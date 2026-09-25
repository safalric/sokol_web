import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const calendar = JSON.parse(readFileSync(new URL("../../src/data/public-calendar.json", import.meta.url), "utf8"));

test("Google events and public subscription links work on mobile and desktop", async ({ page }, testInfo) => {
  const encoded = encodeURIComponent(calendar.id);
  const calendarUrl = `https://calendar.google.com/calendar/embed?src=${encoded}&ctz=Europe%2FPrague`;
  const subscribeUrl = `https://calendar.google.com/calendar/ical/${encoded}/public/basic.ics`;
  await page.route("**/api/calendar*", (route) => route.fulfill({ json: {
    source: "google", demo: false, period: { year: 2026, month: 10 }, calendarUrl, subscribeUrl,
    events: [{ id: "google-test", date: "2026-10-10", title: "Sokolský výlet", time: "09:00-16:00", category: "event", place: "Sokolovna", sourceUrl: calendarUrl }],
  } }));
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/kalendar#akce");
    await expect(page.locator("#selected-day-program")).toContainText("Sokolský výlet");
    await expect(page.getByRole("link", { name: "Otevřít Google kalendář" })).toHaveAttribute("href", calendarUrl);
    await expect(page.getByRole("link", { name: "Odebírat kalendář (iCal)" })).toHaveAttribute("href", subscribeUrl);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`google-calendar-${width}.png`), fullPage: true });
  }
});
