import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createWorker } from "../server/worker-runtime.js";

const calendarEvents = JSON.parse(await readFile(new URL("../src/data/calendar-events.json", import.meta.url), "utf8"));
const demoRegistrationEvents = JSON.parse(await readFile(new URL("../src/data/registration-events.json", import.meta.url), "utf8"));
const registrationEvents = demoRegistrationEvents.map((event) => ({ ...event, productionApproved: true }));
const routeMetadata = JSON.parse(await readFile(new URL("../src/data/site-routes.json", import.meta.url), "utf8"));
const fixedNow = () => new Date("2026-07-26T12:00:00Z");

function createRateLimitDatabase() {
  const attempts = new Map();
  return {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async first() {
              assert.match(sql, /INSERT INTO registration_rate_limits/);
              const key = `${values[0]}:${values[1]}`;
              const attemptCount = (attempts.get(key) || 0) + 1;
              attempts.set(key, attemptCount);
              return { attempt_count: attemptCount };
            },
            async run() {
              return { success: true };
            },
          };
        },
      };
    },
  };
}

const liveEnv = {
  RESEND_API_KEY: "re_test",
  REGISTRATION_FROM_EMAIL: "test@sokol.example",
  REGISTRATION_TRIP_ORGANIZER_EMAIL: "trips@sokol.example",
  REGISTRATION_CAMP_ORGANIZER_EMAIL: "camps@sokol.example",
  GOOGLE_SHEETS_WEBHOOK_URL: "https://script.google.com/macros/s/test/exec",
  GOOGLE_SHEETS_WEBHOOK_SECRET: "long-test-secret-at-least-24-chars",
  TURNSTILE_SITE_KEY: "turnstile-site-key",
  TURNSTILE_SECRET_KEY: "turnstile-secret-key",
  RATE_LIMIT_HASH_SECRET: "rate-limit-test-secret-at-least-32-characters",
  DB: createRateLimitDatabase(),
};

function createTestWorker(options = {}) {
  return createWorker({ indexHtml: "<!doctype html><title>Test</title>", staticEntries: [], calendarEvents, registrationEvents, now: fixedNow, ...options });
}

function registration(overrides = {}) {
  return {
    submissionId: "1234567890abcdef1234567890abcdef",
    eventName: "Sokolský výlet do Orlických hor",
    participantName: "Jan Novák",
    birthDate: "2012-04-12",
    guardianName: "Jana Nováková",
    email: "jan.novak@example.cz",
    phone: "+420 777 123 456",
    healthNote: "",
    additionalNote: "Vegetariánský oběd",
    privacyAcknowledged: true,
    guardianDeclaration: true,
    healthConsent: false,
    mediaConsent: false,
    website_hp: "",
    formStartedAt: fixedNow().getTime() - 60_000,
    turnstileToken: "verified-token",
    consentVersion: "2026-08-12",
    ...overrides,
  };
}

function successfulDeliveryFetch(calls = []) {
  return async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).includes("turnstile")) {
      return new Response(JSON.stringify({ success: true, action: "event-registration", hostname: "sokol.example" }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    if (String(url).includes("script.google.com")) {
      return new Response(JSON.stringify({ ok: true, status: "created", capacityRemaining: 29 }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ id: "email-id" }), { headers: { "Content-Type": "application/json" } });
  };
}

async function postRegistration(worker, body, env = {}) {
  return worker.fetch(new Request("https://sokol.example/api/registrations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://sokol.example", "CF-Connecting-IP": crypto.randomUUID() },
    body: JSON.stringify(body),
  }), env);
}

