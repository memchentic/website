import { useEffect, useId, useRef } from "react";

export type LightboxImage = {
  src: string;
  alt: string;
  caption?: string;
};

type ImageLightboxProps = {
  image: LightboxImage | null;
  onClose: () => void;
};

/** Full-viewport image zoom; Esc / backdrop / close button dismiss. */
export function ImageLightbox({ image, onClose }: ImageLightboxProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!image) {
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [image, onClose]);

  if (!image) {
    return null;
  }

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        className="lightbox-close"
        aria-label="Close image"
        onClick={onClose}
      >
        ×
      </button>
      <figure
        className="lightbox-figure"
        onClick={(event) => event.stopPropagation()}
      >
        <img src={image.src} alt={image.alt} />
        {image.caption ? (
          <figcaption id={titleId} className="lightbox-caption">
            {image.caption}
          </figcaption>
        ) : (
          <span id={titleId} className="sr-only">
            {image.alt}
          </span>
        )}
      </figure>
    </div>
  );
}
