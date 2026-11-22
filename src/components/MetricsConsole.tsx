import { useEffect, useMemo, useRef, useState } from "react";
import { MEMORY_KINDS } from "../data/showcase";

type Range = "7d" | "30d" | "90d";

const ENTRY_COLOR =
  MEMORY_KINDS.find((k) => k.tag === "fact")?.color ?? "#8eb4f0";
const GUIDE_COLOR =
  MEMORY_KINDS.find((k) => k.tag === "guide")?.color ?? "#6ec8d8";

const RANGE_KPIS: Record<
  Range,
  {
    total: number;
    entries: number;
    guides: number;
    created: number;
    expiring: number;
    spaces: number;
    accesses: number;
    unique: number;
    never: number;
  }
> = {
  "7d": {
    total: 2001,
    entries: 1381,
    guides: 620,
    created: 214,
    expiring: 36,
    spaces: 12,
    accesses: 890,
    unique: 412,
    never: 192,
  },
  "30d": {
    total: 2001,
    entries: 1381,
    guides: 620,
    created: 980,
    expiring: 36,
    spaces: 12,
    accesses: 3100,
    unique: 1204,
    never: 192,
  },
  "90d": {
    total: 2001,
    entries: 1381,
    guides: 620,
    created: 1981,
    expiring: 36,
    spaces: 12,
    accesses: 5115,
    unique: 1809,
    never: 192,
  },
};

const TAGS: { name: string; count: number; color: string }[] = [
  { name: "incident", count: 186, color: "#e09080" },
  { name: "ownership", count: 172, color: "#8eb4f0" },
  { name: "clearing", count: 161, color: "#e0c070" },
  { name: "runbook", count: 148, color: "#7dcfb0" },
  { name: "payments", count: 139, color: "#c4a0e8" },
  { name: "postgres", count: 128, color: "#6ec8d8" },
];

const ACCESS_SOURCES: { name: string; count: number; color: string }[] = [
  { name: "search", count: 2814, color: "#6ec8d8" },
  { name: "open", count: 1280, color: "#8eb4f0" },
  { name: "guide_find", count: 768, color: "#7dcfb0" },
  { name: "guide_write", count: 253, color: "#c4a0e8" },
];

const TOP_ACCESSED: { name: string; count: number }[] = [
  { name: "Patroni failover runbook", count: 94 },
  { name: "Idempotency-Key on payouts", count: 81 },
  { name: "When paging on datastore…", count: 73 },
  { name: "OIDC group map for admins", count: 66 },
  { name: "Prefer conventional commits", count: 58 },
];

const SERIES_LEN: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 48 };

function buildSeries(days: number): { entries: number; guides: number }[] {
  const out: { entries: number; guides: number }[] = [];
  for (let i = 0; i < days; i++) {
    const growth = 0.5 + 0.5 * (i / Math.max(1, days - 1));
    const wave = 1 + 0.2 * Math.sin(i * 0.55);
    const base = 14 * growth * wave;
    out.push({
      entries: Math.round(base * 0.68 + (i % 4 === 0 ? 5 : 0)),
      guides: Math.round(base * 0.32 + (i % 6 === 0 ? 3 : 0)),
    });
  }
  return out;
}

