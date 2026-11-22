import { useEffect, useMemo, useRef, useState } from "react";
import {
  DEMO_MEMORIES_LIST,
  MEMORY_KINDS,
  type MemoryKind,
  type VectorPoint,
} from "../data/showcase";
import { MemoryDetailModal } from "./MemoryDetailModal";

const PAGE_SIZE = 10;

const FILTER_KINDS: Array<"All" | MemoryKind> = [
  "All",
  "fact",
  "preference",
  "decision",
  "instruction",
  "feedback",
  "insight",
  "note",
  "guide",
];

const KIND_SET = new Set<string>(MEMORY_KINDS.map((k) => k.tag));

type ParsedQuery = {
  q: string;
  kind: "" | "entry" | "guide";
  types: MemoryKind[];
  tags: string[];
  spaceScope: "" | "personal" | "group";
};

/** Datadog-ish strip: kind:entry|guide type:<kind> tag:<name> space:personal|group|all + free text. */
function parseFilterQuery(raw: string): ParsedQuery {
  const tokens = raw.trim().split(/\s+/).filter(Boolean);
  const free: string[] = [];
  let kind: "" | "entry" | "guide" = "";
  const types: MemoryKind[] = [];
  const tags: string[] = [];
  let spaceScope: "" | "personal" | "group" = "";

  for (const token of tokens) {
    const colon = token.indexOf(":");
    if (colon <= 0) {
      free.push(token);
      continue;
    }
    const key = token.slice(0, colon).toLowerCase();
    const value = token.slice(colon + 1).trim();
    if (!value) {
      free.push(token);
      continue;
    }
    if (key === "kind" && (value === "entry" || value === "guide")) {
      kind = value;
      continue;
    }
    if (key === "type" && KIND_SET.has(value)) {
      types.push(value as MemoryKind);
      continue;
    }
    if (key === "tag") {
      tags.push(value.toLowerCase());
      continue;
    }
    if (key === "space") {
      if (value === "personal" || value === "group") spaceScope = value;
      else if (value === "all") spaceScope = "";
      continue;
    }
    free.push(token);
  }

  return { q: free.join(" ").toLowerCase(), kind, types, tags, spaceScope };
}

type SpaceFilter = "All" | "personal" | "group";

function matchesRow(
  row: VectorPoint,
  parsed: ParsedQuery,
  typeFilter: "All" | MemoryKind,
  spaceFilter: SpaceFilter,
): boolean {
  if (typeFilter !== "All" && row.kind !== typeFilter) return false;
  if (spaceFilter !== "All" && row.spaceKind !== spaceFilter) return false;
  if (parsed.kind === "guide" && row.kind !== "guide") return false;
  if (parsed.kind === "entry" && row.kind === "guide") return false;
  if (parsed.types.length > 0 && !parsed.types.includes(row.kind)) return false;
  if (parsed.spaceScope && row.spaceKind !== parsed.spaceScope) return false;
  if (parsed.tags.length > 0) {
    const rowTags = row.tags.map((t) => t.toLowerCase());
    if (!parsed.tags.every((t) => rowTags.includes(t))) return false;
  }
  if (parsed.q) {
    const hay = `${row.label} ${row.body} ${row.space} ${row.owner} ${row.tags.join(" ")}`.toLowerCase();
    if (!hay.includes(parsed.q)) return false;
  }
  return true;
}

/**
 * Pitch-site Memories list mock — same DEMO_MEMORIES corpus as the embedding cube.
 */
export function MemoriesConsole() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | MemoryKind>("All");
  const [spaceFilter, setSpaceFilter] = useState<SpaceFilter>("All");
  const [page, setPage] = useState(0);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [selected, setSelected] = useState<VectorPoint | null>(null);

  const parsed = useMemo(() => parseFilterQuery(query), [query]);

  const filtered = useMemo(
    () =>
      DEMO_MEMORIES_LIST.filter((row) =>
        matchesRow(row, parsed, typeFilter, spaceFilter),
      ),
    [parsed, typeFilter, spaceFilter],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  );

  useEffect(() => {
    setPage(0);
  }, [query, typeFilter, spaceFilter]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setActive(true);
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const from = filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const to = Math.min(filtered.length, (safePage + 1) * PAGE_SIZE);

  return (
    <div
      ref={rootRef}
      className={active ? "memories-console is-active" : "memories-console"}
    >
      <div className="memories-console-chrome">
        <h3 className="memories-console-title">Memories</h3>
      </div>

      <div className="memories-console-filter">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter: kind:entry type:fact tag:postgres space:group …"
          aria-label="Filter memories"
        />
        <span className="memories-console-filter-go" aria-hidden="true">
          ✓
        </span>
      </div>

      <div className="memories-console-toolbar">
        <div className="memories-console-filters">
          <label className="memories-console-select">
            <span>Space</span>
            <select
              value={spaceFilter}
              onChange={(e) => setSpaceFilter(e.target.value as SpaceFilter)}
              aria-label="Filter by space"
            >
              <option value="All">All</option>
              <option value="group">Groups</option>
              <option value="personal">Personal</option>
            </select>
          </label>
          <label className="memories-console-select">
            <span>Type</span>
            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as "All" | MemoryKind)
              }
              aria-label="Filter by type"
            >
              {FILTER_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k === "All" ? "All" : k}
                </option>
              ))}
            </select>
          </label>
        </div>
        <span className="memories-console-count">
          {filtered.length.toLocaleString()} match
          {filtered.length === 1 ? "" : "es"}
          {filtered.length > 0
            ? ` · ${from.toLocaleString()}–${to.toLocaleString()}`
            : ""}
        </span>
      </div>

      <div className="memories-console-table-wrap">
        <table className="memories-console-table">
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Type</th>
              <th scope="col">Tags</th>
              <th scope="col">Space</th>
              <th scope="col">Owner</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="memories-console-empty">
                  No memories match this filter.
                </td>
              </tr>
            ) : (
              pageRows.map((row) => {
                const meta = MEMORY_KINDS.find((k) => k.tag === row.kind);
                const on = hoverId === null || hoverId === row.id;
                return (
                  <tr
                    key={row.id}
                    className={
                      on
                        ? "is-on memories-console-row"
                        : "is-dim memories-console-row"
                    }
                    tabIndex={0}
                    role="button"
                    aria-label={`Open ${row.label}`}
                    onMouseEnter={() => setHoverId(row.id)}
                    onMouseLeave={() => setHoverId(null)}
                    onClick={() => setSelected(row)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(row);
                      }
                    }}
                  >
                    <td>
                      <div className="memories-console-row-title">
                        {row.label}
                      </div>
                      <div className="memories-console-row-body">{row.body}</div>
                    </td>
                    <td>
                      <code
                        className={`type-rail-tag kind-chip-${row.kind}`}
                        style={
                          meta ? { borderColor: meta.color } : undefined
                        }
                      >
                        {row.kind}
                      </code>
                    </td>
                    <td>
                      <div className="memories-console-tags">
                        {row.tags.map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                      </div>
                    </td>
                    <td>{row.space}</td>
                    <td>{row.owner}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="memories-console-pager">
        <button
          type="button"
          className="memories-console-page-btn"
          disabled={safePage <= 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          Prev
        </button>
        <span className="memories-console-page-label">
          Page {safePage + 1} of {pageCount}
        </span>
        <button
          type="button"
          className="memories-console-page-btn"
          disabled={safePage >= pageCount - 1}
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
        >
          Next
        </button>
      </div>

      {selected ? (
        <MemoryDetailModal
          memory={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </div>
  );
}
