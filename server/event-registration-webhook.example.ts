type Env = {
  ALLOWED_ORIGIN: string;
  GOOGLE_SHEETS_WEBHOOK_URL: string;
  ORGANIZER_EMAIL: string;
  MAIL_WEBHOOK_URL: string;
};

type IncomingRegistration = {
  formType?: string;
  payload?: {
    eventName?: string;
    participantName?: string;
    birthDate?: string;
    guardianName?: string;
    email?: string;
    phone?: string;
    healthNote?: string;
    gdprConsent?: boolean;
    mediaConsent?: boolean;
    organizerEmail?: string;
    submittedAt?: string;
  };
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const phonePattern = /^(\+420\s?)?(\d\s?){9}$/;

function sanitize(value = "", maxLength = 500) {
  return value
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
  });
}

function validateRegistration(body: IncomingRegistration) {
  if (body.formType !== "event-registration" || !body.payload) {
    throw new Error("Neplatny typ formulare.");
  }

  const payload = {
    eventName: sanitize(body.payload.eventName, 160),
    participantName: sanitize(body.payload.participantName, 120),
    birthDate: sanitize(body.payload.birthDate, 20),
    guardianName: sanitize(body.payload.guardianName, 120),
    email: sanitize(body.payload.email, 160).toLowerCase(),
    phone: sanitize(body.payload.phone, 30),
    healthNote: sanitize(body.payload.healthNote, 1000),
    gdprConsent: body.payload.gdprConsent === true,
    mediaConsent: body.payload.mediaConsent === true,
    submittedAt: sanitize(body.payload.submittedAt, 40) || new Date().toISOString(),
  };

  if (!payload.eventName || !payload.participantName || !payload.birthDate) {
    throw new Error("Chybi povinna pole.");
  }

  if (!emailPattern.test(payload.email)) {
    throw new Error("Neplatny e-mail.");
  }

  if (!phonePattern.test(payload.phone)) {
    throw new Error("Neplatne telefonni cislo.");
  }

  if (!payload.gdprConsent) {
    throw new Error("Chybi povinny GDPR souhlas.");
  }

  return payload;
}

async function sendMail(env: Env, to: string, subject: string, html: string) {
  await fetch(env.MAIL_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, html }),
  });
}

async function appendGoogleSheetRow(env: Env, payload: ReturnType<typeof validateRegistration>) {
  await fetch(env.GOOGLE_SHEETS_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      values: [
        payload.submittedAt,
        payload.eventName,
        payload.participantName,
        payload.birthDate,
        payload.guardianName,
        payload.email,
        payload.phone,
        payload.healthNote,
        payload.gdprConsent ? "ano" : "ne",
        payload.mediaConsent ? "ano" : "ne",
      ],
    }),
  });
}

export default {
  async fetch(request: Request, env: Env) {
    if (request.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405);
    }

    const origin = request.headers.get("Origin");
    if (origin && origin !== env.ALLOWED_ORIGIN) {
      return json({ ok: false, error: "Forbidden origin" }, 403);
    }

    try {
      const body = (await request.json()) as IncomingRegistration;
      const payload = validateRegistration(body);

      await Promise.all([
        sendMail(
          env,
          env.ORGANIZER_EMAIL,
          `Nova prihlaska: ${payload.eventName}`,
          `<h1>Nova prihlaska</h1><p>${payload.participantName}</p><p>${payload.email}</p><p>${payload.phone}</p><p>${payload.healthNote}</p>`,
        ),
        sendMail(
          env,
          payload.email,
          `Potvrzeni prihlasky: ${payload.eventName}`,
          `<h1>Dekujeme za prihlasku</h1><p>Prihlaska na akci ${payload.eventName} byla prijata.</p>`,
        ),
        appendGoogleSheetRow(env, payload),
      ]);

      return json({ ok: true });
    } catch (error) {
      return json(
        {
          ok: false,
          error: error instanceof Error ? error.message : "Neznama chyba",
        },
        400,
      );
    }
  },
};
