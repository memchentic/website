import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const CYCLE_SECONDS = 120;
const CYCLE_MS = CYCLE_SECONDS * 1000;
const TICK_MS = 200;
const SEED_MS = 18_000;
/** Throttled or hidden tabs pause the session instead of dumping a backlog. */
const MAX_TICK_MS = 1000;
/** px from the bottom that still counts as "following" the feed */
const STICK_SLACK = 48;

type ResultLine = { title?: string; text: string };

type ToolBeat = {
  kind: "tool";
  at: number;
  runFor: number;
  server: "memchentic" | "workspace";
  name: string;
  args: string;
  status: string;
  write?: boolean;
  meta?: string;
  lines?: ResultLine[];
};

type AgentBeat = { kind: "agent"; at: number; text: string };

type Beat = ToolBeat | AgentBeat;

const PROMPT =
  "Checkout retries are double-charging customers in Payments Core. Find the cause and fix it.";

/** One 120s slice of a single long agent turn; replays back-to-back. */
const SCRIPT: Beat[] = [
  {
    kind: "agent",
    at: 1,
    text: "Checking memory before I touch the payment paths.",
  },
  {
    kind: "tool",
    at: 3,
    runFor: 1.6,
    server: "memchentic",
    name: "guide_find",
    args: `{
  "query": "payments retry double charge idempotency",
  "limit": 8
}`,
    status: "done · 42ms",
    meta: "2 guides · shared",
    lines: [
      {
        title: "When changing money paths, require idempotency",
        text: "Keep Idempotency-Key semantics; no silent write retries.",
      },
      {
        title: "Failed approach: shared Redis for ledger locks",
        text: "Split-brain under partition — stay on Postgres advisory locks.",
      },
    ],
  },
  {
    kind: "tool",
    at: 7,
    runFor: 1.8,
    server: "memchentic",
    name: "find",
    args: `{
  "query": "double charge retry ledger",
  "limit": 10
}`,
    status: "done · 57ms",
    meta: "3 entries · shared",
    lines: [
      {
        title: "insight · Idempotency keys evicted after 24h",
        text: "payments-core · services/payments/ledger/",
      },
      { title: "decision · Retries go through the queue worker", text: "payments-core" },
      { title: "fact · Ledger writes are double-entry", text: "payments-core" },
    ],
  },
  {
    kind: "tool",
    at: 12,
    runFor: 1.2,
    server: "memchentic",
    name: "open",
    args: `{
  "id": "…idempotency-key-ttl…"
}`,
    status: "done · 18ms",
    meta: "insight",
    lines: [
      {
        text: "Keys live in Postgres with a 24h TTL. A replay after eviction is treated as a brand-new charge.",
      },
    ],
  },
  {
    kind: "agent",
    at: 16,
    text: "Known risk: a replay after key eviction charges again. Checking what this path remembers.",
  },
  {
    kind: "tool",
    at: 19,
    runFor: 1.4,
    server: "memchentic",
    name: "about_path",
    args: `{
  "path": "services/payments/ledger/",
  "repo_hint": "payments-core"
}`,
    status: "done · 31ms",
    meta: "1 entry",
    lines: [{ title: "insight · Idempotency keys evicted after 24h", text: "path_hint match" }],
  },
  {
    kind: "tool",
    at: 24,
    runFor: 1.1,
    server: "workspace",
    name: "Grep",
    args: `{
  "pattern": "IDEMPOTENCY_TTL|max_backoff",
  "path": "services/payments"
}`,
    status: "4 matches",
    lines: [
      { text: "ledger/writer.py:41  IDEMPOTENCY_TTL = timedelta(hours=24)" },
      { text: "retry/worker.py:18   max_backoff = timedelta(hours=36)" },
    ],
  },
  {
    kind: "tool",
    at: 28,
    runFor: 0.9,
    server: "workspace",
    name: "Read",
    args: `{
  "path": "services/payments/retry/worker.py",
  "lines": "12-64"
}`,
    status: "53 lines",
  },
  {
    kind: "agent",
    at: 32,
    text: "Found it: the retry worker backs off up to 36h, but keys are evicted at 24h. Late retries slip past dedupe.",
  },
  {
    kind: "tool",
    at: 36,
    runFor: 1.3,
    server: "workspace",
    name: "Edit",
    args: `{
  "path": "services/payments/ledger/writer.py",
  "change": "TTL derives from max_backoff + 24h; reject replays past window"
}`,
    status: "+14 −3",
  },
  {
    kind: "tool",
    at: 41,
    runFor: 4.5,
    server: "workspace",
    name: "Shell",
    args: `pytest tests/payments -q`,
    status: "exit 0",
    lines: [{ text: "128 passed in 3.41s" }],
  },
  {
    kind: "tool",
    at: 49,
    runFor: 1.6,
    server: "memchentic",
    name: "remember",
    write: true,
    args: `{
  "type": "insight",
  "title": "Idempotency TTL must exceed max retry backoff",
  "path_hint": "services/payments/ledger/",
  "visibility": "shared"
}`,
    status: "saved",
  },
  {
    kind: "tool",
    at: 54,
    runFor: 1.6,
    server: "memchentic",
    name: "guide_write",
    write: true,
    args: `{
  "title": "When changing retry backoff, re-check idempotency TTL",
  "when": "editing retry workers on money paths",
  "do": "Derive key TTL from max_backoff; never hardcode it"
}`,
    status: "upserted · confidence ↑",
  },
  {
    kind: "agent",
    at: 59,
    text: "Payments is fixed and green. Checking whether other services copied the same pattern.",
  },
  {
    kind: "tool",
    at: 62,
    runFor: 1.4,
    server: "memchentic",
    name: "guide_find",
    args: `{
  "query": "retry backoff idempotency ttl",
  "limit": 8
}`,
    status: "done · 39ms",
    meta: "1 guide · shared",
    lines: [
      {
        title: "When changing retry backoff, re-check idempotency TTL",
        text: "Derive key TTL from max_backoff; never hardcode it.",
      },
    ],
  },
  {
    kind: "tool",
    at: 67,
    runFor: 1.2,
    server: "workspace",
    name: "Grep",
    args: `{
  "pattern": "IDEMPOTENCY_TTL",
  "path": "services"
}`,
    status: "3 matches",
    lines: [
      { text: "payments/ledger/writer.py:41" },
      { text: "refunds/worker.py:27   IDEMPOTENCY_TTL = timedelta(hours=24)" },
      { text: "payouts/batch.py:33    ttl derived from max_backoff" },
    ],
  },
  {
    kind: "tool",
    at: 71,
    runFor: 0.9,
    server: "workspace",
    name: "Read",
    args: `{
  "path": "services/refunds/worker.py",
  "lines": "1-80"
}`,
    status: "80 lines",
  },
  {
    kind: "agent",
    at: 75,
    text: "Refunds has the same gap: 48h backoff against a 24h key. Payouts already does it right.",
  },
  {
    kind: "tool",
    at: 79,
    runFor: 1.2,
    server: "workspace",
    name: "Edit",
    args: `{
  "path": "services/refunds/worker.py",
  "change": "derive IDEMPOTENCY_TTL from max_backoff"
}`,
    status: "+9 −2",
  },
  {
    kind: "tool",
    at: 83,
    runFor: 4,
    server: "workspace",
    name: "Shell",
    args: `pytest tests/refunds -q`,
    status: "exit 0",
    lines: [{ text: "41 passed in 1.87s" }],
  },
  {
    kind: "tool",
    at: 90,
    runFor: 1.4,
    server: "memchentic",
    name: "revise",
    write: true,
    args: `{
  "id": "…idempotency-ttl-backoff…",
  "path_hint": "services/",
  "body_append": "Also fixed in refunds; payouts already compliant."
}`,
    status: "revised",
  },
  {
    kind: "tool",
    at: 96,
    runFor: 1.8,
    server: "memchentic",
    name: "overlap_report",
    args: `{
  "space": "shared"
}`,
    status: "done · 64ms",
    meta: "1 pair · 0 conflicts",
    lines: [
      {
        title: "Idempotency keys evicted after 24h",
        text: "Superseded by the TTL ≥ backoff insight — merge suggested.",
      },
    ],
  },
  {
    kind: "tool",
    at: 102,
    runFor: 1.3,
    server: "memchentic",
    name: "forget",
    write: true,
    args: `{
  "id": "…idempotency-keys-evicted-24h…"
}`,
    status: "removed · merged",
  },
  {
    kind: "agent",
    at: 107,
    text: "Both paths are patched, tests pass, and the stale entry is merged. The next agent starts from the corrected memory.",
  },
  {
    kind: "agent",
    at: 114,
    text: "Sweeping the remaining money paths for the same retry pattern.",
  },
];