test("calendar API chooses the first upcoming demo month", async () => {
  const response = await createTestWorker().fetch(new Request("https://sokol.example/api/calendar"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.period, { year: 2026, month: 8 });
  assert.equal(body.source, "demo");
  assert.equal(body.events.length, 1);
});

test("worker returns 200 for known HTML routes and 404 for unknown routes", async () => {
  const worker = createWorker({
    indexHtml: "<!doctype html><title>Test</title>",
    staticEntries: [],
    calendarEvents,
    registrationEvents,
    appRoutes: ["/", "/o-nas"],
    now: fixedNow,
  });
  const headers = { Accept: "text/html" };
  const known = await worker.fetch(new Request("https://sokol.example/o-nas", { headers }));
  const unknown = await worker.fetch(new Request("https://sokol.example/neexistuje", { headers }));

  assert.equal(known.status, 200);
  assert.equal(unknown.status, 404);
});

test("calendar API filters a requested month and rejects invalid input", async () => {
  const worker = createTestWorker();
  const valid = await worker.fetch(new Request("https://sokol.example/api/calendar?year=2026&month=9"));
  assert.equal((await valid.json()).events.length, 4);
  const invalid = await worker.fetch(new Request("https://sokol.example/api/calendar?year=2026&month=13"));
  assert.equal(invalid.status, 400);
});

test("calendar API transforms Google Calendar events", async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ items: [{
    id: "google-1",
    summary: "Florbal",
    location: "Sokolovna",
    start: { dateTime: "2026-09-07T17:00:00+02:00" },
    end: { dateTime: "2026-09-07T18:30:00+02:00" },
  }] }), { headers: { "Content-Type": "application/json" } });
  const response = await createTestWorker({ fetchImpl }).fetch(
    new Request("https://sokol.example/api/calendar?year=2026&month=9"),
    { GOOGLE_CALENDAR_ID: "public@example.com", GOOGLE_CALENDAR_API_KEY: "test" },
  );
  const body = await response.json();
  assert.equal(body.source, "google");
  assert.deepEqual(body.events[0], { id: "google-1", date: "2026-09-07", title: "Florbal", time: "17:00-18:30", category: "training", place: "Sokolovna" });
});

test("calendar API falls back safely when Google fails", async () => {
  const response = await createTestWorker({ fetchImpl: async () => new Response("fail", { status: 503 }) }).fetch(
    new Request("https://sokol.example/api/calendar?year=2026&month=9"),
    { GOOGLE_CALENDAR_ID: "public@example.com", GOOGLE_CALENDAR_API_KEY: "test" },
  );
  const body = await response.json();
  assert.equal(body.source, "demo");
  assert.match(body.warning, /Google/);
});

test("trip registration validates fields, guardian declaration and rejects health data", async () => {
  const worker = createTestWorker();
  const invalid = await postRegistration(worker, registration({ email: "bad", healthNote: "Alergie", healthConsent: false }));
  assert.equal(invalid.status, 422);
  const body = await invalid.json();
  assert.ok(body.fields.email);
  assert.ok(body.fields.healthNote);
  const missingGuardian = await postRegistration(worker, registration({ guardianName: "", guardianDeclaration: false }));
  assert.equal(missingGuardian.status, 422);
  assert.ok((await missingGuardian.json()).fields.guardianDeclaration);
});

test("camp registration accepts health data only with explicit consent", async () => {
  const worker = createTestWorker();
  const eventName = registrationEvents.find((event) => event.registrationType === "camp").name;
  const invalid = await postRegistration(worker, registration({ eventName, healthNote: "Alergie", healthConsent: false }));
  assert.equal(invalid.status, 422);
  assert.ok((await invalid.json()).fields.healthConsent);

  const valid = await postRegistration(worker, registration({ eventName, healthNote: "Alergie", healthConsent: true }));
  assert.equal(valid.status, 202);
});

test("honeypot registrations are discarded without delivery", async () => {
  const response = await postRegistration(createTestWorker(), registration({ website_hp: "https://spam.example" }));
  assert.equal(response.status, 202);
  assert.equal((await response.json()).mode, "discarded");
});

test("registration API rejects cross-origin requests", async () => {
  const worker = createTestWorker();
  const response = await worker.fetch(new Request("https://sokol.example/api/registrations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://attacker.example" },
    body: JSON.stringify(registration()),
  }));
  assert.equal(response.status, 403);
});

test("registration API rejects missing origin and event tampering", async () => {
  const worker = createTestWorker();
  const missingOrigin = await worker.fetch(new Request("https://sokol.example/api/registrations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(registration()),
  }));
  assert.equal(missingOrigin.status, 403);
  const tampered = await postRegistration(worker, registration({ eventName: "Neznámá akce" }));
  assert.equal(tampered.status, 422);
  assert.ok((await tampered.json()).fields.eventName);
});

test("registration API rejects unexpected fields", async () => {
  const response = await postRegistration(createTestWorker(), registration({ admin: true }));
  assert.equal(response.status, 422);
  assert.ok((await response.json()).fields.request);
});

