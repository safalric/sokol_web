import { isLocalRequest, jsonResponse } from "./http-security.js";

const CONSENT_VERSION = "2026-08-12";
const REGISTRATION_LIMIT = 5;
const REGISTRATION_WINDOW_MS = 10 * 60 * 1000;
const MIN_FORM_COMPLETION_MS = 3_000;
const MAX_BODY_BYTES = 12_000;
const MAX_STATE_ENTRIES = 5_000;
const PROVIDER_TIMEOUT_MS = 8_000;
const ALLOWED_FIELDS = new Set([
  "submissionId",
  "eventName",
  "participantName",
  "birthDate",
  "guardianName",
  "email",
  "phone",
  "healthNote",
  "additionalNote",
  "privacyAcknowledged",
  "guardianDeclaration",
  "healthConsent",
  "mediaConsent",
  "website_hp",
  "formStartedAt",
  "turnstileToken",
  "consentVersion",
]);

function cleanText(value, maxLength, multiline = false) {
  if (typeof value !== "string") return "";
  const controls = multiline ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g;
  return value.normalize("NFKC").replace(controls, " ").replace(multiline ? /[ \t]+/g : /\s+/g, " ").trim().slice(0, maxLength);
}

function validIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function validHttpsWebhook(value) {
  try {
    const endpoint = new URL(value);
    return endpoint.protocol === "https:" && ["script.google.com", "script.googleusercontent.com"].includes(endpoint.hostname);
  } catch {
    return false;
  }
}

function isMinor(birthDate, now) {
  const eighteenthBirthday = new Date(`${birthDate}T12:00:00Z`);
  eighteenthBirthday.setUTCFullYear(eighteenthBirthday.getUTCFullYear() + 18);
  return eighteenthBirthday > now;
}

