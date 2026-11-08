import { useEffect, useRef } from "react";

/** True when any part of the box is in (or near) the viewport. */
function inOrNearView(node: HTMLElement): boolean {
  const rect = node.getBoundingClientRect();
  const vh = window.innerHeight || 0;
  // Match the IO rootMargin below so hash/restore scrolls do not leave a blank band.
  return rect.top < vh * 1.2 && rect.bottom > 0;
}

/**
 * Adds `.is-visible` when the element enters the viewport.
 *
 * Pre-reveals sections still below the fold so a short band (e.g. Access)
 * does not leave an empty opacity-0 void filling the rest of the screen.
 */
export function useReveal<T extends HTMLElement = HTMLElement>(
  threshold = 0.05,
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const reveal = () => {
      node.classList.add("is-visible");
    };

    if (inOrNearView(node)) {
      reveal();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          reveal();
          observer.unobserve(node);
        }
      },
      // Expand the root downward so the next section reveals before it
      // becomes the empty lower half of the viewport.
      { threshold, rootMargin: "0px 0px 25% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return ref;
}
