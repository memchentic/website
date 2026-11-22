import { useEffect, useMemo, useRef, useState } from "react";
import { FUSION_SCENARIOS } from "../data/showcase";

type Phase = "idle" | "select" | "refuse" | "rerank" | "done";

const PHASE_COPY: Record<Phase, string> = {
  idle: "Waiting…",
  select: "Selecting candidates…",
  refuse: "Near-dup refuse…",
  rerank: "RRF rerank…",
  done: "Fused digests",
};

/**
 * Three retrieval legs → refuse near-dups → reciprocal rank fusion.
 * First scroll starts scenario 0; each replay advances to a new scenario.
 */
export function HybridFusion() {
  const rootRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const started = useRef(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [runId, setRunId] = useState(0);
  const [scenarioIndex, setScenarioIndex] = useState(0);

  const scenario = FUSION_SCENARIOS[scenarioIndex] ?? FUSION_SCENARIOS[0]!;
  const rrfTitles = useMemo(
    () => new Set(scenario.rrf.map((row) => row.title)),
    [scenario],
  );

  const clearTimers = () => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  };

  const playSequence = () => {
    clearTimers();
    setPhase("idle");
    setRunId((n) => n + 1);
    timers.current.push(
      window.setTimeout(() => setPhase("select"), 60),
      window.setTimeout(() => setPhase("refuse"), 1100),
      window.setTimeout(() => setPhase("rerank"), 2000),
      window.setTimeout(() => setPhase("done"), 3200),
    );
  };

  const pendingReplay = useRef(false);

  const onReplayClick = () => {
    pendingReplay.current = true;
    setScenarioIndex((i) => (i + 1) % FUSION_SCENARIOS.length);
  };

  useEffect(() => {
    if (!pendingReplay.current) return;
    pendingReplay.current = false;
    playSequence();
  }, [scenarioIndex]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || started.current) return;
        started.current = true;
        playSequence();
      },
      { threshold: 0.28 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimers();
    };
  }, []);

  const fused = phase === "rerank" || phase === "done";
  const selecting = phase === "select" || phase === "refuse" || fused;
  const refusing = phase === "refuse" || fused;

  const legItemClass = (title: string, rank: number) => {
    const classes = ["hybrid-hit"];
    if (selecting) classes.push("is-selected");
    if (refusing && !rrfTitles.has(title)) classes.push("is-refused");
    if (fused && rrfTitles.has(title)) classes.push("is-kept");
    classes.push(`hybrid-hit-delay-${rank}`);
    return classes.join(" ");
  };

  return (
    <div
      ref={rootRef}
      className={`hybrid-fusion phase-${phase}${fused ? " is-fused" : ""}`}
      data-run={runId}
      data-scenario={scenarioIndex}
    >
      <div className="hybrid-fusion-chrome">
        <div className="hybrid-fusion-chrome-start">
          <span className="hybrid-fusion-k">hybrid path</span>
          <span className="hybrid-fusion-status" aria-live="polite">
            {phase === "idle" && runId === 0
              ? "Scroll to run…"
              : PHASE_COPY[phase]}
          </span>
          <span className="hybrid-fusion-query" title={scenario.query}>
            q: {scenario.query}
          </span>
        </div>
        <button
          type="button"
          className="hybrid-fusion-replay"
          aria-label="Replay fuse with new example"
          title="Replay with new example"
          onClick={onReplayClick}
        >
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <path
              d="M8 2.5a5.5 5.5 0 1 0 5.1 3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M13.5 2v4h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="hybrid-fusion-legs">
        {(
          [
            ["sql", "Relational", scenario.sql],
            ["fts", "Full-text", scenario.fts],
            ["vec", "Vector", scenario.vec],
          ] as const
        ).map(([key, title, rows]) => (
          <div key={`${key}-${runId}`} className={`hybrid-leg hybrid-leg-${key}`}>
            <p className="hybrid-leg-k">{key}</p>
            <h3 className="hybrid-leg-title">{title}</h3>
            <ol className="hybrid-leg-list">
              {rows.map((row) => (
                <li
                  key={`${key}-${row.rank}-${runId}`}
                  className={legItemClass(row.title, row.rank)}
                >
                  <span className="hybrid-leg-rank">{row.rank}</span>
                  <div className="hybrid-leg-item">
                    <div className="hybrid-leg-item-top">
                      <code className={`type-rail-tag kind-chip-${row.kind}`}>
                        {row.kind}
                      </code>
                      {refusing && !rrfTitles.has(row.title) ? (
                        <span className="hybrid-hit-badge is-refuse">refuse</span>
                      ) : null}
                      {fused && rrfTitles.has(row.title) ? (
                        <span className="hybrid-hit-badge is-keep">keep</span>
                      ) : null}
                    </div>
                    <span className="hybrid-leg-title-text">{row.title}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div
        className={
          fused ? "hybrid-fusion-arrow is-active" : "hybrid-fusion-arrow"
        }
        aria-hidden="true"
      >
        <span>rrf</span>
      </div>

      <div
        className={fused ? "hybrid-fusion-out is-active" : "hybrid-fusion-out"}
      >
        <p className="hybrid-leg-k">fused digests</p>
        <h3 className="hybrid-leg-title">Reciprocal rank fusion</h3>
        <ol className="hybrid-rrf-list">
          {scenario.rrf.map((row, i) => (
            <li
              key={`${row.title}-${runId}`}
              className="hybrid-rrf-row"
              style={{
                animationDelay: fused ? `${0.08 + i * 0.14}s` : "0s",
              }}
            >
              <span className="hybrid-leg-rank">{row.rank}</span>
              <div className="hybrid-leg-item">
                <div className="hybrid-leg-item-top">
                  <code className={`type-rail-tag kind-chip-${row.kind}`}>
                    {row.kind}
                  </code>
                  <span className="hybrid-hit-badge is-rank">
                    rank {row.rank}
                  </span>
                </div>
                <div className="hybrid-rrf-copy">
                  <strong>{row.title}</strong>
                  <span>via {row.via}</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
