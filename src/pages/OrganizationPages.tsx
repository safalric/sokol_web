import { Camera, ExternalLink } from "lucide-react";
import { InfoRow, PageShell } from "../components/PagePrimitives";
import {
  coachContacts,
  contactDetails,
  gallery,
  historyStories,
  historyTimeline,
  leadership,
  memberApplicationUrl,
} from "../data/siteContent";

export function AboutPage({ onNavigate }: { onNavigate: (href: string) => void }) {
  return (
    <PageShell title="O nás">
      <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        <article className="content-card">
          <p className="lead">
            TJ Sokol Doudleby nad Orlicí je místní tělocvičná jednota navazující na sokolskou tradici pohybu, dobrovolnictví a práce s dětmi.
          </p>
          <p>
            Jednota propojuje pravidelné cvičení, sportovní oddíly, společné výlety a akce pro místní komunitu. Její činnost stojí na práci dobrovolníků a cvičitelů.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="btn-primary" type="button" onClick={() => onNavigate("/historie")}>Historie jednoty</button>
            <button className="btn-outline" type="button" onClick={() => onNavigate("/kontakt")}>Kontakty</button>
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

export function MemberApplicationPage() {
  return (
    <PageShell title="Přihláška do Sokola">
      <div className="application-layout">
        <article className="content-card text-center">
          <h2>Oficiální členská přihláška</h2>
          <p>
            Přihlášení nového člena probíhá přes systém eČlen České obce sokolské. Tlačítko otevře oficiální formulář v nové kartě.
          </p>
          <a className="btn-primary mt-6 inline-flex items-center gap-2" href={memberApplicationUrl} target="_blank" rel="noopener noreferrer">
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

export function GalleryPage() {
  return (
    <PageShell title="Fotogalerie">
      <div className="demo-callout">
        <Camera className="h-5 w-5" aria-hidden="true" />
        <span>Galerie zatím používá označené ukázkové obálky. Skutečné fotografie budou doplněny po výběru a schválení jednotou.</span>
      </div>
      <div className="gallery-grid">
        {gallery.map((item, index) => (
          <article key={item.title} className={`gallery-card gallery-${item.tone}`}>
            <span className="gallery-watermark" aria-hidden="true" />
            <div className="gallery-number">{String(index + 1).padStart(2, "0")}</div>
            <div>
              <span className="gallery-demo-label">Demo album</span>
              <h2>{item.title}</h2>
              <p>{item.meta}</p>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}

export function HistoryPage() {
  return (
    <PageShell title="Historie">
      <p className="page-intro">
        Historie doudlebského Sokola sahá ke konci 19. století. Z kronik a dochovaných zápisů vystupuje obraz jednoty, která spojovala cvičení, občanský život a péči o společné místo.
      </p>
      <div className="timeline">
        {historyTimeline.map((item) => (
          <article key={item.year} className="timeline-item">
            <div className="timeline-year">{item.year}</div>
            <div><h2>{item.title}</h2><p>{item.text}</p></div>
          </article>
        ))}
      </div>
      <div className="history-story-grid">
        {historyStories.map((story) => (
          <article key={story.title} className="history-story">
            <h2>{story.title}</h2>
            {story.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </article>
        ))}
      </div>
    </PageShell>
  );
}

export function ContactPage({ onNavigate }: { onNavigate: (href: string) => void }) {
  const mapUrl =
    "https://www.google.com/maps/search/?api=1&query=%C5%A0vermova%20528%2C%20517%2042%20Doudleby%20nad%20Orlic%C3%AD";
  const mapPreviewUrl =
    "https://www.openstreetmap.org/export/embed.html?bbox=16.25037%2C50.10361%2C16.26237%2C50.11061&layer=mapnik&marker=50.10711%2C16.25637";

  return (
    <PageShell title="Kontakt">
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <article className="content-card">
          <h2>Kontaktní údaje</h2>
          <dl className="mt-5 grid gap-4">
            {contactDetails.map((item) => <InfoRow key={item.label} icon={item.icon} label={item.label} value={item.value} />)}
          </dl>
          <button className="btn-outline mt-6" type="button" onClick={() => onNavigate("/gdpr")}>Ochrana osobních údajů</button>
        </article>
        <figure className="map-preview">
          <iframe
            src={mapPreviewUrl}
            title="Mapa sídla TJ Sokol Doudleby nad Orlicí"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <figcaption className="map-preview-caption">
            <div>
              <strong>Sídlo jednoty</strong>
              <span>Švermova 528, 517 42 Doudleby nad Orlicí</span>
              <small>
                Mapová data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>
              </small>
            </div>
            <a className="btn-outline inline-flex items-center justify-center gap-2" href={mapUrl} target="_blank" rel="noopener noreferrer">
              Otevřít v mapě
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </figcaption>
        </figure>
      </div>
      <section className="contact-leadership" aria-labelledby="contact-leadership-heading">
        <p className="eyebrow text-sokol-red">Kontaktní osoby</p>
        <h2 id="contact-leadership-heading" className="section-title">Vedení jednoty</h2>
        <div className="contact-leadership-grid">
          {leadership.map((person) => (
            <article key={`contact-${person.role}-${person.name}`} className="person-row">
              <strong>{person.role}</strong>
              <span>{person.name}</span>
              <a href={`tel:${person.phone.replace(/\s/g, "")}`}>{person.phone}</a>
              {person.email ? <a href={`mailto:${person.email}`}>{person.email}</a> : null}
            </article>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
