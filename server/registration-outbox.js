import { jsonResponse } from "./http-security.js";

const LEASE_MS = 120_000;
const SAFE_RETRY_MS = 23 * 60 * 60 * 1000;
const PAYLOAD_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const encoder = new TextEncoder();
const recipients = ["organizer", "participant"];

export function validOutboxKey(value) {
  return typeof value === "string" && /^[A-Za-z0-9+/]{43}=$/.test(value) && atob(value).length === 32;
}

async function encryptionKey(secret) {
  if (!validOutboxKey(secret)) throw new Error("outbox_key_invalid");
  return crypto.subtle.importKey("raw", Uint8Array.from(atob(secret), (char) => char.charCodeAt(0)), "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encrypt(messages, receiptId, fingerprint, secret) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: encoder.encode(`${receiptId}:${fingerprint}`) }, await encryptionKey(secret), encoder.encode(JSON.stringify(messages)));
  return JSON.stringify({ iv: btoa(String.fromCharCode(...iv)), data: btoa(String.fromCharCode(...new Uint8Array(ciphertext))) });
}

async function decrypt(row, secret) {
  const value = JSON.parse(row.payload);
  const bytes = (text) => Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes(value.iv), additionalData: encoder.encode(`${row.receipt_id}:${row.fingerprint}`) }, await encryptionKey(secret), bytes(value.data));
  return JSON.parse(new TextDecoder().decode(plaintext));
}

export async function readDelivery(db, receiptId) {
  return db.prepare("SELECT * FROM registration_deliveries WHERE receipt_id = ?").bind(receiptId).first();
}

export async function stageDelivery(env, { receiptId, fingerprint, eventPolicy, messages, timestamp }) {
  const payload = await encrypt(messages, receiptId, fingerprint, env.REGISTRATION_OUTBOX_KEY);
  const retainUntil = Math.max(timestamp + PAYLOAD_RETENTION_MS, Date.parse(`${eventPolicy.retentionReviewDate}T23:59:59Z`));
  await env.DB.prepare(`INSERT INTO registration_deliveries
    (receipt_id, fingerprint, event_name, registration_type, payload, created_at, retain_until, next_attempt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(receipt_id) DO NOTHING`)
    .bind(receiptId, fingerprint, eventPolicy.name, eventPolicy.registrationType, payload, timestamp, retainUntil, timestamp + LEASE_MS).run();
  const row = await readDelivery(env.DB, receiptId);
  if (!row) throw new Error("outbox_write_unconfirmed");
  return row;
}

export async function confirmDelivery(db, receiptId) {
  await db.prepare("UPDATE registration_deliveries SET state = 'ready', next_attempt = 0 WHERE receipt_id = ? AND state = 'awaiting'").bind(receiptId).run();
}

export async function rejectDelivery(db, receiptId) {
  await db.prepare("UPDATE registration_deliveries SET state = 'rejected', payload = NULL WHERE receipt_id = ? AND state = 'awaiting'").bind(receiptId).run();
}

export function deliveryStates(row) {
  const state = (recipient) => row?.[`${recipient}_status`] === "sent" ? "sent"
    : ["manual", "rejected", "resolved"].includes(row?.state) || row?.[`${recipient}_status`] === "manual" ? "attention_required" : "queued";
  return { organizerEmail: state("organizer"), participantEmail: state("participant") };
}

async function providerFetch(fetchImpl, url, init) {
  const response = await fetchImpl(url, { ...init, signal: AbortSignal.timeout(8_000) });
  if (!response.ok) {
    const error = new Error(`provider_${response.status}`);
    error.permanent = response.status >= 400 && response.status < 500 && ![408, 409, 429].includes(response.status);
    throw error;
  }
  return response.json();
}

async function reservationStatus(row, env, fetchImpl) {
  const endpoint = new URL(env.GOOGLE_SHEETS_WEBHOOK_URL);
  if (endpoint.protocol !== "https:" || !["script.google.com", "script.googleusercontent.com"].includes(endpoint.hostname)) throw new Error("webhook_invalid");
  const result = await providerFetch(fetchImpl, endpoint, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret: env.GOOGLE_SHEETS_WEBHOOK_SECRET, action: "status", receiptId: row.receipt_id, fingerprint: row.fingerprint, eventName: row.event_name, registrationType: row.registration_type }),
  });
  if (result.ok !== true || !["reserved", "not_found", "conflict"].includes(result.status)) throw new Error("reservation_status_invalid");
  return result.status;
}

