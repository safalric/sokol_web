import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { EventCalendar } from "../../src/components/EventCalendar";
import { EventsPage } from "../../src/pages/ProgramPages";

afterEach(() => vi.unstubAllGlobals());

test("events page has no demo offers or registration fields", () => {
  const { container } = render(<EventsPage />);
  expect(container.querySelector("form")).toBeNull();
  expect(container.textContent).not.toMatch(/ukázkov|prototyp|Orlických hor|červenec 2027/i);
  expect(screen.getByRole("link", { name: "Kalendář akcí" })).toHaveAttribute("href", "/kalendar#akce");
});

test("empty calendar is explicit and switching months remains usable", async () => {
  const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(Response.json({ source: "local", demo: false, period: { year: 2026, month: 9 }, events: [] })));
  vi.stubGlobal("fetch", fetchMock);
  render(<EventCalendar />);
  expect(await screen.findByText(/žádná cvičení ani akce/)).toBeVisible();
  expect(screen.queryByText(/Demo API/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Následující měsíc" }));
  await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith("/api/calendar?year=2026&month=10", expect.anything()));
});

test("calendar errors offer retry without replacing data with examples", async () => {
  const fetchMock = vi.fn().mockRejectedValueOnce(new Error("Síť není dostupná")).mockResolvedValueOnce(Response.json({ source: "local", demo: false, period: { year: 2026, month: 9 }, events: [] }));
  vi.stubGlobal("fetch", fetchMock);
  render(<EventCalendar />);
  fireEvent.click(await screen.findByRole("button", { name: "Zkusit znovu" }));
  expect(await screen.findByText(/žádná cvičení ani akce/)).toBeVisible();
});

test("compact calendar exposes every session through day selection without hiding empty days", async () => {
  const events = Array.from({ length: 4 }, (_, index) => ({ id: `test-${index}`, date: "2026-09-14", title: `Lekce ${index}`, time: "17:00–18:00", category: "training", place: "Tělocvična", detailUrl: "/cviceni#florbal" }));
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ source: "local", period: { year: 2026, month: 9 }, events })));
  const { container } = render(<EventCalendar />);
  const day = await screen.findByRole("button", { name: "pondělí 14. září, počet termínů: 4" });
  fireEvent.click(day);
  expect(container.querySelectorAll("#selected-day-program article")).toHaveLength(4);
  expect(container.querySelectorAll(".calendar-date-preview > span")).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "úterý 15. září, počet termínů: 0" }));
  expect(screen.getByText("Na tento den není naplánované žádné cvičení ani akce.")).toBeVisible();
  expect(container.querySelectorAll(".calendar-grid > *")).toHaveLength(35);
});
