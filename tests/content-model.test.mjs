import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { deriveContentData, validateSiteContent } from "../scripts/content-model.mjs";

const content = JSON.parse(await readFile(new URL("../src/data/site-content.json", import.meta.url), "utf8"));

test("the single public content source passes runtime validation", () => {
  assert.deepEqual(validateSiteContent(content), []);
});

test("content validation rejects duplicate IDs and malformed policy", () => {
  const invalid = structuredClone(content);
  invalid.events[1].id = invalid.events[0].id;
  invalid.events[0].registration.closesAt = "not-a-date";
  const errors = validateSiteContent(invalid);
  assert.ok(errors.some((error) => error.includes("duplicitní ID")));
  assert.ok(errors.some((error) => error.includes("closesAt")));
});

test("an open registration requires an official Google Forms URL", () => {
  const missing = structuredClone(content);
  missing.events[0].registration.open = true;
  assert.ok(validateSiteContent(missing).some((error) => error.includes("formUrl je povinný")));

  const malicious = structuredClone(content);
  malicious.events[0].registration.formUrl = "https://example.com/phishing";
  assert.ok(validateSiteContent(malicious).some((error) => error.includes("Google Forms")));

  const valid = structuredClone(content);
  valid.events[0].registration.open = true;
  valid.events[0].registration.formUrl = "https://docs.google.com/forms/d/e/example/viewform";
  assert.deepEqual(validateSiteContent(valid), []);
});

test("worker calendar fallback is derived from the public source", () => {
  assert.equal(deriveContentData(content).calendarEvents, content.calendarFallback);
});