function validateRegistration(input, now, registrationEvents) {
  const payload = {
    submissionId: cleanText(input.submissionId, 80),
    eventName: cleanText(input.eventName, 160),
    participantName: cleanText(input.participantName, 120),
    birthDate: cleanText(input.birthDate, 10),
    guardianName: cleanText(input.guardianName, 120),
    email: cleanText(input.email, 160).toLowerCase(),
    phone: cleanText(input.phone, 30),
    healthNote: cleanText(input.healthNote, 500, true),
    additionalNote: cleanText(input.additionalNote, 600, true),
    privacyAcknowledged: input.privacyAcknowledged === true,
    guardianDeclaration: input.guardianDeclaration === true,
    healthConsent: input.healthConsent === true,
    mediaConsent: input.mediaConsent === true,
    website_hp: cleanText(input.website_hp, 200),
    formStartedAt: Number.isFinite(input.formStartedAt) ? Math.trunc(input.formStartedAt) : 0,
    turnstileToken: cleanText(input.turnstileToken, 2_048),
    consentVersion: cleanText(input.consentVersion, 30),
  };
  const errors = {};
  const namePattern = /^[\p{L}\p{M} .'-]{2,120}$/u;
  const unexpectedFields = Object.keys(input).filter((field) => !ALLOWED_FIELDS.has(field));
  const eventPolicy = registrationEvents.find((event) => event.name === payload.eventName && event.registrationOpen === true);
  const registrationType = eventPolicy?.registrationType;

  if (unexpectedFields.length) errors.request = "Požadavek obsahuje nepovolená pole.";
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(payload.submissionId)) errors.submissionId = "Neplatný identifikátor odeslání.";
  if (!eventPolicy) {
    errors.eventName = "Na tuto akci nyní nelze odeslat přihlášku.";
  } else {
    const closesAt = new Date(eventPolicy.registrationClosesAt);
    const eventDateValid = validIsoDate(eventPolicy.eventDate);
    const retentionDateValid = validIsoDate(eventPolicy.retentionReviewDate);
    const eventEndsAt = eventDateValid ? new Date(`${eventPolicy.eventDate}T23:59:59Z`) : null;
    if (
      !["trip", "camp"].includes(registrationType)
      || !Number.isInteger(eventPolicy.capacity)
      || eventPolicy.capacity < 1
      || eventPolicy.capacity > 10_000
      || Number.isNaN(closesAt.getTime())
      || !eventDateValid
      || !retentionDateValid
      || closesAt > eventEndsAt
      || eventPolicy.retentionReviewDate < eventPolicy.eventDate
    ) {
      errors.eventName = "Přihlašování na tuto akci není správně nastaveno.";
    } else if (now > closesAt) {
      errors.eventName = "Přihlašování na tuto akci již bylo ukončeno.";
    }
  }
  if (!namePattern.test(payload.participantName)) errors.participantName = "Zkontrolujte jméno účastníka.";
  if (payload.guardianName && !namePattern.test(payload.guardianName)) errors.guardianName = "Zkontrolujte jméno zákonného zástupce.";
  if (!validIsoDate(payload.birthDate)) {
    errors.birthDate = "Zadejte platné datum narození.";
  } else {
    const birthDate = new Date(`${payload.birthDate}T12:00:00Z`);
    const oldest = new Date(now);
    oldest.setUTCFullYear(oldest.getUTCFullYear() - 120);
    if (birthDate > now || birthDate < oldest) errors.birthDate = "Zkontrolujte datum narození.";
    if (isMinor(payload.birthDate, now)) {
      if (!payload.guardianName) errors.guardianName = "U nezletilého účastníka vyplňte zákonného zástupce.";
      if (!payload.guardianDeclaration) errors.guardianDeclaration = "Potvrďte oprávnění přihlásit nezletilého účastníka.";
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email)) errors.email = "Zadejte platný e-mail.";
  if (!/^(\+420\s?)?(\d\s?){9}$/.test(payload.phone)) errors.phone = "Zadejte platné české telefonní číslo.";
  if (!payload.privacyAcknowledged) errors.privacyAcknowledged = "Potvrďte seznámení se zásadami ochrany osobních údajů.";
  if (payload.healthNote && !payload.healthConsent) errors.healthConsent = "Pro zpracování zdravotních údajů je nutný výslovný souhlas.";
  if (registrationType === "trip" && (payload.healthNote || payload.healthConsent)) {
    errors.healthNote = "Přihláška na jednodenní výlet zdravotní údaje nepřijímá.";
  }
  if (!payload.formStartedAt || now.getTime() - payload.formStartedAt < MIN_FORM_COMPLETION_MS) {
    errors.request = "Formulář byl odeslán příliš rychle. Zkontrolujte údaje a zkuste to znovu.";
  }
  if (payload.consentVersion !== CONSENT_VERSION) errors.consentVersion = "Formulář používá neplatnou verzi právních informací.";
  return { payload, errors, eventPolicy };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function sheetValue(value) {
  const text = String(value ?? "");
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function maskEmail(email) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 1)}***@${domain}`;
}

async function fetchWithTimeout(fetchImpl, url, init, timeoutMs = PROVIDER_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

function demoPreview(payload) {
  return {
    organizer: { to: "demo-organizator@sokol.test", subject: `Nová přihláška: ${payload.eventName}` },
    participant: { to: maskEmail(payload.email), subject: `Potvrzení přihlášky: ${payload.eventName}` },
  };
}

function organizerMessage(payload, receiptId, registrationType) {
  const rows = [
    ["Akce", payload.eventName],
    ["Typ přihlášky", registrationType === "camp" ? "tábor" : "jednodenní výlet"],
    ["Účastník", payload.participantName],
    ["Datum narození", payload.birthDate],
    ["Zákonný zástupce", payload.guardianName || "neuveden"],
    ["E-mail", payload.email],
    ["Telefon", payload.phone],
    ["Organizační poznámka", payload.additionalNote || "neuvedena"],
    ["Souhlas s fotografiemi", payload.mediaConsent ? "ano" : "ne"],
    ["ID přihlášky", receiptId],
  ];
  if (registrationType === "camp") {
    rows.splice(7, 0, ["Zdravotní údaje", payload.healthNote ? "uvedeny; otevřete omezenou evidenci" : "neuvedeny"]);
  }
  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const healthNotice = registrationType === "camp" ? "<p>Zdravotní údaje se z bezpečnostních důvodů neposílají e-mailem.</p>" : "";
  const html = `<h1>Nová přihláška: ${escapeHtml(payload.eventName)}</h1><table>${rows.map(([label, value]) => `<tr><th align="left">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join("")}</table>${healthNotice}`;
  return { html, text };
}

async function sendResendEmail(fetchImpl, env, message, idempotencyKey) {
  const response = await fetchWithTimeout(fetchImpl, "https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
      "User-Agent": "sokol-doudleby-web/2.0",
    },
    body: JSON.stringify(message),
  });
  if (!response.ok) throw new Error(`Resend returned ${response.status}`);
}

