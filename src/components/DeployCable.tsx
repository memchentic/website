const STEPS = [
  {
    from: "Compose / Helm",
    title: "Deploy",
    body: "Run memchentic where you already operate containers.",
  },
  {
    from: "Cursor · Claude · Copilot",
    title: "Connect",
    body: "Point your MCP client at the endpoint, then Authorize or attach a key.",
  },
  {
    from: "Agents",
    title: "Remember",
    body: "Capture after verification. Recall before rediscovery.",
  },
] as const;

/**
 * Physical “plug into memchentic” journey — replaces the plain 01–02–03 pipe.
 */
export function DeployCable() {
  return (
    <ol className="deploy-cable">
      {STEPS.map((step, i) => (
        <li key={step.title} className="deploy-cable-step">
          <div className="deploy-cable-plug" aria-hidden="true">
            <span className="deploy-cable-from">{step.from}</span>
            <span className="deploy-cable-jack" />
          </div>
          {i < STEPS.length - 1 ? (
            <span className="deploy-cable-wire" aria-hidden="true" />
          ) : null}
          <div className="deploy-cable-copy">
            <span className="deploy-cable-n">0{i + 1}</span>
            <h3 className="deploy-cable-title">{step.title}</h3>
            <p className="deploy-cable-body">{step.body}</p>
          </div>
        </li>
      ))}
      <li className="deploy-cable-hub" aria-hidden="true">
        <span className="deploy-cable-hub-mark">memchentic</span>
      </li>
    </ol>
  );
}
