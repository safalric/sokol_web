import { isLocalRequest, jsonResponse } from "./http-security.js";

const CONSENT_VERSION = "2026-07-26";
const REGISTRATION_LIMIT = 5;
const REGISTRATION_WINDOW_MS = 10 * 60 * 1000;
const MAX_BODY_BYTES = 12_000;
const MAX_STATE_ENTRIES = 5_000;
const ALLOWED_FIELDS = new Set([
  "submissionId",
  "eventName",
  "participantName",
  "birthDate",
  "guardianName",
  "email",
  "phone",
  "healthNote",
  "additionalNote",
  "privacyAcknowledged",
  "guardianDeclaration",
  "healthConsent",
  "mediaConsent",
  "website_hp",
  "consentVersion",
]);

function cleanText(value, maxLength, multiline = false) {
  if (typeof value !== "string") return "";
  const controls = multiline ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g;
  return value.normalize("NFKC").replace(controls, " ").replace(multiline ? /[ \t]+/g : /\s+/g, " ").trim().slice(0, maxLength);
}

function validIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function isMinor(birthDate, now) {
  const eighteenthBirthday = new Date(`${birthDate}T12:00:00Z`);
  eighteenthBirthday.setUTCFullYear(eighteenthBirthday.getUTCFullYear() + 18);
  return eighteenthBirthday > now;
}

function validateRegistration(input, now, registrationEvents) {
  const payload = {
    submissionId: cleanText(input.submissionId, 80),
    eventName: cleanText(input.eventName, 160),
    participantName: cleanText(input.participantName, 120),
    birthDate: cleanText(input.birthDate, 10),
    guardianName: cleanText(input.guardianName, 120),
    email: cleanText(input.email, 160).toLowerCase(),
    phone: cleanText(input.phone, 30),
    healthNote: cleanText(input.healthNote, 500, true),
    additionalNote: cleanText(input.additionalNote, 600, true),
    privacyAcknowledged: input.privacyAcknowledged === true,
    guardianDeclaration: input.guardianDeclaration === true,
    healthConsent: input.healthConsent === true,
    mediaConsent: input.mediaConsent === true,
    website_hp: cleanText(input.website_hp, 200),
    consentVersion: cleanText(input.consentVersion, 30),
  };
  const errors = {};
  const namePattern = /^[\p{L}\p{M} .'-]{2,120}$/u;
  const unexpectedFields = Object.keys(input).filter((field) => !ALLOWED_FIELDS.has(field));
  const eventPolicy = registrationEvents.find((event) => event.name === payload.eventName && event.registrationOpen === true);

  if (unexpectedFields.length) errors.request = "Požadavek obsahuje nepovolená pole.";
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(payload.submissionId)) errors.submissionId = "Neplatný identifikátor odeslání.";
  if (!eventPolicy) errors.eventName = "Na tuto akci nyní nelze odeslat přihlášku.";
  if (!namePattern.test(payload.participantName)) errors.participantName = "Zkontrolujte jméno účastníka.";
  if (payload.guardianName && !namePattern.test(payload.guardianName)) errors.guardianName = "Zkontrolujte jméno zákonného zástupce.";
  if (!validIsoDate(payload.birthDate)) {
    errors.birthDate = "Zadejte platné datum narození.";
  } else {
    const birthDate = new Date(`${payload.birthDate}T12:00:00Z`);
    const oldest = new Date(now);
    oldest.setUTCFullYear(oldest.getUTCFullYear() - 120);
    if (birthDate > now || birthDate < oldest) errors.birthDate = "Zkontrolujte datum narození.";
    if (isMinor(payload.birthDate, now)) {
      if (!payload.guardianName) errors.guardianName = "U nezletilého účastníka vyplňte zákonného zástupce.";
      if (!payload.guardianDeclaration) errors.guardianDeclaration = "Potvrďte oprávnění přihlásit nezletilého účastníka.";
    }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email)) errors.email = "Zadejte platný e-mail.";
  if (!/^(\+420\s?)?(\d\s?){9}$/.test(payload.phone)) errors.phone = "Zadejte platné české telefonní číslo.";
  if (!payload.privacyAcknowledged) errors.privacyAcknowledged = "Potvrďte seznámení se zásadami ochrany osobních údajů.";
  if (payload.healthNote && !payload.healthConsent) errors.healthConsent = "Pro zpracování zdravotních údajů je nutný výslovný souhlas.";
  if (payload.consentVersion !== CONSENT_VERSION) errors.consentVersion = "Formulář používá neplatnou verzi právních informací.";
  return { payload, errors, eventPolicy };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function sheetValue(value) {
  const text = String(value ?? "");
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function maskEmail(email) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 1)}***@${domain}`;
}

function demoPreview(payload) {
  return {
    organizer: { to: "demo-organizator@sokol.test", subject: `Nová přihláška: ${payload.eventName}` },
    participant: { to: maskEmail(payload.email), subject: `Potvrzení přihlášky: ${payload.eventName}` },
  };
}

function organizerMessage(payload, receiptId) {
  const rows = [
    ["Akce", payload.eventName],
    ["Účastník", payload.participantName],
    ["Datum narození", payload.birthDate],
    ["Zákonný zástupce", payload.guardianName || "neuveden"],
    ["E-mail", payload.email],
    ["Telefon", payload.phone],
    ["Zdravotní údaje", payload.healthNote ? "uvedeny; otevřete omezenou evidenci" : "neuvedeny"],
    ["Organizační poznámka", payload.additionalNote || "neuvedena"],
    ["Souhlas s fotografiemi", payload.mediaConsent ? "ano" : "ne"],
    ["ID přihlášky", receiptId],
  ];
  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const html = `<h1>Nová přihláška: ${escapeHtml(payload.eventName)}</h1><table>${rows.map(([label, value]) => `<tr><th align="left">${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join("")}</table><p>Zdravotní údaje se z bezpečnostních důvodů neposílají e-mailem.</p>`;
  return { html, text };
}

async function sendResendEmail(fetchImpl, env, message, idempotencyKey) {
  const response = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
      "User-Agent": "sokol-doudleby-web/2.0",
    },
    body: JSON.stringify(message),
  });
  if (!response.ok) throw new Error(`Resend returned ${response.status}`);
}