async function deliverEmails(payload, receiptId, eventPolicy, env, fetchImpl) {
  const organizer = organizerMessage(payload, receiptId, eventPolicy.registrationType);
  const organizerEmail = eventPolicy.registrationType === "camp"
    ? env.REGISTRATION_CAMP_ORGANIZER_EMAIL
    : env.REGISTRATION_TRIP_ORGANIZER_EMAIL;
  await sendResendEmail(fetchImpl, env, {
    from: env.REGISTRATION_FROM_EMAIL,
    to: [organizerEmail],
    reply_to: payload.email,
    subject: `Nová přihláška: ${payload.eventName}`,
    html: organizer.html,
    text: organizer.text,
  }, `${payload.submissionId}-organizer`);
  await sendResendEmail(fetchImpl, env, {
    from: env.REGISTRATION_FROM_EMAIL,
    to: [payload.email],
    reply_to: organizerEmail,
    subject: `Potvrzení přihlášky: ${payload.eventName}`,
    html: `<h1>Přihlášku jsme přijali</h1><p>Dobrý den, evidujeme přihlášku účastníka ${escapeHtml(payload.participantName)} na akci ${escapeHtml(payload.eventName)}.</p><p>ID přihlášky: ${escapeHtml(receiptId)}</p><p>Pro změnu nebo zrušení přihlášky odpovězte na tento e-mail a uveďte ID přihlášky.</p>`,
    text: `Dobrý den, evidujeme přihlášku účastníka ${payload.participantName} na akci ${payload.eventName}.\nID přihlášky: ${receiptId}\nPro změnu nebo zrušení přihlášky odpovězte na tento e-mail a uveďte ID přihlášky.`,
  }, `${payload.submissionId}-participant`);
}

async function reserveGoogleSheet(payload, receiptId, eventPolicy, env, fetchImpl, now) {
  const endpoint = new URL(env.GOOGLE_SHEETS_WEBHOOK_URL);
  if (endpoint.protocol !== "https:" || !["script.google.com", "script.googleusercontent.com"].includes(endpoint.hostname)) {
    throw new Error("Invalid Google Sheets webhook URL");
  }
  const recordValues = {
    receivedAt: now.toISOString(),
    receiptId,
    eventName: payload.eventName,
    participantName: payload.participantName,
    birthDate: payload.birthDate,
    guardianName: payload.guardianName,
    email: payload.email,
    phone: payload.phone,
    additionalNote: payload.additionalNote,
    privacyAcknowledged: payload.privacyAcknowledged ? "ano" : "ne",
    guardianDeclaration: payload.guardianDeclaration ? "ano" : "ne",
    mediaConsent: payload.mediaConsent ? "ano" : "ne",
    consentVersion: payload.consentVersion,
    retentionReviewDate: eventPolicy.retentionReviewDate,
  };
  if (eventPolicy.registrationType === "camp") {
    recordValues.healthNote = payload.healthNote;
    recordValues.healthConsent = payload.healthConsent ? "ano" : "ne";
  }
  const record = Object.fromEntries(Object.entries(recordValues).map(([key, value]) => [key, sheetValue(value)]));
  const response = await fetchWithTimeout(fetchImpl, endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "sokol-doudleby-web/2.0" },
    body: JSON.stringify({
      secret: env.GOOGLE_SHEETS_WEBHOOK_SECRET,
      action: "reserve",
      receiptId,
      eventName: payload.eventName,
      registrationType: eventPolicy.registrationType,
      capacity: eventPolicy.capacity,
      record,
    }),
  });
  if (!response.ok) throw new Error(`Google Sheets webhook returned ${response.status}`);
  const result = await response.json().catch(() => ({}));
  if (result.ok !== true || !["created", "duplicate", "full"].includes(result.status)) {
    throw new Error("Google Sheets webhook rejected the row");
  }
  return result;
}

