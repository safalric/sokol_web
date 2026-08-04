import { ArrowLeft, CalendarDays, SearchX } from "lucide-react";

export function NotFoundPage({ onNavigate }: { onNavigate: (href: string) => void }) {
  return (
    <section className="not-found" aria-labelledby="not-found-title">
      <div className="not-found-inner">
        <div className="not-found-mark" aria-hidden="true">
          <SearchX />
          <span>404</span>
        </div>
        <div className="not-found-copy">
          <p className="eyebrow">Cesta nevede dál</p>
          <h1 id="not-found-title">Stránka nenalezena</h1>
          <p>
            Odkaz je neplatný nebo se stránka přesunula. Vraťte se na úvod, případně pokračujte k aktuálnímu programu jednoty.
          </p>
          <div className="not-found-actions">
            <button className="btn-primary" type="button" onClick={() => onNavigate("/")}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Zpět na úvod
            </button>
            <button className="btn-outline" type="button" onClick={() => onNavigate("/kalendar")}>
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Aktuální program
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
