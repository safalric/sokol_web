import { Expand } from "lucide-react";
import { useState } from "react";
import type { SitePoster } from "../data/posters";
import { PosterAction } from "./PagePrimitives";
import { PosterLightbox } from "./PosterLightbox";

type PosterGalleryProps = {
  posters: SitePoster[];
  compact?: boolean;
};

export function PosterGallery({ posters, compact = false }: PosterGalleryProps) {
  const [activePoster, setActivePoster] = useState<SitePoster | null>(null);

  return (
    <>
      <div className={`poster-grid${compact ? " poster-grid-compact" : ""}`}>
        {posters.map((poster) => (
          <article key={poster.id} className="poster-card">
            <button
              className="poster-preview-button"
              type="button"
              aria-label={`Zvětšit plakát ${poster.title}`}
              onClick={() => setActivePoster(poster)}
            >
              <img
                src={poster.previewUrl}
                alt={`Plakát ${poster.title}`}
                width={poster.width}
                height={poster.height}
                loading="lazy"
                decoding="async"
              />
              <span className="poster-preview-overlay">
                <Expand className="h-5 w-5" aria-hidden="true" />
                Zvětšit plakát
              </span>
            </button>
            <div className="poster-content">
              <span className="demo-badge">{poster.status}</span>
              <h3>{poster.title}</h3>
              <p>{poster.description}</p>
              <div className="poster-actions">
                <PosterAction href={poster.downloadUrl} label={poster.downloadLabel} />
              </div>
            </div>
          </article>
        ))}
      </div>
      {activePoster ? <PosterLightbox poster={activePoster} onClose={() => setActivePoster(null)} /> : null}
    </>
  );
}
