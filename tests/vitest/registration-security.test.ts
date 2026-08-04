// @vitest-environment node

import { readFile } from "node:fs/promises";
import { describe, expect, test, vi } from "vitest";
import { createWorker } from "../../server/worker-runtime.js";

const calendarEvents = JSON.parse(await readFile(new URL("../../src/data/calendar-events.json", import.meta.url), "utf8"));
const registrationEvents = JSON.parse(await readFile(new URL("../../src/data/registration-events.json", import.meta.url), "utf8"));
const fixedNow = () => new Date("2026-07-26T12:00:00Z");

function createTestWorker(fetchImpl = vi.fn()) {
  return createWorker({
    indexHtml: "<!doctype html><title>Test</title>",
    staticEntries: [],
    calendarEvents,
    registrationEvents,
    appRoutes: ["/", "/akce"],
    now: fixedNow,
    fetchImpl,
  });
}

function validRegistration(overrides: Record<string, unknown> = {}) {
  return {
    submissionId: "1234567890abcdef1234567890abcdef",
    eventName: registrationEvents[0].name,
    participantName: "Jan Novák",
    birthDate: "2012-04-12",
    guardianName: "Jana Nováková",
    email: "jan.novak@example.cz",
    phone: "+420 777 123 456",
    healthNote: "",
    additionalNote: "",
    privacyAcknowledged: true,
    guardianDeclaration: true,
    healthConsent: false,
    mediaConsent: false,
    website_hp: "",
    formStartedAt: fixedNow().getTime() - 60_000,
    turnstileToken: "",
    consentVersion: "2026-07-26",
    ...overrides,
  };
}

async function submit(body: Record<string, unknown>, env: Record<string, string> = {}) {
  return createTestWorker().fetch(new Request("https://sokol.example/api/registrations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "CF-Connecting-IP": crypto.randomUUID(),
      Origin: "https://sokol.example",
    },
    body: JSON.stringify(body),
  }), env);
}

describe("registration API manipulation protections", () => {
  test("example environment never exposes a VITE-prefixed server secret", async () => {
    const envExample = await readFile(new URL("../../.env.example", import.meta.url), "utf8");
    expect(envExample).not.toMatch(/^VITE_[A-Z0-9_]+=/m);
  });

  test("partial production configuration stays in safe demo mode without leaking secrets", async () => {
    const secret = "re_super_secret_value";
    const response = await submit(validRegistration(), { RESEND_API_KEY: secret });
    const responseText = await response.text();

    expect(response.status).toBe(202);
    expect(JSON.parse(responseText).mode).toBe("demo");
    expect(responseText).not.toContain(secret);
    expect(responseText).not.toContain("RESEND_API_KEY");
  });

  test("rejects mass-assignment fields injected by a manipulated client", async () => {
    const response = await submit(validRegistration({ role: "administrator" }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.fields.request).toBeTruthy();
  });

  test("requires explicit health consent when health data is present", async () => {
    const response = await submit(validRegistration({ healthNote: "Silná alergie", healthConsent: false }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.fields.healthConsent).toBeTruthy();
  });

  test("silently discards a filled honeypot", async () => {
    const response = await submit(validRegistration({ website_hp: "https://spam.example" }));
    const body = await response.json();

    expect(response.status).toBe(202);
    expect(body.mode).toBe("discarded");
  });

  test("rejects submissions that bypass the minimum completion time", async () => {
    const response = await submit(validRegistration({ formStartedAt: fixedNow().getTime() - 100 }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.fields.request).toBeTruthy();
  });
});