function useCountUp(target: number, active: boolean, ms = 800): number {
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

function AreaChart({
  active,
  days,
  mode = "created",
}: {
  active: boolean;
  days: number;
  mode?: "created" | "accessed";
}) {
  const series = useMemo(() => buildSeries(days), [days]);
  const w = 640;
  const h = 150;
  const pad = { t: 10, r: 6, b: 8, l: 6 };
  const max = Math.max(...series.map((d) => d.entries + d.guides), 1);
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;

  const toPoints = (vals: number[]) =>
    vals
      .map((v, i) => {
        const x = pad.l + (i / Math.max(1, vals.length - 1)) * innerW;
        const y = pad.t + innerH - (v / max) * innerH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  const stacked = series.map((d) => d.entries + d.guides);
  const guidesOnly = series.map((d) => d.guides);
  const accessed = series.map((d) =>
    Math.round((d.entries + d.guides) * 1.35 + 4),
  );
  const area = (vals: number[]) => {
    const line = toPoints(vals);
    const lastX = pad.l + innerW;
    const baseY = pad.t + innerH;
    return `M ${pad.l},${baseY} L ${line.replace(/ /g, " L ")} L ${lastX},${baseY} Z`;
  };

  if (mode === "accessed") {
    const aMax = Math.max(...accessed, 1);
    const toA = (vals: number[]) =>
      vals
        .map((v, i) => {
          const x = pad.l + (i / Math.max(1, vals.length - 1)) * innerW;
          const y = pad.t + innerH - (v / aMax) * innerH;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
    const areaA = (vals: number[]) => {
      const line = toA(vals);
      const lastX = pad.l + innerW;
      const baseY = pad.t + innerH;
      return `M ${pad.l},${baseY} L ${line.replace(/ /g, " L ")} L ${lastX},${baseY} Z`;
    };
    return (
      <svg
        className={
          active ? "metrics-console-chart is-on" : "metrics-console-chart"
        }
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Accesses over time"
      >
        <path d={areaA(accessed)} fill={GUIDE_COLOR} fillOpacity={0.4} />
        <polyline
          points={toA(accessed)}
          fill="none"
          stroke={GUIDE_COLOR}
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      className={
        active ? "metrics-console-chart is-on" : "metrics-console-chart"
      }
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Created memories over time"
    >
      <path d={area(stacked)} fill={ENTRY_COLOR} fillOpacity={0.32} />
      <path d={area(guidesOnly)} fill={GUIDE_COLOR} fillOpacity={0.5} />
      <polyline
        points={toPoints(stacked)}
        fill="none"
        stroke={ENTRY_COLOR}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <polyline
        points={toPoints(guidesOnly)}
        fill="none"
        stroke={GUIDE_COLOR}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Donut({
  entries,
  guides,
  active,
}: {
  entries: number;
  guides: number;
  active: boolean;
}) {
  const total = entries + guides;
  const r = 42;
  const c = 2 * Math.PI * r;
  const entryLen = (entries / total) * c;
  const guideLen = (guides / total) * c;
  const e = useCountUp(entries, active);
  const g = useCountUp(guides, active);

  return (
    <div className="metrics-console-donut">
      <svg viewBox="0 0 120 120" role="img" aria-label="Entries versus guides">
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="oklch(0.28 0 0)"
          strokeWidth="14"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={ENTRY_COLOR}
          strokeWidth="14"
          strokeDasharray={`${entryLen} ${c - entryLen}`}
          strokeDashoffset={c * 0.25}
          transform="rotate(-90 60 60)"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={GUIDE_COLOR}
          strokeWidth="14"
          strokeDasharray={`${guideLen} ${c - guideLen}`}
          strokeDashoffset={c * 0.25 - entryLen}
          transform="rotate(-90 60 60)"
        />
        <text
          x="60"
          y="56"
          textAnchor="middle"
          className="metrics-console-donut-total"
        >
          {total.toLocaleString()}
        </text>
        <text
          x="60"
          y="72"
          textAnchor="middle"
          className="metrics-console-donut-sub"
        >
          memories
        </text>
      </svg>
      <ul className="metrics-console-donut-legend">
        <li>
          <span style={{ background: ENTRY_COLOR }} />
          entry <strong>{e.toLocaleString()}</strong>
        </li>
        <li>
          <span style={{ background: GUIDE_COLOR }} />
          guide <strong>{g.toLocaleString()}</strong>
        </li>
      </ul>
    </div>
  );
}

/**
 * Pitch-site Metrics mock: Storage left, Retrieval right, shared range.
 */
export function MetricsConsole() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [range, setRange] = useState<Range>("90d");
  const kpis = RANGE_KPIS[range];
  const days = SERIES_LEN[range];
  const maxTag = Math.max(...TAGS.map((t) => t.count));

  const totalN = useCountUp(kpis.total, active);
  const entriesN = useCountUp(kpis.entries, active);
  const guidesN = useCountUp(kpis.guides, active);
  const createdN = useCountUp(kpis.created, active);
  const expiringN = useCountUp(kpis.expiring, active);
  const accessesN = useCountUp(kpis.accesses, active);
  const uniqueN = useCountUp(kpis.unique, active);
  const neverN = useCountUp(kpis.never, active);
  const spacesN = useCountUp(kpis.spaces, active);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setActive(true);
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      className={active ? "metrics-console is-active" : "metrics-console"}
    >
      <div className="metrics-console-chrome">
        <span className="metrics-console-k">Metrics</span>
        <div className="metrics-console-ranges" role="group" aria-label="Range">
          {(["7d", "30d", "90d"] as const).map((r) => (
            <button
              key={r}
              type="button"
              className={range === r ? "is-on" : undefined}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="metrics-console-columns">
        <section className="metrics-console-pane" aria-label="Storage">
          <p className="metrics-console-section">Storage</p>
          <div className="metrics-console-kpis">
            <div className="metrics-console-kpi">
              <span>Total memories</span>
              <strong>{totalN.toLocaleString()}</strong>
            </div>
            <div className="metrics-console-kpi is-split">
              <span>Entries / guides</span>
              <strong>
                <em style={{ color: ENTRY_COLOR }}>
                  {entriesN.toLocaleString()}
                </em>
                {" / "}
                <em style={{ color: GUIDE_COLOR }}>
                  {guidesN.toLocaleString()}
                </em>
              </strong>
            </div>
            <div className="metrics-console-kpi">
              <span>Created in window</span>
              <strong>{createdN.toLocaleString()}</strong>
            </div>
            <div className="metrics-console-kpi is-warn">
              <span>Expiring in 14 days</span>
              <strong>{expiringN.toLocaleString()}</strong>
            </div>
          </div>

          <div className="metrics-console-card">
            <p className="metrics-console-card-title">Created over time</p>
            <AreaChart active={active} days={days} />
          </div>

          <div className="metrics-console-card">
            <p className="metrics-console-card-title">Entries vs guides</p>
            <Donut
              entries={kpis.entries}
              guides={kpis.guides}
              active={active}
            />
          </div>

          <div className="metrics-console-card metrics-console-card--grow">
            <p className="metrics-console-card-title">Top tags</p>
            <ul className="metrics-console-tags">
              {TAGS.map((tag) => (
                <li key={tag.name}>
                  <span className="metrics-console-tag-name">{tag.name}</span>
                  <span
                    className="metrics-console-tag-bar"
                    style={{
                      width: `${(tag.count / maxTag) * 100}%`,
                      background: tag.color,
                    }}
                  />
                  <span className="metrics-console-tag-count">{tag.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="metrics-console-pane" aria-label="Retrieval">
          <p className="metrics-console-section">Retrieval</p>
          <div className="metrics-console-kpis">
            <div className="metrics-console-kpi is-access">
              <span>Accesses in window</span>
              <strong>{accessesN.toLocaleString()}</strong>
            </div>
            <div className="metrics-console-kpi">
              <span>Unique memories</span>
              <strong>{uniqueN.toLocaleString()}</strong>
            </div>
            <div className="metrics-console-kpi">
              <span>Never accessed</span>
              <strong>{neverN.toLocaleString()}</strong>
            </div>
            <div className="metrics-console-kpi">
              <span>Spaces with memories</span>
              <strong>{spacesN.toLocaleString()}</strong>
            </div>
          </div>

          <div className="metrics-console-card">
            <p className="metrics-console-card-title">Accessed over time</p>
            <AreaChart active={active} days={days} mode="accessed" />
          </div>

          <div className="metrics-console-card">
            <p className="metrics-console-card-title">Accesses by source</p>
            <ul className="metrics-console-tags">
              {ACCESS_SOURCES.map((row) => (
                <li key={row.name}>
                  <span className="metrics-console-tag-name">{row.name}</span>
                  <span
                    className="metrics-console-tag-bar"
                    style={{
                      width: `${(row.count / ACCESS_SOURCES[0].count) * 100}%`,
                      background: row.color,
                    }}
                  />
                  <span className="metrics-console-tag-count">
                    {row.count.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="metrics-console-card metrics-console-card--grow">
            <p className="metrics-console-card-title">Top accessed</p>
            <ul className="metrics-console-tags metrics-console-tags--wide">
              {TOP_ACCESSED.map((row) => (
                <li key={row.name}>
                  <span className="metrics-console-tag-name" title={row.name}>
                    {row.name}
                  </span>
                  <span
                    className="metrics-console-tag-bar"
                    style={{
                      width: `${(row.count / TOP_ACCESSED[0].count) * 100}%`,
                      background: GUIDE_COLOR,
                    }}
                  />
                  <span className="metrics-console-tag-count">{row.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
