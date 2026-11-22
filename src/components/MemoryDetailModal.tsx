import { useEffect, useId, useMemo } from "react";
import { createPortal } from "react-dom";
import { mulberry32, type VectorPoint } from "../data/showcase";

type Props = {
  memory: VectorPoint;
  onClose: () => void;
};

type RecallEvent = {
  when: string;
  source: string;
  who: string;
};

const SOURCES = ["open", "search", "find", "guide_find", "guide_write"] as const;

function hashSeed(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function formatStamp(daysAgo: number, hour: number, minute: number): string {
  const d = new Date(Date.UTC(2026, 10, 22, 16, 0, 0));
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hour, minute, (daysAgo * 17) % 60, 0);
  return d.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function detailStats(row: VectorPoint) {
  const rand = mulberry32(hashSeed(row.id) ^ 0x9e3779b9);
  const recalls = 2 + Math.floor(rand() * 28);
  const lastDays = Math.floor(rand() * 14);
  const createdDays = 40 + Math.floor(rand() * 90);
  const permanent = rand() > 0.35;
  const expireDays = permanent ? null : 20 + Math.floor(rand() * 60);
  const confidence =
    row.kind === "guide" ? 1 + Math.floor(rand() * 5) : null;

  const people = [
    row.owner,
    "Alex Kim",
    "Priya Shah",
    "Sofia Ramos",
    "Jordan Lee",
    "Marcus Chen",
  ];
  const events: RecallEvent[] = [];
  const n = 3 + Math.floor(rand() * 3);
  for (let i = 0; i < n; i++) {
    events.push({
      when: formatStamp(
        lastDays + i * (1 + Math.floor(rand() * 4)),
        8 + Math.floor(rand() * 12),
        Math.floor(rand() * 60),
      ),
      source: SOURCES[Math.floor(rand() * SOURCES.length)]!,
      who: people[Math.floor(rand() * people.length)]!,
    });
  }

  return {
    recalls,
    lastRecalled: formatStamp(lastDays, 18, 43),
    created: formatStamp(createdDays, 7, 34),
    expires: expireDays
      ? formatStamp(-expireDays, 12, 0)
      : "Permanent",
    confidence,
    events,
  };
}

function detailBody(row: VectorPoint): string {
  if (row.kind === "guide" && row.id.endsWith("-0")) {
    return (
      "When X = unfamiliar path or recurring failure in northline/*: do Y = " +
      "guide_find + find before rediscovery. Avoid Z = re-deriving ACL or " +
      "payments rules from scratch."
    );
  }
  if (row.body.length > 90) return row.body;
  return `${row.body}\n\nKept in ${row.space} for agents that share this principal.`;
}

/**
 * Pitch-site memory detail lightbox — mirrors the product Entry page layout.
 */
export function MemoryDetailModal({ memory, onClose }: Props) {
  const titleId = useId();
  const stats = useMemo(() => detailStats(memory), [memory]);
  const body = useMemo(() => detailBody(memory), [memory]);
  const kindLabel =
    memory.kind === "guide"
      ? `guide · confidence ${stats.confidence}`
      : memory.kind;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="memory-detail-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="memory-detail-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="memory-detail-header">
          <div className="memory-detail-header-main">
            <h2 id={titleId} className="memory-detail-title">
              {memory.label}
            </h2>
            <p className="memory-detail-meta">
              {kindLabel} · {memory.space} · updated {stats.lastRecalled}
            </p>
          </div>
          <div className="memory-detail-header-actions">
            <span
              className="memory-detail-action"
              title="Revise (demo)"
              aria-hidden="true"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                <path d="M11.1 1.6a1.5 1.5 0 0 1 2.1 2.1L5.4 11.5 2 12.8l1.3-3.4L11.1 1.6z" />
              </svg>
            </span>
            <span
              className="memory-detail-action"
              title="Forget (demo)"
              aria-hidden="true"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
                <path d="M6 2h4l1 1h3v1.5H2V3h3l1-1zm-2 4h10l-.7 8.2A1.5 1.5 0 0 1 11.8 15H4.2a1.5 1.5 0 0 1-1.5-1.3L2 6z" />
              </svg>
            </span>
            <button
              type="button"
              className="memory-detail-close"
              aria-label="Close"
              onClick={onClose}
            >
              ×
            </button>
          </div>
        </div>

        <div className="memory-detail-body">
          <section aria-label="Memory metrics">
            <h3 className="memory-detail-section">Usage</h3>
            <div className="memory-detail-kpis">
              <div className="memory-detail-kpi">
                <div className="memory-detail-kpi-label">Recalls</div>
                <div className="memory-detail-kpi-value">{stats.recalls}</div>
              </div>
              <div className="memory-detail-kpi">
                <div className="memory-detail-kpi-label">Last recalled</div>
                <div className="memory-detail-kpi-value memory-detail-kpi-value-sm">
                  {stats.lastRecalled}
                </div>
              </div>
              <div className="memory-detail-kpi">
                <div className="memory-detail-kpi-label">Created</div>
                <div className="memory-detail-kpi-value memory-detail-kpi-value-sm">
                  {stats.created}
                </div>
              </div>
              <div className="memory-detail-kpi">
                <div className="memory-detail-kpi-label">Expires</div>
                <div className="memory-detail-kpi-value memory-detail-kpi-value-sm">
                  {stats.expires}
                </div>
              </div>
            </div>

            <div className="memory-detail-panel-block">
              <h4 className="memory-detail-block-title">Recent accesses</h4>
              <ul className="memory-detail-recalls">
                {stats.events.map((ev) => (
                  <li key={`${ev.when}-${ev.source}-${ev.who}`}>
                    <span className="memory-detail-recall-when">{ev.when}</span>
                    <code className="memory-detail-recall-source">
                      {ev.source}
                    </code>
                    <span className="memory-detail-recall-who">{ev.who}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <div className="memory-detail-panel-block memory-detail-content">
            <pre className="memory-detail-text">{body}</pre>
            {memory.tags.length > 0 ? (
              <div className="memory-detail-tags">
                {memory.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
