import { AlertCircle, CalendarDays, ChevronLeft, ChevronRight, Clock, Grid2X2, List, Loader2, MapPin, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchCalendar, type CalendarEvent, type CalendarResponse } from "../services/calendar";
import calendarRules from "../data/exercise-calendar-rules.json";

const weekDays = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getCalendarCells(year: number, month: number) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  return Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - firstDay + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("cs-CZ", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${date}T12:00:00`));
}

function todayKey() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Prague", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function categoryLabel(category: CalendarEvent["category"]) {
  return category === "training" ? "Trénink" : "Akce / výlet";
}

export function EventCalendar() {
  const [calendar, setCalendar] = useState<CalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const dayButtons = useRef(new Map<number, HTMLButtonElement>());
  const activeRequest = useRef<AbortController | null>(null);

  const load = useCallback(async (period?: { year: number; month: number }) => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCalendar(period, controller.signal);
      if (!controller.signal.aborted) {
        setCalendar(result);
        const today = todayKey();
        const monthKey = `${result.period.year}-${String(result.period.month).padStart(2, "0")}`;
        const firstDate = result.events.find((event) => event.date >= today)?.date ?? result.events[0]?.date;
        setSelectedDate(firstDate ?? (today.startsWith(monthKey) ? today : `${monthKey}-01`));
      }
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
  const selectedEvents = events.filter((event) => event.date === selectedDate);
  const today = todayKey();
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
            <span className="eyebrow text-sokol-red">Měsíční program</span>
            <h2>{monthLabel}</h2>
          </div>
          <div className="calendar-toolbar-actions">
            <div className="calendar-view-toggle" role="group" aria-label="Zobrazení kalendáře">
              <button
                type="button"
                className={view === "grid" ? "calendar-view-active" : undefined}
                aria-pressed={view === "grid"}
                title="Mřížka"
                onClick={() => setView("grid")}
              >
                <Grid2X2 className="h-4 w-4" aria-hidden="true" />
                <span>Mřížka</span>
              </button>
              <button
                type="button"
                className={view === "list" ? "calendar-view-active" : undefined}
                aria-pressed={view === "list"}
                title="Seznam"
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" aria-hidden="true" />
                <span>Seznam</span>
              </button>
            </div>
            <div className="calendar-controls" role="group" aria-label="Přepínání měsíců">
              <button type="button" aria-label="Aktuální měsíc" title="Aktuální měsíc" disabled={loading} onClick={() => void load()}>
                <CalendarDays className="h-5 w-5" aria-hidden="true" />
              </button>
              <button type="button" aria-label="Předchozí měsíc" disabled={!period || loading || (period.year === 2020 && period.month === 1)} onClick={() => changeMonth(-1)}>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button type="button" aria-label="Následující měsíc" disabled={!period || loading || (period.year === 2035 && period.month === 12)} onClick={() => changeMonth(1)}>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
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
            {events.length === 0 && !loading ? <CalendarEmpty /> : null}
            <div className={view === "grid" ? "calendar-workspace" : "calendar-view-hidden"}>
            <div className="calendar-month">
              <div className="calendar-weekdays" aria-hidden="true">
                {weekDays.map((day) => <span key={day}>{day}</span>)}
              </div>
              <div className="calendar-grid">
                {cells.map((day, index) => {
                  const key = day ? toDateKey(period.year, period.month, day) : `empty-${index}`;
                  const dayEvents = day ? events.filter((event) => event.date === key) : [];
                  if (!day) return <div key={key} className="calendar-day-empty" aria-hidden="true" />;
                  return <button key={key} type="button" className={`calendar-date-button${dayEvents.length ? " has-program" : ""}`}
                    ref={(element) => { if (element) dayButtons.current.set(day, element); else dayButtons.current.delete(day); }}
                    data-date={key} aria-pressed={selectedDate === key} aria-current={today === key ? "date" : undefined}
                    aria-label={`${dateLabel(key)}, počet termínů: ${dayEvents.length}`}
                    aria-controls="selected-day-program" tabIndex={selectedDate === key ? 0 : -1} disabled={loading}
                    onClick={() => setSelectedDate(key)}
                    onKeyDown={(event) => {
                      const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
                      const offset = offsets[event.key];
                      if (offset === undefined) return;
                      event.preventDefault();
                      const target = dayButtons.current.get(day + offset);
                      if (target) { setSelectedDate(toDateKey(period.year, period.month, day + offset)); target.focus(); }
                    }}>
                    <span className="calendar-date-top"><time dateTime={key}>{day}</time><span className="calendar-date-count" aria-hidden="true">{dayEvents.length || ""}</span></span>
                    <span className="calendar-date-preview" aria-hidden="true">
                      {dayEvents.slice(0, 2).map((event) => <span key={event.id} className={event.category === "training" ? "date-preview-training" : "date-preview-event"}><b>{event.time.split(/[–-]/)[0]}</b><span>{event.title}</span></span>)}
                      {dayEvents.length > 2 ? <small>+{dayEvents.length - 2} další</small> : null}
                    </span>
                    <span className="calendar-date-dots" aria-hidden="true">
                      {dayEvents.some((event) => event.category === "training") ? <i className="training-dot" /> : null}
                      {dayEvents.some((event) => event.category === "event") ? <i className="event-dot" /> : null}
                    </span>
                  </button>;
                })}
              </div>
            </div>
            <section id="selected-day-program" className="calendar-selected-day" aria-labelledby="selected-day-title" aria-live="polite" aria-atomic="true">
              <p className="eyebrow text-sokol-red">Program dne</p>
              <h3 id="selected-day-title">{selectedDate ? dateLabel(selectedDate) : "Vybraný den"}</h3>
              {selectedEvents.length ? selectedEvents.map((event) => <CalendarListItem key={event.id} event={event} />) : <p className="calendar-day-free">Na tento den není naplánované žádné cvičení ani akce.</p>}
            </section>
            </div>
            <div className={view === "list" ? "calendar-list-view" : "calendar-view-hidden"}>
              {Array.from(new Set(events.map((event) => event.date))).map((date) => <section key={date} className="calendar-list-day" aria-label={dateLabel(date)}><h3>{dateLabel(date)}</h3>{events.filter((event) => event.date === date).map((event) => <CalendarListItem key={event.id} event={event} />)}</section>)}
            </div>
          </>
        ) : null}
      </section>

      <aside className="calendar-agenda">
        <p className="eyebrow text-sokol-red">Program jednoty</p>
        <h2>Termíny a změny</h2>
        <p className="calendar-disclaimer">
          Cvičení se opakují podle rozvrhu pro školní rok {calendarRules.season}. O školních prázdninách okresu {calendarRules.district} a o státních i ostatních svátcích se necvičí. Mimořádné změny oznámí cvičitel.
        </p>
        <div className="calendar-legend">
          <span className="category-label category-training">Tréninky</span>
          <span className="category-label category-event">Výlety a akce</span>
        </div>
      </aside>
    </div>
  );
}

function CalendarEmpty() {
  return (
    <p className="calendar-empty mt-5" role="status">
      <CalendarDays className="h-5 w-5" aria-hidden="true" />
      Pro tento měsíc nejsou naplánovaná žádná cvičení ani akce.
    </p>
  );
}

function CalendarListItem({ event }: { event: CalendarEvent }) {
  return (
    <article className="calendar-list-item">
      <div className="calendar-list-heading">
        <span className={event.category === "training" ? "category-label category-training" : "category-label category-event"}>{categoryLabel(event.category)}</span>
        <span className="calendar-item-time"><Clock aria-hidden="true" />{event.time}</span>
      </div>
      <h3>{event.title}</h3>
      <p><MapPin className="h-4 w-4" aria-hidden="true" />{event.place}</p>
      {event.detailUrl ? <a className="text-link mt-3 inline-flex" href={event.detailUrl}>Detail cvičení a kontakt</a> : event.sourceUrl ? <a className="text-link mt-3 inline-flex" href={event.sourceUrl} target="_blank" rel="noopener noreferrer">Podrobnosti akce</a> : null}
    </article>
  );
}
