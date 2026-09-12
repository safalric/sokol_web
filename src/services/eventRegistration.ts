export type EventRegistrationPayload = {
  submissionId: string;
  eventName: string;
  participantName: string;
  birthDate: string;
  guardianName: string;
  email: string;
  phone: string;
  healthNote: string;
  additionalNote: string;
  privacyAcknowledged: boolean;
  guardianDeclaration: boolean;
  healthConsent: boolean;
  mediaConsent: boolean;
  website_hp: string;
  formStartedAt: number;
  turnstileToken: string;
  consentVersion: "2026-08-12";
};

type DeliveryState = "sent" | "queued" | "attention_required" | "saved" | "duplicate" | "preview" | "not_configured";

export type EventRegistrationResult = {
  ok: true;
  mode: "demo" | "live" | "discarded";
  receiptId?: string;
  capacityRemaining?: number;
  configurationWarning?: boolean;
  warning?: string | null;
  delivery?: {
    organizerEmail: DeliveryState;
    participantEmail: DeliveryState;
    googleSheet: DeliveryState;
  };
  preview?: {
    organizer: { to: string; subject: string };
    participant: { to: string; subject: string };
  };
};

export type RegistrationClientConfig = {
  mode: "demo" | "live" | "unavailable";
  turnstileSiteKey: string | null;
  healthDataEnabled: boolean;
  configurationWarning?: boolean;
  missingCapabilities?: string[];
  warning?: string | null;
};

export function registrationSuccessMessage(result: EventRegistrationResult | null) {
  if (result?.mode !== "live") return "Demo přihláška byla úspěšně zkontrolována. V ostrém provozu by potvrzení přišlo na e-mail; žádná data nebyla uložena ani odeslána.";
  const receipt = result.receiptId ? ` ID přihlášky: ${result.receiptId}.` : "";
  if (result.delivery?.participantEmail === "sent") return `Přihlášku jsme přijali a potvrzení předali e-mailové službě.${receipt}`;
  if (result.delivery?.participantEmail === "attention_required") return `Přihlášku jsme přijali. Potvrzení e-mailem vyžaduje kontrolu organizátora. Neposílejte novou přihlášku.${receipt}`;
  return `Přihlášku jsme přijali. Potvrzení čeká na odeslání a systém jej zkusí odeslat znovu. Neposílejte novou přihlášku.${receipt}`;
}

function isLocalhost() {
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

export async function submitEventRegistration(payload: EventRegistrationPayload): Promise<EventRegistrationResult> {
  if (window.location.protocol !== "https:" && !isLocalhost()) {
    throw new Error("Formulář lze odeslat pouze ze zabezpečené HTTPS adresy.");
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 40_000);
  try {
    const response = await fetch("/api/registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const result = (await response.json().catch(() => ({}))) as EventRegistrationResult & { error?: string };
    if (!response.ok) {
      throw new Error(result.error || "Přihlášku se nepodařilo odeslat. Zkuste to prosím později.");
    }
    return result;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Odeslání trvalo příliš dlouho. Zkontrolujte připojení a zkuste to znovu.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function loadRegistrationConfig(): Promise<RegistrationClientConfig> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch("/api/registration-config", {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Konfiguraci přihlášek se nepodařilo načíst.");
    return (await response.json()) as RegistrationClientConfig;
  } finally {
    window.clearTimeout(timeout);
  }
}
