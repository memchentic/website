import { useState, type CSSProperties } from "react";
import {
  KIND_DIGESTS,
  MEMORY_KINDS,
  type MemoryKind,
} from "../data/showcase";

/**
 * Interactive memory-kind deck — hover or focus a kind to preview its digest;
 * click to pin it to the tray.
 */
export function KindConstellation() {
  const [active, setActive] = useState<MemoryKind>("insight");
  const meta = MEMORY_KINDS.find((k) => k.tag === active)!;
  const digest = KIND_DIGESTS[active];

  return (
    <div className="kind-constellation">
      <ul className="kind-orbit" role="list">
        {MEMORY_KINDS.map((k, i) => (
          <li key={k.tag} style={{ "--i": i } as CSSProperties}>
            <button
              type="button"
              className={
                active === k.tag
                  ? `kind-orbit-chip kind-chip-${k.tag} is-active`
                  : `kind-orbit-chip kind-chip-${k.tag}`
              }
              onMouseEnter={() => setActive(k.tag)}
              onFocus={() => setActive(k.tag)}
              onClick={() => {
                setActive(k.tag);
              }}
              aria-pressed={active === k.tag}
            >
              {k.tag}
            </button>
          </li>
        ))}
      </ul>

      <article className="kind-digest" aria-live="polite">
        <code className={`type-rail-tag kind-chip-${meta.tag}`}>{meta.tag}</code>
        <h3 className="kind-digest-name">{meta.name}</h3>
        <p className="kind-digest-blurb">{meta.blurb}</p>
        <div className="kind-digest-card">
          <p className="kind-digest-k">digest</p>
          <p className="kind-digest-title">{digest.title}</p>
          <p className="kind-digest-body">{digest.body}</p>
        </div>
      </article>
    </div>
  );
}
