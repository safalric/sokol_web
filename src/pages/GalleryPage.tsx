import { Camera, Maximize2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { GalleryLightbox } from "../components/GalleryLightbox";
import { PageShell } from "../components/PagePrimitives";
import { galleryAlbums, galleryPhotos, getGalleryAlbum } from "../data/gallery";

export function GalleryPage() {
  const [activeAlbum, setActiveAlbum] = useState("all");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);

  const visiblePhotos = useMemo(
    () => activeAlbum === "all" ? galleryPhotos : galleryPhotos.filter((photo) => photo.albumId === activeAlbum),
    [activeAlbum],
  );

  const closeLightbox = () => {
    setActiveIndex(null);
    window.requestAnimationFrame(() => openerRef.current?.focus());
  };

  const moveLightbox = (step: number) => {
    setActiveIndex((current) => {
      if (current === null || visiblePhotos.length === 0) return null;
      return (current + step + visiblePhotos.length) % visiblePhotos.length;
    });
  };

  const activePhoto = activeIndex === null ? null : visiblePhotos[activeIndex];
  const activeFilterId = `gallery-tab-${activeAlbum}`;

  return (
    <PageShell title="Fotogalerie">
      <div className="gallery-intro">
        <Camera className="h-5 w-5" aria-hidden="true" />
        <div>
          <strong>Archiv TJ Sokol Doudleby nad Orlicí</strong>
          <span>Vyberte album a fotografii otevřete v plné velikosti. Podněty ke zveřejnění přijímáme na kontaktním e-mailu jednoty.</span>
        </div>
      </div>

      <div className="gallery-toolbar">
        <div
          className="gallery-tabs"
          role="tablist"
          aria-label="Filtrovat fotografie podle alba"
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

            const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
            const currentIndex = tabs.indexOf(event.target as HTMLButtonElement);
            if (currentIndex === -1) return;

            event.preventDefault();
            const nextIndex = event.key === "Home"
              ? 0
              : event.key === "End"
                ? tabs.length - 1
                : (currentIndex + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
            tabs[nextIndex]?.focus();
            tabs[nextIndex]?.click();
          }}
        >
          <button
            id="gallery-tab-all"
            className={activeAlbum === "all" ? "gallery-tab gallery-tab-active" : "gallery-tab"}
            type="button"
            role="tab"
            aria-selected={activeAlbum === "all"}
            aria-controls="gallery-panel"
            tabIndex={activeAlbum === "all" ? 0 : -1}
            onClick={() => {
              setActiveAlbum("all");
              setActiveIndex(null);
            }}
          >
            Vše <span>{galleryPhotos.length}</span>
          </button>
          {galleryAlbums.map((album) => {
            const count = galleryPhotos.filter((photo) => photo.albumId === album.id).length;
            return (
              <button
                key={album.id}
                id={`gallery-tab-${album.id}`}
                className={activeAlbum === album.id ? "gallery-tab gallery-tab-active" : "gallery-tab"}
                type="button"
                role="tab"
                aria-selected={activeAlbum === album.id}
                aria-controls="gallery-panel"
                tabIndex={activeAlbum === album.id ? 0 : -1}
                onClick={() => {
                  setActiveAlbum(album.id);
                  setActiveIndex(null);
                }}
              >
                {album.title} <span>{count}</span>
              </button>
            );
          })}
        </div>
        <p className="gallery-result-count" aria-live="polite">
          {visiblePhotos.length} {visiblePhotos.length < 5 ? "fotografie" : "fotografií"}
        </p>
      </div>

      <div
        id="gallery-panel"
        className="gallery-photo-grid"
        role="tabpanel"
        aria-labelledby={activeFilterId}
      >
        {visiblePhotos.map((photo, index) => {
          const album = getGalleryAlbum(photo.albumId);
          return (
            <figure key={photo.id} className="gallery-photo-card">
              <button
                className="gallery-photo-button group"
                type="button"
                aria-label={`Otevřít fotografii: ${photo.title}`}
                onClick={(event) => {
                  openerRef.current = event.currentTarget;
                  setActiveIndex(index);
                }}
              >
                <img
                  src={photo.thumbSrc}
                  alt={photo.alt}
                  width={photo.thumbWidth}
                  height={photo.thumbHeight}
                  loading="lazy"
                  decoding="async"
                />
                <span className="gallery-photo-open" aria-hidden="true">
                  <Maximize2 className="h-4 w-4" />
                  Zvětšit
                </span>
              </button>
              <figcaption>
                <div>
                  <span>{album?.title ?? "Fotogalerie"}</span>
                  <h2>{photo.title}</h2>
                </div>
                <time>{photo.year}</time>
              </figcaption>
            </figure>
          );
        })}
      </div>

      {activePhoto ? (
        <GalleryLightbox
          photo={activePhoto}
          albumTitle={getGalleryAlbum(activePhoto.albumId)?.title ?? "Fotogalerie"}
          position={(activeIndex ?? 0) + 1}
          total={visiblePhotos.length}
          onClose={closeLightbox}
          onPrevious={() => moveLightbox(-1)}
          onNext={() => moveLightbox(1)}
        />
      ) : null}
    </PageShell>
  );
}