test("registration API rejects submissions completed unrealistically quickly", async () => {
  const response = await postRegistration(createTestWorker(), registration({ formStartedAt: fixedNow().getTime() - 500 }));
  assert.equal(response.status, 422);
  assert.ok((await response.json()).fields.request);
});

test("registration API applies per-client rate limiting", async () => {
  const worker = createTestWorker();
  const makeRequest = (index) => worker.fetch(new Request("https://sokol.example/api/registrations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://sokol.example", "CF-Connecting-IP": "192.0.2.1" },
    body: JSON.stringify(registration({ submissionId: `1234567890abcdef1234567890abc${index}` })),
  }));
  for (let index = 0; index < 5; index += 1) assert.notEqual((await makeRequest(index)).status, 429);
  assert.equal((await makeRequest(5)).status, 429);
});

test("valid demo registration returns email previews and is idempotent", async () => {
  const worker = createTestWorker();
  const first = await postRegistration(worker, registration());
  const second = await postRegistration(worker, registration());
  assert.equal(first.status, 202);
  const firstBody = await first.json();
  const secondBody = await second.json();
  assert.equal(firstBody.mode, "demo");
  assert.equal(firstBody.receiptId, secondBody.receiptId);
  assert.equal(firstBody.preview.participant.to, "j***@example.cz");
});

test("configured registration sends two emails and appends one sheet row", async () => {
  const calls = [];
  const fetchImpl = successfulDeliveryFetch(calls);
  const env = { ...liveEnv, REGISTRATION_HEALTH_DATA_ENABLED: "true" };
  const eventName = registrationEvents.find((event) => event.registrationType === "camp").name;
  const response = await postRegistration(createTestWorker({ fetchImpl }), registration({ eventName, healthNote: "Alergie", healthConsent: true, additionalNote: "=IMPORTXML(A1)" }), env);
  assert.equal(response.status, 201);
  const responseBody = await response.json();
  assert.equal(responseBody.mode, "live");
  assert.equal(responseBody.capacityRemaining, 29);
  assert.equal(calls.filter((call) => call.url === "https://api.resend.com/emails").length, 2);
  assert.equal(calls.filter((call) => call.url.includes("script.google.com")).length, 1);
  assert.equal(calls.filter((call) => call.url.includes("turnstile")).length, 1);
  const organizerCall = calls.find((call) => call.url === "https://api.resend.com/emails");
  assert.deepEqual(JSON.parse(organizerCall.init.body).to, ["camps@sokol.example"]);
  assert.ok(organizerCall.init.headers["Idempotency-Key"]);
  assert.doesNotMatch(organizerCall.init.body, /Alergie/);
  assert.match(organizerCall.init.body, /Zdravotní údaje/);
  const sheetCall = calls.find((call) => call.url.includes("script.google.com"));
  const sheetBody = JSON.parse(sheetCall.init.body);
  assert.equal(sheetBody.action, "reserve");
  assert.equal(sheetBody.registrationType, "camp");
  assert.equal(sheetBody.capacity, 40);
  assert.equal(sheetBody.record.additionalNote, "'=IMPORTXML(A1)");
  assert.equal(sheetBody.record.healthNote, "Alergie");
});

test("registration capacity is enforced before emails are sent", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).includes("turnstile")) {
      return new Response(JSON.stringify({ success: true, action: "event-registration", hostname: "sokol.example" }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    if (String(url).includes("script.google.com")) {
      return new Response(JSON.stringify({ ok: true, status: "full", capacityRemaining: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ id: "unexpected-email" }), { headers: { "Content-Type": "application/json" } });
  };
  const response = await postRegistration(createTestWorker({ fetchImpl }), registration(), liveEnv);
  assert.equal(response.status, 409);
  assert.equal(calls.filter((call) => call.url === "https://api.resend.com/emails").length, 0);
});

test("live registrations require a valid Turnstile token", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify({ success: false }), { headers: { "Content-Type": "application/json" } });
  };
  const response = await postRegistration(createTestWorker({ fetchImpl }), registration(), liveEnv);
  assert.equal(response.status, 403);
  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /turnstile/);
});

