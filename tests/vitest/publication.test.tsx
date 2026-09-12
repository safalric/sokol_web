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
  expect(await screen.findByText(/žádné potvrzené akce/)).toBeVisible();
  expect(screen.queryByText(/Demo API/)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Následující měsíc" }));
  await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith("/api/calendar?year=2026&month=10", expect.anything()));
});

test("calendar errors offer retry without replacing data with examples", async () => {
  const fetchMock = vi.fn().mockRejectedValueOnce(new Error("Síť není dostupná")).mockResolvedValueOnce(Response.json({ source: "local", demo: false, period: { year: 2026, month: 9 }, events: [] }));
  vi.stubGlobal("fetch", fetchMock);
  render(<EventCalendar />);
  fireEvent.click(await screen.findByRole("button", { name: "Zkusit znovu" }));
  expect(await screen.findByText(/žádné potvrzené akce/)).toBeVisible();
});
