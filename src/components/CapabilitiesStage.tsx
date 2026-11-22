import { useEffect, useState } from "react";

type CapId =
  | "history"
  | "feedback"
  | "export"
  | "ingest"
  | "hygiene"
  | "webhooks";

type Cap = {
  id: CapId;
  label: string;
  blurb: string;
  status: string;
  kpis: readonly { label: string; value: string }[];
  feed: readonly { when: string; text: string }[];
};

const CAPS: readonly Cap[] = [
  {
    id: "history",
    label: "History",
    blurb: "Field-level revisions — audit what changed, not only who touched it.",
    status: "entry · 3 revisions",
    kpis: [
      { label: "Revisions", value: "3" },
      { label: "Fields", value: "body, tags" },
      { label: "Last", value: "11/21" },
    ],
    feed: [
      { when: "11:43", text: "body revised by Alex Kim" },
      { when: "09:12", text: "tags revised by Priya Shah" },
      { when: "07:34", text: "created via remember" },
    ],
  },
  {
    id: "feedback",
    label: "Feedback",
    blurb: "Useful / stale / wrong — signals that nudge ranking on the next recall.",
    status: "signals · 128 this week",
    kpis: [
      { label: "Useful", value: "84" },
      { label: "Stale", value: "29" },
      { label: "Wrong", value: "15" },
    ],
    feed: [
      { when: "14:02", text: "guide marked useful · Agent Tooling" },
      { when: "13:41", text: "fact marked stale · Incident Response" },
      { when: "12:18", text: "insight marked wrong · Payments Core" },
    ],
  },
  {
    id: "export",
    label: "Export",
    blurb: "Portable rows you can read — ACL-scoped, capped, ready to leave.",
    status: "JSONL · 240 / 500",
    kpis: [
      { label: "Rows", value: "240" },
      { label: "Cap", value: "500" },
      { label: "Spaces", value: "4" },
    ],
    feed: [
      { when: "16:10", text: "export started · Groups" },
      { when: "16:10", text: "ACL filter applied · 12 denied" },
      { when: "16:11", text: "bundle ready · download" },
    ],
  },
  {
    id: "ingest",
    label: "Ingest",
    blurb: "Propose from prose — heuristics first, optional extract, confirm before write.",
    status: "suggest · 4 candidates",
    kpis: [
      { label: "Proposed", value: "4" },
      { label: "Accepted", value: "1" },
      { label: "Skipped", value: "3" },
    ],
    feed: [
      { when: "10:22", text: "decision scored 0.86 · queued" },
      { when: "10:22", text: "fact scored 0.71 · review" },
      { when: "10:23", text: "guide scored 0.64 · review" },
    ],
  },
  {
    id: "hygiene",
    label: "Hygiene",
    blurb: "Conflicts and near-dups surface before the corpus quietly forks.",
    status: "overlap · 2 open",
    kpis: [
      { label: "Conflicts", value: "1" },
      { label: "Near-dups", value: "1" },
      { label: "Resolved", value: "18" },
    ],
    feed: [
      { when: "08:55", text: "conflict opened · ledger locks" },
      { when: "08:56", text: "near-dup flagged · Argo waves" },
      { when: "09:01", text: "auto-resolve skipped · needs human" },
    ],
  },
  {
    id: "webhooks",
    label: "Webhooks",
    blurb: "Create / update / delete posts into the rest of your agent stack.",
    status: "endpoint · /hooks/agents",
    kpis: [
      { label: "Delivered", value: "1.2k" },
      { label: "Fail", value: "3" },
      { label: "p95", value: "42ms" },
    ],
    feed: [
      { when: "15:44", text: "memory.updated · 202" },
      { when: "15:41", text: "memory.created · 202" },
      { when: "15:39", text: "memory.deleted · 202" },
    ],
  },
];

const CYCLE_MS = 6500;

/**
 * Dense capabilities console — tabs, main vignette, KPI rail, activity feed.
 */
