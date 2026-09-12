import { CalendarDays, ExternalLink } from "lucide-react";
import { useState } from "react";
import { EventCalendar } from "../components/EventCalendar";
import { PageShell } from "../components/PagePrimitives";
import { PosterGallery } from "../components/PosterGallery";
import { currentPosters, archivedPosters } from "../data/posters";
import { socialLinks } from "../data/siteContent";
import { WeeklySchedule } from "./ExercisePage";
export { ExercisePage } from "./ExercisePage";

export function EventsPage() {
  return (
    <PageShell title="Akce a tábory">
      <section aria-labelledby="upcoming-events-title">
        <h2 id="upcoming-events-title" className="section-title">Nadcházející akce</h2>
        <p className="page-intro mt-4">Potvrzené termíny výletů, táborů a společných setkání zveřejňujeme v kalendáři akcí.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a className="btn-primary" href="/kalendar#akce"><CalendarDays className="h-4 w-4" aria-hidden="true" />Kalendář akcí</a>
          <a className="btn-outline" href={socialLinks[0].href} target="_blank" rel="noopener noreferrer">Aktuality na Facebooku <ExternalLink className="h-4 w-4" aria-hidden="true" /></a>
        </div>
        <p className="mt-5">Informace k účasti poskytne organizátor konkrétní akce. Online přihlášky na akce zde zatím nejsou otevřené.</p>
      </section>
      <section id="plakaty" className="mt-12 scroll-mt-24" aria-labelledby="plakaty-title">
        <p className="eyebrow text-sokol-red">Sezóna 2026/2027</p>
        <h2 id="plakaty-title" className="section-title">Plakáty a informační letáky</h2>
        <p className="page-intro mt-4">Aktuální plakáty cvičení z Facebooku jednoty. Časy, místa a kontakty najdete také v nabídce cvičení.</p>
        <div className="mt-7"><PosterGallery posters={currentPosters} /></div>
        <details className="poster-archive mt-8">
          <summary>Archiv plakátů · {archivedPosters.length} materiálů</summary>
          <p className="my-5">Starší letáky slouží pouze jako archiv. Jejich termíny a rozvrhy již nejsou aktuální.</p>
          <PosterGallery posters={archivedPosters} />
        </details>
      </section>
    </PageShell>
  );
}

export function CalendarPage() {
  const [view, setView] = useState<"schedule" | "events">(() => window.location.hash === "#akce" ? "events" : "schedule");
  const changeView = (next: "schedule" | "events") => {
    setView(next);
    window.history.replaceState(window.history.state, "", next === "events" ? "/kalendar#akce" : "/kalendar");
  };
  return (
    <PageShell title="Kalendář">
      <div className="program-view-switch" role="group" aria-label="Typ programu">
        <button className="btn-outline" type="button" aria-pressed={view === "schedule"} aria-controls="calendar-program" onClick={() => changeView("schedule")}>Rozvrh cvičení</button>
        <button className="btn-outline" type="button" aria-pressed={view === "events"} aria-controls="calendar-program" onClick={() => changeView("events")}>Kalendář akcí</button>
      </div>
      <div id="calendar-program" className="mt-8">{view === "schedule" ? <WeeklySchedule /> : <EventCalendar />}</div>
    </PageShell>
  );
}