test("organizer emails omit free text that might contain sensitive details", async () => {
  const calls = [];
  const fetchImpl = successfulDeliveryFetch(calls);
  const response = await postRegistration(createTestWorker({ fetchImpl }), registration({
    additionalNote: "<img src=x onerror=alert(1)>",
  }), liveEnv);
  assert.equal(response.status, 201);
  const organizerCall = calls.find((call) => call.url === "https://api.resend.com/emails");
  const organizerPayload = JSON.parse(organizerCall.init.body);
  assert.doesNotMatch(organizerPayload.html, /<img/);
  assert.doesNotMatch(organizerPayload.html, /&lt;img|onerror|alert/);
  assert.doesNotMatch(organizerPayload.html, /Zdravotní údaje/);
  assert.deepEqual(organizerPayload.to, ["trips@sokol.example"]);
  const sheetPayload = JSON.parse(calls.find((call) => call.url.includes("script.google.com")).init.body);
  assert.equal(sheetPayload.registrationType, "trip");
  assert.equal(Object.hasOwn(sheetPayload.record, "healthNote"), false);
  assert.equal(Object.hasOwn(sheetPayload.record, "healthConsent"), false);
});

test("live health data requires an explicitly enabled restricted store", async () => {
  const fetchImpl = successfulDeliveryFetch();
  const eventName = registrationEvents.find((event) => event.registrationType === "camp").name;
  const response = await postRegistration(createTestWorker({ fetchImpl }), registration({ eventName, healthNote: "Alergie", healthConsent: true }), liveEnv);
  assert.equal(response.status, 503);
});

test("registration config exposes only the public Turnstile site key", async () => {
  const worker = createTestWorker();
  const live = await worker.fetch(new Request("https://sokol.example/api/registration-config"), liveEnv);
  const liveBody = await live.json();
  assert.deepEqual(liveBody, {
    mode: "live",
    turnstileSiteKey: "turnstile-site-key",
    healthDataEnabled: false,
    configurationWarning: false,
    missingCapabilities: [],
    warning: null,
  });
  assert.doesNotMatch(JSON.stringify(liveBody), /secret/i);

  const fallback = await worker.fetch(new Request("https://sokol.example/api/registration-config"), {
    RESEND_API_KEY: "partial",
  });
  const fallbackBody = await fallback.json();
  assert.equal(fallbackBody.mode, "demo");
  assert.equal(fallbackBody.healthDataEnabled, false);
  assert.equal(fallbackBody.configurationWarning, true);
  assert.deepEqual(fallbackBody.missingCapabilities.sort(), ["abuseProtection", "antispam", "email", "storage"]);
  assert.doesNotMatch(JSON.stringify(fallbackBody), /partial|RESEND_API_KEY|secret/i);
});

test("worker renders route-specific SEO and canonical URLs before JavaScript", async () => {
  const seoHtml = `<!doctype html><html><head>
    <meta name="description" content="default">
    <meta name="robots" content="index, follow">
    <meta name="site-origin" content="https://old.example">
    <link rel="canonical" href="https://old.example/">
    <meta property="og:title" content="default">
    <meta property="og:description" content="default">
    <meta property="og:url" content="https://old.example/">
    <meta property="og:image" content="https://old.example/og.png">
    <meta name="twitter:title" content="default">
    <meta name="twitter:description" content="default">
    <meta name="twitter:image" content="https://old.example/og.png">
    <title>Default</title></head><body></body></html>`;
  const worker = createWorker({
    indexHtml: seoHtml,
    staticEntries: [],
    calendarEvents,
    registrationEvents,
    appRoutes: routeMetadata.map((route) => route.path),
    routeMetadata,
    now: fixedNow,
  });
  const response = await worker.fetch(new Request("https://preview.example/kontakt", { headers: { Accept: "text/html" } }), {
    PUBLIC_SITE_URL: "https://sokoldoudleby.cz",
  });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /<title>Kontakty \| TJ Sokol Doudleby nad Orlicí<\/title>/);
  assert.match(html, /href="https:\/\/sokoldoudleby\.cz\/kontakt"/);
  assert.match(html, /content="https:\/\/sokoldoudleby\.cz\/og\.png"/);
  assert.doesNotMatch(html, /old\.example|preview\.example/);
});

