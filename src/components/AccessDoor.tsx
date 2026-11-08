import { useState } from "react";

const MODES = [
  {
    id: "oauth",
    label: "OAuth",
    title: "Sign in with your IdP",
    body: "Org login or built-in accounts — same principals and sessions either way.",
  },
  {
    id: "harness",
    label: "In-harness",
    title: "Authorize from the client",
    body: "URL-only MCP entry in Cursor and similar, or a personal API key for headless agents.",
  },
  {
    id: "acl",
    label: "Groups & ACL",
    title: "Share only on purpose",
    body: "Personal stays private. Optional groups share intentionally. Server ACL never trusts a client-supplied user id.",
  },
] as const;

/**
 * Auth as a door — flip the lock mode; the same principal badge stays lit.
 */
export function AccessDoor() {
  const [mode, setMode] = useState<(typeof MODES)[number]["id"]>("oauth");
  const active = MODES.find((m) => m.id === mode)!;

  return (
    <div className="access-door">
      <div className="access-door-lock" aria-hidden="true">
        <div className="access-door-dial">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={
                mode === m.id ? "access-door-key is-active" : "access-door-key"
              }
              onClick={() => setMode(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="access-door-badge">
          <span className="access-door-badge-dot" />
          <span>
            principal <strong>you@team</strong>
          </span>
        </div>
      </div>
      <div className="access-door-copy" aria-live="polite">
        <p className="access-door-k">{active.label}</p>
        <h3 className="access-door-title">{active.title}</h3>
        <p className="access-door-body">{active.body}</p>
      </div>
    </div>
  );
}
