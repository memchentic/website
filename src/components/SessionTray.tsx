import { useSessionTray } from "../context/SessionTrayContext";

/**
 * Sticky “what this page taught the agent” tray — chips accumulate as the
 * visitor interacts with kinds, fusion, and the vector cube.
 */
export function SessionTray() {
  const { chips, clear } = useSessionTray();

  if (chips.length === 0) return null;

  return (
    <aside className="session-tray" aria-live="polite">
      <div className="session-tray-inner site-shell">
        <div className="session-tray-meta">
          <span className="session-tray-k">working set</span>
          <span className="session-tray-count">{chips.length} memories</span>
        </div>
        <ul className="session-tray-chips">
          {chips.map((chip) => (
            <li key={chip.id}>
              <code className={`type-rail-tag kind-chip-${chip.kind}`}>
                {chip.kind}
              </code>
              <span className="session-tray-label">{chip.label}</span>
            </li>
          ))}
        </ul>
        <button type="button" className="session-tray-clear" onClick={clear}>
          Clear
        </button>
      </div>
    </aside>
  );
}
