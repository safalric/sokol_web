import { jsonResponse } from "./http-security.js";
import { getPublicCalendarEvents, publicCalendarLinks } from "./google-ical.js";

const GOOGLE_TIMEOUT_MS = 8_000;

async function fetchWithTimeout(fetchImpl, url, init, timeoutMs = GOOGLE_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export function calendarRuntimeStatus(env) {
  if (env.GOOGLE_CALENDAR_PUBLIC_ID) {
    return { status: "google", configurationWarning: false, missingCapabilities: [], warning: null };
  }
  const missingCapabilities = [];
  if (!env.GOOGLE_CALENDAR_ID) missingCapabilities.push("calendar_id");
  if (!env.GOOGLE_CALENDAR_API_KEY) missingCapabilities.push("calendar_api");

  return missingCapabilities.length === 0
    ? { status: "google", configurationWarning: false, missingCapabilities: [], warning: null }
    : {
      status: "local",
      configurationWarning: Boolean(env.GOOGLE_CALENDAR_ID || env.GOOGLE_CALENDAR_API_KEY),
      missingCapabilities,
      warning: null,
    };
}

function getPeriod(url, now) {
  const yearValue = url.searchParams.get("year");
  const monthValue = url.searchParams.get("month");

  if (yearValue !== null || monthValue !== null) {
    if (!/^\d{4}$/.test(yearValue ?? "") || !/^\d{1,2}$/.test(monthValue ?? "")) return null;
    const year = Number(yearValue);
    const month = Number(monthValue);
    if (!Number.isInteger(year) || year < 2020 || year > 2035 || !Number.isInteger(month) || month < 1 || month > 12) {
      return null;
    }
    return { year, month };
  }

  const today = now();
  const currentKey = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Prague", year: "numeric", month: "2-digit" }).format(today);
  const initialDate = new Date(`${currentKey}-01T12:00:00Z`);
  return { year: initialDate.getUTCFullYear(), month: initialDate.getUTCMonth() + 1 };
}

function monthBounds({ year, month }) {
  const midnight = (monthIndex) => {
    const date = new Date(Date.UTC(year, monthIndex, 1));
    const offset = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Prague", timeZoneName: "longOffset" })
      .formatToParts(date).find((part) => part.type === "timeZoneName").value.replace("GMT", "");
    return `${date.toISOString().slice(0, 10)}T00:00:00${offset}`;
  };
  return {
    timeMin: midnight(month - 1),
    timeMax: midnight(month),
  };
}

function inferCategory(item) {
  const explicit = item.extendedProperties?.shared?.category ?? item.extendedProperties?.private?.category;
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
  const end = item.end?.dateTime && Number.isFinite(Date.parse(item.end.dateTime)) ? formatter.format(new Date(item.end.dateTime)) : "";
  return end ? `${start}-${end}` : start;
}

function googleDate(item) {
  if (item.start?.date) {
    const date = new Date(`${item.start.date}T12:00:00Z`);
    return /^\d{4}-\d{2}-\d{2}$/.test(item.start.date) && Number.isFinite(date.getTime()) && date.toISOString().startsWith(item.start.date) ? item.start.date : "";
  }
  if (!item.start?.dateTime || !Number.isFinite(Date.parse(item.start.dateTime))) return "";
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
  apiUrl.searchParams.set("timeZone", "Europe/Prague");

  const items = [];
  const seenTokens = new Set();
  for (let page = 0; page < 10; page += 1) {
    const response = await fetchWithTimeout(fetchImpl, apiUrl, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Google Calendar API returned ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.items)) throw new Error("Invalid Google Calendar response");
    items.push(...data.items);
    if (!data.nextPageToken) break;
    if (page === 9 || seenTokens.has(data.nextPageToken)) throw new Error("Incomplete Google Calendar pagination");
    seenTokens.add(data.nextPageToken);
    apiUrl.searchParams.set("pageToken", data.nextPageToken);
  }

  return items
    .filter((item) => item && item.status !== "cancelled" && googleDate(item))
    .map((item) => ({
      id: String(item.id || crypto.randomUUID()),
      date: googleDate(item),
      title: String(item.summary || "Akce TJ Sokol").slice(0, 160),
      time: formatGoogleTime(item),
      category: inferCategory(item),
      place: String(item.location || "Doudleby nad Orlicí").slice(0, 160),
    }));
}

export function publishedCalendarEvents(calendarEvents) {
  const ids = new Set();
  return calendarEvents.filter((event) => {
    if (!event || event.published !== true || !/^[a-z0-9-]+$/.test(event.id ?? "") || ids.has(event.id)) return false;
    const date = new Date(`${event.date}T12:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event.date ?? "") || !Number.isFinite(date.getTime()) || !date.toISOString().startsWith(event.date)) return false;
    if (!["training", "event"].includes(event.category) || ![event.title, event.time, event.place].every((value) => typeof value === "string" && value.trim() && value.length <= 160)) return false;
    try { if (new URL(event.sourceUrl).protocol !== "https:") return false; } catch { return false; }
    ids.add(event.id);
    return true;
  }).map(({ id, date, title, time, category, place, sourceUrl, detailUrl }) => ({
    id, date, title, time, category, place, sourceUrl,
    ...(/^\/cviceni#[a-z0-9-]+$/.test(detailUrl ?? "") ? { detailUrl } : {}),
  }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.title.localeCompare(b.title, "cs"));
}

export async function handleCalendar(url, env, calendarEvents, fetchImpl, now) {
  const runtime = calendarRuntimeStatus(env);
  const period = getPeriod(url, now);
  if (!period) return jsonResponse({ error: "Neplatný rok nebo měsíc." }, 400);
  const localEvents = publishedCalendarEvents(calendarEvents).filter((event) => event.date.startsWith(`${period.year}-${String(period.month).padStart(2, "0")}`));

  if (runtime.status === "google") {
    let links = {};
    try {
      if (env.GOOGLE_CALENDAR_PUBLIC_ID) links = publicCalendarLinks(env.GOOGLE_CALENDAR_PUBLIC_ID);
      const googleEvents = env.GOOGLE_CALENDAR_PUBLIC_ID
        ? await getPublicCalendarEvents(period, env.GOOGLE_CALENDAR_PUBLIC_ID, fetchImpl)
        : await getGoogleEvents(period, env, fetchImpl);
      const events = [...new Map([...localEvents, ...googleEvents].map((event) => [event.id, event])).values()]
        .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
      return jsonResponse({
        source: "google",
        ...links,
        demo: false,
        period,
        events,
        updatedAt: now().toISOString(),
        configurationWarning: false,
        missingCapabilities: [],
        warning: null,
      }, 200, "public, max-age=300");
    } catch {
      return jsonResponse({
        source: "local",
        ...links,
        demo: false,
        period,
        events: localEvents,
        updatedAt: now().toISOString(),
        configurationWarning: false,
        warningCode: "provider_unavailable",
        warning: "Online kalendář je dočasně nedostupný. Zobrazené zveřejněné termíny nemusí zahrnovat poslední změny. Aktuální informace ověřte u jednoty.",
      });
    }
  }

  return jsonResponse({
    source: "local",
    demo: false,
    period,
    events: localEvents,
    updatedAt: now().toISOString(),
    configurationWarning: runtime.configurationWarning,
    missingCapabilities: runtime.missingCapabilities,
    warning: runtime.warning,
  });
}