export function CapabilitiesStage() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const cap = CAPS[i]!;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || paused) return;
    const id = window.setInterval(() => {
      setI((n) => (n + 1) % CAPS.length);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div
      className="cap-stage"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="cap-tabs" role="tablist" aria-label="Capabilities">
        {CAPS.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={idx === i}
            className={idx === i ? "cap-tab is-active" : "cap-tab"}
            onClick={() => setI(idx)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="cap-shell" aria-live="polite" key={cap.id}>
        <div className="cap-shell-chrome">
          <div className="cap-shell-chrome-start">
            <span className="cap-panel-k">{cap.label}</span>
            <span className="cap-panel-status">{cap.status}</span>
          </div>
          <span className="cap-shell-hint">
            {paused ? "Paused" : "Cycling"}
          </span>
        </div>

        <p className="cap-panel-blurb">{cap.blurb}</p>

        <div className="cap-workspace">
          <div className={`cap-main cap-main--${cap.id}`}>
            {cap.id === "history" ? <HistoryVignette /> : null}
            {cap.id === "feedback" ? <FeedbackVignette /> : null}
            {cap.id === "export" ? <ExportVignette /> : null}
            {cap.id === "ingest" ? <IngestVignette /> : null}
            {cap.id === "hygiene" ? <HygieneVignette /> : null}
            {cap.id === "webhooks" ? <WebhookVignette /> : null}
          </div>

          <aside className="cap-side">
            <div className="cap-side-block">
              <p className="cap-side-title">Pulse</p>
              <div className="cap-kpis">
                {cap.kpis.map((kpi) => (
                  <div key={kpi.label} className="cap-kpi">
                    <span>{kpi.label}</span>
                    <strong>{kpi.value}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="cap-side-block cap-side-block--grow">
              <p className="cap-side-title">Activity</p>
              <ul className="cap-feed">
                {cap.feed.map((row) => (
                  <li key={`${row.when}-${row.text}`}>
                    <span>{row.when}</span>
                    <em>{row.text}</em>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <div
          className={paused ? "cap-progress is-paused" : "cap-progress"}
          key={`bar-${cap.id}-${paused ? "p" : "r"}`}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

function HistoryVignette() {
  return (
    <div className="cap-history">
      <div className="cap-history-head">
        <code className="type-rail-tag kind-chip-insight">insight</code>
        <strong>Failed approach: shared Redis for ledger locks</strong>
      </div>
      <div className="cap-history-diff">
        <div className="cap-history-col">
          <span>Before</span>
          <p>Use Redis locks for the ledger path under load.</p>
        </div>
        <div className="cap-history-col is-after">
          <span>After</span>
          <p>
            Split-brain under partition — stay on Postgres advisory locks.
          </p>
        </div>
      </div>
      <ul className="cap-timeline">
        <li>
          <span>11/21 · 11:43</span>
          <strong>body</strong>
          <em>revise · Alex Kim</em>
        </li>
        <li>
          <span>11/18 · 09:12</span>
          <strong>tags</strong>
          <em>revise · Priya Shah</em>
        </li>
        <li>
          <span>11/12 · 16:04</span>
          <strong>title</strong>
          <em>revise · Marcus Chen</em>
        </li>
        <li>
          <span>11/07 · 07:34</span>
          <strong>created</strong>
          <em>remember · Alex Kim</em>
        </li>
      </ul>
    </div>
  );
}

function FeedbackVignette() {
  return (
    <div className="cap-feedback">
      <div className="cap-feedback-target">
        <code className="type-rail-tag kind-chip-guide">guide</code>
        <div>
          <strong>When starting agent work, recall first</strong>
          <p>guide_find before rediscovery — then remember after verify.</p>
        </div>
      </div>
      <div className="cap-feedback-actions">
        <button type="button" className="cap-feedback-btn is-on" tabIndex={-1}>
          Useful
        </button>
        <button type="button" className="cap-feedback-btn" tabIndex={-1}>
          Stale
        </button>
        <button type="button" className="cap-feedback-btn" tabIndex={-1}>
          Wrong
        </button>
      </div>
      <div className="cap-feedback-bars" aria-hidden="true">
        <div>
          <span>useful</span>
          <i style={{ width: "72%" }} />
        </div>
        <div>
          <span>stale</span>
          <i style={{ width: "24%" }} />
        </div>
        <div>
          <span>wrong</span>
          <i style={{ width: "12%" }} />
        </div>
      </div>
      <p className="cap-feedback-note">
        Marked useful — confidence + ranking weight nudged for this space.
      </p>
    </div>
  );
}

function ExportVignette() {
  return (
    <div className="cap-export">
      <div className="cap-export-grid">
        <div className="cap-export-row">
          <span>scope</span>
          <strong>Groups · entries + guides</strong>
        </div>
        <div className="cap-export-row">
          <span>format</span>
          <strong>JSONL</strong>
        </div>
        <div className="cap-export-row">
          <span>cap</span>
          <strong>240 / 500</strong>
        </div>
        <div className="cap-export-row">
          <span>denied</span>
          <strong>12 · ACL</strong>
        </div>
      </div>
      <div className="cap-export-bar" aria-hidden="true">
        <i style={{ width: "48%" }} />
      </div>
      <ul className="cap-export-preview">
        <li>
          <code className="type-rail-tag kind-chip-fact">fact</code>
          <span>Postgres primary failover runbook</span>
        </li>
        <li>
          <code className="type-rail-tag kind-chip-guide">guide</code>
          <span>When changing money paths, require idempotency</span>
        </li>
        <li>
          <code className="type-rail-tag kind-chip-decision">decision</code>
          <span>OIDC groups claim maps to Northline auth</span>
        </li>
        <li>
          <code className="type-rail-tag kind-chip-preference">preference</code>
          <span>Prefer Argo CD sync waves over Helm hooks</span>
        </li>
      </ul>
      <p className="cap-export-foot">Bundle ready · checksum ok · download</p>
    </div>
  );
}

function IngestVignette() {
  return (
    <div className="cap-ingest">
      <div className="cap-ingest-source">
        <span>source prose</span>
        <p>
          “Pin chart images by tag and let Renovate bump. Staging memory TTL is
          14d. When CI flakes, pin the seed before you chase ghosts.”
        </p>
      </div>
      <ul className="cap-suggest">
        <li className="is-pick">
          <code className="type-rail-tag kind-chip-decision">decision</code>
          <span>Pin images by tag, Renovate bumps</span>
          <em>0.86</em>
        </li>
        <li>
          <code className="type-rail-tag kind-chip-fact">fact</code>
          <span>Staging TTL on memory keys is 14d</span>
          <em>0.71</em>
        </li>
        <li>
          <code className="type-rail-tag kind-chip-guide">guide</code>
          <span>When CI flakes, pin the seed</span>
          <em>0.64</em>
        </li>
        <li>
          <code className="type-rail-tag kind-chip-note">note</code>
          <span>Chase ghosts — skipped (noise)</span>
          <em>0.21</em>
        </li>
      </ul>
      <p className="cap-ingest-foot">Confirm writes one row — suggest never auto-saves.</p>
    </div>
  );
}

function HygieneVignette() {
  return (
    <div className="cap-hygiene">
      <div className="cap-hygiene-card is-conflict">
        <div className="cap-hygiene-card-top">
          <span>conflict</span>
          <em>supersedes</em>
        </div>
        <strong>Ledger lock approach</strong>
        <p>
          Two insights claim the survivor. Pick one — the other stays as history.
        </p>
        <div className="cap-hygiene-pair">
          <code className="type-rail-tag kind-chip-insight">insight</code>
          <span>Failed approach: shared Redis…</span>
        </div>
        <div className="cap-hygiene-pair">
          <code className="type-rail-tag kind-chip-insight">insight</code>
          <span>Stay on Postgres advisory locks</span>
        </div>
      </div>
      <div className="cap-hygiene-card is-dup">
        <div className="cap-hygiene-card-top">
          <span>near-dup</span>
          <em>refuse</em>
        </div>
        <strong>Argo sync waves</strong>
        <p>
          Same preference, weaker wording. Refuse the write or merge into the
          stronger row.
        </p>
        <div className="cap-hygiene-pair">
          <code className="type-rail-tag kind-chip-preference">preference</code>
          <span>Prefer Argo CD sync waves…</span>
        </div>
        <div className="cap-hygiene-pair is-dim">
          <code className="type-rail-tag kind-chip-preference">preference</code>
          <span>Prefer Argo waves — older note</span>
        </div>
      </div>
    </div>
  );
}

function WebhookVignette() {
  return (
    <div className="cap-hook">
      <div className="cap-hook-line">
        <span className="cap-hook-verb">POST</span>
        <code>https://agents.example/hooks/memchentic</code>
      </div>
      <div className="cap-hook-grid">
        <pre className="cap-hook-body">{`{
  "event": "memory.updated",
  "id": "insight-12",
  "kind": "insight",
  "space": "Payments Core",
  "updated_by": "alex"
}`}</pre>
        <ul className="cap-hook-log">
          <li className="is-ok">
            <span>15:44:02</span>
            <em>memory.updated</em>
            <strong>202</strong>
          </li>
          <li className="is-ok">
            <span>15:41:18</span>
            <em>memory.created</em>
            <strong>202</strong>
          </li>
          <li className="is-ok">
            <span>15:39:55</span>
            <em>memory.deleted</em>
            <strong>202</strong>
          </li>
          <li className="is-fail">
            <span>15:12:03</span>
            <em>memory.updated</em>
            <strong>503</strong>
          </li>
        </ul>
      </div>
      <p className="cap-hook-ok">Retry queue empty · signature verified</p>
    </div>
  );
}
