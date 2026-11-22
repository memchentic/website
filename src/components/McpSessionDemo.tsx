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
  "Repeat billing disputes are backing up in Tier-2. Draft the customer reply and update what the team should remember.";

/** One 120s slice of a single long agent turn; replays back-to-back. */
const SCRIPT: Beat[] = [
  {
    kind: "agent",
    at: 1,
    text: "Checking shared memory before I draft the incident summary.",
  },
  {
    kind: "tool",
    at: 3,
    runFor: 1.6,
    server: "memchentic",
    name: "guide_find",
    args: `{
  "query": "billing dispute escalation credit policy",
  "limit": 8
}`,
    status: "done · 42ms",
    meta: "2 guides · support",
    lines: [
      {
        title: "When a dispute repeats within 30 days",
        text: "Escalate to Tier-3; do not promise instant credits in chat.",
      },
      {
        title: "When finance flags a known outage",
        text: "Use the approved macro; link the status page, not internal tickets.",
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
  "query": "duplicate charge retry window",
  "limit": 10
}`,
    status: "done · 57ms",
    meta: "3 entries · support",
    lines: [
      {
        title: "fact · Retry window is 48h after first decline",
        text: "ops/billing-playbooks",
      },
      {
        title: "decision · Proactive credits need manager approval",
        text: "support-escalations",
      },
      {
        title: "insight · March outage still cited in macros",
        text: "stale customer-facing wording",
      },
    ],
  },
  {
    kind: "tool",
    at: 12,
    runFor: 1.1,
    server: "memchentic",
    name: "feedback",
    write: true,
    args: `{
  "id": "…march-outage-macro…",
  "signal": "stale"
}`,
    status: "recorded",
    meta: "ranking nudge",
  },
  {
    kind: "tool",
    at: 16,
    runFor: 1.5,
    server: "memchentic",
    name: "ingest_suggest",
    args: `{
  "text": "Shift handoff: three dup-charge tickets… finance says retry batch stuck…"
}`,
    status: "done · 88ms",
    meta: "2 candidates · kind scored",
    lines: [
      {
        title: "decision · Retry batch paused",
        text: "Finance halted auto-retries until duplicate detection is verified.",
      },
      {
        title: "When duplicate charges cluster",
        text: "Open Sev-2 with billing-oncall; do not close tickets individually.",
      },
    ],
  },
  {
    kind: "agent",
    at: 21,
    text: "Handoff matches memory: retries are paused, customers need the approved status wording — not last quarter's outage note.",
  },
  {
    kind: "tool",
    at: 25,
    runFor: 1.6,
    server: "memchentic",
    name: "remember",
    write: true,
    args: `{
  "type": "decision",
  "title": "Feb duplicate-charge cluster uses Sev-2 + status macro",
  "tags": ["billing", "tier-2"],
  "visibility": "shared"
}`,
    status: "saved",
  },
  {
    kind: "tool",
    at: 30,
    runFor: 1.6,
    server: "memchentic",
    name: "guide_write",
    write: true,
    args: `{
  "title": "When duplicate charges spike in Tier-2",
  "when": "more than two dup-charge tickets in 24h",
  "do": "Sev-2 billing-oncall; single status macro — no per-ticket credits"
}`,
    status: "upserted · confidence ↑",
  },
  {
    kind: "tool",
    at: 36,
    runFor: 1.2,
    server: "memchentic",
    name: "history",
    args: `{
  "id": "…march-outage-macro…",
  "limit": 5
}`,
    status: "done · 22ms",
    meta: "2 revisions",
    lines: [
      { text: "revised_at · body now points customers to /status not March postmortem" },
    ],
  },
  {
    kind: "tool",
    at: 41,
    runFor: 1.4,
    server: "memchentic",
    name: "export",
    args: `{
  "space_scope": "group",
  "tags": ["billing"],
  "limit": 20
}`,
    status: "done · 71ms",
    meta: "14 rows",
  },
  {
    kind: "agent",
    at: 47,
    text: "Customer reply drafted. Memory updated, stale macro flagged, and the next shift starts from the same facts.",
  },
  {
    kind: "agent",
    at: 52,
    text: "Webhook will fan the new decision to our internal agent runtime — no second paste into the ticket bot.",
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
