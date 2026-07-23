import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import { EventRegistrationForm } from "./components/EventRegistrationForm";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import {
  contactDetails,
  coachContacts,
  departments,
  events,
  gallery,
  historyStories,
  historyTimeline,
  leadership,
  memberApplicationUrl,
  notices,
  privacyItems,
  quickLinks,
} from "./data/siteContent";

const pageTitles: Record<string, string> = {
  "/": "Úvod",
  "/o-nas": "O nás",
  "/cviceni": "Cvičení",
  "/akce": "Akce",
  "/prihlaska": "Přihláška",
  "/fotogalerie": "Fotogalerie",
  "/historie": "Historie",
  "/kontakt": "Kontakt",
  "/gdpr": "Ochrana osobních údajů",
};

function normalizePath(pathname: string) {
  const path = pathname.replace(/\/$/, "") || "/";
  return pageTitles[path] ? path : "/";
}

export function App() {
  const [currentPath, setCurrentPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const onPopState = () => setCurrentPath(normalizePath(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (href: string) => {
    const nextPath = normalizePath(href);
    if (nextPath !== currentPath) {
      window.history.pushState({}, "", nextPath);
      setCurrentPath(nextPath);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-sokol-paper text-sokol-ink">
      <Header currentPath={currentPath} onNavigate={navigate} />
      <main className="flex-1">
        {currentPath === "/" ? <HomePage onNavigate={navigate} /> : null}
        {currentPath === "/o-nas" ? <AboutPage onNavigate={navigate} /> : null}
        {currentPath === "/cviceni" ? <ExercisePage /> : null}
        {currentPath === "/akce" ? <EventsPage /> : null}
        {currentPath === "/prihlaska" ? <MemberApplicationPage /> : null}
        {currentPath === "/fotogalerie" ? <GalleryPage /> : null}
        {currentPath === "/historie" ? <HistoryPage /> : null}
        {currentPath === "/kontakt" ? <ContactPage onNavigate={navigate} /> : null}
        {currentPath === "/gdpr" ? <PrivacyPage /> : null}
      </main>
      <Footer onNavigate={navigate} />
    </div>
  );
}

function HomePage({ onNavigate }: { onNavigate: (href: string) => void }) {
  return (
    <>
      <section className="hero-clean">
        <div className="hero-inner">
          <div>
            <p className="eyebrow">Tělocvičná jednota</p>
            <h1>TJ Sokol Doudleby nad Orlicí</h1>
            <p className="hero-lead">
              Čistý web pro cvičení, akce, členství a historii jednoty. Sokolský duch, jasná navigace a rychlý přístup k tomu, co návštěvník potřebuje.
            </p>
            <div className="hero-actions">
              <button className="btn-primary" type="button" onClick={() => onNavigate("/cviceni")}>
                Chci cvičit
              </button>
              <button className="btn-outline-light" type="button" onClick={() => onNavigate("/akce")}>
                Aktuální akce
              </button>
              <button className="btn-outline-light" type="button" onClick={() => onNavigate("/prihlaska")}>
                Přihláška
              </button>
            </div>
          </div>
          <div className="hero-panel">
            <p className="panel-kicker">Sokolský ideál</p>
            <blockquote>„Buďte věrni sobě, pravdě a spravedlnosti.“</blockquote>
            <p>Sokol usiluje o všestranný rozvoj osobnosti člověka: tělem, duchem i službou obci.</p>
          </div>
        </div>
      </section>

      <section className="page-band">
        <div className="mx-auto grid max-w-6xl gap-4 px-5 py-8 md:grid-cols-3">
          {quickLinks.map((item) => (
            <button key={item.href} className="quick-card" type="button" onClick={() => onNavigate(item.href)}>
              <item.icon className="h-6 w-6 text-sokol-red" aria-hidden="true" />
              <span>{item.label}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <Section eyebrow="Aktuality" title="Co je potřeba vědět">
        <div className="grid gap-5 md:grid-cols-3">
          {notices.map((notice) => (
            <article key={notice.title} className="simple-card">
              <p className="card-date">{notice.date}</p>
              <h3>{notice.title}</h3>
              <p>{notice.text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow="Nadcházející akce" title="Pozvánky a výlety" tone="white">
        <div className="grid gap-5 md:grid-cols-3">
          {events.map((event) => (
            <article key={event.title} className="event-card">
              <CalendarDays className="h-6 w-6 text-sokol-red" aria-hidden="true" />
              <h3>{event.title}</h3>
              <p>{event.description}</p>
              <button className="text-link" type="button" onClick={() => onNavigate("/akce")}>
                Zobrazit detail
              </button>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}

function AboutPage({ onNavigate }: { onNavigate: (href: string) => void }) {
  return (
    <PageShell title="O nás" crumb="O nás">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        <article className="content-card">
          <p className="lead">
            TJ Sokol Doudleby nad Orlicí je místní tělocvičná jednota navazující na sokolskou tradici pohybu, dobrovolnictví a práce s dětmi.
          </p>
          <p>
            Web je připravený tak, aby šel snadno doplnit o ověřené údaje z kroniky, seznam cvičitelů, dokumenty jednoty a aktuální rozpis sezóny.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn-primary" type="button" onClick={() => onNavigate("/historie")}>
              Historie jednoty
            </button>
            <button className="btn-outline" type="button" onClick={() => onNavigate("/kontakt")}>
              Kontakty
            </button>
          </div>
        </article>
        <article className="content-card">
          <h2>Vedení jednoty</h2>
          <div className="mt-5 grid gap-3">
            {leadership.map((person) => (
              <div key={`${person.role}-${person.name}`} className="person-row">
                <strong>{person.role}</strong>
                <span>{person.name}</span>
                <a href={`tel:${person.phone.replace(/\s/g, "")}`}>{person.phone}</a>
                {person.email ? <a href={`mailto:${person.email}`}>{person.email}</a> : null}
              </div>
            ))}
          </div>
        </article>
      </div>
      <section className="mt-8">
        <div className="section-heading-row">
          <p className="eyebrow text-sokol-red">Kontakty</p>
          <h2 className="section-title">Cvičitelky a cvičitelé</h2>
        </div>
        <div className="coach-grid">
          {coachContacts.map((coach) => (
            <article key={coach.name} className="coach-card">
              <h3>{coach.name}</h3>
              {coach.focus ? <p>{coach.focus}</p> : null}
              <a href={`tel:${coach.phone.replace(/\s/g, "")}`}>{coach.phone}</a>
              {coach.email ? <a href={`mailto:${coach.email}`}>{coach.email}</a> : null}
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function ExercisePage() {
  return (
    <PageShell title="Nabídka cvičení" crumb="Cvičení">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {departments.map((item) => (
          <article key={item.title} className="department-card">
            <span className="icon-badge">
              <item.icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            <dl className="mt-5 grid gap-3">
              <InfoRow icon={Users} label="Cílová skupina" value={item.age} />
              <InfoRow icon={Clock} label="Čas tréninku" value={item.schedule} />
              <InfoRow icon={MapPin} label="Místo" value={item.place} />
              <InfoRow icon={Mail} label="Kontakt" value={item.contact} />
            </dl>
          </article>
        ))}
      </div>
    </PageShell>
  );
}

function EventsPage() {
  const registrationEvent = events.find((event) => event.registration);

  return (
    <PageShell title="Akce a tábory" crumb="Akce">
      <div className="grid gap-5 lg:grid-cols-3">
        {events.map((event) => (
          <article key={event.title} className="event-card">
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
            <h2>Přihlášení na výlet</h2>
            <p>Formulář má validace, honeypot proti spamu, povinný GDPR souhlas a ochranu proti vícenásobnému odeslání.</p>
            <ul className="mt-5 grid gap-3 text-sm">
              <li className="check-row"><CheckCircle2 className="h-4 w-4" /> HTTPS kontrola</li>
              <li className="check-row"><CheckCircle2 className="h-4 w-4" /> Sanitizace vstupů</li>
              <li className="check-row"><CheckCircle2 className="h-4 w-4" /> Připravený webhook</li>
            </ul>
          </article>
          <EventRegistrationForm eventName={registrationEvent.title} organizerEmail="akce@sokoldoudleby.cz" />
        </div>
      ) : null}
    </PageShell>
  );
}

function MemberApplicationPage() {
  return (
    <PageShell title="Přihláška do Sokola" crumb="Přihláška">
      <div className="application-layout">
        <article className="content-card text-center">
          <h2>Oficiální členská přihláška</h2>
          <p>
            Přihlášení nového člena probíhá přes systém eČlen České obce sokolské. Tlačítko otevře oficiální formulář v nové kartě.
          </p>
          <a className="btn-primary mt-6 inline-flex items-center gap-2" href={memberApplicationUrl} target="_blank" rel="noreferrer">
            Přihláška do Sokola Doudleby
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </article>
        <article className="application-preview">
          <div className="magnifier">
            <span>Členské zařazení</span>
            <p>Kraj: Královéhradecký</p>
            <p>Župa: Orlická</p>
            <p>Jednota: Doudleby nad Orlicí</p>
          </div>
        </article>
      </div>
    </PageShell>
  );
}

function GalleryPage() {
  return (
    <PageShell title="Fotogalerie" crumb="Fotogalerie">
      <p className="page-intro">Struktura galerie je připravená pro skutečné fotografie jednoty. Dočasné náhledy drží jednotný vizuální styl, aby stránka nepůsobila prázdně.</p>
      <div className="gallery-grid">
        {gallery.map((item, index) => (
          <article key={item.title} className={`gallery-card gallery-${item.tone}`}>
            <div className="gallery-number">{String(index + 1).padStart(2, "0")}</div>
            <div>
              <h2>{item.title}</h2>
              <p>{item.meta}</p>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}

function HistoryPage() {
  return (
    <PageShell title="Historie" crumb="Historie">
      <p className="page-intro">
        Historie doudlebského Sokola sahá ke konci 19. století. Z kronik a dochovaných zápisů vystupuje obraz jednoty, která spojovala cvičení, občanský život a péči o společné místo.
      </p>
      <div className="timeline">
        {historyTimeline.map((item) => (
          <article key={item.year} className="timeline-item">
            <div className="timeline-year">{item.year}</div>
            <div>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </div>
          </article>
        ))}
      </div>
      <div className="history-story-grid">
        {historyStories.map((story) => (
          <article key={story.title} className="history-story">
            <h2>{story.title}</h2>
            {story.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </article>
        ))}
      </div>
    </PageShell>
  );
}

function ContactPage({ onNavigate }: { onNavigate: (href: string) => void }) {
  return (
    <PageShell title="Kontakt" crumb="Kontakt">
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <article className="content-card">
          <h2>Kontaktní údaje</h2>
          <dl className="mt-5 grid gap-4">
            {contactDetails.map((item) => (
              <InfoRow key={item.label} icon={item.icon} label={item.label} value={item.value} />
            ))}
          </dl>
          <button className="btn-outline mt-6" type="button" onClick={() => onNavigate("/gdpr")}>
            Ochrana osobních údajů
          </button>
        </article>
        <div className="map-placeholder">
          <MapPin className="h-8 w-8 text-sokol-red" aria-hidden="true" />
          <span>Mapa bude doplněna po potvrzení přesné adresy sokolovny.</span>
        </div>
      </div>
    </PageShell>
  );
}

function PrivacyPage() {
  return (
    <PageShell title="Ochrana osobních údajů" crumb="GDPR">
      <div className="grid gap-5 md:grid-cols-2">
        {privacyItems.map((item) => (
          <article key={item.title} className="content-card">
            <ShieldCheck className="mb-4 h-6 w-6 text-sokol-red" aria-hidden="true" />
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </PageShell>
  );
}

function Section({ eyebrow, title, tone = "paper", children }: { eyebrow: string; title: string; tone?: "paper" | "white"; children: React.ReactNode }) {
  return (
    <section className={tone === "white" ? "section section-white" : "section"}>
      <div className="mx-auto max-w-6xl px-5 py-12">
        <p className="eyebrow text-sokol-red">{eyebrow}</p>
        <h2 className="section-title">{title}</h2>
        <div className="mt-7">{children}</div>
      </div>
    </section>
  );
}

function PageShell({ title, children }: { title: string; crumb?: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-8 md:py-10">
      <div className="page-heading">
        <p>TJ Sokol Doudleby nad Orlicí</p>
        <h1>{title}</h1>
      </div>
      <div className="mt-8 md:mt-10">{children}</div>
    </section>
  );
}

type InfoRowProps = {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
};

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  const href = label === "E-mail" ? `mailto:${value}` : label === "Telefon" ? `tel:${value.replace(/\s/g, "")}` : null;

  return (
    <div className="info-row">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-sokol-red" aria-hidden={true} />
      <div>
        <dt>{label}</dt>
        <dd>{href ? <a href={href}>{value}</a> : value}</dd>
      </div>
    </div>
  );
}