export function registrationRuntimeStatus(env) {
  const groups = {
    email: [
      env.RESEND_API_KEY,
      env.REGISTRATION_FROM_EMAIL,
      env.REGISTRATION_TRIP_ORGANIZER_EMAIL,
      env.REGISTRATION_CAMP_ORGANIZER_EMAIL,
    ],
    storage: [
      validHttpsWebhook(env.GOOGLE_SHEETS_WEBHOOK_URL || "") ? env.GOOGLE_SHEETS_WEBHOOK_URL : null,
      typeof env.GOOGLE_SHEETS_WEBHOOK_SECRET === "string" && env.GOOGLE_SHEETS_WEBHOOK_SECRET.length >= 24
        ? env.GOOGLE_SHEETS_WEBHOOK_SECRET
        : null,
    ],
    abuseProtection: [
      env.DB,
      typeof env.RATE_LIMIT_HASH_SECRET === "string" && env.RATE_LIMIT_HASH_SECRET.length >= 32
        ? env.RATE_LIMIT_HASH_SECRET
        : null,
    ],
    antispam: [env.TURNSTILE_SITE_KEY, env.TURNSTILE_SECRET_KEY],
  };
  const missingCapabilities = Object.entries(groups)
    .filter(([, values]) => values.some((value) => !value))
    .map(([name]) => name);

  if (missingCapabilities.length > 0) {
    return {
      status: "demo",
      turnstileSiteKey: null,
      configurationWarning: true,
      missingCapabilities,
      warning: "Přihlášky běží v demo režimu, protože nejsou kompletně nastavené všechny produkční služby.",
    };
  }

  return {
    status: "configured",
    turnstileSiteKey: env.TURNSTILE_SITE_KEY,
    configurationWarning: false,
    missingCapabilities: [],
    warning: null,
  };
}

async function verifyTurnstile(payload, request, url, env, fetchImpl) {
  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY,
    response: payload.turnstileToken,
  });
  const remoteIp = clientKey(request);
  if (remoteIp !== "unknown") body.set("remoteip", remoteIp);

  const response = await fetchWithTimeout(fetchImpl, "https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error(`Turnstile returned ${response.status}`);
  const result = await response.json().catch(() => ({}));
  return result.success === true
    && result.action === "event-registration"
    && (!result.hostname || result.hostname === url.hostname);
}

