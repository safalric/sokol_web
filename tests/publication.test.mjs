import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createWorker } from "../server/worker-runtime.js";

const readData = async (name) => JSON.parse(await readFile(new URL(`../src/data/${name}.json`, import.meta.url), "utf8"));
const now = () => new Date("2026-12-31T23:30:00Z");
const create = (options = {}) => createWorker({ indexHtml: "", staticEntries: [], calendarEvents: [], now, ...options });
const request = (path) => new Request(`https://sokol.example${path}`);

test("publication data contains no fictional events or open registrations", async () => {
  assert.deepEqual(await readData("calendar-events"), []);
  assert.deepEqual(await readData("registration-events"), []);
  const worker = create();
  const health = await (await worker.fetch(request("/api/health"))).json();
  assert.equal(health.calendar, "local");
  assert.equal(health.registrations, "closed");
  assert.equal(health.ok, true);
});

test("closed registrations do not parse request bodies or call external providers", async () => {
  const worker = create({ fetchImpl: () => { throw new Error("Must not send anything"); } });
  const body = new Request("https://sokol.example/api/registrations", { method: "POST", body: "not-json" });
  body.json = () => { throw new Error("Must not read the body"); };
  body.text = () => { throw new Error("Must not read the body"); };
  const response = await worker.fetch(body);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, "registrations_closed");
  const config = await (await worker.fetch(request("/api/registration-config"))).json();
  assert.equal(config.mode, "unavailable");
  assert.equal(config.turnstileSiteKey, null);
});

test("local calendar accepts only explicitly published sourced records and filters months", async () => {
  const event = { id: "test-only", published: true, date: "2027-01-15", title: "Testovací záznam", time: "10:00", place: "Testovací místo", category: "event", sourceUrl: "https://example.org/source" };
  const worker = create({ calendarEvents: [event, { ...event, id: "draft", published: false }, { ...event, id: "bad-source", sourceUrl: "javascript:alert(1)" }, { ...event, id: "bad-date", date: "2027-02-30" }, { ...event, id: "other-month", date: "2027-02-01" }, { ...event, id: "long", title: "x".repeat(161) }, event] });
  const body = await (await worker.fetch(request("/api/calendar"))).json();
  assert.deepEqual(body.period, { year: 2027, month: 1 });
  assert.equal(body.events.length, 1);
  assert.equal(body.events[0].sourceUrl, event.sourceUrl);
  assert.equal(Object.hasOwn(body.events[0], "published"), false);
  const feb = await (await worker.fetch(request("/api/calendar?year=2027&month=2"))).json();
  assert.equal(feb.events[0].id, "other-month");
});

test("calendar rejects missing, empty and malformed periods", async () => {
  for (const query of ["year=2026", "year=&month=", "year=2026&month=", "year=2026&month=1e1", "year=2036&month=1"]) {
    assert.equal((await create().fetch(request(`/api/calendar?${query}`))).status, 400, query);
  }
});

test("internal delivery route reaches its authenticated handler rather than the generic 404", async () => {
  const worker = create();
  assert.equal((await worker.fetch(request("/api/internal/registration-delivery"))).status, 405);
  assert.equal((await worker.fetch(new Request("https://sokol.example/api/internal/registration-delivery", { method: "POST" }))).status, 503);
});
