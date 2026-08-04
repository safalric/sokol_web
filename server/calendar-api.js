import { jsonResponse } from "./http-security.js";

export function calendarRuntimeStatus(env) {
  const missingCapabilities = [];
  if (!env.GOOGLE_CALENDAR_ID) missingCapabilities.push("calendar_id");
  if (!env.GOOGLE_CALENDAR_API_KEY) missingCapabilities.push("calendar_api");

  return missingCapabilities.length === 0
    ? { status: "google", configurationWarning: false, missingCapabilities: [], warning: null }
    : {
      status: "demo",
      configurationWarning: true,
      missingCapabilities,
      warning: "Kalendář běží v demo režimu, protože není kompletně připojený veřejný Google Kalendář jednoty.",
    };
}

function getPeriod(url, calendarEvents, now) {
  const yearValue = url.searchParams.get("year");
  const monthValue = url.searchParams.get("month");

  if ((yearValue && !monthValue) || (!yearValue && monthValue)) return null;
  if (yearValue && monthValue) {
    const year = Number(yearValue);
    const month = Number(monthValue);
    if (!Number.isInteger(year) || year < 2020 || year > 2035 || !Number.isInteger(month) || month < 1 || month > 12) {
      return null;
    }
    return { year, month };
  }

  const today = now();
  const currentKey = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}`;
  const nextEvent = [...calendarEvents].sort((a, b) => a.date.localeCompare(b.date)).find((event) => event.date.slice(0, 7) >= currentKey);
  const initialDate = nextEvent ? new Date(`${nextEvent.date}T12:00:00Z`) : today;
  return { year: initialDate.getUTCFullYear(), month: initialDate.getUTCMonth() + 1 };
}

function monthBounds({ year, month }) {
  return {
    timeMin: new Date(Date.UTC(year, month - 1, 1)).toISOString(),
    timeMax: new Date(Date.UTC(year, month, 1)).toISOString(),
  };
}

function inferCategory(item) {
  const explicit = item.extendedProperties?.private?.category;
  if (explicit === "training" || explicit === "event") return explicit;
  return /trénink|cvičení|florbal|gymnastika|žactvo|rodiče a děti/i.test(item.summary || "") ? "training" : "event";
}

function formatGoogleTime(item) {
  if (item.start?.date) return "celý den";
  if (!item.start?.dateTime) return "čas bude upřesněn";
  const formatter = new Intl.DateTimeFormat("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Prague",
  });
  const start = formatter.format(new Date(item.start.dateTime));
  const end = item.end?.dateTime ? formatter.format(new Date(item.end.dateTime)) : "";
  return end ? `${start}-${end}` : start;
}

function googleDate(item) {
  if (item.start?.date) return item.start.date;
  if (!item.start?.dateTime) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Prague",
  }).format(new Date(item.start.dateTime));
}

async function getGoogleEvents(period, env, fetchImpl) {
  const { timeMin, timeMax } = monthBounds(period);
  const apiUrl = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(env.GOOGLE_CALENDAR_ID)}/events`);
  apiUrl.searchParams.set("key", env.GOOGLE_CALENDAR_API_KEY);
  apiUrl.searchParams.set("timeMin", timeMin);
  apiUrl.searchParams.set("timeMax", timeMax);
  apiUrl.searchParams.set("singleEvents", "true");
  apiUrl.searchParams.set("orderBy", "startTime");
  apiUrl.searchParams.set("maxResults", "100");

  const response = await fetchImpl(apiUrl, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Google Calendar API returned ${response.status}`);
  const data = await response.json();

  return (Array.isArray(data.items) ? data.items : [])
    .filter((item) => item.status !== "cancelled" && googleDate(item))
    .map((item) => ({
      id: String(item.id || crypto.randomUUID()),
      date: googleDate(item),
      title: String(item.summary || "Akce TJ Sokol").slice(0, 160),
      time: formatGoogleTime(item),
      category: inferCategory(item),
      place: String(item.location || "Doudleby nad Orlicí").slice(0, 160),
    }));
}

export async function handleCalendar(url, env, calendarEvents, fetchImpl, now) {
  const period = getPeriod(url, calendarEvents, now);
  if (!period) return jsonResponse({ error: "Neplatný rok nebo měsíc." }, 400);
  const runtime = calendarRuntimeStatus(env);

  if (runtime.status === "google") {
    try {
      const events = await getGoogleEvents(period, env, fetchImpl);
      return jsonResponse({
        source: "google",
        demo: false,
        period,
        events,
        updatedAt: now().toISOString(),
        configurationWarning: false,
        missingCapabilities: [],
        warning: null,
      }, 200, "public, max-age=300");
    } catch {
      const events = calendarEvents.filter((event) => event.date.startsWith(`${period.year}-${String(period.month).padStart(2, "0")}`));
      return jsonResponse({
        source: "demo",
        demo: true,
        period,
        events,
        updatedAt: now().toISOString(),
        configurationWarning: false,
        warningCode: "provider_unavailable",
        warning: "Google Kalendář je dočasně nedostupný. Zobrazujeme náhradní ukázková data.",
      });
    }
  }

  const events = calendarEvents.filter((event) => event.date.startsWith(`${period.year}-${String(period.month).padStart(2, "0")}`));
  return jsonResponse({
    source: "demo",
    demo: true,
    period,
    events,
    updatedAt: now().toISOString(),
    configurationWarning: runtime.configurationWarning,
    warningCode: "missing_configuration",
    missingCapabilities: runtime.missingCapabilities,
    warning: runtime.warning,
  });
}
