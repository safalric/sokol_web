import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../server/google-forms-sheets.example.gs", import.meta.url), "utf8");
const Utilities = {
  Charset: { UTF_8: "UTF_8" },
  DigestAlgorithm: { SHA_256: "SHA_256" },
  computeDigest(_algorithm, value) {
    return [...createHash("sha256").update(value, "utf8").digest()];
  },
  computeHmacSha256Signature(value, secret) {
    return [...createHash("sha256").update(`${secret}|${value}`, "utf8").digest()];
  },
};

const helpers = new Function("Utilities", `${source}; return {
  createDedupeKey_,
  normalizeIdentity_,
  parseFormDate_,
  readFormValues_,
  validateSubmission_,
};`)(Utilities);

function validSubmission(overrides = {}) {
  return {
    eventId: "orlicke-hory-2026",
    participantName: "Jan Novák",
    birthDate: "2012-04-12",
    guardianName: "Jana Nováková",
    email: "jan.novak@example.cz",
    phone: "+420 777 123 456",
    privacy: "Souhlasím",
    ...overrides,
  };
}

test("Google Forms validation accepts a valid minor registration", () => {
  assert.deepEqual(helpers.validateSubmission_(validSubmission()).errors, []);
});

test("Google Forms validation rejects malformed contact and future birth data", () => {
  const errors = helpers.validateSubmission_(validSubmission({
    birthDate: "2999-01-01",
    email: "spatne",
    phone: "123",
    privacy: "ne",
  })).errors;

  assert.ok(errors.some((error) => error.includes("Datum narozeni")));
  assert.ok(errors.some((error) => error.includes("e-mail")));
  assert.ok(errors.some((error) => error.includes("telefon")));
  assert.ok(errors.some((error) => error.includes("souhlas")));
});

test("a minor registration requires a guardian", () => {
  const errors = helpers.validateSubmission_(validSubmission({ guardianName: "" })).errors;
  assert.ok(errors.some((error) => error.includes("zakonny zastupce")));
});

test("event labels are reduced to the stable allowlisted ID", () => {
  const values = helpers.readFormValues_({
    "Akce": ["orlicke-hory-2026 — Sokolský výlet"],
    "Jméno a příjmení účastníka": [" Jan  Novák "],
    "Datum narození účastníka": ["12. 4. 2012"],
    "Jméno a příjmení zákonného zástupce": ["Jana Nováková"],
    "E-mail": ["JAN.NOVAK@EXAMPLE.CZ"],
    "Telefon": ["+420 777 123 456"],
    "Souhlas se zpracováním údajů": ["Souhlasím"],
  });

  assert.equal(values.eventId, "orlicke-hory-2026");
  assert.equal(values.participantName, "Jan Novák");
  assert.equal(values.email, "jan.novak@example.cz");
  assert.equal(helpers.parseFormDate_(values.birthDate), "2012-04-12");
});

test("duplicate identity ignores email spelling but separates events", () => {
  const original = validSubmission();
  const anotherEmail = { ...original, email: "rodic@example.com", participantName: "JAN NOVAK" };
  const anotherEvent = { ...anotherEmail, eventId: "letni-tabor-2027" };

  const secret = "test-secret-that-is-longer-than-thirty-two-characters";
  assert.equal(helpers.createDedupeKey_(original, secret), helpers.createDedupeKey_(anotherEmail, secret));
  assert.notEqual(helpers.createDedupeKey_(original, secret), helpers.createDedupeKey_(anotherEvent, secret));
});

test("scheduled jobs use the persisted private spreadsheet ID", () => {
  assert.match(source, /REGISTRATION_SPREADSHEET_ID/);
  assert.match(source, /DEDUPE_SECRET/);
  assert.match(source, /computeHmacSha256Signature/);
  assert.match(source, /SpreadsheetApp\.openById/);
  assert.doesNotMatch(source, /const spreadsheet = SpreadsheetApp\.getActive\(\);\s*const autoDelete/);
});

test("automation monitors unprocessed rows and ignores unrelated sheets", () => {
  assert.match(source, /function monitorRegistrationProcessing\(\)/);
  assert.match(source, /everyHours\(1\)/);
  assert.match(source, /function isRegistrationResponseSheet_\(sheet\)/);
  assert.match(source, /Automaticke zpracovani neprobehlo/);
});