test("unknown HTML routes are server-rendered as noindex 404 pages", async () => {
  const seoHtml = `<!doctype html><head><meta name="description" content="default"><meta name="robots" content="index, follow"><meta name="site-origin" content="https://old.example"><link rel="canonical" href="https://old.example/"><meta property="og:title" content="default"><meta property="og:description" content="default"><meta property="og:url" content="https://old.example/"><meta property="og:image" content="https://old.example/og.png"><meta name="twitter:title" content="default"><meta name="twitter:description" content="default"><meta name="twitter:image" content="https://old.example/og.png"><title>Default</title></head>`;
  const worker = createWorker({ indexHtml: seoHtml, staticEntries: [], calendarEvents, registrationEvents, appRoutes: ["/"], routeMetadata, now: fixedNow });
  const response = await worker.fetch(new Request("https://sokol.example/neexistuje", { headers: { Accept: "text/html" } }));
  const html = await response.text();

  assert.equal(response.status, 404);
  assert.match(html, /content="noindex, follow"/);
  assert.match(html, /Stránka nenalezena/);
});

test("robots and sitemap use the configured production origin", async () => {
  const worker = createWorker({ indexHtml: "", staticEntries: [], calendarEvents, registrationEvents, appRoutes: ["/", "/kontakt"], routeMetadata, now: fixedNow });
  const env = { PUBLIC_SITE_URL: "https://sokoldoudleby.cz" };
  const robots = await worker.fetch(new Request("https://preview.example/robots.txt"), env);
  const sitemap = await worker.fetch(new Request("https://preview.example/sitemap.xml"), env);

  assert.match(await robots.text(), /https:\/\/sokoldoudleby\.cz\/sitemap\.xml/);
  assert.match(await sitemap.text(), /https:\/\/sokoldoudleby\.cz\/kontakt/);
});

test("invalid webhook configuration cannot activate live registrations", async () => {
  const worker = createTestWorker();
  const response = await worker.fetch(new Request("https://sokol.example/api/registration-config"), {
    ...liveEnv,
    GOOGLE_SHEETS_WEBHOOK_URL: "http://attacker.example/webhook",
    GOOGLE_SHEETS_WEBHOOK_SECRET: "short",
  });
  const body = await response.json();

  assert.equal(body.mode, "demo");
  assert.ok(body.missingCapabilities.includes("storage"));
});

test("durable rate limiting works across separate Worker instances", async () => {
  const database = createRateLimitDatabase();
  const env = { ...liveEnv, DB: database };
  const statuses = [];

  for (let index = 0; index < 6; index += 1) {
    const worker = createTestWorker({ fetchImpl: successfulDeliveryFetch() });
    const response = await worker.fetch(new Request("https://sokol.example/api/registrations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://sokol.example",
        "CF-Connecting-IP": "192.0.2.44",
      },
      body: JSON.stringify(registration({ submissionId: `1234567890abcdef1234567890abcde${index}`, participantName: "1" })),
    }), env);
    statuses.push(response.status);
  }

  assert.deepEqual(statuses, [422, 422, 422, 422, 422, 429]);
});

test("live registration fails closed without a trusted Cloudflare client address", async () => {
  const worker = createTestWorker({ fetchImpl: successfulDeliveryFetch() });
  const response = await worker.fetch(new Request("https://sokol.example/api/registrations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://sokol.example",
      "X-Forwarded-For": "192.0.2.55",
    },
    body: JSON.stringify(registration()),
  }), liveEnv);

  assert.equal(response.status, 503);
});

test("malformed registration event policy is rejected before delivery", async () => {
  const malformedEvents = [{
    ...registrationEvents[0],
    registrationClosesAt: "2026-09-20T18:00:00+02:00",
    retentionReviewDate: "2026-09-01",
  }];
  const response = await postRegistration(createTestWorker({ registrationEvents: malformedEvents }), registration());
  const body = await response.json();

  assert.equal(response.status, 422);
  assert.ok(body.fields.eventName);
});

