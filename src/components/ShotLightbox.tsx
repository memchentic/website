import { useEffect, useId, useState, type ReactNode } from "react";

type ShotLightboxProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

/**
 * Product screenshot that opens a large modal on click / Enter / Space.
 */
export function ShotLightbox({
  src,
  alt,
  width,
  height,
  className = "",
}: ShotLightboxProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

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
      {open ? (
        <div
          className="shot-lightbox-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={() => setOpen(false)}
        >
          <div
            className="shot-lightbox-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shot-lightbox-bar">
              <p id={titleId} className="shot-lightbox-title">
                {alt}
              </p>
              <button
                type="button"
                className="shot-lightbox-close"
                onClick={() => setOpen(false)}
                aria-label="Close enlarged screenshot"
              >
                Close
              </button>
            </div>
            <img
              src={src}
              alt=""
              className="shot-lightbox-full"
              width={width}
              height={height}
              decoding="async"
            />
          </div>
        </div>
      ) : null}
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
