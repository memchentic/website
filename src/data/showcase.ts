/** Shared showcase content for interactive pitch-site demos. */

export type MemoryKind =
  | "fact"
  | "preference"
  | "decision"
  | "instruction"
  | "feedback"
  | "insight"
  | "note"
  | "guide";

export type KindMeta = {
  tag: MemoryKind;
  name: string;
  blurb: string;
  /** Canvas / SVG stroke-friendly oklch-ish hex */
  color: string;
};

export const MEMORY_KINDS: readonly KindMeta[] = [
  {
    tag: "fact",
    name: "Fact",
    blurb: "A stable truth about the world or the codebase.",
    color: "#8eb4f0",
  },
  {
    tag: "preference",
    name: "Preference",
    blurb: "How someone wants work done.",
    color: "#c4a0e8",
  },
  {
    tag: "decision",
    name: "Decision",
    blurb: "A choice and the rationale behind it.",
    color: "#e0c070",
  },
  {
    tag: "instruction",
    name: "Instruction",
    blurb: "A standing always / never rule.",
    color: "#7dcfb0",
  },
  {
    tag: "feedback",
    name: "Feedback",
    blurb: "A correction after a mistake.",
    color: "#e09080",
  },
  {
    tag: "insight",
    name: "Insight",
    blurb: "A non-obvious lesson from the last hunt.",
    color: "#a898e8",
  },
  {
    tag: "note",
    name: "Note",
    blurb: "Anything durable that does not fit cleanly above.",
    color: "#9aa3b2",
  },
  {
    tag: "guide",
    name: "Guide",
    blurb: "Reusable advice that gets stronger the more it proves useful.",
    color: "#6ec8d8",
  },
] as const;

export const KIND_DIGESTS: Record<
  MemoryKind,
  { title: string; body: string }
> = {
  fact: {
    title: "Postgres primary failover runbook (eu-west-1)",
    body: "Patroni first — never promote a replica by hand mid-incident.",
  },
  preference: {
    title: "Prefer Argo CD sync waves over Helm hooks",
    body: "Hooks hide ordering; waves stay visible in the Application.",
  },
  decision: {
    title: "OIDC groups claim maps to Northline auth groups",
    body: "Ship claim → group once; do not invent per-app role tables.",
  },
  instruction: {
    title: "When paging on datastore, check Patroni before failover",
    body: "Standing always: verify cluster health before you touch DNS.",
  },
  feedback: {
    title: "Feedback: vault lease renewal raced deploy",
    body: "Renew before rollout — not in the same Job as the cutover.",
  },
  insight: {
    title: "Failed approach: shared Redis for ledger locks",
    body: "Split-brain under partition — stay on Postgres advisory locks.",
  },
  note: {
    title: "TTL on staging memory keys is 14d",
    body: "Not product policy — just how this env is wired today.",
  },
  guide: {
    title: "When starting agent work in northline repos, recall first",
    body: "guide_find before rediscovery — then remember after verify.",
  },
};

/** Deterministic pseudo-random in [0, 1). */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export type VectorPoint = {
  id: string;
  kind: MemoryKind;
  x: number;
  y: number;
  z: number;
  label: string;
};

/** Cluster centers in unit cube [-1,1]^3 — kinds that “mean similar things” sit near each other. */
const CLUSTER_CENTERS: Record<MemoryKind, [number, number, number]> = {
  guide: [-0.55, 0.45, 0.35],
  insight: [-0.4, 0.55, -0.2],
  feedback: [-0.15, 0.65, -0.55],
  decision: [0.35, 0.4, 0.45],
  instruction: [0.5, 0.15, 0.55],
  fact: [0.55, -0.35, 0.25],
  preference: [-0.45, -0.5, 0.4],
  note: [0.1, -0.55, -0.45],
};

/** Rough row counts per kind for a busy team's memory store. */
const CUBE_KIND_COUNTS: Record<MemoryKind, number> = {
  fact: 420,
  note: 380,
  insight: 300,
  guide: 240,
  decision: 220,
  instruction: 200,
  preference: 180,
  feedback: 160,
};

/** Subsystems memories are about; each pulls its rows into a sub-cluster. */
const CUBE_TOPICS: readonly string[] = [
  "payments ledger",
  "auth service",
  "ingress",
  "Postgres primary",
  "Redis cache",
  "CI pipeline",
  "Helm chart",
  "search API",
  "billing export",
  "alerting",
  "job queue",
  "DNS",
  "object storage",
  "feature flags",
  "tenant onboarding",
  "Kafka consumers",
  "ML embeddings",
  "mobile API",
];

const CUBE_SCOPES: readonly string[] = ["", " (prod)", " (staging)", " (eu-west)", " (us-east)"];

