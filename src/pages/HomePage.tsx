import { AlertTriangle, ArrowRight, Expand, Info, Megaphone } from "lucide-react";
import { useState } from "react";
import { PosterLightbox } from "../components/PosterLightbox";
import { PosterAction, Section } from "../components/PagePrimitives";
import { events, notices, quickLinks, type SiteEvent } from "../data/siteContent";

export function HomePage({ onNavigate }: { onNavigate: (href: string) => void }) {
  const [activePoster, setActivePoster] = useState<SiteEvent | null>(null);

  return (
    <>
      <section className="hero-clean">
        <div className="hero-inner">
          <div>
            <p className="eyebrow">Tělocvičná jednota</p>
            <h1>TJ Sokol Doudleby nad Orlicí</h1>
            <p className="hero-lead">
              Pohyb pro děti i dospělé, společné akce a živá tradice v Doudlebách nad Orlicí. Najděte svůj oddíl nebo se podívejte, co společně chystáme.
            </p>
            <div className="hero-actions">
              <button className="btn-primary" type="button" onClick={() => onNavigate("/cviceni")}>Chci cvičit</button>
              <button className="btn-outline-light" type="button" onClick={() => onNavigate("/kalendar")}>Aktuální program</button>
            </div>
          </div>
          <div className="hero-panel">
            <p className="panel-kicker">Sokolský ideál</p>
            <blockquote>„Buďte věrni sobě, pravdě a spravedlnosti.“</blockquote>
            <p>Všestranný rozvoj člověka, pohyb, odpovědnost a služba místní komunitě.</p>
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
        <div className="demo-callout">
          <Info className="h-5 w-5" aria-hidden="true" />
          <span>Aktuality níže jsou ukázkové a čekají na nahrazení ověřenými zprávami jednoty.</span>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {notices.map((notice) => (
            <article key={notice.title} className={`simple-card notice-card notice-${notice.type}`}>
              <div className="notice-label">
                {notice.type === "alert" ? <AlertTriangle className="h-4 w-4" aria-hidden="true" /> : null}
                {notice.type === "event" ? <Megaphone className="h-4 w-4" aria-hidden="true" /> : null}
                {notice.type === "info" ? <Info className="h-4 w-4" aria-hidden="true" /> : null}
                {notice.label}
              </div>
              <p className="card-date">{notice.date}</p>
              <h3>{notice.title}</h3>
              <p>{notice.text}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section eyebrow="Plakátovací plocha" title="Pozvánky a významné akce" tone="white">
        <div className="poster-grid">
          {events.map((event) => (
            <article key={event.title} className="poster-card">
              <button
                className="poster-preview-button"
                type="button"
                aria-label={`Zvětšit plakát k akci ${event.title}`}
                onClick={() => setActivePoster(event)}
              >
                <img
                  src={event.posterPreviewUrl}
                  alt={`Náhled plakátu k akci ${event.title}`}
                  width={926}
                  height={1310}
                  loading="lazy"
                  decoding="async"
                />
                <span className="poster-preview-overlay">
                  <Expand className="h-5 w-5" aria-hidden="true" />
                  Zvětšit plakát
                </span>
              </button>
              <div className="poster-content">
                <span className="demo-badge">{event.status}</span>
                <h3>{event.title}</h3>
                <p>{event.description}</p>
                <div className="poster-actions">
                  <button className="text-link" type="button" onClick={() => onNavigate("/akce")}>Zobrazit detail</button>
                  <PosterAction href={event.posterUrl} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>
      {activePoster ? (
        <PosterLightbox event={activePoster} onClose={() => setActivePoster(null)} onNavigate={onNavigate} />
      ) : null}
    </>
  );
}
