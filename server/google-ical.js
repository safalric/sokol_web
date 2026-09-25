import ICAL from "ical.js";

const ZONE = "Europe/Prague";
const MAX_BYTES = 2_000_000;
const feeds = new WeakMap();
const dateFormatter = new Intl.DateTimeFormat("sv-SE", { timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit" });
const timeFormatter = new Intl.DateTimeFormat("cs-CZ", { timeZone: ZONE, hour: "2-digit", minute: "2-digit" });

export function publicCalendarLinks(id) {
  if (typeof id !== "string" || !/^[a-zA-Z0-9._+@-]{3,254}$/.test(id)) throw new Error("Invalid public calendar ID");
  const encoded = encodeURIComponent(id);
  return {
    calendarUrl: `https://calendar.google.com/calendar/embed?src=${encoded}&ctz=Europe%2FPrague`,
    subscribeUrl: `https://calendar.google.com/calendar/ical/${encoded}/public/basic.ics`,
  };
}

// Floating times belong to the calendar's zone, never to the server's zone.
function instant(time, fallbackZone) {
  if (time.zone.tzid !== "floating") return new Date(time.toUnixTime() * 1000);
  const wall = Date.UTC(time.year, time.month - 1, time.day, time.hour, time.minute, time.second);
  let result = wall;
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone: fallbackZone, timeZoneName: "longOffset" });
  for (let i = 0; i < 3; i += 1) {
    const offset = formatter.formatToParts(new Date(result)).find((part) => part.type === "timeZoneName").value;
    const match = offset.match(/^GMT(?:([+-])(\d{2}):(\d{2}))?$/);
    if (!match) throw new Error("Unsupported timezone offset");
    const minutes = match[1] ? (Number(match[2]) * 60 + Number(match[3])) * (match[1] === "-" ? -1 : 1) : 0;
    result = wall - minutes * 60000;
  }
  return new Date(result);
}

function nextDay(key) {
  return new Date(Date.parse(`${key}T12:00:00Z`) + 86400000).toISOString().slice(0, 10);
}

export function parsePublicCalendar(text, { year, month }, calendarUrl) {
  if (!text.trimStart().startsWith("BEGIN:VCALENDAR") || text.length > MAX_BYTES) throw new Error("Invalid calendar feed");
  const root = new ICAL.Component(ICAL.parse(text));
  const components = root.getAllSubcomponents("vevent");
  if (components.length > 5000) throw new Error("Calendar is too large");
  const zone = root.getFirstPropertyValue("x-wr-timezone") || ZONE;
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
  const output = new Map();
  const exceptions = new Map();
  for (const component of components) {
    if (!component.hasProperty("recurrence-id")) continue;
    const uid = component.getFirstPropertyValue("uid");
    if (!exceptions.has(uid)) exceptions.set(uid, []);
    exceptions.get(uid).push(component);
  }
  let steps = 0;

  function add(item, start, end, recurrenceId) {
    const status = String(item.component.getFirstPropertyValue("status") || "").toUpperCase();
    const visibility = String(item.component.getFirstPropertyValue("class") || "PUBLIC").toUpperCase();
    if (status === "CANCELLED" || visibility === "PRIVATE" || visibility === "CONFIDENTIAL" || !start) return;
    const startZone = item.component.getFirstProperty("dtstart")?.getParameter("tzid") || zone;
    const endZone = item.component.getFirstProperty("dtend")?.getParameter("tzid") || startZone;
    const first = start.isDate ? start.toString() : dateFormatter.format(instant(start, startZone));
    // DTEND is exclusive, also for a timed event ending exactly at midnight.
    const last = start.isDate
      ? (end && end.compare(start) > 0 ? new Date(Date.parse(`${end.toString()}T12:00:00Z`) - 86400000).toISOString().slice(0, 10) : first)
      : (end && end.compare(start) > 0 ? dateFormatter.format(new Date(instant(end, endZone).getTime() - 1)) : first);
    if (last < monthStart || first >= monthEnd) return;
    const title = String(item.summary || "Akce TJ Sokol").slice(0, 160);
    const startTime = start.isDate ? "" : timeFormatter.format(instant(start, startZone));
    const endTime = !end || end.isDate ? "" : timeFormatter.format(instant(end, endZone));
    for (let day = first < monthStart ? monthStart : first; day <= last && day < monthEnd; day = nextDay(day)) {
      const id = `google-${item.uid}-${recurrenceId}-${day}`;
      output.set(id, {
        id, date: day, title,
        time: start.isDate ? "celý den" : first === last ? `${startTime}${endTime ? `-${endTime}` : ""}` : day === first ? `od ${startTime}` : day === last ? `do ${endTime}` : "celý den",
        category: /trénink|cvičení|florbal|gymnastika|žactvo|rodiče a děti/i.test(title) ? "training" : "event",
        place: String(item.location || "Doudleby nad Orlicí").slice(0, 160),
        sourceUrl: calendarUrl,
      });
      if (output.size > 2000) throw new Error("Too many calendar occurrences");
    }
  }

  for (const component of components) {
    const event = new ICAL.Event(component, { exceptions: component.hasProperty("recurrence-id") ? [] : exceptions.get(component.getFirstPropertyValue("uid")) || [], strictExceptions: true });
    if (!event.uid || event.uid.length > 512) throw new Error("Invalid event identity");
    if (event.isRecurrenceException()) {
      // Include moved instances even when the original falls outside this month.
      add(event, event.startDate, event.endDate, event.recurrenceId.toString());
      continue;
    }
    if (String(component.getFirstPropertyValue("status")).toUpperCase() === "CANCELLED") continue;
    if (!event.startDate) throw new Error("Missing event start");
    if (!event.isRecurring()) {
      add(event, event.startDate, event.endDate, event.startDate.toString());
      continue;
    }
    const iterator = event.iterator();
    let occurrence;
    while ((occurrence = iterator.next())) {
      if (++steps > 20000) throw new Error("Calendar recurrence limit exceeded");
      if (occurrence.toString().slice(0, 10) > nextDay(monthEnd)) break;
      const details = event.getOccurrenceDetails(occurrence);
      add(details.item, details.startDate, details.endDate, occurrence.toString());
    }
  }
  return [...output.values()].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}

async function downloadFeed(url, fetchImpl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetchImpl(url, { headers: { Accept: "text/calendar" }, signal: controller.signal, redirect: "error" });
    if (!response.ok || !response.body) throw new Error("Public calendar unavailable");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let bytes = 0;
    let text = "";
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > MAX_BYTES) throw new Error("Calendar is too large");
        text += decoder.decode(chunk.value, { stream: true });
      }
      return text + decoder.decode();
    } finally { await reader.cancel(); }
  } finally { clearTimeout(timeout); }
}

export async function getPublicCalendarEvents(period, id, fetchImpl) {
  const links = publicCalendarLinks(id);
  let cache = feeds.get(fetchImpl);
  if (!cache) { cache = new Map(); feeds.set(fetchImpl, cache); }
  let entry = cache.get(id);
  if (!entry || entry.expires <= Date.now()) {
    if (cache.size >= 8) cache.clear();
    entry = { promise: downloadFeed(links.subscribeUrl, fetchImpl), expires: Date.now() + 60000 };
    cache.set(id, entry);
  }
  try {
    return parsePublicCalendar(await entry.promise, period, links.calendarUrl);
  } catch (error) { if (cache.get(id) === entry) cache.delete(id); throw error; }
}