/** Title templates per kind; `{t}` is replaced with a topic. */
const CUBE_TEMPLATES: Record<MemoryKind, readonly string[]> = {
  fact: [
    "{t} runs three replicas behind the gateway",
    "{t} owns its own schema",
    "{t} logs ship to the central stream",
    "{t} is paged through the platform rotation",
    "{t} config lives in the config service",
    "{t} backups land in cold storage nightly",
    "{t} caps requests at 100 per page",
    "{t} terminates TLS at the edge",
  ],
  preference: [
    "Prefer small PRs when touching {t}",
    "Keep {t} dashboards one per team",
    "Favor typed boundaries in {t}",
    "Prefer feature flags over branches for {t}",
    "Write {t} runbooks as numbered steps",
    "Run linters before {t} review",
  ],
  decision: [
    "Adopt pgvector for {t} similarity",
    "Move {t} CI to GitHub Actions",
    "Store tenant id on every {t} row",
    "Use cursor pagination in {t}",
    "Hard-cut {t} v1 instead of dual-serving",
    "Run {t} migrations as a pre-deploy Job",
    "Pin {t} images by tag, let Renovate bump",
  ],
  instruction: [
    "Always test {t} against a throwaway DB",
    "Never force-push the {t} release branch",
    "Check open incidents before deploying {t}",
    "Recall prior decisions before editing {t}",
    "Tag every {t} alert with an owner",
    "Rotate {t} credentials after any leak",
  ],
  feedback: [
    "Feedback: {t} health check hit the DB",
    "Feedback: {t} retry loop ignored backoff",
    "Feedback: wrong namespace in {t} rollout",
    "Feedback: {t} cache key missed the tenant",
    "Feedback: {t} migration locked a hot table",
    "Feedback: {t} log line leaked a header",
  ],
  insight: [
    "{t} latency came from cold model load",
    "{t} flake was a timezone fixture",
    "{t} OOM traced to an unbounded buffer",
    "{t} 502s were pool exhaustion",
    "{t} failover slowed by DNS TTL",
    "Failed approach: sharding {t} by region",
    "{t} readiness broke on sidecar order",
  ],
  note: [
    "{t} load-test results, March run",
    "{t} maintenance window calendar",
    "Scratch notes on the {t} redesign",
    "{t} vendor sandbox limit is 10 req/s",
    "{t} audit bucket kept until Q3",
    "{t} on-call handoff notes",
    "{t} TTL on memory keys is 14d",
  ],
  guide: [
    "When {t} deploys fail, read events first",
    "When adding to {t}, mirror it as an MCP tool",
    "When {t} latency spikes, check pool saturation",
    "When editing {t}, diff the rendered output",
    "When {t} tests flake, pin the seed",
    "When touching {t} auth, run the checklist",
  ],
};

/** Standard normal sample via Box–Muller. */
function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

const clampUnit = (v: number) => Math.max(-0.98, Math.min(0.98, v));

/** Deterministic, production-sized embedding cloud: kind clusters with topic sub-clusters. */
export function buildVectorCloud(): VectorPoint[] {
  const topicRand = mulberry32(4242);
  const topicOffsets = CUBE_TOPICS.map(() => {
    const v = [gaussian(topicRand), gaussian(topicRand), gaussian(topicRand)];
    const n = Math.hypot(v[0], v[1], v[2]) || 1;
    return v.map((c) => c / n) as [number, number, number];
  });

  const points: VectorPoint[] = [];
  for (const kind of MEMORY_KINDS) {
    const rand = mulberry32(kind.tag.length * 97 + kind.tag.charCodeAt(0) * 31 + 13);
    const [cx, cy, cz] = CLUSTER_CENTERS[kind.tag];
    const templates = CUBE_TEMPLATES[kind.tag];
    const count = CUBE_KIND_COUNTS[kind.tag];
    for (let i = 0; i < count; i++) {
      const label =
        i === 0
          ? KIND_DIGESTS[kind.tag].title
          : templates[Math.floor(rand() * templates.length)].replace(
              "{t}",
              CUBE_TOPICS[Math.floor(Math.pow(rand(), 1.4) * CUBE_TOPICS.length)],
            ) + CUBE_SCOPES[Math.floor(rand() * CUBE_SCOPES.length)];
      const topicIdx = CUBE_TOPICS.findIndex((t) => label.includes(t));
      const [ox, oy, oz] = topicIdx >= 0 ? topicOffsets[topicIdx] : [0, 0, 0];
      const pull = 0.24;
      const spread = 0.095 + (rand() < 0.08 ? 0.14 : 0);
      points.push({
        id: `${kind.tag}-${i}`,
        kind: kind.tag,
        x: clampUnit(cx + ox * pull + gaussian(rand) * spread),
        y: clampUnit(cy + oy * pull + gaussian(rand) * spread),
        z: clampUnit(cz + oz * pull + gaussian(rand) * spread),
        label: label.charAt(0).toUpperCase() + label.slice(1),
      });
    }
  }
  return points;
}

export const FUSION_LEGS = {
  sql: [
    { rank: 1, title: "Failed approach: shared Redis for ledger locks", kind: "insight" as MemoryKind },
    { rank: 2, title: "Postgres primary failover runbook", kind: "fact" as MemoryKind },
    { rank: 3, title: "When paging on datastore, check Patroni", kind: "instruction" as MemoryKind },
  ],
  fts: [
    { rank: 1, title: "Failed approach: shared Redis for ledger locks", kind: "insight" as MemoryKind },
    { rank: 2, title: "Session: Redis ledger locks — still abandoned", kind: "insight" as MemoryKind },
    { rank: 3, title: "Prefer Argo CD sync waves over Helm hooks", kind: "preference" as MemoryKind },
  ],
  vec: [
    { rank: 1, title: "When changing money paths, require idempotency", kind: "guide" as MemoryKind },
    { rank: 2, title: "Failed approach: shared Redis for ledger locks", kind: "insight" as MemoryKind },
    { rank: 3, title: "OIDC groups claim maps to Northline auth", kind: "decision" as MemoryKind },
  ],
  rrf: [
    { rank: 1, title: "Failed approach: shared Redis for ledger locks", kind: "insight" as MemoryKind, via: "sql+fts+vec" },
    { rank: 2, title: "When changing money paths, require idempotency", kind: "guide" as MemoryKind, via: "vec" },
    { rank: 3, title: "Postgres primary failover runbook", kind: "fact" as MemoryKind, via: "sql" },
  ],
} as const;
