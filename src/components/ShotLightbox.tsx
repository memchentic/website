import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ShotLightboxProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

/**
 * Product screenshot that opens a viewport-centered lightbox on click.
 */
export function ShotLightbox({
  src,
  alt,
  width,
  height,
  className = "",
}: ShotLightboxProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const backdrop =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            className="shot-lightbox-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label={alt}
            onClick={() => setOpen(false)}
          >
            <div
              className="shot-lightbox-panel"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="shot-lightbox-close"
                onClick={() => setOpen(false)}
                aria-label="Close enlarged screenshot"
              >
                ×
              </button>
              <img
                src={src}
                alt=""
                className="shot-lightbox-full"
                width={width}
                height={height}
                decoding="async"
              />
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        className={`shot-lightbox-trigger ${className}`.trim()}
        onClick={() => setOpen(true)}
        aria-label={`Enlarge screenshot: ${alt}`}
      >
        <img
          src={src}
          alt={alt}
          className="shot-lightbox-thumb"
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
        />
        <span className="shot-lightbox-hint" aria-hidden="true">
          Click to enlarge
        </span>
      </button>
      {backdrop}
    </>
  );
}

export function ShotFigure({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <figure className={`shot-frame m-0 ${className}`.trim()}>{children}</figure>
  );
}
