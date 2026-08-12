import { CalendarDays, CheckCircle2, Clock, Info, Mail, MapPin, Users } from "lucide-react";
import { useState } from "react";
import { EventCalendar } from "../components/EventCalendar";
import { EventRegistrationForm } from "../components/EventRegistrationForm";
import { InfoRow, PageShell } from "../components/PagePrimitives";
import { PosterGallery } from "../components/PosterGallery";
import { posters } from "../data/posters";
import { departments, events } from "../data/siteContent";

export function ExercisePage() {
  return (
    <PageShell title="Nabídka cvičení">
      <div className="demo-callout mb-6">
        <Info className="h-5 w-5" aria-hidden="true" />
        <span>Časy a místa jsou ukázkové. Jména a telefony vycházejí z dodaných kontaktů, přiřazení k oddílům je nutné finálně potvrdit.</span>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {departments.map((item) => (
          <article key={item.title} className="department-card">
            {item.demo ? <span className="demo-badge">Demo rozvrh</span> : null}
            <span className="icon-badge"><item.icon className="h-6 w-6" aria-hidden="true" /></span>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            <dl className="mt-5 grid gap-3">
              <InfoRow icon={Users} label="Cílová skupina" value={item.age} />
              <InfoRow icon={CalendarDays} label="Den" value={item.day} />
              <InfoRow icon={Clock} label="Čas" value={item.time} />
              <InfoRow icon={MapPin} label="Místo" value={item.place} />
              <InfoRow
                icon={Mail}
                label="Kontakt"
                value={item.contactPhone ? `${item.contactName}\n${item.contactPhone}` : item.contactName}
                href={item.contactPhone ? `tel:${item.contactPhone.replace(/\s/g, "")}` : undefined}
              />
            </dl>
          </article>
        ))}
      </div>
    </PageShell>
  );
}

export function EventsPage() {
  const registrationEvents = events.filter((event) => event.registration && event.registrationType);
  const [selectedEventTitle, setSelectedEventTitle] = useState(registrationEvents[0]?.title ?? "");
  const registrationEvent = registrationEvents.find((event) => event.title === selectedEventTitle) ?? registrationEvents[0];
  const selectRegistrationEvent = (eventTitle: string, scrollToForm = false) => {
    setSelectedEventTitle(eventTitle);
    if (scrollToForm) {
      window.requestAnimationFrame(() => document.getElementById("prihlaska-na-akci")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  return (
    <PageShell title="Akce a tábory">
      <div className="demo-callout mb-6">
        <Info className="h-5 w-5" aria-hidden="true" />
        <span>Termíny a kapacity jsou ukázkové. Stránka představuje cílovou podobu nabídky akcí.</span>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {events.map((event) => (
          <article key={event.title} className="event-card">
            <span className="demo-badge">{event.status}</span>
            <CalendarDays className="h-7 w-7 text-sokol-red" aria-hidden="true" />
            <h2>{event.title}</h2>
            <p>{event.description}</p>
            <dl className="mt-5 grid gap-3">
              <InfoRow icon={CalendarDays} label="Termín" value={event.date} />
              <InfoRow icon={Clock} label="Čas" value={event.time} />
              <InfoRow icon={MapPin} label="Místo" value={event.place} />
              <InfoRow icon={Users} label="Kapacita" value={event.capacity} />
            </dl>
            {event.registration && event.registrationType ? (
              <button className="btn-outline mt-5" type="button" onClick={() => selectRegistrationEvent(event.title, true)}>
                {event.registrationType === "camp" ? "Přihlásit na tábor" : "Přihlásit na výlet"}
              </button>
            ) : null}
          </article>
        ))}
      </div>
      <section id="plakaty" className="mt-12 scroll-mt-24" aria-labelledby="plakaty-title">
        <p className="eyebrow text-sokol-red">Archiv jednoty</p>
        <h2 id="plakaty-title" className="section-title">Plakáty a informační letáky</h2>
        <p className="page-intro mt-4">
          Originální materiály převzaté z původního webu TJ Sokol Doudleby nad Orlicí. Archivní letáky mohou obsahovat již neplatné termíny; aktuální rozvrh je potřeba ověřit u cvičitele.
        </p>
        <div className="mt-7"><PosterGallery posters={posters} /></div>
      </section>
      {registrationEvent ? (
        <div id="prihlaska-na-akci" className="mt-10 scroll-mt-24 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <article className="content-card">
            <span className="demo-badge">Funkční prototyp</span>
            <h2 className="mt-4">Vyberte typ přihlášky</h2>
            <div className="registration-type-switch" role="group" aria-label="Typ přihlášky">
              {registrationEvents.map((event) => (
                <button
                  key={event.title}
                  type="button"
                  aria-pressed={registrationEvent?.title === event.title}
                  onClick={() => selectRegistrationEvent(event.title)}
                >
                  {event.registrationType === "camp" ? "Tábor" : "Výlet"}
                </button>
              ))}
            </div>
            <p>
              {registrationEvent?.registrationType === "camp"
                ? "Táborová přihláška obsahuje také nepovinné zdravotní údaje a samostatný výslovný souhlas."
                : "Jednodenní výlet má zkrácenou přihlášku bez zdravotních údajů a alergií."}
            </p>
            <ul className="mt-5 grid gap-3 text-sm">
              <li className="check-row"><CheckCircle2 className="h-4 w-4" /> U nezletilých potvrzuje oprávnění zákonný zástupce</li>
              <li className="check-row"><CheckCircle2 className="h-4 w-4" /> Rozsah údajů odpovídá typu a délce akce</li>
              <li className="check-row"><CheckCircle2 className="h-4 w-4" /> Serverová validace, antispam a ochrana proti duplicitám</li>
              <li className="check-row"><CheckCircle2 className="h-4 w-4" /> Demo náhled e-mailů bez ukládání osobních údajů</li>
            </ul>
          </article>
          <EventRegistrationForm
            key={registrationEvent.title}
            eventName={registrationEvent.title}
            registrationType={registrationEvent.registrationType === "camp" ? "camp" : "trip"}
          />
        </div>
      ) : null}
    </PageShell>
  );
}

export function CalendarPage() {
  return (
    <PageShell title="Kalendář">
      <p className="page-intro">
        Přehled tréninků, výletů a společných akcí se načítá přes vlastní API. V demo režimu používá bezpečná ukázková data; po doplnění přístupu se automaticky přepne na veřejný Google Kalendář jednoty.
      </p>
      <div className="mt-8"><EventCalendar /></div>
    </PageShell>
  );
}
