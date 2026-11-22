import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type ShotLightboxProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

const SECTION_OPEN_CLASS = "band--lightbox-open";

/**
 * Product screenshot that opens a large modal on click / Enter / Space.
 * The overlay is portaled into the nearest `.reveal` / `.band` section.
 */
export function ShotLightbox({
  src,
  alt,
  width,
  height,
  className = "",
}: ShotLightboxProps) {
  const [open, setOpen] = useState(false);
  const [sectionEl, setSectionEl] = useState<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }
    const section =
      trigger.closest<HTMLElement>(".reveal") ??
      trigger.closest<HTMLElement>(".band");
    setSectionEl(section);
  }, []);

  useEffect(() => {
    if (!open || !sectionEl) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    sectionEl.classList.add(SECTION_OPEN_CLASS);
    window.addEventListener("keydown", onKey);
    return () => {
      sectionEl.classList.remove(SECTION_OPEN_CLASS);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, sectionEl]);

  const backdrop =
    open && sectionEl
      ? createPortal(
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
          </div>,
          sectionEl,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
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
