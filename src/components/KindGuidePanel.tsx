import { useEffect, useMemo, useState } from "react";
import {
  DEMO_MEMORIES_LIST,
  MEMORY_KINDS,
  type MemoryKind,
} from "../data/showcase";

const CYCLE_MS = 10000;
const EXAMPLES_PER_KIND = 4;

type KindCopy = {
  blurb: string;
  when: string;
  mechanics: string;
};

/** Deeper copy for the type rail — what it is, when to write it, how it behaves. */
const KIND_COPY: Record<MemoryKind, KindCopy> = {
  fact: {
    blurb:
      "A stable truth about the world or the codebase — something that should still be true next week.",
    when: "Write a fact when agents keep rediscovering the same invariant, runbook step, or ownership edge.",
    mechanics:
      "Stored as an entry. Digests stay short; open the full body only when the turn needs the detail.",
  },
  preference: {
    blurb:
      "How a person or team wants work done — taste, workflow, and defaults that are not universal law.",
    when: "Write a preference when the same style note would otherwise be re-explained every session.",
    mechanics:
      "Usually personal or team-scoped. Agents should weigh it, not treat it as a hard ACL rule.",
  },
  decision: {
    blurb:
      "A choice that was made, plus the rationale — so the next agent does not reopen a settled debate.",
    when: "Write a decision after a deliberate trade-off: architecture, vendor, schema, or process cutover.",
    mechanics:
      "Keep the why with the what. Later revise if the decision changes — do not leave a silent fork.",
  },
  instruction: {
    blurb:
      "A standing always / never rule that should constrain the next action, not just inform it.",
    when: "Write an instruction when breaking the rule has caused real damage or near-misses.",
    mechanics:
      "Treat as advice from the author, not a system override. Prefer guides when the pattern is reusable advice.",
  },
  feedback: {
    blurb:
      "A correction after a mistake — the concrete “do not do that again” signal from a failed turn.",
    when: "Write feedback right after verify fails or a human corrects the agent, while the failure is fresh.",
    mechanics:
      "Short and specific beats a lecture. Pair with an instruction or guide when the lesson should stick broadly.",
  },
  insight: {
    blurb:
      "A non-obvious lesson from investigation — root cause, failed approach, or surprising mechanism.",
    when: "Write an insight when rediscovery would cost another hunt; skip generic programming knowledge.",
    mechanics:
      "Capture the condition that made it true. Failed approaches belong here so they are not retried cold.",
  },
  note: {
    blurb:
      "Durable scratch that does not fit a sharper type — env wiring, temporary limits, handoff crumbs.",
    when: "Write a note when it must survive the session but is not a fact, decision, or standing rule.",
    mechanics:
      "Prefer a shorter TTL when the note is env-local. Promote to a sharper type once the shape is clear.",
  },
  guide: {
    blurb:
      "Reusable when-X / do-Y / avoid-Z advice that gets stronger the more it proves useful.",
    when: "Write a guide when the same playbook should fire before rediscovery across agents and spaces.",
    mechanics:
      "Near-dup upserts raise confidence. Agents should guide_find early; suggest does not write by itself.",
  },
};

/**
 * Right-rail type explainer — cycles kinds with deeper copy and several digests.
 */
export function KindGuidePanel() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const kind = MEMORY_KINDS[i]!;
  const copy = KIND_COPY[kind.tag];
  const step = `${String(i + 1).padStart(2, "0")} / ${String(MEMORY_KINDS.length).padStart(2, "0")}`;

  const examples = useMemo(() => {
    const rows = DEMO_MEMORIES_LIST.filter((row) => row.kind === kind.tag);
    const digest = rows.find((row) => row.id.endsWith("-0"));
    const rest = rows.filter((row) => row !== digest);
    const picked = digest ? [digest, ...rest] : rest;
    return picked.slice(0, EXAMPLES_PER_KIND);
  }, [kind.tag]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || paused) return;
    const id = window.setInterval(() => {
      setI((n) => (n + 1) % MEMORY_KINDS.length);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <aside
      className="kind-guide"
      aria-label="Memory types"
      style={{ ["--kind-accent" as string]: kind.color }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div className="kind-guide-top">
        <p className="kind-guide-kicker">Types</p>
        <span className="kind-guide-step" aria-hidden="true">
          {step}
        </span>
      </div>

      <div
        className="kind-guide-stage"
        aria-live="polite"
        key={kind.tag}
        style={{ ["--kind-accent" as string]: kind.color }}
      >
        <code className={`type-rail-tag kind-chip-${kind.tag} kind-guide-chip`}>
          {kind.tag}
        </code>
        <h3 className="kind-guide-name">{kind.name}</h3>
        <p className="kind-guide-blurb">{copy.blurb}</p>
        <p className="kind-guide-when">{copy.when}</p>
        <p className="kind-guide-mechanics">{copy.mechanics}</p>

        <div className="kind-guide-examples">
          <p className="kind-guide-example-label">Example digests</p>
          <ul className="kind-guide-example-list">
            {examples.map((ex) => (
              <li key={ex.id} className="kind-guide-example">
                <p className="kind-guide-example-title">{ex.label}</p>
                <p className="kind-guide-example-body">{ex.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="kind-guide-dots" role="tablist" aria-label="Memory types">
        {MEMORY_KINDS.map((meta, idx) => (
          <button
            key={meta.tag}
            type="button"
            role="tab"
            aria-selected={idx === i}
            aria-label={meta.name}
            className={
              idx === i ? "kind-guide-dot is-active" : "kind-guide-dot"
            }
            style={{ ["--kind-accent" as string]: meta.color }}
            onClick={() => setI(idx)}
          />
        ))}
      </div>

      <div
        className={
          paused ? "kind-guide-progress is-paused" : "kind-guide-progress"
        }
        key={`bar-${kind.tag}-${paused ? "p" : "r"}`}
        aria-hidden="true"
      />
    </aside>
  );
}