test("API and HTML responses include security headers", async () => {
  const worker = createTestWorker();
  const api = await worker.fetch(new Request("https://sokol.example/api/health"));
  const html = await worker.fetch(new Request("https://sokol.example/o-nas", { headers: { Accept: "text/html" } }));
  assert.equal(api.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(html.headers.get("X-Frame-Options"), "DENY");
  assert.match(html.headers.get("Content-Security-Policy"), /frame-ancestors 'none'/);
  assert.match(html.headers.get("Content-Security-Policy"), /frame-src https:\/\/www\.openstreetmap\.org/);
  assert.match(html.headers.get("Content-Security-Policy"), /https:\/\/challenges\.cloudflare\.com/);
  assert.doesNotMatch(html.headers.get("Content-Security-Policy"), /unsafe-inline/);
  assert.equal(html.headers.get("Cross-Origin-Opener-Policy"), "same-origin");
});

test("health endpoint becomes monitorable when live integrations are required", async () => {
  const worker = createTestWorker();
  const demo = await worker.fetch(new Request("https://sokol.example/api/health"));
  const requiredLive = await worker.fetch(new Request("https://sokol.example/api/health"), { HEALTH_EXPECT_LIVE: "true", RELEASE_SHA: "1234567890abcdef" });
  const body = await requiredLive.json();

  assert.equal(demo.status, 200);
  assert.equal(requiredLive.status, 503);
  assert.equal(body.ok, false);
  assert.equal(body.status, "degraded");
  assert.equal(body.release, "1234567890ab");
  assert.equal(body.checkedAt, fixedNow().toISOString());
});

test("unsupported methods are rejected with Allow header", async () => {
  const response = await createTestWorker().fetch(new Request("https://sokol.example/api/calendar", { method: "POST" }));
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET");
});

test("unapproved demo events cannot accept live registrations", async () => {
  const calls = [];
  const worker = createTestWorker({ registrationEvents: demoRegistrationEvents, fetchImpl: successfulDeliveryFetch(calls) });
  assert.equal((await postRegistration(worker, registration(), liveEnv)).status, 409);
  assert.equal(calls.length, 0);
  assert.equal((await postRegistration(worker, registration())).status, 202);
});

test("streamed bodies are limited even without Content-Length", async () => {
  let cancelled = false;
  const stream = new ReadableStream({
    pull(controller) { controller.enqueue(new Uint8Array(6_001)); },
    cancel() { cancelled = true; },
  });
  const request = new Request("https://sokol.example/api/registrations", {
    method: "POST", duplex: "half", body: stream,
    headers: { "Content-Type": "application/json", Origin: "https://sokol.example" },
  });
  assert.equal((await createTestWorker().fetch(request)).status, 413);
  assert.equal(cancelled, true);
});

test("Turnstile must verify both the expected action and hostname", async () => {
  for (const verification of [
    { success: true, action: "event-registration" },
    { success: true, action: "event-registration", hostname: "attacker.example" },
    { success: true, action: "login", hostname: "sokol.example" },
  ]) {
    const worker = createTestWorker({ fetchImpl: async () => Response.json(verification) });
    assert.equal((await postRegistration(worker, registration(), liveEnv)).status, 403);
  }
});

test("invalid durable counters fail closed", async () => {
  for (const value of [null, { attempt_count: 0 }, { attempt_count: "1" }, { attempt_count: -1 }]) {
    const DB = { prepare: () => ({ bind: () => ({ first: async () => value, run: async () => ({ success: true }) }) }) };
    assert.equal((await postRegistration(createTestWorker(), registration(), { ...liveEnv, DB })).status, 503);
  }
});

test("idempotency binds data and does not truncate submission IDs to eight characters", async () => {
  const worker = createTestWorker();
  const first = await (await postRegistration(worker, registration())).json();
  const second = await (await postRegistration(worker, registration({ submissionId: "1234567890abcdef1234567890abcdefff" }))).json();
  assert.notEqual(first.receiptId, second.receiptId);
  assert.equal((await postRegistration(worker, registration({ participantName: "Eva Nováková" }))).status, 409);
});

test("partial email failure reports saved registration and allows an idempotent retry", async () => {
  const calls = [];
  let failEmail = true;
  const success = successfulDeliveryFetch(calls);
  const worker = createTestWorker({ fetchImpl: async (url, init) => {
    if (String(url).includes("api.resend.com") && failEmail) return new Response("unavailable", { status: 503 });
    return success(url, init);
  } });
  const failed = await postRegistration(worker, registration(), liveEnv);
  const body = await failed.json();
  assert.equal(failed.status, 502);
  assert.equal(body.registrationSaved, true);
  assert.match(body.error, /je uložená/);
  failEmail = false;
  const retried = await postRegistration(worker, registration(), liveEnv);
  assert.equal(retried.status, 201);
  assert.equal((await retried.json()).receiptId, body.receiptId);
});

test("durable submission conflicts do not send emails", async () => {
  const calls = [];
  const success = successfulDeliveryFetch(calls);
  const worker = createTestWorker({ fetchImpl: async (url, init) => String(url).includes("script.google.com")
    ? Response.json({ ok: true, status: "conflict" }) : success(url, init) });
  assert.equal((await postRegistration(worker, registration(), liveEnv)).status, 409);
  assert.equal(calls.filter((call) => call.url.includes("resend")).length, 0);
});

test("health recognizes complete live configuration without claiming provider availability", async () => {
  const response = await createTestWorker().fetch(new Request("https://sokol.example/api/health"), {
    ...liveEnv, HEALTH_EXPECT_LIVE: "true", GOOGLE_CALENDAR_ID: "calendar", GOOGLE_CALENDAR_API_KEY: "key",
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
});

test("Google Calendar paginates using Prague month boundaries and skips malformed dates", async () => {
  const urls = [];
  const worker = createTestWorker({ fetchImpl: async (url) => {
    const parsed = new URL(url);
    urls.push(parsed);
    return Response.json(parsed.searchParams.has("pageToken")
      ? { items: [{ id: "two", summary: "Pohyb", start: { date: "2026-10-08" }, extendedProperties: { shared: { category: "training" } } }] }
      : { items: [{ id: "one", summary: "Akce", start: { dateTime: "2026-10-01T00:30:00+02:00" } }, { start: { date: "2026-13-01" } }, { start: { dateTime: "invalid" } }], nextPageToken: "second" });
  } });
  const response = await worker.fetch(new Request("https://sokol.example/api/calendar?year=2026&month=10"), { GOOGLE_CALENDAR_ID: "calendar", GOOGLE_CALENDAR_API_KEY: "key" });
  const body = await response.json();
  assert.equal(body.source, "google");
  assert.equal(body.events.length, 2);
  assert.equal(body.events[1].category, "training");
  assert.equal(urls[0].searchParams.get("timeMin"), "2026-10-01T00:00:00+02:00");
  assert.equal(urls[0].searchParams.get("timeMax"), "2026-11-01T00:00:00+01:00");
  assert.equal(urls[1].searchParams.get("pageToken"), "second");
});

test("live calendar defaults to the current Prague month, not the next demo event", async () => {
  const worker = createTestWorker({ now: () => new Date("2026-07-31T23:00:00Z"), fetchImpl: async () => Response.json({ items: [] }) });
  const response = await worker.fetch(new Request("https://sokol.example/api/calendar"), { GOOGLE_CALENDAR_ID: "calendar", GOOGLE_CALENDAR_API_KEY: "key" });
  assert.deepEqual((await response.json()).period, { year: 2026, month: 8 });
});

test("asset navigation uses the asset binding before the HTML fallback", async () => {
  const calls = [];
  const worker = createTestWorker({ staticEntries: [["/posters/original/test.jpg", { contentType: "image/jpeg" }]] });
  const env = { ASSETS: { fetch: async (request) => {
    calls.push(request.method);
    return new Response(request.method === "HEAD" ? null : "image-bytes", { headers: { "Content-Type": "image/jpeg" } });
  } } };
  for (const method of ["GET", "HEAD"]) {
    const response = await worker.fetch(new Request("https://sokol.example/posters/original/test.jpg", { method, headers: { Accept: "text/html" } }), env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("Content-Type"), "image/jpeg");
    assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
    assert.equal(await response.text(), method === "HEAD" ? "" : "image-bytes");
  }
  assert.deepEqual(calls, ["GET", "HEAD"]);
});

test("only public manifest entries can reach the asset binding", async () => {
  const worker = createTestWorker();
  const env = { ASSETS: { fetch: () => { throw new Error("Private path reached the asset binding"); } } };
  for (const path of ["/server/index.js", "/.env", "/.openai/hosting.json", "/unknown.svg"]) {
    assert.equal((await worker.fetch(new Request(`https://sokol.example${path}`), env)).status, 404);
  }
});

test("missing asset bindings fail explicitly instead of returning an HTML image", async () => {
  const worker = createTestWorker({ staticEntries: [["/fonts/sokol.woff2", { contentType: "font/woff2" }]] });
  const response = await worker.fetch(new Request("https://sokol.example/fonts/sokol.woff2"));
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
});
