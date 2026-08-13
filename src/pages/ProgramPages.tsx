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
          <article key={item.id} className="department-card">
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
  const [selectedEventId, setSelectedEventId] = useState(registrationEvents[0]?.id ?? "");
  const registrationEvent = registrationEvents.find((event) => event.id === selectedEventId) ?? registrationEvents[0];
  const selectRegistrationEvent = (eventId: string, scrollToForm = false) => {
    setSelectedEventId(eventId);
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
          <article key={event.id} className="event-card">
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
              <button className="btn-outline mt-5" type="button" onClick={() => selectRegistrationEvent(event.id, true)}>
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
            <span className="demo-badge">Google Forms + neveřejné Sheets</span>
            <h2 className="mt-4">Vyberte typ přihlášky</h2>
            <div className="registration-type-switch" role="group" aria-label="Typ přihlášky">
              {registrationEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  aria-pressed={registrationEvent?.id === event.id}
                  onClick={() => selectRegistrationEvent(event.id)}
                >
                  {event.registrationType === "camp" ? "Tábor" : "Výlet"}
                </button>
              ))}
            </div>
            <p>
              Přihlášky se zpracovávají mimo veřejný web. Google formulář je propojený pouze s neveřejnou tabulkou organizátora.
            </p>
            <ul className="mt-5 grid gap-3 text-sm">
              <li className="check-row"><CheckCircle2 className="h-4 w-4" /> Povinná pole a formát údajů kontroluje Google Forms</li>
              <li className="check-row"><CheckCircle2 className="h-4 w-4" /> Duplicity, uzávěrku a kapacitu kontroluje Apps Script</li>
              <li className="check-row"><CheckCircle2 className="h-4 w-4" /> Veřejný obsah a osobní údaje zůstávají oddělené</li>
              <li className="check-row"><CheckCircle2 className="h-4 w-4" /> Přihlášky po retenční lhůtě označí automatická kontrola</li>
            </ul>
          </article>
          <EventRegistrationForm
            key={registrationEvent.id}
            eventName={registrationEvent.title}
            formUrl={registrationEvent.registrationUrl}
            open={registrationEvent.registrationOpen}
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
        Přehled tréninků, výletů a společných akcí se načítá z veřejného Google Kalendáře jednoty. Po připojení kalendáře jej lze z této stránky přidat také do Apple Kalendáře.
      </p>
      <div className="mt-8"><EventCalendar /></div>
    </PageShell>
  );
}