async function deliverEmails(payload, receiptId, env, fetchImpl) {
  const organizer = organizerMessage(payload, receiptId);
  await sendResendEmail(fetchImpl, env, {
    from: env.REGISTRATION_FROM_EMAIL,
    to: [env.REGISTRATION_ORGANIZER_EMAIL],
    reply_to: payload.email,
    subject: `Nová přihláška: ${payload.eventName}`,
    html: organizer.html,
    text: organizer.text,
  }, `${payload.submissionId}-organizer`);
  await sendResendEmail(fetchImpl, env, {
    from: env.REGISTRATION_FROM_EMAIL,
    to: [payload.email],
    reply_to: env.REGISTRATION_ORGANIZER_EMAIL,
    subject: `Potvrzení přihlášky: ${payload.eventName}`,
    html: `<h1>Přihlášku jsme přijali</h1><p>Dobrý den, evidujeme přihlášku účastníka ${escapeHtml(payload.participantName)} na akci ${escapeHtml(payload.eventName)}.</p><p>ID přihlášky: ${escapeHtml(receiptId)}</p>`,
    text: `Dobrý den, evidujeme přihlášku účastníka ${payload.participantName} na akci ${payload.eventName}.\nID přihlášky: ${receiptId}`,
  }, `${payload.submissionId}-participant`);
}

async function appendGoogleSheet(payload, receiptId, eventPolicy, env, fetchImpl, now) {
  const endpoint = new URL(env.GOOGLE_SHEETS_WEBHOOK_URL);
  if (endpoint.protocol !== "https:" || !["script.google.com", "script.googleusercontent.com"].includes(endpoint.hostname)) {
    throw new Error("Invalid Google Sheets webhook URL");
  }
  const row = [
    now.toISOString(),
    receiptId,
    payload.eventName,
    payload.participantName,
    payload.birthDate,
    payload.guardianName,
    payload.email,
    payload.phone,
    payload.healthNote,
    payload.additionalNote,
    payload.privacyAcknowledged ? "ano" : "ne",
    payload.guardianDeclaration ? "ano" : "ne",
    payload.healthConsent ? "ano" : "ne",
    payload.mediaConsent ? "ano" : "ne",
    payload.consentVersion,
    eventPolicy.retentionReviewDate,
  ].map(sheetValue);
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "sokol-doudleby-web/2.0" },
    body: JSON.stringify({ secret: env.GOOGLE_SHEETS_WEBHOOK_SECRET, receiptId, row }),
  });
  if (!response.ok) throw new Error(`Google Sheets webhook returned ${response.status}`);
  const result = await response.json().catch(() => ({}));
  if (result.ok !== true) throw new Error("Google Sheets webhook rejected the row");
}

function checkConfiguration(env) {
  const emailValues = [env.RESEND_API_KEY, env.REGISTRATION_FROM_EMAIL, env.REGISTRATION_ORGANIZER_EMAIL];
  const sheetValues = [env.GOOGLE_SHEETS_WEBHOOK_URL, env.GOOGLE_SHEETS_WEBHOOK_SECRET];
  const allValues = [...emailValues, ...sheetValues];
  const configuredCount = allValues.filter(Boolean).length;
  if (configuredCount > 0 && configuredCount < allValues.length) {
    return "Ostrý režim vyžaduje kompletní nastavení obou e-mailů i zabezpečené evidence.";
  }
  return null;
}

function clientKey(request) {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() || "unknown";
}

function pruneState(state, timestamp) {
  for (const [key, entry] of state.receipts) {
    if (timestamp - entry.createdAt > 24 * 60 * 60 * 1000) state.receipts.delete(key);
  }
  for (const [key, attempts] of state.rateLimits) {
    const recent = attempts.filter((time) => timestamp - time < REGISTRATION_WINDOW_MS);
    if (recent.length) state.rateLimits.set(key, recent);
    else state.rateLimits.delete(key);
  }
  while (state.receipts.size > MAX_STATE_ENTRIES) state.receipts.delete(state.receipts.keys().next().value);
  while (state.rateLimits.size > MAX_STATE_ENTRIES) state.rateLimits.delete(state.rateLimits.keys().next().value);
}

