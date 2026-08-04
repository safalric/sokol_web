import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createWorker } from "../server/worker-runtime.js";

const calendarEvents = JSON.parse(await readFile(new URL("../src/data/calendar-events.json", import.meta.url), "utf8"));
const registrationEvents = JSON.parse(await readFile(new URL("../src/data/registration-events.json", import.meta.url), "utf8"));
const fixedNow = () => new Date("2026-07-26T12:00:00Z");
const liveEnv = {
  RESEND_API_KEY: "re_test",
  REGISTRATION_FROM_EMAIL: "test@sokol.example",
  REGISTRATION_ORGANIZER_EMAIL: "organizer@sokol.example",
  GOOGLE_SHEETS_WEBHOOK_URL: "https://script.google.com/macros/s/test/exec",
  GOOGLE_SHEETS_WEBHOOK_SECRET: "long-test-secret",
  TURNSTILE_SITE_KEY: "turnstile-site-key",
  TURNSTILE_SECRET_KEY: "turnstile-secret-key",
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
    consentVersion: "2026-07-26",
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

test("registration API validates fields, guardian declaration and explicit health consent", async () => {
  const worker = createTestWorker();
  const invalid = await postRegistration(worker, registration({ email: "bad", healthNote: "Alergie", healthConsent: false }));
  assert.equal(invalid.status, 422);
  const body = await invalid.json();
  assert.ok(body.fields.email);
  assert.ok(body.fields.healthConsent);
  const missingGuardian = await postRegistration(worker, registration({ guardianName: "", guardianDeclaration: false }));
  assert.equal(missingGuardian.status, 422);
  assert.ok((await missingGuardian.json()).fields.guardianDeclaration);
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
  const response = await postRegistration(createTestWorker({ fetchImpl }), registration({ healthNote: "Alergie", healthConsent: true, additionalNote: "=IMPORTXML(A1)" }), env);
  assert.equal(response.status, 201);
  const responseBody = await response.json();
  assert.equal(responseBody.mode, "live");
  assert.equal(responseBody.capacityRemaining, 29);
  assert.equal(calls.filter((call) => call.url === "https://api.resend.com/emails").length, 2);
  assert.equal(calls.filter((call) => call.url.includes("script.google.com")).length, 1);
  assert.equal(calls.filter((call) => call.url.includes("turnstile")).length, 1);
  const organizerCall = calls.find((call) => call.url === "https://api.resend.com/emails");
  assert.ok(organizerCall.init.headers["Idempotency-Key"]);
  assert.doesNotMatch(organizerCall.init.body, /Alergie/);
  const sheetCall = calls.find((call) => call.url.includes("script.google.com"));
  const sheetBody = JSON.parse(sheetCall.init.body);
  assert.equal(sheetBody.action, "reserve");
  assert.equal(sheetBody.capacity, 30);
  assert.equal(sheetBody.row[9], "'=IMPORTXML(A1)");
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

test("organizer email HTML-encodes untrusted free text", async () => {
  const calls = [];
  const fetchImpl = successfulDeliveryFetch(calls);
  const response = await postRegistration(createTestWorker({ fetchImpl }), registration({
    additionalNote: "<img src=x onerror=alert(1)>",
  }), liveEnv);
  assert.equal(response.status, 201);
  const organizerCall = calls.find((call) => call.url === "https://api.resend.com/emails");
  const organizerPayload = JSON.parse(organizerCall.init.body);
  assert.doesNotMatch(organizerPayload.html, /<img/);
  assert.match(organizerPayload.html, /&lt;img/);
});

test("live health data requires an explicitly enabled restricted store", async () => {
  const fetchImpl = successfulDeliveryFetch();
  const response = await postRegistration(createTestWorker({ fetchImpl }), registration({ healthNote: "Alergie", healthConsent: true }), liveEnv);
  assert.equal(response.status, 503);
});

test("registration config exposes only the public Turnstile site key", async () => {
  const worker = createTestWorker();
  const live = await worker.fetch(new Request("https://sokol.example/api/registration-config"), liveEnv);
  const liveBody = await live.json();
  assert.deepEqual(liveBody, {
    mode: "live",
    turnstileSiteKey: "turnstile-site-key",
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
  assert.equal(fallbackBody.configurationWarning, true);
  assert.deepEqual(fallbackBody.missingCapabilities.sort(), ["antispam", "email", "storage"]);
  assert.doesNotMatch(JSON.stringify(fallbackBody), /partial|RESEND_API_KEY|secret/i);
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

test("unsupported methods are rejected with Allow header", async () => {
  const response = await createTestWorker().fetch(new Request("https://sokol.example/api/calendar", { method: "POST" }));
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("Allow"), "GET");
});