type FeedItem = { key: string; beat: Beat; done: boolean };

function buildFeed(elapsed: number): FeedItem[] {
  const cycles = Math.floor(elapsed / CYCLE_MS);
  const items: FeedItem[] = [];
  for (let c = 0; c <= cycles; c += 1) {
    for (const [i, beat] of SCRIPT.entries()) {
      const start = c * CYCLE_MS + beat.at * 1000;
      if (start > elapsed) {
        break;
      }
      const runMs = beat.kind === "tool" ? beat.runFor * 1000 : 0;
      items.push({ key: `${c}-${i}`, beat, done: elapsed >= start + runMs });
    }
  }
  return items;
}

function ToolCard({ beat, done }: { beat: ToolBeat; done: boolean }) {
  const memchentic = beat.server === "memchentic";
  const className = [
    "mcp-beat mcp-tool",
    memchentic && "mcp-tool-memchentic",
    beat.write && "mcp-tool-write",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <div className="mcp-tool-head">
        <span className="mcp-tool-badge">{memchentic ? "memchentic" : "tool"}</span>
        <code className="mcp-tool-name">{beat.name}</code>
        {done && beat.meta && <span className="mcp-result-meta">{beat.meta}</span>}
        <span
          className={`mcp-tool-status ${done ? "mcp-status-ok" : "mcp-status-run"}`}
        >
          {done ? beat.status : "running"}
        </span>
      </div>
      <pre className="mcp-tool-args">{beat.args}</pre>
      {done && beat.lines && (
        <ul className="mcp-result-list mcp-tool-output">
          {beat.lines.map((line) => (
            <li key={line.title ?? line.text}>
              {line.title && <strong>{line.title}</strong>}
              <span>{line.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Stylized agent ↔ MCP session under the hero — one long agent turn that
 * keeps calling memchentic and workspace tools. The 120s script replays
 * back-to-back and only appends, so the feed reads as a single turn.
 */
export function McpSessionDemo() {
  const sessionRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const [reducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [elapsed, setElapsed] = useState(reducedMotion ? CYCLE_MS - 1 : SEED_MS);

  useEffect(() => {
    const sessionEl = sessionRef.current;
    if (reducedMotion || !sessionEl) {
      return;
    }

    let timer = 0;
    let last = 0;
    const tick = () => {
      const now = performance.now();
      const delta = Math.min(now - last, MAX_TICK_MS);
      last = now;
      setElapsed((prev) => prev + delta);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        window.clearInterval(timer);
        if (entry?.isIntersecting) {
          last = performance.now();
          timer = window.setInterval(tick, TICK_MS);
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(sessionEl);

    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, [reducedMotion]);

  useLayoutEffect(() => {
    const bodyEl = bodyRef.current;
    const feedEl = feedRef.current;
    if (reducedMotion || !bodyEl || !feedEl) {
      return;
    }

    // Only real user input may unstick; layout clamps also emit scroll events.
    let dragging = false;
    let keyed = false;
    const nearBottom = () =>
      bodyEl.scrollHeight - bodyEl.scrollTop - bodyEl.clientHeight < STICK_SLACK;

    const onScroll = () => {
      if (nearBottom()) {
        stickRef.current = true;
      } else if (dragging || keyed) {
        stickRef.current = false;
      }
      keyed = false;
    };
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY < 0) {
        stickRef.current = false;
      }
    };
    const onPress = () => {
      dragging = true;
    };
    const onRelease = () => {
      dragging = false;
    };
    const onKey = () => {
      keyed = true;
    };

    const resize = new ResizeObserver(() => {
      if (stickRef.current) {
        bodyEl.scrollTop = bodyEl.scrollHeight;
      }
    });

    bodyEl.addEventListener("scroll", onScroll, { passive: true });
    bodyEl.addEventListener("wheel", onWheel, { passive: true });
    bodyEl.addEventListener("pointerdown", onPress);
    bodyEl.addEventListener("touchstart", onPress, { passive: true });
    bodyEl.addEventListener("keydown", onKey);
    window.addEventListener("pointerup", onRelease);
    window.addEventListener("touchend", onRelease);
    resize.observe(feedEl);
    return () => {
      bodyEl.removeEventListener("scroll", onScroll);
      bodyEl.removeEventListener("wheel", onWheel);
      bodyEl.removeEventListener("pointerdown", onPress);
      bodyEl.removeEventListener("touchstart", onPress);
      bodyEl.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerup", onRelease);
      window.removeEventListener("touchend", onRelease);
      resize.disconnect();
    };
  }, [reducedMotion]);

  const feed = useMemo(() => buildFeed(elapsed), [elapsed]);

  return (
    <section className="mcp-demo site-shell py-20 sm:py-24" id="in-session">
      <p className="mb-3 text-sm font-medium tracking-[0.12em] text-faint uppercase">
        In session
      </p>
      <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Agents don&apos;t paste context. They call tools.
      </h2>
      <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">
        Same MCP surface your IDE already speaks — recall before rediscovery,
        capture after verification.
      </p>

      <div ref={sessionRef} className="mcp-session mt-16 sm:mt-20">
        <div className="mcp-session-chrome">
          <span className="mcp-session-dot" aria-hidden="true" />
          <span className="mcp-session-dot" aria-hidden="true" />
          <span className="mcp-session-dot" aria-hidden="true" />
          <span className="mcp-session-title">agent · memchentic MCP</span>
          <span className="mcp-session-live">live</span>
        </div>

        <div
          ref={bodyRef}
          className="mcp-session-body"
          role="log"
          aria-live="off"
          aria-label="Simulated agent turn calling memchentic MCP tools alongside workspace tools"
          tabIndex={0}
        >
          <div ref={feedRef} className="mcp-session-feed">
            <div className="mcp-beat mcp-user">
              <span className="mcp-role">You</span>
              <p>{PROMPT}</p>
            </div>

            {feed.map(({ key, beat, done }) =>
              beat.kind === "tool" ? (
                <ToolCard key={key} beat={beat} done={done} />
              ) : (
                <div key={key} className="mcp-beat mcp-assistant">
                  <span className="mcp-role">Agent</span>
                  <p>{beat.text}</p>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