export function createRegistrationHandler({ fetchImpl, now, registrationEvents }) {
  const state = { rateLimits: new Map(), receipts: new Map() };

  return async function handleRegistration(request, url, env) {
    if (url.protocol !== "https:" && !isLocalRequest(url)) return jsonResponse({ error: "Přihlášku lze odeslat pouze přes HTTPS." }, 400);
    const origin = request.headers.get("Origin");
    if ((!origin && !isLocalRequest(url)) || (origin && origin !== url.origin)) {
      return jsonResponse({ error: "Požadavek bez platného původu byl odmítnut." }, 403);
    }
    if (request.headers.get("Sec-Fetch-Site") === "cross-site") return jsonResponse({ error: "Požadavek z jiné domény byl odmítnut." }, 403);
    if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) {
      return jsonResponse({ error: "Požadavek musí být ve formátu JSON." }, 415);
    }
    const contentLength = Number(request.headers.get("Content-Length") || 0);
    if (!Number.isFinite(contentLength) || contentLength > MAX_BODY_BYTES) return jsonResponse({ error: "Požadavek je příliš velký." }, 413);

    const timestamp = now().getTime();
    pruneState(state, timestamp);
    const key = clientKey(request);
    const attempts = state.rateLimits.get(key) || [];
    if (attempts.length >= REGISTRATION_LIMIT) return jsonResponse({ error: "Příliš mnoho pokusů. Zkuste to znovu za několik minut." }, 429);
    attempts.push(timestamp);
    state.rateLimits.set(key, attempts);

    let input;
    try {
      const raw = await request.text();
      if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return jsonResponse({ error: "Požadavek je příliš velký." }, 413);
      input = JSON.parse(raw);
    } catch {
      return jsonResponse({ error: "Požadavek obsahuje neplatná data." }, 400);
    }
    if (!input || typeof input !== "object" || Array.isArray(input)) return jsonResponse({ error: "Požadavek obsahuje neplatná data." }, 400);
    if (cleanText(input.website_hp, 200)) return jsonResponse({ ok: true, mode: "discarded" }, 202);

    const submissionTime = now();
    const { payload, errors, eventPolicy } = validateRegistration(input, submissionTime, registrationEvents);
    if (Object.keys(errors).length) return jsonResponse({ error: "Zkontrolujte vyplněná pole.", fields: errors }, 422);

    const previous = state.receipts.get(payload.submissionId);
    if (previous?.state === "processing") return jsonResponse({ error: "Tato přihláška se právě zpracovává." }, 409);
    if (previous?.result) {
      return jsonResponse(previous.result.mode === "demo" ? { ...previous.result, preview: demoPreview(payload) } : previous.result);
    }

    const configurationError = checkConfiguration(env);
    if (configurationError) return jsonResponse({ error: configurationError }, 503);

    const receiptId = `SOKOL-${submissionTime.getUTCFullYear()}-${payload.submissionId.slice(0, 8).toUpperCase()}`;
    const emailConfigured = Boolean(env.RESEND_API_KEY);
    const sheetConfigured = Boolean(env.GOOGLE_SHEETS_WEBHOOK_URL);

    if (!emailConfigured && !sheetConfigured) {
      const result = {
        ok: true,
        mode: "demo",
        receiptId,
        delivery: { organizerEmail: "preview", participantEmail: "preview", googleSheet: "not_configured" },
      };
      state.receipts.set(payload.submissionId, { state: "complete", result, createdAt: timestamp });
      return jsonResponse({ ...result, preview: demoPreview(payload) }, 202);
    }
    if (payload.healthNote && (!sheetConfigured || env.REGISTRATION_HEALTH_DATA_ENABLED !== "true")) {
      return jsonResponse({ error: "Příjem zdravotních údajů zatím není bezpečně aktivován. Kontaktujte prosím organizátora." }, 503);
    }

    state.receipts.set(payload.submissionId, { state: "processing", createdAt: timestamp });
    try {
      if (emailConfigured) await deliverEmails(payload, receiptId, env, fetchImpl);
      if (sheetConfigured) await appendGoogleSheet(payload, receiptId, eventPolicy, env, fetchImpl, submissionTime);
    } catch (error) {
      state.receipts.delete(payload.submissionId);
      console.error("Registration delivery failed", { receiptId, error: String(error) });
      return jsonResponse({ error: "Přihlášku se nepodařilo bezpečně doručit. Data nebyla potvrzena jako uložená." }, 502);
    }

    const result = {
      ok: true,
      mode: "live",
      receiptId,
      delivery: {
        organizerEmail: emailConfigured ? "sent" : "not_configured",
        participantEmail: emailConfigured ? "sent" : "not_configured",
        googleSheet: sheetConfigured ? "saved" : "not_configured",
      },
    };
    state.receipts.set(payload.submissionId, { state: "complete", result, createdAt: timestamp });
    return jsonResponse(result, 201);
  };
}
