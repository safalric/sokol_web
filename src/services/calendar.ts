export type CalendarEvent = {
  id: string;
  date: string;
  title: string;
  time: string;
  category: "training" | "event";
  place: string;
};

export type CalendarResponse = {
  source: "demo" | "google";
  demo: boolean;
  period: { year: number; month: number };
  events: CalendarEvent[];
  updatedAt: string;
  warning?: string;
  warningCode?: "missing_configuration" | "provider_unavailable";
  configurationWarning?: boolean;
  missingCapabilities?: string[];
  subscriptions: {
    google: string;
    apple: string;
    ics: string;
  } | null;
};

export async function fetchCalendar(period?: { year: number; month: number }, signal?: AbortSignal) {
  const query = period ? `?year=${period.year}&month=${period.month}` : "";
  const response = await fetch(`/api/calendar${query}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    throw new Error("Kalendář se nyní nepodařilo načíst. Zkuste to prosím znovu.");
  }

  return (await response.json()) as CalendarResponse;
}
