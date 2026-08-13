// @vitest-environment node

import { readFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";
import { createWorker } from "../../server/worker-runtime.js";

describe("Google Forms registration boundary", () => {
  test("example environment contains no browser-exposed secret", async () => {
    const envExample = await readFile(new URL("../../.env.example", import.meta.url), "utf8");
    expect(envExample).not.toMatch(/^VITE_[A-Z0-9_]+=/m);
    expect(envExample).not.toMatch(/RESEND|TURNSTILE|SHEETS_WEBHOOK|RATE_LIMIT_HASH/);
  });

  test("the website no longer accepts personal registration data", async () => {
    const worker = createWorker({ indexHtml: "", staticEntries: [], calendarEvents: [] });
    const response = await worker.fetch(new Request("https://sokol.example/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantName: "Jan Novák" }),
    }));

    expect(response.status).toBe(404);
  });

  test("the private Sheets automation has required safeguards and sends no mail", async () => {
    const source = await readFile(new URL("../../server/google-forms-sheets.example.gs", import.meta.url), "utf8");

    expect(() => new Function(source)).not.toThrow();
    expect(source).toMatch(/LockService\.getDocumentLock/);
    expect(source).toMatch(/DUPLICITA/);
    expect(source).toMatch(/countConfirmed_/);
    expect(source).toMatch(/sanitizeSubmittedRow_/);
    expect(source).toMatch(/runDailyMaintenance/);
    expect(source).toMatch(/createPrivateBackup/);
    expect(source).not.toMatch(/MailApp|GmailApp|sendEmail/);
  });
});
