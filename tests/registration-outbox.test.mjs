import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { confirmDelivery, handleDeliveryMaintenance, processDelivery, readDelivery, rejectDelivery, runDeliveryMaintenance, stageDelivery, validOutboxKey } from "../server/registration-outbox.js";
import { createD1 } from "./helpers/d1.mjs";

const start = Date.parse("2026-09-11T12:00:00Z");
const receiptId = "SOKOL-1234567890ABCDEF1234567890ABCDEF";
const fingerprint = "a".repeat(64);
const messages = {
  organizer: { to: ["organizer@example.test"], text: "Jan Novak", subject: "Registration" },
  participant: { to: ["jan@example.test"], text: "Registration accepted", subject: "Confirmation" },
};

async function setup() {
  const env = {
    DB: createD1(), REGISTRATION_OUTBOX_KEY: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    REGISTRATION_JOBS_TOKEN: "only-a-test-token-at-least-32-characters", RESEND_API_KEY: "test",
    GOOGLE_SHEETS_WEBHOOK_URL: "https://script.google.com/macros/s/test/exec", GOOGLE_SHEETS_WEBHOOK_SECRET: "test-webhook-secret",
  };
  await stageDelivery(env, { receiptId, fingerprint, eventPolicy: { name: "Test", registrationType: "trip", retentionReviewDate: "2027-01-01" }, messages, timestamp: start });
  return env;
}

const now = (offset = 0) => () => new Date(start + offset);
function sender(calls) { return async (url, init) => { calls.push({ url: String(url), body: init.body, key: init.headers["Idempotency-Key"] }); return Response.json({ id: "provider-id" }); }; }

test("outbox encrypts the payload and preserves the first immutable message", async () => {
  const env = await setup();
  const row = await readDelivery(env.DB, receiptId);
  assert.doesNotMatch(row.payload, /Jan|example|Registration/);
  await stageDelivery(env, { receiptId, fingerprint: "b".repeat(64), eventPolicy: { name: "Other", registrationType: "camp", retentionReviewDate: "2027-01-01" }, messages: {}, timestamp: start });
  assert.equal((await readDelivery(env.DB, receiptId)).payload, row.payload);
  assert.equal((await readDelivery(env.DB, receiptId)).fingerprint, fingerprint);
  assert.equal(validOutboxKey("weak"), false);
});

test("confirmed emails survive restarts, clear message data and are not resent after 24 hours", async () => {
  const env = await setup();
  const calls = [];
  await confirmDelivery(env.DB, receiptId);
  const result = await processDelivery(env, receiptId, sender(calls), now());
  assert.equal(result.state, "complete");
  assert.equal(result.payload, null);
  assert.equal(result.organizer_provider_id, "provider-id");
  await processDelivery({ ...env }, receiptId, sender(calls), now(26 * 3600_000));
  assert.equal(calls.length, 2);
});

test("concurrent workers claim only one lease", async () => {
  const env = await setup();
  const calls = [];
  await confirmDelivery(env.DB, receiptId);
  await Promise.all([processDelivery(env, receiptId, sender(calls), now()), processDelivery({ ...env }, receiptId, sender(calls), now())]);
  assert.equal(calls.length, 2);
  assert.equal((await readDelivery(env.DB, receiptId)).state, "complete");
});

test("transient failure retries only the pending email with the identical payload and key", async () => {
  const env = await setup();
  await confirmDelivery(env.DB, receiptId);
  const calls = [];
  const send = sender(calls);
  await processDelivery(env, receiptId, async (url, init) => {
    const response = await send(url, init);
    return init.headers["Idempotency-Key"].endsWith("participant") ? new Response("failure", { status: 503 }) : response;
  }, now());
  await processDelivery(env, receiptId, send, now(30_000));
  assert.equal(calls.length, 2);
  await processDelivery(env, receiptId, send, now(61_000));
  assert.equal(calls.length, 3);
  assert.equal(calls[1].body, calls[2].body);
  assert.equal(calls[1].key, calls[2].key);
  assert.equal((await readDelivery(env.DB, receiptId)).state, "complete");
});

test("ambiguous delivery outside the idempotency window requires manual review", async () => {
  const env = await setup();
  await confirmDelivery(env.DB, receiptId);
  let count = 0;
  const uncertain = async () => { count++; throw new Error("network timeout after upstream acceptance"); };
  await processDelivery(env, receiptId, uncertain, now());
  const row = await processDelivery(env, receiptId, uncertain, now(24 * 3600_000));
  assert.equal(count, 2);
  assert.equal(row.state, "manual");
  assert.equal(row.last_error, "retry_window_expired");
});

test("a lost Sheets response is reconciled before emails are sent", async () => {
  const env = await setup();
  const calls = [];
  const send = sender(calls);
  const row = await processDelivery(env, receiptId, async (url, init) => {
    if (String(url).includes("script.google.com")) {
      const body = JSON.parse(init.body);
      assert.equal(body.action, "status");
      assert.equal(body.fingerprint, fingerprint);
      assert.equal(body.record, undefined);
      return Response.json({ ok: true, status: "reserved" });
    }
    return send(url, init);
  }, now(121_000));
  assert.equal(calls.length, 2);
  assert.equal(row.state, "complete");
});