export async function processDelivery(env, receiptId, fetchImpl = fetch, now = () => new Date()) {
  const token = crypto.randomUUID();
  let row = await env.DB.prepare(`UPDATE registration_deliveries SET lease_token = ?, lease_until = ?
    WHERE receipt_id = ? AND state IN ('awaiting', 'ready') AND next_attempt <= ? AND lease_until <= ? RETURNING *`)
    .bind(token, now().getTime() + LEASE_MS, receiptId, now().getTime(), now().getTime()).first();
  if (!row) return readDelivery(env.DB, receiptId);
  // Every state transition is fenced by the lease token, including crash recovery.
  async function update(sql, values = []) {
    const updated = await env.DB.prepare(`UPDATE registration_deliveries SET ${sql} WHERE receipt_id = ? AND lease_token = ? AND state = ? RETURNING *`)
      .bind(...values, receiptId, token, row.state).first();
    if (!updated) throw new Error("outbox_lease_lost");
    row = updated;
  }
  try {
    if (row.state === "awaiting") {
      const status = await reservationStatus(row, env, fetchImpl);
      if (status === "reserved") await update("state = 'ready'");
      else {
        const manual = status === "conflict" || now().getTime() - row.created_at >= 15 * 60_000;
        await update("state = ?, next_attempt = ?, last_error = ?", [manual ? "manual" : "awaiting", now().getTime() + 60_000, manual ? "reservation_unconfirmed" : "reservation_waiting"]);
        return row;
      }
    }
    let messages;
    try { messages = await decrypt(row, env.REGISTRATION_OUTBOX_KEY); }
    catch { await update("state = 'manual', last_error = 'decryption_failed'"); return row; }

    for (const recipient of recipients) {
      if (row[`${recipient}_status`] !== "pending") continue;
      const firstAttempt = row[`${recipient}_first_attempt`];
      if (firstAttempt !== null && now().getTime() - firstAttempt >= SAFE_RETRY_MS) {
        await update(`${recipient}_status = 'manual', last_error = 'retry_window_expired'`);
        continue;
      }
      await update(`${recipient}_first_attempt = COALESCE(${recipient}_first_attempt, ?), ${recipient}_attempts = ${recipient}_attempts + 1`, [now().getTime()]);
      try {
        const result = await providerFetch(fetchImpl, "https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json", "Idempotency-Key": `${receiptId}-${recipient}` },
          body: JSON.stringify(messages[recipient]),
        });
        if (typeof result.id !== "string" || !result.id || result.id.length > 160) throw new Error("email_acceptance_unconfirmed");
        await update(`${recipient}_status = 'sent', ${recipient}_provider_id = ?`, [result.id]);
      } catch (error) {
        await update(`${recipient}_status = ?, last_error = ?`, [error.permanent ? "manual" : "pending", error.permanent ? "email_rejected" : "email_retry_pending"]);
      }
    }
    const complete = recipients.every((recipient) => row[`${recipient}_status`] === "sent");
    const pending = recipients.some((recipient) => row[`${recipient}_status`] === "pending");
    const attempts = Math.max(row.organizer_attempts, row.participant_attempts);
    await update("state = ?, payload = ?, next_attempt = ?, last_error = ?", [
      complete ? "complete" : pending ? "ready" : "manual", complete ? null : row.payload,
      now().getTime() + Math.min(3600, 60 * 2 ** Math.min(attempts - 1, 6)) * 1000,
      complete ? null : row.last_error,
    ]);
    return row;
  } catch (error) {
    if (row.state === "awaiting") {
      await update("next_attempt = ?, last_error = 'reservation_status_unavailable'", [now().getTime() + 60_000]);
    }
    throw error;
  } finally {
    await env.DB.prepare("UPDATE registration_deliveries SET lease_token = NULL, lease_until = 0 WHERE receipt_id = ? AND lease_token = ?").bind(receiptId, token).run();
  }
}

export async function runDeliveryMaintenance(env, fetchImpl = fetch, now = () => new Date()) {
  const timestamp = now().getTime();
  await env.DB.prepare(`UPDATE registration_deliveries SET payload = NULL, state = CASE WHEN state IN ('awaiting', 'ready') THEN 'manual' ELSE state END,
    last_error = CASE WHEN state IN ('awaiting', 'ready') THEN 'payload_expired' ELSE last_error END
    WHERE payload IS NOT NULL AND created_at < ? AND lease_until <= ?`).bind(timestamp - PAYLOAD_RETENTION_MS, timestamp).run();
  await env.DB.prepare("DELETE FROM registration_deliveries WHERE retain_until < ? AND lease_until <= ?").bind(timestamp, timestamp).run();
  await env.DB.prepare("DELETE FROM registration_rate_limits WHERE updated_at < ?").bind(timestamp - 24 * 60 * 60_000).run();
  const due = await env.DB.prepare("SELECT receipt_id FROM registration_deliveries WHERE state IN ('awaiting', 'ready') AND next_attempt <= ? AND lease_until <= ? ORDER BY next_attempt LIMIT 3").bind(timestamp, timestamp).all();
  let failures = 0;
  for (const job of due.results) {
    try { await processDelivery(env, job.receipt_id, fetchImpl, now); }
    catch { failures += 1; }
  }
  const rows = await env.DB.prepare("SELECT state, COUNT(*) AS count FROM registration_deliveries GROUP BY state").all();
  const counts = Object.fromEntries(rows.results.map((row) => [row.state, row.count]));
  return { ok: failures === 0 && !counts.manual, processed: due.results.length, failures, counts, checkedAt: now().toISOString() };
}

export async function handleDeliveryMaintenance(request, env, fetchImpl, now) {
  if (request.method !== "POST") {
    const response = jsonResponse({ error: "Tato metoda není podporována." }, 405);
    response.headers.set("Allow", "POST");
    return response;
  }
  const secret = env.REGISTRATION_JOBS_TOKEN;
  if (typeof secret !== "string" || secret.length < 32 || !validOutboxKey(env.REGISTRATION_OUTBOX_KEY) || !env.DB || !env.RESEND_API_KEY || !env.GOOGLE_SHEETS_WEBHOOK_URL) {
    return jsonResponse({ error: "Údržba přihlášek není nastavená." }, 503);
  }
  const authorization = request.headers.get("Authorization") || "";
  if (authorization.length > 1024) return jsonResponse({ error: "Přístup odmítnut." }, 401);
  const hash = async (value) => new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
  const expected = await hash(`Bearer ${secret}`);
  const supplied = await hash(authorization);
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) difference |= expected[index] ^ supplied[index];
  if (difference) return jsonResponse({ error: "Přístup odmítnut." }, 401);
  try {
    const result = await runDeliveryMaintenance(env, fetchImpl, now);
    return jsonResponse(result, result.ok ? 200 : 503);
  } catch {
    return jsonResponse({ error: "Údržbu přihlášek se nepodařilo dokončit." }, 503);
  }
}