function clientKey(request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

async function hashClientKey(value, secret) {
  const bytes = new TextEncoder().encode(`${secret}:${value}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function consumeDurableRateLimit(database, client, secret, timestamp) {
  if (!database || client === "unknown") throw new Error("Durable rate limiting is unavailable");
  const clientHash = await hashClientKey(client, secret);
  const windowStart = Math.floor(timestamp / REGISTRATION_WINDOW_MS) * REGISTRATION_WINDOW_MS;
  const result = await database.prepare(`
    INSERT INTO registration_rate_limits (client_hash, window_start, attempt_count, updated_at)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(client_hash, window_start) DO UPDATE SET
      attempt_count = registration_rate_limits.attempt_count + 1,
      updated_at = excluded.updated_at
    RETURNING attempt_count
  `).bind(clientHash, windowStart, timestamp).first();
  if (Math.random() < 0.02) {
    await database.prepare("DELETE FROM registration_rate_limits WHERE updated_at < ?")
      .bind(timestamp - 24 * 60 * 60 * 1_000).run();
  }
  return Number(result?.attempt_count || 0);
}

function pruneState(state, timestamp) {
  for (const [key, entry] of state.receipts) {
    if (timestamp - entry.createdAt > 24 * 60 * 60 * 1000) state.receipts.delete(key);
  }
  for (const [key, attempts] of state.rateLimits) {
    const recent = attempts.filter((time) => timestamp - time < REGISTRATION_WINDOW_MS);
    if (recent.length) state.rateLimits.set(key, recent);
    else state.rateLimits.delete(key);
  }
  while (state.receipts.size > MAX_STATE_ENTRIES) state.receipts.delete(state.receipts.keys().next().value);
  while (state.rateLimits.size > MAX_STATE_ENTRIES) state.rateLimits.delete(state.rateLimits.keys().next().value);
}

export function createRegistrationHandler({ fetchImpl, now, registrationEvents }) {
  const state = { rateLimits: new Map(), receipts: new Map() };

  return async function handleRegistration(request, url, env) {
    if (url.protocol !== "https:" && !isLocalRequest(url)) return jsonResponse({ error: "Přihlášku lze odeslat pouze přes HTTPS." }, 400);
    const origin = request.headers.get("Origin");
    if ((!origin && !isLocalRequest(url)) || (origin && origin !== url.origin)) {
      return jsonResponse({ error: "Požadavek bez platného původu byl odmítnut." }, 403);
    }
    if (request.headers.get("Sec-Fetch-Site") === "cross-site") return jsonResponse({ error: "Požadavek z jiné domény byl odmítnut." }, 403);
    if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) {
      return jsonResponse({ error: "Požadavek musí být ve formátu JSON." }, 415);
    }
    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (!Number.isFinite(contentLength) || contentLength > MAX_BODY_BYTES) return jsonResponse({ error: "Požadavek je příliš velký." }, 413);

    const timestamp = now().getTime();
    pruneState(state, timestamp);
    const key = clientKey(request);
    const attempts = state.rateLimits.get(key) || [];
    if (attempts.length >= REGISTRATION_LIMIT) {
      const retryAfter = Math.max(1, Math.ceil((REGISTRATION_WINDOW_MS - (timestamp - attempts[0])) / 1_000));
      const response = jsonResponse({ error: "Příliš mnoho pokusů. Zkuste to znovu za několik minut." }, 429);
      response.headers.set("Retry-After", String(retryAfter));
      return response;
    }
    attempts.push(timestamp);
    state.rateLimits.set(key, attempts);

    const runtime = registrationRuntimeStatus(env);
    if (runtime.status === "configured") {
      try {
        const durableAttempts = await consumeDurableRateLimit(env.DB, key, env.RATE_LIMIT_HASH_SECRET, timestamp);
        if (durableAttempts > REGISTRATION_LIMIT) {
          const windowEnd = (Math.floor(timestamp / REGISTRATION_WINDOW_MS) + 1) * REGISTRATION_WINDOW_MS;
          const response = jsonResponse({ error: "Příliš mnoho pokusů. Zkuste to znovu za několik minut." }, 429);
          response.headers.set("Retry-After", String(Math.max(1, Math.ceil((windowEnd - timestamp) / 1_000))));
          return response;
        }
      } catch (error) {
        console.error("Durable rate limit failed", { error: String(error) });
        return jsonResponse({ error: "Ochrana formuláře je dočasně nedostupná. Zkuste to prosím později." }, 503);
      }
    }

    let input;
    try {
      const raw = await request.text();
      if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return jsonResponse({ error: "Požadavek je příliš velký." }, 413);
      input = JSON.parse(raw);
    } catch {
      return jsonResponse({ error: "Požadavek obsahuje neplatná data." }, 400);
    }
    if (!input || typeof input !== "object" || Array.isArray(input)) return jsonResponse({ error: "Požadavek obsahuje neplatná data." }, 400);
    if (cleanText(input.website_hp, 200)) return jsonResponse({ ok: true, mode: "discarded" }, 202);

    const submissionTime = now();
    const { payload, errors, eventPolicy } = validateRegistration(input, submissionTime, registrationEvents);
    if (Object.keys(errors).length) return jsonResponse({ error: "Zkontrolujte vyplněná pole.", fields: errors }, 422);

    const previous = state.receipts.get(payload.submissionId);
    if (previous?.state === "processing") return jsonResponse({ error: "Tato přihláška se právě zpracovává." }, 409);
    if (previous?.result) {
      return jsonResponse(previous.result.mode === "demo" ? { ...previous.result, preview: demoPreview(payload) } : previous.result);
    }

    if (runtime.status === "configured") {
      try {
        if (!payload.turnstileToken || !(await verifyTurnstile(payload, request, url, env, fetchImpl))) {
          return jsonResponse({ error: "Ověření proti spamu se nezdařilo. Obnovte formulář a zkuste to znovu." }, 403);
        }
      } catch (error) {
        console.error("Turnstile verification failed", { error: String(error) });
        return jsonResponse({ error: "Ověření proti spamu je dočasně nedostupné. Zkuste to prosím později." }, 503);
      }
    }

    const receiptId = `SOKOL-${submissionTime.getUTCFullYear()}-${payload.submissionId.slice(0, 8).toUpperCase()}`;
    const emailConfigured = runtime.status === "configured";
    const sheetConfigured = runtime.status === "configured";

    if (!emailConfigured && !sheetConfigured) {
      const result = {
        ok: true,
        mode: "demo",
        receiptId,
        configurationWarning: runtime.configurationWarning,
        warning: runtime.warning,
        delivery: { organizerEmail: "preview", participantEmail: "preview", googleSheet: "not_configured" },
      };
      state.receipts.set(payload.submissionId, { state: "complete", result, createdAt: timestamp });
      return jsonResponse({ ...result, preview: demoPreview(payload) }, 202);
    }
    if (payload.healthNote && (!sheetConfigured || env.REGISTRATION_HEALTH_DATA_ENABLED !== "true")) {
      return jsonResponse({ error: "Příjem zdravotních údajů zatím není bezpečně aktivován. Kontaktujte prosím organizátora." }, 503);
    }

    state.receipts.set(payload.submissionId, { state: "processing", createdAt: timestamp });
    try {
      const reservation = await reserveGoogleSheet(payload, receiptId, eventPolicy, env, fetchImpl, submissionTime);
      if (reservation.status === "full") {
        state.receipts.delete(payload.submissionId);
        return jsonResponse({ error: "Kapacita této akce je již naplněna." }, 409);
      }
      await deliverEmails(payload, receiptId, eventPolicy, env, fetchImpl);

      const result = {
        ok: true,
        mode: "live",
        receiptId,
        capacityRemaining: Number.isInteger(reservation.capacityRemaining) ? reservation.capacityRemaining : undefined,
        delivery: {
          organizerEmail: "sent",
          participantEmail: "sent",
          googleSheet: reservation.status === "duplicate" ? "duplicate" : "saved",
        },
      };
      state.receipts.set(payload.submissionId, { state: "complete", result, createdAt: timestamp });
      return jsonResponse(result, reservation.status === "duplicate" ? 200 : 201);
    } catch (error) {
      state.receipts.delete(payload.submissionId);
      console.error("Registration delivery failed", { receiptId, error: String(error) });
      return jsonResponse({ error: "Přihlášku se nepodařilo bezpečně doručit. Data nebyla potvrzena jako uložená." }, 502);
    }
  };
}
