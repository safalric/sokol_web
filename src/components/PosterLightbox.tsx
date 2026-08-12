import { FileDown, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { SitePoster } from "../data/posters";

type PosterLightboxProps = {
  poster: SitePoster;
  onClose: () => void;
};

export function PosterLightbox({ poster, onClose }: PosterLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog?.open) dialog.close();
      window.requestAnimationFrame(() => openerRef.current?.focus());
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="poster-lightbox"
      role="dialog"
      aria-modal="true"
      aria-labelledby="poster-lightbox-title"
      onCancel={(eventObject) => {
        eventObject.preventDefault();
        onClose();
      }}
      onClick={(eventObject) => {
        if (eventObject.currentTarget === eventObject.target) onClose();
      }}
      onKeyDown={(eventObject) => {
        if (eventObject.key === "Escape") {
          eventObject.preventDefault();
          onClose();
        }
      }}
    >
      <div className="poster-lightbox-panel">
        <button className="poster-lightbox-close" type="button" aria-label="Zavřít náhled plakátu" onClick={onClose}>
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="poster-lightbox-image-wrap">
          <img
            src={poster.previewUrl}
            alt={`Plakát ${poster.title}`}
            width={poster.width}
            height={poster.height}
            decoding="async"
          />
        </div>
        <div className="poster-lightbox-content">
          <span className="category-label category-event">{poster.category}</span>
          <h2 id="poster-lightbox-title">{poster.title}</h2>
          <p>{poster.date} · {poster.place}</p>
          <div className="poster-lightbox-actions">
            <a className="btn-outline inline-flex items-center justify-center gap-2" href={poster.downloadUrl} download>
              <FileDown className="h-4 w-4" aria-hidden="true" />
              {poster.downloadLabel}
            </a>
          </div>
        </div>
      </div>
    </dialog>
  );
}
