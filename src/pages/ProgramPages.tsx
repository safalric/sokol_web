import { CalendarDays, CheckCircle2, Clock, Info, Mail, MapPin, Users } from "lucide-react";
import { EventCalendar } from "../components/EventCalendar";
import { EventRegistrationForm } from "../components/EventRegistrationForm";
import { InfoRow, PageShell } from "../components/PagePrimitives";
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
  const registrationEvent = events.find((event) => event.registration);

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
          </article>
        ))}
      </div>
      {registrationEvent ? (
        <div className="mt-10 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <article className="content-card">
            <span className="demo-badge">Funkční prototyp</span>
            <h2 className="mt-4">Přihlášení na výlet</h2>
            <p>Vyplňte kontaktní údaje účastníka a pouze nezbytné organizační informace.</p>
            <ul className="mt-5 grid gap-3 text-sm">
              <li className="check-row"><CheckCircle2 className="h-4 w-4" /> U nezletilých potvrzuje oprávnění zákonný zástupce</li>
              <li className="check-row"><CheckCircle2 className="h-4 w-4" /> Zdravotní a mediální souhlasy jsou oddělené a dobrovolné</li>
              <li className="check-row"><CheckCircle2 className="h-4 w-4" /> Serverová validace, antispam a ochrana proti duplicitám</li>
              <li className="check-row"><CheckCircle2 className="h-4 w-4" /> Demo náhled e-mailů bez ukládání osobních údajů</li>
            </ul>
          </article>
          <EventRegistrationForm eventName={registrationEvent.title} />
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
