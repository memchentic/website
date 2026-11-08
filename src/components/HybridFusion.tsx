import { useEffect, useRef, useState } from "react";
import { FUSION_LEGS } from "../data/showcase";

/**
 * Three retrieval legs → reciprocal rank fusion. Auto-fuses when scrolled into
 * view; visitor can replay.
 */
export function HybridFusion() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [fused, setFused] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setFused(true);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      className={fused ? "hybrid-fusion is-fused" : "hybrid-fusion"}
    >
      <div className="hybrid-fusion-chrome">
        <span className="hybrid-fusion-k">hybrid path</span>
        <button
          type="button"
          className="hybrid-fusion-replay"
          onClick={() => {
            setFused(false);
            window.setTimeout(() => setFused(true), 80);
          }}
        >
          Replay fuse
        </button>
      </div>

      <div className="hybrid-fusion-legs">
        {(
          [
            ["sql", "Relational", FUSION_LEGS.sql],
            ["fts", "Full-text", FUSION_LEGS.fts],
            ["vec", "Vector", FUSION_LEGS.vec],
          ] as const
        ).map(([key, title, rows]) => (
          <div key={key} className={`hybrid-leg hybrid-leg-${key}`}>
            <p className="hybrid-leg-k">{key}</p>
            <h3 className="hybrid-leg-title">{title}</h3>
            <ol className="hybrid-leg-list">
              {rows.map((row) => (
                <li key={`${key}-${row.rank}`}>
                  <span className="hybrid-leg-rank">{row.rank}</span>
                  <code className={`type-rail-tag kind-chip-${row.kind}`}>
                    {row.kind}
                  </code>
                  <span className="hybrid-leg-title-text">{row.title}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="hybrid-fusion-arrow" aria-hidden="true">
        <span>rrf</span>
      </div>

      <div className="hybrid-fusion-out">
        <p className="hybrid-leg-k">fused digests</p>
        <h3 className="hybrid-leg-title">Reciprocal rank fusion</h3>
        <ol className="hybrid-rrf-list">
          {FUSION_LEGS.rrf.map((row, i) => (
            <li
              key={row.title}
              className="hybrid-rrf-row"
              style={{ animationDelay: fused ? `${0.12 + i * 0.12}s` : "0s" }}
            >
              <span className="hybrid-leg-rank">{row.rank}</span>
              <code className={`type-rail-tag kind-chip-${row.kind}`}>
                {row.kind}
              </code>
              <div className="hybrid-rrf-copy">
                <strong>{row.title}</strong>
                <span>via {row.via}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
