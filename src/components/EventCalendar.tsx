import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight, Clock, Loader2, MapPin, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchCalendar, type CalendarEvent, type CalendarResponse } from "../services/calendar";

const weekDays = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getCalendarCells(year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDay + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });
}

function categoryLabel(category: CalendarEvent["category"]) {
  return category === "training" ? "Trénink" : "Akce / výlet";
}

export function EventCalendar() {
  const [calendar, setCalendar] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeRequest = useRef<AbortController | null>(null);

  const load = useCallback(async (period?: { year: number; month: number }) => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setError(null);
    try {
      setCalendar(await fetchCalendar(period, controller.signal));
    } catch (reason) {
      if (!controller.signal.aborted) {
        setError(reason instanceof Error ? reason.message : "Kalendář se nepodařilo načíst.");
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => activeRequest.current?.abort();
  }, [load]);

  const period = calendar?.period;
  const events = calendar?.events ?? [];
  const cells = useMemo(() => (period ? getCalendarCells(period.year, period.month) : []), [period]);
  const monthLabel = period
    ? new Intl.DateTimeFormat("cs-CZ", { month: "long", year: "numeric" }).format(new Date(period.year, period.month - 1, 1))
    : "Načítání kalendáře";

  const changeMonth = (offset: number) => {
    if (!period || loading) return;
    const next = new Date(Date.UTC(period.year, period.month - 1 + offset, 1));
    void load({ year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 });
  };

  return (
    <div className="calendar-layout" aria-busy={loading}>
      <section className="calendar-panel" aria-label="Kalendář programu">
        <div className="calendar-toolbar">
          <div>
            <span className="demo-badge">{calendar?.source === "google" ? "Google Kalendář" : "Demo API"}</span>
            <h2>{monthLabel}</h2>
          </div>
          <div className="calendar-controls">
            <button type="button" aria-label="Předchozí měsíc" disabled={!period || loading || period.year <= 2020} onClick={() => changeMonth(-1)}>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button type="button" aria-label="Následující měsíc" disabled={!period || loading || period.year >= 2035} onClick={() => changeMonth(1)}>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="calendar-live-status" aria-live="polite">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Načítám aktuální program…</> : null}
          {error ? <><AlertCircle className="h-4 w-4" aria-hidden="true" /> {error}</> : null}
          {!loading && !error && calendar?.warning ? <><AlertCircle className="h-4 w-4" aria-hidden="true" /> {calendar.warning}</> : null}
        </div>

        {error ? (
          <button type="button" className="btn-outline mt-5 inline-flex items-center gap-2" onClick={() => void load(period ?? undefined)}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Zkusit znovu
          </button>
        ) : null}

        {!error && period ? (
          <>
            <div className="calendar-desktop">
              <div className="calendar-weekdays" aria-hidden="true">
                {weekDays.map((day) => <span key={day}>{day}</span>)}
              </div>
              <div className="calendar-grid">
                {cells.map((day, index) => {
                  const key = day ? toDateKey(period.year, period.month, day) : `empty-${index}`;
                  const dayEvents = day ? events.filter((event) => event.date === key) : [];
                  return (
                    <div key={key} className={day ? "calendar-day" : "calendar-day calendar-day-empty"}>
                      {day ? <span className="calendar-day-number">{day}</span> : null}
                      {dayEvents.map((event) => (
                        <div key={event.id} className={event.category === "training" ? "calendar-chip calendar-chip-training" : "calendar-chip calendar-chip-event"}>
                          <strong>{categoryLabel(event.category)}</strong>
                          <span>{event.title}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="calendar-mobile">
              {events.length > 0 ? events.map((event) => <CalendarListItem key={event.id} event={event} />) : <CalendarEmpty />}
            </div>
          </>
        ) : null}
      </section>

      <aside className="calendar-agenda">
        <p className="eyebrow text-sokol-red">Nejbližší položky</p>
        <h2>Program v přehledu</h2>
        <p className="calendar-disclaimer">
          {calendar?.demo
            ? "Kalendář běží přes funkční API s ukázkovými daty. Po připojení veřejného Google Kalendáře se obsah začne načítat automaticky."
            : "Program se načítá z veřejného kalendáře jednoty. Změny se mohou projevit s krátkým zpožděním."}
        </p>
        <div className="calendar-agenda-list">
          {!loading && !error && events.length === 0 ? <CalendarEmpty /> : null}
          {events.map((event) => <CalendarListItem key={`agenda-${event.id}`} event={event} />)}
        </div>
      </aside>
    </div>
  );
}

function CalendarEmpty() {
  return (
    <p className="calendar-empty">
      <CalendarDays className="h-5 w-5" aria-hidden="true" />
      Pro tento měsíc nejsou zveřejněné žádné položky.
    </p>
  );
}

function CalendarListItem({ event }: { event: CalendarEvent }) {
  const formattedDate = new Intl.DateTimeFormat("cs-CZ", { weekday: "short", day: "numeric", month: "numeric" }).format(
    new Date(`${event.date}T12:00:00`),
  );
  return (
    <article className="calendar-list-item">
      <div className="calendar-list-heading">
        <span className={event.category === "training" ? "category-label category-training" : "category-label category-event"}>{categoryLabel(event.category)}</span>
        <strong>{formattedDate}</strong>
      </div>
      <h3>{event.title}</h3>
      <p><Clock className="h-4 w-4" aria-hidden="true" />{event.time}</p>
      <p><MapPin className="h-4 w-4" aria-hidden="true" />{event.place}</p>
    </article>
  );
}
