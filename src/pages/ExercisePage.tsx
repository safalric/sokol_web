import { ArrowRight, CalendarDays, Clock, Expand, ExternalLink, MapPin, Phone, Users } from "lucide-react";
import { useState } from "react";
import { InfoRow, PageShell } from "../components/PagePrimitives";
import { PosterLightbox } from "../components/PosterLightbox";
import { exerciseSchedule, weekDayNames } from "../data/exercises";
import { currentPosters, type SitePoster } from "../data/posters";
import { memberApplicationGuideUrl } from "../data/siteContent";

export function WeeklySchedule() {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const sessions = exerciseSchedule.courses.flatMap((course) => course.sessions.map((session) => ({ course, session })))
    .sort((a, b) => a.session.start.localeCompare(b.session.start));
  return (
    <section aria-label="Týdenní rozvrh cvičení">
      <div className="schedule-overview">
        <div><strong>Sezóna {exerciseSchedule.season}</strong><p>{exerciseSchedule.courses.length} cvičení · {sessions.length} lekcí týdně</p></div>
        <div className="schedule-day-filter" role="group" aria-label="Dny týdenního rozvrhu">
          <button type="button" aria-pressed={selectedDay === null} onClick={() => setSelectedDay(null)}>Celý týden</button>
          {[1, 2, 3, 4, 5].map((day) => <button key={day} type="button" aria-pressed={selectedDay === day} onClick={() => setSelectedDay(day)}>{weekDayNames[day]}</button>)}
        </div>
      </div>
      <div className="weekly-schedule">
        {[1, 2, 3, 4, 5].filter((day) => selectedDay === null || day === selectedDay).map((day) => (
          <section className="schedule-day" key={day} aria-labelledby={`day-${day}`}>
            <div className="schedule-day-heading"><h2 id={`day-${day}`}>{weekDayNames[day]}</h2><span>{sessions.filter(({ session }) => session.day === day).length} lekce</span></div>
            <ul>
              {sessions.filter(({ session }) => session.day === day)
                .map(({ course, session }) => (
                  <li key={`${course.id}-${session.start}`}>
                    <span className="schedule-time"><strong>{session.start}</strong><span>– {session.end}</span></span>
                    <div className="schedule-session-main">
                      <a className="text-link" href={`/cviceni#${course.id}`}>{course.title}</a>
                      <p><Users aria-hidden="true" />{course.coaches.map((coach) => coach.name).join(", ")}</p>
                    </div>
                    <p className="schedule-place"><MapPin aria-hidden="true" />{course.place ?? "Místo domluvte s trenérkami"}</p>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="schedule-footnote">O školních prázdninách a svátcích se necvičí. Mimořádné změny oznámí cvičitel.</p>
    </section>
  );
}

export function ExercisePage() {
  const [day, setDay] = useState("all");
  const [active, setActive] = useState<{ poster: SitePoster; opener: HTMLButtonElement } | null>(null);
  const courses = exerciseSchedule.courses.filter((course) => day === "all" || course.sessions.some((session) => session.day === Number(day)));

  return (
    <PageShell title="Nabídka cvičení">
      <div className="exercise-toolbar">
        <label htmlFor="exercise-day">Den cvičení
          <select id="exercise-day" value={day} onChange={(event) => setDay(event.target.value)}>
            <option value="all">Všechny dny</option>
            {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{weekDayNames[value]}</option>)}
          </select>
        </label>
        <a className="btn-outline" href="/kalendar"><CalendarDays aria-hidden="true" className="h-4 w-4" /> Týdenní rozvrh</a>
        <a className="btn-primary" href={memberApplicationGuideUrl}>Přihláška do Sokola <ArrowRight aria-hidden="true" className="h-4 w-4" /></a>
      </div>
      <p className="mb-5 text-sm" role="status">{courses.length} cvičení</p>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <article id={course.id} key={course.id} className="department-card exercise-card scroll-mt-28">
            <h2>{course.title}</h2>
            <p>{course.description}</p>
            <dl className="mt-5 grid gap-3">
              {course.age ? <InfoRow icon={Users} label="Pro koho" value={course.age} /> : null}
              <InfoRow icon={Clock} label="Kdy" value={course.sessions.map((session) => `${weekDayNames[session.day]} ${session.start}–${session.end}`).join("\n")} />
              <InfoRow icon={MapPin} label="Kde" value={course.place ?? "Místo upřesní trenérky"} />
            </dl>
            <div className="exercise-coaches">
              <h3>Cvičitelé</h3>
              {course.coaches.map((coach) => (
                <div key={coach.name}>
                  <strong>{coach.name}</strong>
                  {coach.phone ? <a href={`tel:+420${coach.phone.replace(/\s/g, "")}`}><Phone className="h-4 w-4" aria-hidden="true" />{coach.phone}</a> : null}
                  {coach.email ? <a href={`mailto:${coach.email}`}>{coach.email}</a> : null}
                </div>
              ))}
            </div>
            {course.note ? <p className="exercise-note">{course.note}</p> : null}
            <div className="exercise-card-actions">
              <button type="button" className="btn-outline" onClick={(event) => {
                const poster = currentPosters.find((item) => item.id === `${course.id}-2026-2027`);
                if (poster) setActive({ poster, opener: event.currentTarget });
              }} aria-label={`Zvětšit plakát ${course.title}`}><Expand className="h-4 w-4" aria-hidden="true" />Plakát</button>
              <a className="text-link" href={course.sourceUrl} target="_blank" rel="noopener noreferrer">Zdroj <ExternalLink className="h-4 w-4" aria-hidden="true" /></a>
            </div>
          </article>
        ))}
      </div>
      {active ? <PosterLightbox poster={active.poster} opener={active.opener} onClose={() => setActive(null)} /> : null}
    </PageShell>
  );
}
