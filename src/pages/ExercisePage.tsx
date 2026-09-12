import { CalendarDays, Clock, Expand, ExternalLink, MapPin, Phone, Users } from "lucide-react";
import { useState } from "react";
import { InfoRow, PageShell } from "../components/PagePrimitives";
import { PosterLightbox } from "../components/PosterLightbox";
import { exerciseSchedule, weekDayNames } from "../data/exercises";
import { currentPosters, type SitePoster } from "../data/posters";
import { memberApplicationUrl } from "../data/siteContent";

export function WeeklySchedule() {
  return (
    <section aria-label="Týdenní rozvrh cvičení">
      <div className="weekly-schedule">
        {[1, 2, 3, 4, 5].map((day) => (
          <section className="schedule-day" key={day} aria-labelledby={`day-${day}`}>
            <h2 id={`day-${day}`}>{weekDayNames[day]}</h2>
            <ul>
              {exerciseSchedule.courses.flatMap((course) => course.sessions
                .filter((session) => session.day === day)
                .map((session) => ({ course, session })))
                .sort((a, b) => a.session.start.localeCompare(b.session.start))
                .map(({ course, session }) => (
                  <li key={course.id}>
                    <span className="schedule-time">{session.start}–{session.end}</span>
                    <div>
                      <a className="text-link" href={`/cviceni#${course.id}`}>{course.title}</a>
                      <p>{course.coaches.map((coach) => coach.name).join(", ")}</p>
                      <p>{course.place ?? "Místo domluvte s trenérkami"}</p>
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
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
        <a className="btn-primary" href={memberApplicationUrl} target="_blank" rel="noopener noreferrer">Přihláška do Sokola <ExternalLink aria-hidden="true" className="h-4 w-4" /></a>
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
