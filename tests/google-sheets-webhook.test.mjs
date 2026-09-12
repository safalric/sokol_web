import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

const source = await readFile(new URL("../server/google-sheets-webhook.example.gs", import.meta.url), "utf8");

function webhook(properties = {}) {
  const rows = [];
  let locked = false;
  const sheet = {
    getLastRow: () => rows.length,
    getLastColumn: () => rows[0]?.length || 0,
    appendRow(row) { assert.equal(locked, true); rows.push([...row]); },
    getRange(row, column, count, width) {
      return {
        getDisplayValues: () => rows.slice(row - 1, row - 1 + count).map((values) => values.slice(column - 1, column - 1 + width)),
        setNumberFormat(format) { assert.equal(format, "@"); return this; },
        setValues(values) { assert.equal(locked, true); rows[row - 1] = [...values[0]]; return this; },
      };
    },
  };
  const context = vm.createContext({
    console,
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key) => ({ WEBHOOK_SECRET: "secret", TRIP_SHEET_ID: "trips", CAMP_SHEET_ID: "camps", ...properties })[key] }) },
    ContentService: { MimeType: { JSON: "application/json" }, createTextOutput: (text) => ({ setMimeType: () => JSON.parse(text) }) },
    SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet }) },
    LockService: { getScriptLock: () => ({ waitLock() { locked = true; }, releaseLock() { locked = false; } }) },
  });
  vm.runInContext(source, context);
  return { rows, post: (body) => context.doPost({ postData: { contents: JSON.stringify(body) } }) };
}

function payload(overrides = {}) {
  return {
    secret: "secret", action: "reserve", receiptId: "SOKOL-test", eventName: "Test trip", registrationType: "trip", capacity: 1,
    record: { receiptId: "SOKOL-test", eventName: "Test trip", receivedAt: "2026-09-10", participantName: "Jan Novak", additionalNote: "=IMPORTXML(A1)", requestFingerprint: "a".repeat(64) },
    ...overrides,
  };
}

test("Sheets reserves atomically, escapes formulas and keeps identical retries idempotent", () => {
  const { post, rows } = webhook();
  assert.equal(post(payload()).status, "created");
  assert.equal(post(payload()).status, "duplicate");
  assert.equal(rows.length, 2);
  assert.ok(rows[1].includes("'=IMPORTXML(A1)"));
  const changedTimestamp = payload();
  changedTimestamp.record.receivedAt = "2026-09-11";
  assert.equal(post(changedTimestamp).status, "duplicate");
});

test("Sheets rejects changed data under the same receipt and enforces capacity", () => {
  const { post, rows } = webhook();
  post(payload());
  const changed = payload();
  changed.record.participantName = "Eva Novakova";
  assert.equal(post(changed).status, "conflict");
  const next = payload({ receiptId: "SOKOL-next" });
  next.record.receiptId = next.receiptId;
  assert.equal(post(next).status, "full");
  assert.equal(rows.length, 2);
});

test("Sheets refuses unauthenticated and wrong-schema records", () => {
  const { post, rows } = webhook();
  assert.equal(post(payload({ secret: "wrong" })).ok, false);
  const healthOnTrip = payload();
  healthOnTrip.record.healthNote = "sensitive";
  assert.equal(post(healthOnTrip).ok, false);
  assert.equal(rows.length, 0);
});

test("camp data requires a separate workbook rather than a hidden tab", () => {
  const camp = payload({ registrationType: "camp" });
  camp.record.healthNote = "Test allergy";
  camp.record.healthConsent = "ano";
  assert.equal(webhook({ CAMP_SHEET_ID: "trips" }).post(camp).ok, false);
  assert.equal(webhook({ CAMP_SHEET_ID: "" }).post(camp).ok, false);
  assert.equal(webhook().post(camp).status, "created");
});

test("recovery status exposes no personal data and requires the exact fingerprint", () => {
  const { post } = webhook();
  const request = { secret: "secret", action: "status", receiptId: "SOKOL-test", eventName: "Test trip", registrationType: "trip", fingerprint: "a".repeat(64) };
  assert.deepEqual(post(request), { ok: true, status: "not_found" });
  post(payload());
  assert.deepEqual(post(request), { ok: true, status: "reserved" });
  assert.equal(post({ ...request, fingerprint: "b".repeat(64) }).status, "conflict");
  assert.equal(post({ ...request, secret: "bad" }).ok, false);
});
