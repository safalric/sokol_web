import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { GalleryPhoto } from "../data/gallery";

type GalleryLightboxProps = {
  photo: GalleryPhoto;
  albumTitle: string;
  position: number;
  total: number;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

export function GalleryLightbox({
  photo,
  albumTitle,
  position,
  total,
  onClose,
  onPrevious,
  onNext,
}: GalleryLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (dialog && !dialog.open) dialog.showModal();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog?.open) dialog.close();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="gallery-lightbox"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-lightbox-title"
      aria-describedby="gallery-lightbox-meta"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
          return;
        }
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          onPrevious();
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          onNext();
        }
      }}
    >
      <div
        className="gallery-lightbox-panel"
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const start = touchStartX.current;
          const end = event.changedTouches[0]?.clientX;
          touchStartX.current = null;
          if (start === null || end === undefined || Math.abs(start - end) < 55) return;
          if (start > end) onNext();
          else onPrevious();
        }}
      >
        <button className="gallery-lightbox-close" type="button" aria-label="Zavřít fotogalerii" onClick={onClose}>
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="gallery-lightbox-media">
          <img
            key={photo.id}
            src={photo.largeSrc}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            decoding="async"
          />

          {total > 1 ? (
            <>
              <button className="gallery-lightbox-nav gallery-lightbox-previous" type="button" aria-label="Předchozí fotografie" onClick={onPrevious}>
                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
              </button>
              <button className="gallery-lightbox-nav gallery-lightbox-next" type="button" aria-label="Další fotografie" onClick={onNext}>
                <ChevronRight className="h-6 w-6" aria-hidden="true" />
              </button>
            </>
          ) : null}
        </div>

        <div className="gallery-lightbox-caption">
          <div>
            <p id="gallery-lightbox-meta">{albumTitle} · {photo.year}</p>
            <h2 id="gallery-lightbox-title">{photo.title}</h2>
          </div>
          <span aria-label={`Fotografie ${position} z ${total}`}>{position} / {total}</span>
        </div>
      </div>
    </dialog>
  );
}
