export type EventRegistrationPayload = {
  eventName: string;
  participantName: string;
  birthDate: string;
  guardianName: string;
  email: string;
  phone: string;
  healthNote: string;
  gdprConsent: boolean;
  mediaConsent: boolean;
  organizerEmail?: string;
  submittedAt: string;
};

function isLocalhost() {
  return ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

function assertSecureTransport(webhookUrl: string) {
  if (window.location.protocol !== "https:" && !isLocalhost()) {
    throw new Error("Formulář lze odeslat pouze ze zabezpečené HTTPS adresy.");
  }

  if (!webhookUrl.startsWith("https://") && !isLocalhost()) {
    throw new Error("Webhook musí používat šifrované HTTPS rozhraní.");
  }
}

export async function submitEventRegistration(payload: EventRegistrationPayload, webhookUrl?: string) {
  if (!webhookUrl) {
    throw new Error("Chybí konfigurace webhooku pro zpracování přihlášky.");
  }

  assertSecureTransport(webhookUrl);

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      formType: "event-registration",
      actions: {
        notifyOrganizer: true,
        confirmParticipant: true,
        appendGoogleSheetRow: true,
      },
      payload,
    }),
  });

  if (!response.ok) {
    throw new Error("Přihlášku se nepodařilo odeslat. Zkuste to prosím později.");
  }

  return response;
}
