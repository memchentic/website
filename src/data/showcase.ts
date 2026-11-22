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
  /** Title shown in the cube tooltip and Memories list. */
  label: string;
  body: string;
  tags: string[];
  space: string;
  spaceKind: "personal" | "group";
  owner: string;
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

const CUBE_SPACES: readonly { name: string; kind: "personal" | "group" }[] = [
  { name: "Personal", kind: "personal" },
  { name: "Platform Engineering", kind: "group" },
  { name: "Payments Core", kind: "group" },
  { name: "Incident Response", kind: "group" },
  { name: "Agent Tooling", kind: "group" },
  { name: "Data Platform", kind: "group" },
];

const CUBE_OWNERS: readonly string[] = [
  "Jordan Lee",
  "Alex Kim",
  "Marcus Chen",
  "Priya Shah",
  "Sofia Ramos",
  "Devon Park",
];

const CUBE_BODIES: readonly string[] = [
  "Captured after verify — keep for the next agent turn.",
  "Standing guidance; confidence rises when it keeps proving useful.",
  "Field-level revision trail stays on this row.",
  "Scoped by space ACL — agents only see what their principal can read.",
  "Digest first; open the full body only when the turn needs it.",
  "Near-dup refuse applies — force only when the memories genuinely differ.",
];

function topicTags(topic: string, scope: string): string[] {
  const base = topic
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9-]/g, ""))
    .filter((w) => w.length > 1)
    .slice(0, 3);
  const extra =
    scope.includes("prod")
      ? "prod"
      : scope.includes("staging")
        ? "staging"
        : scope.includes("eu-west")
          ? "eu-west"
          : scope.includes("us-east")
            ? "us-east"
            : null;
  return extra ? [...base, extra] : base;
}

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
      const topic =
        CUBE_TOPICS[Math.floor(Math.pow(rand(), 1.4) * CUBE_TOPICS.length)];
      const scope = CUBE_SCOPES[Math.floor(rand() * CUBE_SCOPES.length)];
      const label =
        i === 0
          ? KIND_DIGESTS[kind.tag].title
          : templates[Math.floor(rand() * templates.length)].replace(
              "{t}",
              topic,
            ) + scope;
      const topicIdx =
        i === 0
          ? CUBE_TOPICS.findIndex((t) => label.toLowerCase().includes(t.toLowerCase().split(/\s+/)[0]!))
          : CUBE_TOPICS.indexOf(topic);
      const [ox, oy, oz] = topicIdx >= 0 ? topicOffsets[topicIdx] : [0, 0, 0];
      const pull = 0.24;
      const spread = 0.095 + (rand() < 0.08 ? 0.14 : 0);
      const space = CUBE_SPACES[Math.floor(rand() * CUBE_SPACES.length)]!;
      const owner = CUBE_OWNERS[Math.floor(rand() * CUBE_OWNERS.length)]!;
      const body =
        i === 0
          ? KIND_DIGESTS[kind.tag].body
          : CUBE_BODIES[Math.floor(rand() * CUBE_BODIES.length)]!;
      const tags =
        i === 0
          ? kind.tag === "guide"
            ? ["agents", "recall", "guide"]
            : [kind.tag, "runbook"]
          : topicTags(topic, scope);
      if (kind.tag === "guide" && !tags.includes("guide")) tags.push("guide");
      points.push({
        id: `${kind.tag}-${i}`,
        kind: kind.tag,
        x: clampUnit(cx + ox * pull + gaussian(rand) * spread),
        y: clampUnit(cy + oy * pull + gaussian(rand) * spread),
        z: clampUnit(cz + oz * pull + gaussian(rand) * spread),
        label: label.charAt(0).toUpperCase() + label.slice(1),
        body,
        tags,
        space: space.name,
        spaceKind: space.kind,
        owner,
      });
    }
  }
  return points;
}

/** Shared corpus for the embedding cube and Memories console (~2.1k rows). */
export const DEMO_MEMORIES: readonly VectorPoint[] = buildVectorCloud();

/**
 * List order for the Memories console: one of every kind first (so page 1
 * always shows a full type mix), then deterministic shuffled round-robin.
 */
