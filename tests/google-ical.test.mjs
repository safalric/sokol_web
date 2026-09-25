import test from "node:test";
import assert from "node:assert/strict";
import { parsePublicCalendar, publicCalendarLinks } from "../server/google-ical.js";
import { createWorker } from "../server/worker-runtime.js";

const wrap = (...events) => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nX-WR-TIMEZONE:Europe/Prague\r\n${events.join("\r\n")}\r\nEND:VCALENDAR\r\n`;
const event = (lines) => `BEGIN:VEVENT\r\n${lines.join("\r\n")}\r\nEND:VEVENT`;
const period = { year: 2026, month: 10 };
const links = publicCalendarLinks("test@group.calendar.google.com");
const parse = (feed, selected = period) => parsePublicCalendar(feed, selected, links.calendarUrl);

test("empty public calendar is valid and private URLs cannot become calendar IDs", () => {
  assert.deepEqual(parse(wrap()), []);
  assert.throws(() => publicCalendarLinks("https://calendar.google.com/private-token/basic.ics"));
  assert.match(links.subscribeUrl, /\/public\/basic\.ics$/);
});

test("UTC events are displayed in Prague across the daylight saving transition", () => {
  const rows = parse(wrap(event(["UID:utc", "SUMMARY:Cvičení", "DTSTART:20261019T160000Z", "DTEND:20261019T170000Z", "RRULE:FREQ=WEEKLY;COUNT=2"])));
  assert.deepEqual(rows.map((r) => [r.date, r.time, r.category]), [["2026-10-19", "18:00-19:00", "training"], ["2026-10-26", "17:00-18:00", "training"]]);
});

test("TZID weekly events keep local time when daylight saving ends", () => {
  const rows = parse(wrap(event(["UID:local", "SUMMARY:Trénink", "DTSTART;TZID=Europe/Prague:20261019T180000", "DTEND;TZID=Europe/Prague:20261019T190000", "RRULE:FREQ=WEEKLY;COUNT=2"])));
  assert.deepEqual(rows.map((r) => r.time), ["18:00-19:00", "18:00-19:00"]);
});

test("all-day events span each day, clip to month, and use exclusive end", () => {
  const feed = wrap(event(["UID:trip", "SUMMARY:Výlet", "DTSTART;VALUE=DATE:20260930", "DTEND;VALUE=DATE:20261003"]));
  assert.deepEqual(parse(feed).map((r) => [r.date, r.time]), [["2026-10-01", "celý den"], ["2026-10-02", "celý den"]]);
});

test("timed events crossing midnight appear on all affected days", () => {
  const feed = wrap(event(["UID:night", "DTSTART:20261001T210000Z", "DTEND:20261003T220000Z"]));
  assert.deepEqual(parse(feed).map((r) => [r.date, r.time]), [["2026-10-01", "od 23:00"], ["2026-10-02", "celý den"], ["2026-10-03", "do 00:00"]]);
});

test("recurrence exclusions, added dates, moved instances and cancellations", () => {
  const feed = wrap(
    event(["UID:weekly", "SUMMARY:Původní", "DTSTART:20261001T160000Z", "DTEND:20261001T170000Z", "RRULE:FREQ=WEEKLY;COUNT=5", "EXDATE:20261008T160000Z", "RDATE:20261003T160000Z"]),
    event(["UID:weekly", "RECURRENCE-ID:20261015T160000Z", "SUMMARY:Přesun", "DTSTART:20261016T170000Z", "DTEND:20261016T180000Z"]),
    event(["UID:weekly", "RECURRENCE-ID:20261022T160000Z", "STATUS:CANCELLED", "DTSTART:20261022T160000Z", "DTEND:20261022T170000Z"]),
  );
  const rows = parse(feed);
  assert.deepEqual(rows.map((r) => r.date), ["2026-10-01", "2026-10-03", "2026-10-16", "2026-10-29"]);
  assert.equal(rows[2].title, "Přesun");
  assert.equal(new Set(rows.map((r) => r.id)).size, rows.length);
});

test("an instance moved from next month is still shown", () => {
  const feed = wrap(
    event(["UID:move", "DTSTART:20261103T160000Z", "RRULE:FREQ=WEEKLY;COUNT=2"]),
    event(["UID:move", "RECURRENCE-ID:20261103T160000Z", "DTSTART:20261030T160000Z", "SUMMARY:Přesun do října"]),
  );
  assert.deepEqual(parse(feed).map((r) => r.date), ["2026-10-30"]);
});

test("a change in one series cannot change a different series at the same time", () => {
  const feed = wrap(
    event(["UID:a", "SUMMARY:První", "DTSTART:20261001T160000Z", "RRULE:FREQ=WEEKLY;COUNT=2"]),
    event(["UID:b", "SUMMARY:Druhý", "DTSTART:20261001T160000Z", "RRULE:FREQ=WEEKLY;COUNT=2"]),
    event(["UID:a", "SUMMARY:Přesun prvního", "RECURRENCE-ID:20261008T160000Z", "DTSTART:20261009T160000Z"]),
  );
  const rows = parse(feed);
  assert.equal(rows.length, 4);
  assert.equal(rows.filter((r) => r.title === "Druhý").length, 2);
  assert.equal(rows.find((r) => r.date === "2026-10-08").title, "Druhý");
});

test("unfolds Czech text and excludes private, confidential, and cancelled events", () => {
  const feed = wrap(
    event(["UID:text", "SUMMARY:Výlet do ", " přírody\\, les", "LOCATION:Doudleby\\, sokolovna", "DTSTART;VALUE=DATE:20261005"]),
    ...["CLASS:PRIVATE", "CLASS:CONFIDENTIAL", "STATUS:CANCELLED"].map((flag, index) => event([`UID:hidden${index}`, flag, "DTSTART;VALUE=DATE:20261005"])),
  );
  const rows = parse(feed);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].title, "Výlet do přírody, les");
  assert.equal(rows[0].place, "Doudleby, sokolovna");
});

test("malformed feeds and excessive recurrence fail explicitly", () => {
  assert.throws(() => parse("<html>login</html>"));
  assert.throws(() => parse(wrap(event(["UID:limit", "DTSTART:20261001T000000Z", "RRULE:FREQ=SECONDLY"]))));
});

const local = { id: "local", date: "2026-10-01", time: "12:00", title: "Rozvrh", category: "training", place: "Sokolovna", sourceUrl: "https://sokol.example/cviceni", published: true };
const request = () => new Request("https://sokol.example/api/calendar?year=2026&month=10");
function worker(fetchImpl) { return createWorker({ indexHtml: "", staticEntries: [], calendarEvents: [local], publicCalendarId: "test@group.calendar.google.com", fetchImpl }); }

test("built-in public calendar merges local dates, exposes only public links and caches fetches", async () => {
  let calls = 0;
  const site = worker(async (url) => { calls++; assert.equal(url, links.subscribeUrl); return new Response(wrap(event(["UID:online", "SUMMARY:Akce", "DTSTART;VALUE=DATE:20261007"]))); });
  const body = await (await site.fetch(request())).json();
  assert.equal(body.source, "google");
  assert.equal(body.events.length, 2);
  assert.equal(body.subscribeUrl, links.subscribeUrl);
  assert.equal(body.warning, null);
  await site.fetch(request());
  assert.equal(calls, 1);
});

test("provider failure preserves local schedule, warns, and retries on the next request", async () => {
  let calls = 0;
  const site = worker(async () => { calls++; return calls === 1 ? new Response("denied", { status: 403 }) : new Response(wrap()); });
  const response = await site.fetch(request());
  const body = await response.json();
  assert.equal(body.source, "local");
  assert.equal(body.warningCode, "provider_unavailable");
  assert.equal(body.events.length, 1);
  assert.equal(body.calendarUrl, links.calendarUrl);
  assert.equal((await (await site.fetch(request())).json()).source, "google");
});

test("oversized feeds are rejected without suppressing local events", async () => {
  const site = worker(async () => new Response("x".repeat(2_000_001)));
  assert.equal((await (await site.fetch(request())).json()).warningCode, "provider_unavailable");
});
