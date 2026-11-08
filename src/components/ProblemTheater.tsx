import { useEffect, useRef, useState } from "react";
import { useSessionTray } from "../context/SessionTrayContext";

type Beat = "paste" | "wipe" | "recall";

/**
 * Scroll-driven problem story: paste → context cleared → guide_find recall.
 */
export function ProblemTheater() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [beat, setBeat] = useState<Beat>("paste");
  const { collect } = useSessionTray();
  const recalled = useRef(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setBeat("recall");
      return;
    }

    let step = 0;
    const order: Beat[] = ["paste", "wipe", "recall"];
    const id = window.setInterval(() => {
      step = (step + 1) % order.length;
      setBeat(order[step]);
    }, 2800);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
      },
      { threshold: 0.2 },
    );
    io.observe(el);

    return () => {
      window.clearInterval(id);
      io.disconnect();
    };
  }, []);

  useEffect(() => {
    if (beat !== "recall" || recalled.current) return;
    recalled.current = true;
    collect({
      id: "problem-recall",
      kind: "insight",
      label: "Failed approach: shared Redis for ledger locks",
    });
  }, [beat, collect]);

  return (
    <div
      ref={rootRef}
      className={`problem-theater is-${beat}`}
      role="img"
      aria-label="Illustration: pasted context is cleared between chats, then recovered via guide_find"
    >
      <div className="problem-theater-stages">
        <div className="problem-stage problem-stage-paste">
          <div className="problem-stage-chrome">
            <span>session A</span>
            <span className="problem-stage-tag">pasting…</span>
          </div>
          <p className="problem-stage-line">
            Remember: we use Postgres advisory locks, not Redis, for ledger
            writes…
          </p>
          <p className="problem-stage-line problem-stage-line-dim">
            And Prefer Argo CD sync waves over Helm hooks…
          </p>
        </div>

        <div className="problem-stage problem-stage-wipe">
          <div className="problem-stage-chrome">
            <span>new chat</span>
            <span className="problem-stage-tag is-bad">context cleared</span>
          </div>
          <p className="problem-stage-empty">∅ agent forgot everything</p>
        </div>

        <div className="problem-stage problem-stage-recall">
          <div className="problem-stage-chrome">
            <span>session B · MCP</span>
            <span className="problem-stage-tag is-ok">guide_find</span>
          </div>
          <div className="problem-stage-hit">
            <code className="type-rail-tag kind-chip-insight">insight</code>
            <div>
              <strong>Failed approach: shared Redis for ledger locks</strong>
              <span>
                Split-brain under partition — stay on Postgres advisory locks.
              </span>
            </div>
          </div>
        </div>
      </div>

      <ol className="problem-theater-legend">
        <li className={beat === "paste" ? "is-on" : undefined}>01 Paste</li>
        <li className={beat === "wipe" ? "is-on" : undefined}>02 Wipe</li>
        <li className={beat === "recall" ? "is-on" : undefined}>03 Recall</li>
      </ol>
    </div>
  );
}