export function mixMemoriesForList(
  rows: readonly VectorPoint[],
): VectorPoint[] {
  const buckets = new Map<MemoryKind, VectorPoint[]>();
  for (const meta of MEMORY_KINDS) buckets.set(meta.tag, []);
  for (const row of rows) buckets.get(row.kind)!.push(row);

  const out: VectorPoint[] = [];
  // Mandatory page-1 seed: exactly one of each type, digest rows first.
  for (const meta of MEMORY_KINDS) {
    const bucket = buckets.get(meta.tag)!;
    if (bucket.length > 0) out.push(bucket.shift()!);
  }

  const rand = mulberry32(7717);
  const shuffleKinds = (): MemoryKind[] => {
    const kinds = MEMORY_KINDS.map((m) => m.tag);
    for (let i = kinds.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = kinds[i]!;
      kinds[i] = kinds[j]!;
      kinds[j] = tmp;
    }
    return kinds;
  };

  for (;;) {
    const order = shuffleKinds();
    let added = false;
    for (const kind of order) {
      const bucket = buckets.get(kind)!;
      if (bucket.length === 0) continue;
      out.push(bucket.shift()!);
      added = true;
    }
    if (!added) break;
  }
  return out;
}

/** Memories console browse order (mixed types; cube still uses DEMO_MEMORIES). */
export const DEMO_MEMORIES_LIST: readonly VectorPoint[] =
  mixMemoriesForList(DEMO_MEMORIES);

export type FusionHit = {
  rank: number;
  title: string;
  kind: MemoryKind;
};

export type FusionRrfHit = FusionHit & { via: string };

export type FusionScenario = {
  /** Short query label shown in the hybrid chrome. */
  query: string;
  sql: readonly FusionHit[];
  fts: readonly FusionHit[];
  vec: readonly FusionHit[];
  rrf: readonly FusionRrfHit[];
};

const hit = (
  rank: number,
  title: string,
  kind: MemoryKind,
): FusionHit => ({ rank, title, kind });

const rrf = (
  rank: number,
  title: string,
  kind: MemoryKind,
  via: string,
): FusionRrfHit => ({ rank, title, kind, via });

/**
 * Replayable hybrid demos — each scenario is a different query + leg mix so
 * replay shows “new” data instead of the same three digests.
 */
