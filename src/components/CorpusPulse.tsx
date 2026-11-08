import { useEffect, useMemo, useRef, useState } from "react";
import { MEMORY_KINDS, type MemoryKind } from "../data/showcase";

/** Pitch-site demo numbers — mirrors a healthy seeded corpus, not live API. */
const KPIS = [
  { key: "total", label: "Memories", value: 2000, tint: "ink" as const },
  { key: "entries", label: "Entries", value: 1377, tint: "entry" as const },
  { key: "guides", label: "Guides", value: 623, tint: "guide" as const },
  { key: "expiring", label: "Expiring soon", value: 36, tint: "warn" as const },
] as const;

const TYPE_COUNTS: { kind: MemoryKind; count: number }[] = [
  { kind: "decision", count: 218 },
  { kind: "fact", count: 209 },
  { kind: "instruction", count: 198 },
  { kind: "preference", count: 197 },
  { kind: "insight", count: 192 },
  { kind: "note", count: 183 },
  { kind: "feedback", count: 180 },
];

const SERIES_DAYS = 30;

function buildSeries(): { entries: number; guides: number }[] {
  const out: { entries: number; guides: number }[] = [];
  for (let i = 0; i < SERIES_DAYS; i++) {
    const growth = 0.55 + 0.45 * (i / (SERIES_DAYS - 1));
    const wave = 1 + 0.18 * Math.sin(i * 0.7);
    const base = 18 * growth * wave;
    out.push({
      entries: Math.round(base * 0.7 + (i % 5 === 0 ? 4 : 0)),
      guides: Math.round(base * 0.3 + (i % 7 === 0 ? 2 : 0)),
    });
  }
  return out;
}

function useCountUp(target: number, active: boolean, ms = 900): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!active) {
      setN(0);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setN(target);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      const eased = 1 - (1 - p) ** 3;
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, ms]);
  return n;
}

function AreaChart({ active }: { active: boolean }) {
  const series = useMemo(() => buildSeries(), []);
  const w = 560;
  const h = 140;
  const pad = { t: 12, r: 8, b: 8, l: 8 };
  const max = Math.max(...series.map((d) => d.entries + d.guides), 1);
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  const toPoints = (vals: number[]) =>
    vals
      .map((v, i) => {
        const x = pad.l + (i / (vals.length - 1)) * innerW;
        const y = pad.t + innerH - (v / max) * innerH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  const stacked = series.map((d) => d.entries + d.guides);
  const guidesOnly = series.map((d) => d.guides);
  const area = (vals: number[]) => {
    const line = toPoints(vals);
    const lastX = pad.l + innerW;
    const baseY = pad.t + innerH;
    return `M ${pad.l},${baseY} L ${line.replace(/ /g, " L ")} L ${lastX},${baseY} Z`;
  };

  const entryColor =
    MEMORY_KINDS.find((k) => k.tag === "fact")?.color ?? "#8eb4f0";
  const guideColor =
    MEMORY_KINDS.find((k) => k.tag === "guide")?.color ?? "#6ec8d8";

  return (
    <svg
      className={active ? "corpus-pulse-chart is-on" : "corpus-pulse-chart"}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Created memories over thirty days, entries stacked with guides"
    >
      <path d={area(stacked)} fill={entryColor} fillOpacity={0.35} />
      <path d={area(guidesOnly)} fill={guideColor} fillOpacity={0.55} />
      <polyline
        points={toPoints(stacked)}
        fill="none"
        stroke={entryColor}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <polyline
        points={toPoints(guidesOnly)}
        fill="none"
        stroke={guideColor}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Kpi({
  label,
  value,
  tint,
  active,
}: {
  label: string;
  value: number;
  tint: "ink" | "entry" | "guide" | "warn";
  active: boolean;
}) {
  const n = useCountUp(value, active);
  return (
    <div className={`corpus-pulse-kpi corpus-pulse-kpi-${tint}`}>
      <div className="corpus-pulse-kpi-label">{label}</div>
      <div className="corpus-pulse-kpi-value">{n.toLocaleString()}</div>
    </div>
  );
}

/**
 * Interactive corpus snapshot — KPI count-up, type bars, stacked sparkline.
 * Demo numbers only; real aggregates live in the product Metrics page.
 */
export function CorpusPulse() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [hover, setHover] = useState<MemoryKind | null>(null);
  const maxType = Math.max(...TYPE_COUNTS.map((t) => t.count));

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setActive(true);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      className={active ? "corpus-pulse is-active" : "corpus-pulse"}
    >
      <div className="corpus-pulse-chrome">
        <span className="corpus-pulse-k">corpus metrics</span>
        <span className="corpus-pulse-legend" aria-hidden="true">
          <span className="corpus-pulse-swatch corpus-pulse-swatch-entry" />
          entries
          <span className="corpus-pulse-swatch corpus-pulse-swatch-guide" />
          guides
        </span>
      </div>

      <div className="corpus-pulse-kpis">
        {KPIS.map((k) => (
          <Kpi
            key={k.key}
            label={k.label}
            value={k.value}
            tint={k.tint}
            active={active}
          />
        ))}
      </div>

      <AreaChart active={active} />

      <ul className="corpus-pulse-types">
        {TYPE_COUNTS.map((row) => {
          const meta = MEMORY_KINDS.find((k) => k.tag === row.kind);
          const on = hover === null || hover === row.kind;
          return (
            <li key={row.kind}>
              <button
                type="button"
                className={on ? "is-on" : "is-dim"}
                onMouseEnter={() => setHover(row.kind)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(row.kind)}
                onBlur={() => setHover(null)}
              >
                <span
                  className={`type-rail-tag kind-chip-${row.kind}`}
                >
                  {row.kind}
                </span>
                <span
                  className="corpus-pulse-bar"
                  style={{
                    width: `${(row.count / maxType) * 100}%`,
                    background: meta?.color ?? "var(--color-muted)",
                  }}
                />
                <span className="corpus-pulse-count">{row.count}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
