import type { ReactNode } from "react";
import { useReveal } from "../hooks/useReveal";

type RevealProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

/** Scroll-reveal wrapper for landing sections. */
export function Reveal({ children, className = "", id }: RevealProps) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <div ref={ref} id={id} className={`reveal ${className}`.trim()} role="region">
      {children}
    </div>
  );
}