export const FUSION_SCENARIOS: readonly FusionScenario[] = [
  {
    query: "ledger lock split-brain",
    sql: [
      hit(1, "Failed approach: shared Redis for ledger locks", "insight"),
      hit(2, "Postgres primary failover runbook", "fact"),
      hit(3, "When paging on datastore, check Patroni", "instruction"),
    ],
    fts: [
      hit(1, "Failed approach: shared Redis for ledger locks", "insight"),
      hit(2, "Session: Redis ledger locks — still abandoned", "insight"),
      hit(3, "Prefer Argo CD sync waves over Helm hooks", "preference"),
    ],
    vec: [
      hit(1, "When changing money paths, require idempotency", "guide"),
      hit(2, "Failed approach: shared Redis for ledger locks", "insight"),
      hit(3, "OIDC groups claim maps to Northline auth", "decision"),
    ],
    rrf: [
      rrf(1, "Failed approach: shared Redis for ledger locks", "insight", "sql+fts+vec"),
      rrf(2, "When changing money paths, require idempotency", "guide", "vec"),
      rrf(3, "Postgres primary failover runbook", "fact", "sql"),
    ],
  },
  {
    query: "Patroni before failover",
    sql: [
      hit(1, "When paging on datastore, check Patroni", "instruction"),
      hit(2, "Postgres primary failover runbook", "fact"),
      hit(3, "DNS TTL slowed last failover", "insight"),
    ],
    fts: [
      hit(1, "Postgres primary failover runbook", "fact"),
      hit(2, "When paging on datastore, check Patroni", "instruction"),
      hit(3, "Scratch: Patroni checklist from war room", "note"),
    ],
    vec: [
      hit(1, "When paging on datastore, check Patroni", "instruction"),
      hit(2, "Never promote a replica by hand mid-incident", "instruction"),
      hit(3, "Postgres primary owns its own schema", "fact"),
    ],
    rrf: [
      rrf(1, "When paging on datastore, check Patroni", "instruction", "sql+fts+vec"),
      rrf(2, "Postgres primary failover runbook", "fact", "sql+fts"),
      rrf(3, "Never promote a replica by hand mid-incident", "instruction", "vec"),
    ],
  },
  {
    query: "Argo sync waves",
    sql: [
      hit(1, "Prefer Argo CD sync waves over Helm hooks", "preference"),
      hit(2, "Helm hooks hide ordering in prod", "feedback"),
      hit(3, "Platform Application uses wave 2 for CRDs", "fact"),
    ],
    fts: [
      hit(1, "Prefer Argo CD sync waves over Helm hooks", "preference"),
      hit(2, "Prefer Argo waves — same note, older wording", "preference"),
      hit(3, "When editing Helm charts, diff the rendered output", "guide"),
    ],
    vec: [
      hit(1, "When editing Helm charts, diff the rendered output", "guide"),
      hit(2, "Prefer Argo CD sync waves over Helm hooks", "preference"),
      hit(3, "Pin chart images by tag, let Renovate bump", "decision"),
    ],
    rrf: [
      rrf(1, "Prefer Argo CD sync waves over Helm hooks", "preference", "sql+fts+vec"),
      rrf(2, "When editing Helm charts, diff the rendered output", "guide", "fts+vec"),
      rrf(3, "Helm hooks hide ordering in prod", "feedback", "sql"),
    ],
  },
  {
    query: "OIDC group claims",
    sql: [
      hit(1, "OIDC groups claim maps to Northline auth groups", "decision"),
      hit(2, "Auth service terminates TLS at the edge", "fact"),
      hit(3, "Never invent per-app role tables", "instruction"),
    ],
    fts: [
      hit(1, "OIDC groups claim maps to Northline auth groups", "decision"),
      hit(2, "OIDC groups → auth groups (draft)", "note"),
      hit(3, "Prefer claim mapping once at the edge", "preference"),
    ],
    vec: [
      hit(1, "When touching auth, run the checklist", "guide"),
      hit(2, "OIDC groups claim maps to Northline auth groups", "decision"),
      hit(3, "Store tenant id on every auth row", "decision"),
    ],
    rrf: [
      rrf(1, "OIDC groups claim maps to Northline auth groups", "decision", "sql+fts+vec"),
      rrf(2, "When touching auth, run the checklist", "guide", "vec"),
      rrf(3, "Never invent per-app role tables", "instruction", "sql"),
    ],
  },
  {
    query: "idempotent payments",
    sql: [
      hit(1, "When changing money paths, require idempotency", "guide"),
      hit(2, "Payments ledger owns its own schema", "fact"),
      hit(3, "Feedback: retry loop ignored Idempotency-Key", "feedback"),
    ],
    fts: [
      hit(1, "When changing money paths, require idempotency", "guide"),
      hit(2, "Idempotency note — same guide, weaker wording", "guide"),
      hit(3, "Clearing batch window is 02:00–04:00 UTC", "fact"),
    ],
    vec: [
      hit(1, "Failed approach: shared Redis for ledger locks", "insight"),
      hit(2, "When changing money paths, require idempotency", "guide"),
      hit(3, "Prefer advisory locks over Redis for money", "preference"),
    ],
    rrf: [
      rrf(1, "When changing money paths, require idempotency", "guide", "sql+fts+vec"),
      rrf(2, "Feedback: retry loop ignored Idempotency-Key", "feedback", "sql"),
      rrf(3, "Failed approach: shared Redis for ledger locks", "insight", "vec"),
    ],
  },
  {
    query: "vault lease race",
    sql: [
      hit(1, "Feedback: vault lease renewal raced deploy", "feedback"),
      hit(2, "Rotate credentials after any leak", "instruction"),
      hit(3, "Deploy Job must not renew leases inline", "decision"),
    ],
    fts: [
      hit(1, "Feedback: vault lease renewal raced deploy", "feedback"),
      hit(2, "Vault lease race — duplicate write", "feedback"),
      hit(3, "Renew before rollout, not in the cutover Job", "insight"),
    ],
    vec: [
      hit(1, "When deploys fail, read events first", "guide"),
      hit(2, "Feedback: vault lease renewal raced deploy", "feedback"),
      hit(3, "Pin images by tag, let Renovate bump", "decision"),
    ],
    rrf: [
      rrf(1, "Feedback: vault lease renewal raced deploy", "feedback", "sql+fts+vec"),
      rrf(2, "Renew before rollout, not in the cutover Job", "insight", "fts"),
      rrf(3, "Rotate credentials after any leak", "instruction", "sql"),
    ],
  },
  {
    query: "CI pipeline flakes",
    sql: [
      hit(1, "CI flake was a timezone fixture", "insight"),
      hit(2, "When CI tests flake, pin the seed", "guide"),
      hit(3, "Move CI to GitHub Actions", "decision"),
    ],
    fts: [
      hit(1, "When CI tests flake, pin the seed", "guide"),
      hit(2, "CI flake was a timezone fixture", "insight"),
      hit(3, "Timezone fixture note (scratch)", "note"),
    ],
    vec: [
      hit(1, "Prefer small PRs when touching CI", "preference"),
      hit(2, "When CI tests flake, pin the seed", "guide"),
      hit(3, "CI pipeline caps requests at 100 per page", "fact"),
    ],
    rrf: [
      rrf(1, "When CI tests flake, pin the seed", "guide", "sql+fts+vec"),
      rrf(2, "CI flake was a timezone fixture", "insight", "sql+fts"),
      rrf(3, "Prefer small PRs when touching CI", "preference", "vec"),
    ],
  },
  {
    query: "ingress TLS edge",
    sql: [
      hit(1, "Ingress terminates TLS at the edge", "fact"),
      hit(2, "Never terminate TLS twice in the mesh", "instruction"),
      hit(3, "Feedback: wrong namespace in ingress rollout", "feedback"),
    ],
    fts: [
      hit(1, "Ingress terminates TLS at the edge", "fact"),
      hit(2, "TLS at the edge — same fact, old title", "fact"),
      hit(3, "Prefer one cert issuer per cluster", "preference"),
    ],
    vec: [
      hit(1, "When ingress deploys fail, read events first", "guide"),
      hit(2, "Ingress terminates TLS at the edge", "fact"),
      hit(3, "Adopt cert-manager for ingress issuers", "decision"),
    ],
    rrf: [
      rrf(1, "Ingress terminates TLS at the edge", "fact", "sql+fts+vec"),
      rrf(2, "Never terminate TLS twice in the mesh", "instruction", "sql"),
      rrf(3, "When ingress deploys fail, read events first", "guide", "vec"),
    ],
  },
  {
    query: "Kafka consumer lag",
    sql: [
      hit(1, "Kafka consumers OOM from unbounded buffer", "insight"),
      hit(2, "Kafka consumers own their own schema", "fact"),
      hit(3, "Always test consumers against a throwaway topic", "instruction"),
    ],
    fts: [
      hit(1, "Kafka consumers OOM from unbounded buffer", "insight"),
      hit(2, "Unbounded buffer — near-dup insight", "insight"),
      hit(3, "Prefer lag alerts tagged with owner", "preference"),
    ],
    vec: [
      hit(1, "When Kafka latency spikes, check pool saturation", "guide"),
      hit(2, "Kafka consumers OOM from unbounded buffer", "insight"),
      hit(3, "Use cursor pagination in consumer APIs", "decision"),
    ],
    rrf: [
      rrf(1, "Kafka consumers OOM from unbounded buffer", "insight", "sql+fts+vec"),
      rrf(2, "When Kafka latency spikes, check pool saturation", "guide", "vec"),
      rrf(3, "Always test consumers against a throwaway topic", "instruction", "sql"),
    ],
  },
  {
    query: "feature flag cutover",
    sql: [
      hit(1, "Prefer feature flags over branches for cutover", "preference"),
      hit(2, "Hard-cut v1 instead of dual-serving", "decision"),
      hit(3, "Feedback: flag default flipped in wrong env", "feedback"),
    ],
    fts: [
      hit(1, "Prefer feature flags over branches for cutover", "preference"),
      hit(2, "Flags over branches — duplicate preference", "preference"),
      hit(3, "Feature flags config lives in the config service", "fact"),
    ],
    vec: [
      hit(1, "When editing feature flags, diff the rendered output", "guide"),
      hit(2, "Prefer feature flags over branches for cutover", "preference"),
      hit(3, "Hard-cut v1 instead of dual-serving", "decision"),
    ],
    rrf: [
      rrf(1, "Prefer feature flags over branches for cutover", "preference", "sql+fts+vec"),
      rrf(2, "Hard-cut v1 instead of dual-serving", "decision", "sql+vec"),
      rrf(3, "Feedback: flag default flipped in wrong env", "feedback", "sql"),
    ],
  },
  {
    query: "search API pagination",
    sql: [
      hit(1, "Use cursor pagination in search API", "decision"),
      hit(2, "Search API caps requests at 100 per page", "fact"),
      hit(3, "Never force offset past 10k rows", "instruction"),
    ],
    fts: [
      hit(1, "Use cursor pagination in search API", "decision"),
      hit(2, "Cursor pagination decision — older draft", "decision"),
      hit(3, "Prefer typed boundaries in search handlers", "preference"),
    ],
    vec: [
      hit(1, "Adopt pgvector for search similarity", "decision"),
      hit(2, "Use cursor pagination in search API", "decision"),
      hit(3, "When search latency spikes, check pool saturation", "guide"),
    ],
    rrf: [
      rrf(1, "Use cursor pagination in search API", "decision", "sql+fts+vec"),
      rrf(2, "Search API caps requests at 100 per page", "fact", "sql"),
      rrf(3, "When search latency spikes, check pool saturation", "guide", "vec"),
    ],
  },
  {
    query: "Redis cache key miss",
    sql: [
      hit(1, "Feedback: cache key missed the tenant", "feedback"),
      hit(2, "Redis cache owns its own schema", "fact"),
      hit(3, "Always include tenant in cache keys", "instruction"),
    ],
    fts: [
      hit(1, "Feedback: cache key missed the tenant", "feedback"),
      hit(2, "Tenant missing from cache key — dup feedback", "feedback"),
      hit(3, "Prefer short TTLs on staging cache keys", "preference"),
    ],
    vec: [
      hit(1, "Failed approach: shared Redis for ledger locks", "insight"),
      hit(2, "Feedback: cache key missed the tenant", "feedback"),
      hit(3, "When Redis latency spikes, check pool saturation", "guide"),
    ],
    rrf: [
      rrf(1, "Feedback: cache key missed the tenant", "feedback", "sql+fts+vec"),
      rrf(2, "Always include tenant in cache keys", "instruction", "sql"),
      rrf(3, "When Redis latency spikes, check pool saturation", "guide", "vec"),
    ],
  },
  {
    query: "object storage backups",
    sql: [
      hit(1, "Object storage backups land nightly", "fact"),
      hit(2, "Audit bucket kept until Q3", "note"),
      hit(3, "Never delete backup prefixes by hand", "instruction"),
    ],
    fts: [
      hit(1, "Object storage backups land nightly", "fact"),
      hit(2, "Nightly backups — same fact, shorter title", "fact"),
      hit(3, "Prefer cold storage for weekly snapshots", "preference"),
    ],
    vec: [
      hit(1, "When storage deploys fail, read events first", "guide"),
      hit(2, "Object storage backups land nightly", "fact"),
      hit(3, "Pin storage images by tag, let Renovate bump", "decision"),
    ],
    rrf: [
      rrf(1, "Object storage backups land nightly", "fact", "sql+fts+vec"),
      rrf(2, "Never delete backup prefixes by hand", "instruction", "sql"),
      rrf(3, "Prefer cold storage for weekly snapshots", "preference", "fts"),
    ],
  },
  {
    query: "mobile API readiness",
    sql: [
      hit(1, "Mobile API readiness broke on sidecar order", "insight"),
      hit(2, "Check open incidents before deploying mobile API", "instruction"),
      hit(3, "Mobile API runs three replicas behind the gateway", "fact"),
    ],
    fts: [
      hit(1, "Mobile API readiness broke on sidecar order", "insight"),
      hit(2, "Sidecar order — near-dup insight", "insight"),
      hit(3, "Prefer sync waves for mobile sidecars", "preference"),
    ],
    vec: [
      hit(1, "When mobile API deploys fail, read events first", "guide"),
      hit(2, "Mobile API readiness broke on sidecar order", "insight"),
      hit(3, "Run mobile migrations as a pre-deploy Job", "decision"),
    ],
    rrf: [
      rrf(1, "Mobile API readiness broke on sidecar order", "insight", "sql+fts+vec"),
      rrf(2, "When mobile API deploys fail, read events first", "guide", "vec"),
      rrf(3, "Check open incidents before deploying mobile API", "instruction", "sql"),
    ],
  },
  {
    query: "billing export window",
    sql: [
      hit(1, "Billing export window is 02:00–04:00 UTC", "fact"),
      hit(2, "Never open ledger writes mid-export", "instruction"),
      hit(3, "Partner SFTP note for clearing batches", "decision"),
    ],
    fts: [
      hit(1, "Billing export window is 02:00–04:00 UTC", "fact"),
      hit(2, "Export window fact — duplicate row", "fact"),
      hit(3, "Prefer numbered steps in billing runbooks", "preference"),
    ],
    vec: [
      hit(1, "When changing money paths, require idempotency", "guide"),
      hit(2, "Billing export window is 02:00–04:00 UTC", "fact"),
      hit(3, "Failed approach: shared Redis for ledger locks", "insight"),
    ],
    rrf: [
      rrf(1, "Billing export window is 02:00–04:00 UTC", "fact", "sql+fts+vec"),
      rrf(2, "Never open ledger writes mid-export", "instruction", "sql"),
      rrf(3, "When changing money paths, require idempotency", "guide", "vec"),
    ],
  },
  {
    query: "alerting ownership",
    sql: [
      hit(1, "Tag every alert with an owner", "instruction"),
      hit(2, "Alerting is paged through platform rotation", "fact"),
      hit(3, "Feedback: alert fired without runbook link", "feedback"),
    ],
    fts: [
      hit(1, "Tag every alert with an owner", "instruction"),
      hit(2, "Owner tag on alerts — dup instruction", "instruction"),
      hit(3, "Keep alerting dashboards one per team", "preference"),
    ],
    vec: [
      hit(1, "When alerts fire, recall prior decisions first", "guide"),
      hit(2, "Tag every alert with an owner", "instruction"),
      hit(3, "Prefer small PRs when touching alerting", "preference"),
    ],
    rrf: [
      rrf(1, "Tag every alert with an owner", "instruction", "sql+fts+vec"),
      rrf(2, "Feedback: alert fired without runbook link", "feedback", "sql"),
      rrf(3, "When alerts fire, recall prior decisions first", "guide", "vec"),
    ],
  },
  {
    query: "DNS failover TTL",
    sql: [
      hit(1, "Failover slowed by DNS TTL", "insight"),
      hit(2, "DNS terminates at the edge resolver", "fact"),
      hit(3, "Lower TTL before planned failovers", "instruction"),
    ],
    fts: [
      hit(1, "Failover slowed by DNS TTL", "insight"),
      hit(2, "DNS TTL insight — near-dup", "insight"),
      hit(3, "Prefer 60s TTL on cutover records", "preference"),
    ],
    vec: [
      hit(1, "When DNS changes, check open incidents first", "guide"),
      hit(2, "Failover slowed by DNS TTL", "insight"),
      hit(3, "Postgres primary failover runbook", "fact"),
    ],
    rrf: [
      rrf(1, "Failover slowed by DNS TTL", "insight", "sql+fts+vec"),
      rrf(2, "Lower TTL before planned failovers", "instruction", "sql"),
      rrf(3, "Prefer 60s TTL on cutover records", "preference", "fts"),
    ],
  },
  {
    query: "job queue backoff",
    sql: [
      hit(1, "Feedback: retry loop ignored backoff", "feedback"),
      hit(2, "Job queue caps concurrency at 32", "fact"),
      hit(3, "Always set max attempts on new jobs", "instruction"),
    ],
    fts: [
      hit(1, "Feedback: retry loop ignored backoff", "feedback"),
      hit(2, "Backoff ignored — duplicate feedback", "feedback"),
      hit(3, "Prefer exponential backoff with jitter", "preference"),
    ],
    vec: [
      hit(1, "When job latency spikes, check pool saturation", "guide"),
      hit(2, "Feedback: retry loop ignored backoff", "feedback"),
      hit(3, "Use cursor pagination in job APIs", "decision"),
    ],
    rrf: [
      rrf(1, "Feedback: retry loop ignored backoff", "feedback", "sql+fts+vec"),
      rrf(2, "Prefer exponential backoff with jitter", "preference", "fts"),
      rrf(3, "When job latency spikes, check pool saturation", "guide", "vec"),
    ],
  },
  {
    query: "tenant onboarding ACL",
    sql: [
      hit(1, "Store tenant id on every onboarding row", "decision"),
      hit(2, "Tenant onboarding owns its own schema", "fact"),
      hit(3, "Never skip ACL checks in onboarding tools", "instruction"),
    ],
    fts: [
      hit(1, "Store tenant id on every onboarding row", "decision"),
      hit(2, "Tenant id on rows — older decision draft", "decision"),
      hit(3, "Prefer typed boundaries in onboarding APIs", "preference"),
    ],
    vec: [
      hit(1, "When touching onboarding auth, run the checklist", "guide"),
      hit(2, "Store tenant id on every onboarding row", "decision"),
      hit(3, "OIDC groups claim maps to Northline auth groups", "decision"),
    ],
    rrf: [
      rrf(1, "Store tenant id on every onboarding row", "decision", "sql+fts+vec"),
      rrf(2, "Never skip ACL checks in onboarding tools", "instruction", "sql"),
      rrf(3, "When touching onboarding auth, run the checklist", "guide", "vec"),
    ],
  },
  {
    query: "ML embedding cold start",
    sql: [
      hit(1, "ML embeddings latency from cold model load", "insight"),
      hit(2, "ML embeddings config lives in the config service", "fact"),
      hit(3, "Always warm the model before peak traffic", "instruction"),
    ],
    fts: [
      hit(1, "ML embeddings latency from cold model load", "insight"),
      hit(2, "Cold model load — near-dup insight", "insight"),
      hit(3, "Prefer one embedding model per env", "preference"),
    ],
    vec: [
      hit(1, "Adopt pgvector for embedding similarity", "decision"),
      hit(2, "ML embeddings latency from cold model load", "insight"),
      hit(3, "When embedding latency spikes, check pool saturation", "guide"),
    ],
    rrf: [
      rrf(1, "ML embeddings latency from cold model load", "insight", "sql+fts+vec"),
      rrf(2, "Adopt pgvector for embedding similarity", "decision", "vec"),
      rrf(3, "Always warm the model before peak traffic", "instruction", "sql"),
    ],
  },
  {
    query: "agent recall first",
    sql: [
      hit(1, "When starting agent work, recall first", "guide"),
      hit(2, "Prefer guide_find before rediscovery", "preference"),
      hit(3, "Feedback: agent skipped recall and re-derived ACL", "feedback"),
    ],
    fts: [
      hit(1, "When starting agent work, recall first", "guide"),
      hit(2, "Recall first — duplicate guide wording", "guide"),
      hit(3, "TTL on staging memory keys is 14d", "note"),
    ],
    vec: [
      hit(1, "When starting agent work, recall first", "guide"),
      hit(2, "When unfamiliar paths appear, guide_find first", "guide"),
      hit(3, "OIDC groups claim maps to Northline auth groups", "decision"),
    ],
    rrf: [
      rrf(1, "When starting agent work, recall first", "guide", "sql+fts+vec"),
      rrf(2, "Feedback: agent skipped recall and re-derived ACL", "feedback", "sql"),
      rrf(3, "Prefer guide_find before rediscovery", "preference", "sql"),
    ],
  },
];

/** @deprecated Prefer FUSION_SCENARIOS — kept as the first demo pack. */
export const FUSION_LEGS = FUSION_SCENARIOS[0]!;
