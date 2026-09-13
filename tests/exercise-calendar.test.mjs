import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { generateExerciseEvents } from "../server/exercise-calendar.js";
import { createWorker } from "../server/worker-runtime.js";

const readData = async (file) => JSON.parse(await readFile(new URL(`../src/data/${file}.json`, import.meta.url), "utf8"));
const exercises = await readData("exercises");
const rules = await readData("exercise-calendar-rules");
const events = generateExerciseEvents(exercises, rules);

test("all 17 weekly sessions repeat with original times, places and stable unique IDs", () => {
  const week = events.filter(({ date }) => date >= "2026-09-14" && date <= "2026-09-20");
  assert.equal(week.length, 17);
  assert.equal(new Set(events.map(({ id }) => id)).size, events.length);
  assert.deepEqual(generateExerciseEvents(exercises, rules), events);
  for (const event of events) {
    const course = exercises.courses.find(({ id }) => event.detailUrl === `/cviceni#${id}`);
    assert.ok(course);
    assert.ok(course.sessions.some(({ day, start, end }) => day === new Date(`${event.date}T12:00:00Z`).getUTCDay() && `${start}–${end}` === event.time));
    assert.equal(event.category, "training");
    assert.equal(event.sourceUrl, course.sourceUrl);
    assert.equal(event.place, course.place || "Místo upřesní cvičitel");
  }
});

test("national holidays and all local school breaks contain no recurring exercises", () => {
  for (const date of ["2026-09-28", "2026-10-28", "2026-10-29", "2026-10-30", "2026-11-17", "2026-12-23", "2026-12-31", "2027-01-01", "2027-01-29", "2027-02-08", "2027-02-09", "2027-02-10", "2027-02-11", "2027-02-12", "2027-03-25", "2027-03-26", "2027-03-29", "2027-05-01", "2027-05-08"]) {
    assert.equal(events.filter((event) => event.date === date).length, 0, date);
  }
  assert.ok(events.some(({ date }) => date === "2027-01-04"));
  assert.ok(events.some(({ date }) => date === "2027-02-15"));
  assert.ok(events.some(({ date }) => date === "2027-03-30"));
});

test("summer and unconfirmed next seasons stay empty; DST does not shift times", () => {
  assert.ok(events.every(({ date }) => date >= rules.startsOn && date <= rules.endsOn));
  assert.ok(events.every(({ date }) => !date.startsWith("2027-07") && !date.startsWith("2027-08")));
  for (const date of ["2026-10-19", "2026-10-26", "2027-03-22", "2027-04-05"]) {
    assert.equal(events.find((event) => event.detailUrl === "/cviceni#florbal" && event.date === date)?.time, "17:30–18:30");
  }
});

test("school closures and single-session cancellations leave other sessions intact", () => {
  const adjusted = generateExerciseEvents(exercises, { ...rules, excludedDates: ["2026-09-15"], cancelledSessions: [{ courseId: "florbal", date: "2026-09-14", start: "17:30" }] });
  assert.equal(adjusted.some(({ date }) => date === "2026-09-15"), false);
  assert.equal(adjusted.some(({ date, detailUrl }) => date === "2026-09-14" && detailUrl === "/cviceni#florbal"), false);
  assert.ok(adjusted.some(({ date, detailUrl }) => date === "2026-09-14" && detailUrl === "/cviceni#atletika"));
  assert.ok(adjusted.some(({ date, detailUrl }) => date === "2026-09-21" && detailUrl === "/cviceni#florbal"));
});

test("invalid recurrence configuration fails rather than publishing wrong dates", () => {
  for (const change of [{ endsOn: "2027-02-30" }, { endsOn: "2028-06-30" }, { season: "2027/2028" }, { schoolBreaks: [{ from: "2027-02-14", to: "2027-02-08" }] }, { cancelledSessions: [{ courseId: "unknown", date: "2026-09-14", start: "17:30" }] }]) {
    assert.throws(() => generateExerciseEvents(exercises, { ...rules, ...change }));
  }
});

test("calendar API serves recurring exercises and preserves exceptional one-off events during breaks", async () => {
  const extra = { id: "test-trip", date: "2027-02-10", title: "Testovací výlet", category: "event", place: "Test", time: "09:00", published: true, sourceUrl: "https://example.org/trip" };
  const worker = createWorker({ indexHtml: "", staticEntries: [], calendarEvents: [...events, extra] });
  const getMonth = async (month) => (await worker.fetch(new Request(`https://sokol.example/api/calendar?year=2027&month=${month}`))).json();
  const february = await getMonth(2);
  assert.ok(february.events.length > 0);
  assert.deepEqual(february.events.filter(({ date }) => date === "2027-02-10").map(({ id }) => id), ["test-trip"]);
  assert.ok(february.events.some(({ detailUrl }) => detailUrl === "/cviceni#florbal"));
  assert.deepEqual((await getMonth(7)).events, []);
});

test("optional Google integration supplements recurring training instead of erasing it", async () => {
  const worker = createWorker({
    indexHtml: "", staticEntries: [], calendarEvents: events,
    fetchImpl: async () => Response.json({ items: [{ id: "google-trip", summary: "Test", start: { date: "2026-09-19" } }] }),
  });
  const response = await worker.fetch(new Request("https://sokol.example/api/calendar?year=2026&month=9"), { GOOGLE_CALENDAR_ID: "test", GOOGLE_CALENDAR_API_KEY: "test-only" });
  const body = await response.json();
  assert.equal(body.source, "google");
  assert.ok(body.events.some(({ id }) => id === "google-trip"));
  assert.ok(body.events.some(({ detailUrl }) => detailUrl === "/cviceni#florbal"));
});
