import { useEffect, useState } from "react";

const ITEMS = [
  {
    idx: "01",
    title: "Continuity",
    body: "Across sessions and tools — without pasting the same brief every time.",
  },
  {
    idx: "02",
    title: "Hybrid retrieval",
    body: "Relational filters, full-text, and vectors — fused so recall stays fast and current.",
  },
  {
    idx: "03",
    title: "Auth that fits the harness",
    body: "OAuth or built-in login, Authorize in-client or a personal API key — then groups and ACL.",
  },
  {
    idx: "04",
    title: "Operator-owned",
    body: "Run it where you already run containers. Your data stays yours.",
  },
  {
    idx: "05",
    title: "Agent-native",
    body: "MCP-first, with a polished console when humans need to look.",
  },
] as const;

/**
 * One big claim with rotating proof lines — quieter than a five-up grid.
 */
export function WhyRotator() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      setI((n) => (n + 1) % ITEMS.length);
    }, 3400);
    return () => window.clearInterval(id);
  }, []);

  const item = ITEMS[i];

  return (
    <div className="why-rotator">
      <p className="why-rotator-claim">Continuity without rediscovery.</p>
      <div className="why-rotator-card" aria-live="polite" key={item.idx}>
        <span className="why-rotator-idx">{item.idx}</span>
        <div>
          <h3 className="why-rotator-title">{item.title}</h3>
          <p className="why-rotator-body">{item.body}</p>
        </div>
      </div>
      <div className="why-rotator-dots" role="tablist" aria-label="Reasons">
        {ITEMS.map((it, idx) => (
          <button
            key={it.idx}
            type="button"
            role="tab"
            aria-selected={idx === i}
            className={idx === i ? "is-on" : undefined}
            onClick={() => setI(idx)}
          />
        ))}
      </div>
    </div>
  );
}
