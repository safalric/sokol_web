import { describe, expect, test } from "vitest";
import { registrationSuccessMessage, type EventRegistrationResult } from "../../src/services/eventRegistration";

describe("truthful registration delivery feedback", () => {
  const result: EventRegistrationResult = { ok: true, mode: "live", receiptId: "SOKOL-test", delivery: { participantEmail: "queued", organizerEmail: "sent", googleSheet: "saved" } };
  test("queued confirmation does not claim that an email was sent", () => {
    expect(registrationSuccessMessage(result)).toContain("čeká na odeslání");
    expect(registrationSuccessMessage(result)).toContain("SOKOL-test");
    expect(registrationSuccessMessage(result)).not.toContain("zasláno");
  });
  test("provider acceptance is distinguished from inbox delivery", () => {
    expect(registrationSuccessMessage({ ...result, delivery: { ...result.delivery!, participantEmail: "sent" } })).toContain("předali e-mailové službě");
  });
  test("manual review and demo remain explicit", () => {
    expect(registrationSuccessMessage({ ...result, delivery: { ...result.delivery!, participantEmail: "attention_required" } })).toContain("kontrolu organizátora");
    expect(registrationSuccessMessage({ ...result, mode: "demo" })).toContain("žádná data nebyla uložena");
  });
});
