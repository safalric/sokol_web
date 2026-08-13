import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { deriveContentData } from "../scripts/content-model.mjs";
import { createWorker } from "../server/worker-runtime.js";

const content = JSON.parse(await readFile(new URL("../src/data/site-content.json", import.meta.url), "utf8"));
const { calendarEvents } = deriveContentData(content);
const routeMetadata = JSON.parse(await readFile(new URL("../src/data/site-routes.json", import.meta.url), "utf8"));
const fixedNow = () => new Date("2026-07-26T12:00:00Z");

function createTestWorker(options = {}) {
  return createWorker({ indexHtml: "<!doctype html><title>Test</title>", staticEntries: [], calendarEvents, now: fixedNow, ...options });
}

test("calendar API chooses the first upcoming fallback month", async () => {
  const response = await createTestWorker().fetch(new Request("https://sokol.example/api/calendar"));
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.deepEqual(body.period, { year: 2026, month: 8 });
  assert.equal(body.source, "demo");
  assert.equal(body.events.length, 1);
  assert.equal(body.subscriptions, null);
});

test("configured calendar returns live events and Apple subscription links", async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ items: [{
    id: "event-1",
    summary: "Florbal",
    location: "Sokolovna",
    status: "confirmed",
    start: { dateTime: "2026-08-03T17:00:00+02:00" },
    end: { dateTime: "2026-08-03T18:30:00+02:00" },
  }] }), { headers: { "Content-Type": "application/json" } });
  const response = await createTestWorker({ fetchImpl }).fetch(new Request("https://sokol.example/api/calendar?year=2026&month=8"), {
    GOOGLE_CALENDAR_ID: "sokol@example.com",
    GOOGLE_CALENDAR_API_KEY: "test-key",
  });
  const body = await response.json();
  assert.equal(body.source, "google");
  assert.equal(body.events[0].title, "Florbal");
  assert.match(body.subscriptions.apple, /^webcal:\/\/calendar\.google\.com/);
  assert.match(body.subscriptions.google, /^https:\/\/calendar\.google\.com/);
  assert.doesNotMatch(JSON.stringify(body), /test-key/);
});

test("invalid calendar periods are rejected", async () => {
  const response = await createTestWorker().fetch(new Request("https://sokol.example/api/calendar?year=2026&month=13"));
  assert.equal(response.status, 400);
});

test("legacy personal-data API is not exposed", async () => {
  const response = await createTestWorker().fetch(new Request("https://sokol.example/api/registrations", { method: "POST" }));
  assert.equal(response.status, 404);
});

test("worker returns known routes and noindex 404 pages", async () => {
  const seoHtml = `<!doctype html><head><meta name="description" content="default"><meta name="robots" content="index, follow"><meta name="site-origin" content="https://old.example"><link rel="canonical" href="https://old.example/"><meta property="og:title" content="default"><meta property="og:description" content="default"><meta property="og:url" content="https://old.example/"><meta property="og:image" content="https://old.example/og.png"><meta name="twitter:title" content="default"><meta name="twitter:description" content="default"><meta name="twitter:image" content="https://old.example/og.png"><title>Default</title></head>`;
  const worker = createWorker({ indexHtml: seoHtml, staticEntries: [], calendarEvents, appRoutes: ["/", "/kontakt"], routeMetadata, now: fixedNow });
  const known = await worker.fetch(new Request("https://preview.example/kontakt", { headers: { Accept: "text/html" } }), { PUBLIC_SITE_URL: "https://sokoldoudleby.cz" });
  const unknown = await worker.fetch(new Request("https://preview.example/neexistuje", { headers: { Accept: "text/html" } }));
  assert.equal(known.status, 200);
  assert.match(await known.text(), /https:\/\/sokoldoudleby\.cz\/kontakt/);
  assert.equal(unknown.status, 404);
  assert.match(await unknown.text(), /noindex, follow/);
});

test("robots and sitemap use the configured production origin", async () => {
  const worker = createWorker({ indexHtml: "", staticEntries: [], calendarEvents, appRoutes: ["/", "/kontakt"], routeMetadata, now: fixedNow });
  const env = { PUBLIC_SITE_URL: "https://sokoldoudleby.cz" };
  const robots = await worker.fetch(new Request("https://preview.example/robots.txt"), env);
  const sitemap = await worker.fetch(new Request("https://preview.example/sitemap.xml"), env);
  assert.match(await robots.text(), /sokoldoudleby\.cz\/sitemap\.xml/);
  assert.match(await sitemap.text(), /sokoldoudleby\.cz\/kontakt/);
});

test("responses include strict security headers without obsolete form providers", async () => {
  const response = await createTestWorker().fetch(new Request("https://sokol.example/api/health"));
  const csp = response.headers.get("Content-Security-Policy");
  assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
  assert.match(csp, /frame-ancestors 'none'/);
  assert.doesNotMatch(csp, /turnstile|challenges\.cloudflare/);
});

test("health requires only the public calendar when live mode is enabled", async () => {
  const worker = createTestWorker();
  const demo = await worker.fetch(new Request("https://sokol.example/api/health"));
  const degraded = await worker.fetch(new Request("https://sokol.example/api/health"), { HEALTH_EXPECT_LIVE: "true" });
  const live = await worker.fetch(new Request("https://sokol.example/api/health"), {
    HEALTH_EXPECT_LIVE: "true",
    GOOGLE_CALENDAR_ID: "sokol@example.com",
    GOOGLE_CALENDAR_API_KEY: "key",
  });
  assert.equal(demo.status, 200);
  assert.equal(degraded.status, 503);
  assert.equal(live.status, 200);
  assert.equal((await live.json()).registrations, "google_forms");
});

test("unsupported methods are rejected with an Allow header", async () => {
  const response = await createTestWorker().fetch(new Request("https://sokol.example/api/calendar", { method: "POST" }));
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET");
});
