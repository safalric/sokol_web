import { ArrowRight, FileDown, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { SiteEvent } from "../data/siteContent";

type PosterLightboxProps = {
  event: SiteEvent;
  onClose: () => void;
  onNavigate: (href: string) => void;
};

export function PosterLightbox({ event, onClose, onNavigate }: PosterLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  const openEventPage = () => {
    onClose();
    onNavigate("/akce");
  };

  return (
    <dialog
      ref={dialogRef}
      className="poster-lightbox"
      aria-labelledby="poster-lightbox-title"
      onCancel={(eventObject) => {
        eventObject.preventDefault();
        onClose();
      }}
      onClick={(eventObject) => {
        if (eventObject.currentTarget === eventObject.target) onClose();
      }}
    >
      <div className="poster-lightbox-panel">
        <button className="poster-lightbox-close" type="button" aria-label="Zavřít náhled plakátu" onClick={onClose}>
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="poster-lightbox-image-wrap">
          <img
            src={event.posterPreviewUrl}
            alt={`Plakát k akci ${event.title}`}
            width={926}
            height={1310}
            decoding="async"
          />
        </div>
        <div className="poster-lightbox-content">
          <span className="category-label category-event">{event.category}</span>
          <h2 id="poster-lightbox-title">{event.title}</h2>
          <p>{event.date} · {event.place}</p>
          <div className="poster-lightbox-actions">
            <a className="btn-outline inline-flex items-center justify-center gap-2" href={event.posterUrl} download>
              <FileDown className="h-4 w-4" aria-hidden="true" />
              Stáhnout v PDF
            </a>
            <button className="btn-primary inline-flex items-center justify-center gap-2" type="button" onClick={openEventPage}>
              {event.registration ? "Přihlásit se na akci" : "Zobrazit detail akce"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