test("unconfirmed and conflicting reservations never send email", async () => {
  for (const status of ["not_found", "conflict"]) {
    const env = await setup();
    const row = await processDelivery(env, receiptId, async (url) => {
      assert.match(String(url), /script.google.com/);
      return Response.json({ ok: true, status });
    }, now(16 * 60_000));
    assert.equal(row.state, "manual");
  }
});

test("rejected reservations delete their email payload and are never processed", async () => {
  const env = await setup();
  await rejectDelivery(env.DB, receiptId);
  await processDelivery(env, receiptId, () => { throw new Error("unexpected send"); }, now(121_000));
  const row = await readDelivery(env.DB, receiptId);
  assert.equal(row.payload, null);
  assert.equal(row.state, "rejected");
});

test("corrupted ciphertext fails closed without exposing data", async () => {
  const env = await setup();
  await confirmDelivery(env.DB, receiptId);
  await env.DB.prepare("UPDATE registration_deliveries SET fingerprint = ? WHERE receipt_id = ?").bind("b".repeat(64), receiptId).run();
  const row = await processDelivery(env, receiptId, () => { throw new Error("unexpected send"); }, now());
  assert.equal(row.state, "manual");
  assert.equal(row.last_error, "decryption_failed");
});

test("expired leases recover and retention removes content before the deduplication ledger", async () => {
  const env = await setup();
  await confirmDelivery(env.DB, receiptId);
  await env.DB.prepare("UPDATE registration_deliveries SET lease_token = 'crashed', lease_until = ? WHERE receipt_id = ?").bind(start + 120_000, receiptId).run();
  const calls = [];
  await processDelivery(env, receiptId, sender(calls), now());
  assert.equal(calls.length, 0);
  await processDelivery(env, receiptId, sender(calls), now(121_000));
  assert.equal(calls.length, 2);
  await runDeliveryMaintenance(env, sender(calls), now(8 * 86400_000));
  assert.equal((await readDelivery(env.DB, receiptId)).payload, null);
  await runDeliveryMaintenance(env, sender(calls), () => new Date("2027-01-03T00:00:00Z"));
  assert.equal(await readDelivery(env.DB, receiptId), null);
});

test("maintenance rejects anonymous requests and reports only aggregate counts", async () => {
  const env = await setup();
  const request = (token) => new Request("https://sokol.example/api/internal/registration-delivery", { method: "POST", headers: { Authorization: token } });
  assert.equal((await handleDeliveryMaintenance(request("Bearer wrong"), env, fetch, now())).status, 401);
  const response = await handleDeliveryMaintenance(request(`Bearer ${env.REGISTRATION_JOBS_TOKEN}`), env, fetch, now());
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.doesNotMatch(body, /SOKOL-|Jan|example|payload|fingerprint/);
  assert.equal(JSON.parse(body).counts.awaiting, 1);
});

test("outbox migration stays aligned with the schema and permits bounded manual resolution", async () => {
  const source = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  const migration = await readFile(new URL("../drizzle/0001_registration_deliveries.sql", import.meta.url), "utf8");
  assert.equal(source.match(/registrationDeliveriesSchema = `([\s\S]*?)`/)[1].trim(), migration.trim());
  const env = await setup();
  await env.DB.prepare("UPDATE registration_deliveries SET state = 'resolved', payload = NULL, resolved_at = ? WHERE receipt_id = ?").bind(start, receiptId).run();
  const result = await runDeliveryMaintenance(env, () => { throw new Error("resolved job was resent"); }, now(121_000));
  assert.equal(result.ok, true);
  assert.equal(result.counts.resolved, 1);
});

test("reservation failures back off and cannot overwrite a concurrent confirmation", async () => {
  const env = await setup();
  await assert.rejects(processDelivery(env, receiptId, async () => { throw new Error("unavailable"); }, now(121_000)));
  assert.equal((await readDelivery(env.DB, receiptId)).next_attempt, start + 181_000);
  await assert.rejects(processDelivery(env, receiptId, async () => {
    await confirmDelivery(env.DB, receiptId);
    return Response.json({ ok: true, status: "not_found" });
  }, now(182_000)));
  assert.equal((await readDelivery(env.DB, receiptId)).state, "ready");
});

test("pending encrypted content is purged after seven days, while deduplication metadata remains", async () => {
  const env = await setup();
  const result = await runDeliveryMaintenance(env, () => { throw new Error("expired payload sent"); }, now(8 * 86400_000));
  const row = await readDelivery(env.DB, receiptId);
  assert.equal(row.payload, null);
  assert.equal(row.state, "manual");
  assert.equal(row.last_error, "payload_expired");
  assert.equal(result.ok, false);
});

test("permanent email rejection is not retried automatically", async () => {
  const env = await setup();
  await confirmDelivery(env.DB, receiptId);
  let attempts = 0;
  await processDelivery(env, receiptId, async () => { attempts++; return new Response("bad request", { status: 422 }); }, now());
  const result = await runDeliveryMaintenance(env, () => { throw new Error("permanent rejection resent"); }, now(121_000));
  assert.equal(attempts, 2);
  assert.equal(result.ok, false);
  assert.equal(result.counts.manual, 1);
});
