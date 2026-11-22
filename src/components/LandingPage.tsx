import { LINKS } from "../constants";
import { AccessDoor } from "./AccessDoor";
import { DeployCable } from "./DeployCable";
import { HybridFusion } from "./HybridFusion";
import { CapabilitiesStage } from "./CapabilitiesStage";
import { KindGuidePanel } from "./KindGuidePanel";
import { McpSessionDemo } from "./McpSessionDemo";
import { MemoriesConsole } from "./MemoriesConsole";
import { MetricsConsole } from "./MetricsConsole";
import { ProblemTheater } from "./ProblemTheater";
import { Reveal } from "./Reveal";
import { VectorSpaceCube } from "./VectorSpaceCube";
import { WhyRotator } from "./WhyRotator";

const PRODUCT_FLOW = [
  {
    k: "run",
    title: "You run it",
    body: "Compose or Helm where you already operate.",
  },
  {
    k: "connect",
    title: "Agents connect",
    body: "MCP over streamable HTTP — no glue service.",
  },
  {
    k: "acl",
    title: "ACL holds",
    body: "Personal stays personal; groups stay intentional.",
  },
] as const;

function Mark({ className = "" }: { className?: string }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}mark-white.svg`}
      alt=""
      width={120}
      height={120}
      className={className}
      decoding="async"
    />
  );
}

export function LandingPage() {
  return (
    <>
      <div className="page">
        <header id="top" className="hero">
          <div className="hero-media" aria-hidden="true">
            <img
              src={`${import.meta.env.BASE_URL}screenshots/memories.png`}
              alt=""
              className="hero-shot"
              width={2560}
              height={1440}
              decoding="async"
              fetchPriority="high"
            />
            <div className="hero-scrim" aria-hidden="true">
              <div className="hero-scrim-layer hero-scrim-layer--desktop" />
              <div className="hero-scrim-layer hero-scrim-layer--tablet" />
              <div className="hero-scrim-layer hero-scrim-layer--phone" />
            </div>
          </div>

          <nav className="hero-nav flex items-center justify-between py-5">
            <a
              href="#top"
              className="flex items-center gap-2 text-ink no-underline"
            >
              <img
                src={`${import.meta.env.BASE_URL}mark-white.svg`}
                alt=""
                width={28}
                height={28}
                className="opacity-95"
              />
              <span className="border-l border-[color-mix(in_oklab,currentColor_25%,transparent)] pl-2 text-[0.9375rem] font-semibold tracking-tight">
                memchentic
              </span>
            </a>
            <div className="flex items-center gap-5 text-sm">
              <a
                href={LINKS.docs}
                target="_blank"
                rel="noreferrer"
                className="text-muted no-underline transition-colors hover:text-ink"
              >
                Docs
              </a>
              <a
                href={LINKS.github}
                target="_blank"
                rel="noreferrer"
                className="text-muted no-underline transition-colors hover:text-ink"
              >
                GitHub
              </a>
            </div>
          </nav>

          <div className="hero-stage site-shell flex min-h-[calc(100vh-4.5rem)] flex-col justify-center pt-8">
            <div className="anim-hero-copy flex flex-col items-start lg:flex-row lg:items-center">
              <div className="anim-mark shrink-0">
                <Mark className="hero-mark drop-shadow-[0_12px_40px_oklch(0_0_0_/_0.55)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-3 text-sm font-medium tracking-[0.14em] text-faint uppercase">
                  memchentic
                </p>
                <h1 className="hero-title font-display leading-[1.1] font-semibold tracking-tight text-balance">
                  Memory that sticks with your agents
                </h1>
                <p className="hero-lede mt-5 max-w-md text-lg leading-relaxed text-muted text-pretty">
                  Across sessions, tools, and people — so agents stop
                  rediscovering what you already taught them.
                </p>
                <div className="anim-hero-cta flex flex-wrap gap-3">
                  <a
                    className="btn-primary"
                    href={LINKS.github}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View on GitHub
                  </a>
                  <a
                    className="btn-secondary hero-btn-secondary"
                    href={LINKS.docs}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Read the docs
                  </a>
                </div>
              </div>
            </div>
          </div>
        </header>

        <Reveal>
          <McpSessionDemo />
        </Reveal>

        <Reveal className="band band-alt" id="problem">
          <div className="site-shell grid items-start gap-12 py-24 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="mb-3 text-sm font-medium tracking-[0.12em] text-faint uppercase">
                The problem
              </p>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Brilliant in the moment. Amnesiac the next.
              </h2>
              <div className="mt-8 space-y-5 text-base leading-relaxed text-muted">
                <p>
                  Agents lose the preferences you already explained, the
                  decisions your team already made, and the hard-won lessons from
                  last week&apos;s incident or review — in support, ops, research,
                  or code.
                </p>
                <p>
                  Shared work makes it worse. One person&apos;s runbook or policy
                  never reaches the next person&apos;s session — until something
                  recalls it.
                </p>
              </div>
            </div>
            <ProblemTheater />
          </div>
        </Reveal>

        <Reveal className="band" id="solution">
          <div className="site-shell py-24">
            <p className="mb-3 text-sm font-medium tracking-[0.12em] text-faint uppercase">
              The product
            </p>
            <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              A self-hosted memory service built for agentic work.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
              You run it. Your agents connect to it. They remember what matters,
              find it again later, and respect who is allowed to see what.
            </p>
            <ol className="product-flow mt-16 sm:mt-20">
              {PRODUCT_FLOW.map((item, i) => (
                <li key={item.k} className="product-flow-step">
                  {i > 0 ? (
                    <span className="product-flow-join" aria-hidden="true" />
                  ) : null}
                  <span className="product-flow-k">{item.k}</span>
                  <h3 className="product-flow-title">{item.title}</h3>
                  <p className="product-flow-body">{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>

        <Reveal className="band band-alt" id="memory">
          <div className="site-shell py-24">
            <p className="mb-3 text-sm font-medium tracking-[0.12em] text-faint uppercase">
              Memory model
            </p>
            <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Shaped the way people think — not one blob of text.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
              Agents get a short digest first, then open the full memory when
              they need it — so context stays useful instead of drowning the
              chat. Typed entries, guides, tags, and spaces keep the corpus
              browsable.
            </p>
            <div className="memory-stage mt-10 sm:mt-12">
              <MemoriesConsole />
              <KindGuidePanel />
            </div>
          </div>
        </Reveal>

        <Reveal className="band" id="hybrid">
          <div className="site-shell py-24">
            <p className="mb-3 text-sm font-medium tracking-[0.12em] text-faint uppercase">
              Hybrid retrieval
            </p>
            <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Ask once — get the memory that actually fits.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
              Exact matches, meaning, and structure all weigh in — then weak
              near-duplicates get refused and the rest rerank into a short list
              your agents can trust. Continuity without drowning the next turn
              in almost-right noise.
            </p>

            <div className="hybrid-stage mt-16 sm:mt-20">
              <VectorSpaceCube />
              <HybridFusion />
            </div>
          </div>
        </Reveal>

        <Reveal className="band band-alt" id="capabilities">
          <div className="site-shell py-24">
            <p className="mb-3 text-sm font-medium tracking-[0.12em] text-faint uppercase">
              Beyond remember / find
            </p>
            <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              The rest of the job — after the first save.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
              Memory that lasts has to be audited, pruned, moved, and wired into
              the tools around it. These are the surfaces that keep a corpus
              honest once agents start writing for real.
            </p>
            <div className="mt-12 sm:mt-14">
              <CapabilitiesStage />
            </div>
          </div>
        </Reveal>

        <Reveal className="band" id="mcp">
          <div className="site-shell py-24">
            <p className="mb-3 text-sm font-medium tracking-[0.12em] text-faint uppercase">
              MCP-native
            </p>
            <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              The same application is the MCP server.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
              Point Cursor, Claude Code, Copilot, Codex, or another MCP client at
              it. Every recall tool hits that hybrid Postgres path — not a side
              index glued on later.
            </p>
            <div className="mt-16 sm:mt-20">
              <DeployCable />
            </div>
          </div>
        </Reveal>

        <Reveal className="band" id="access">
          <div className="site-shell py-24">
            <p className="mb-3 text-sm font-medium tracking-[0.12em] text-faint uppercase">
              Access &amp; ACL
            </p>
            <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Sign in how your team already works. Share only what you mean to.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
              Auth is first-class — not a bolted-on admin password. Agents act as
              real users, and every memory read or write goes through server ACL.
            </p>
            <div className="mt-16 sm:mt-20">
              <AccessDoor />
            </div>
          </div>
        </Reveal>

        <Reveal className="band band-alt" id="metrics">
          <div className="site-shell py-24">
            <p className="mb-3 text-sm font-medium tracking-[0.12em] text-faint uppercase">
              Corpus metrics
            </p>
            <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              See the shape of what your agents remember.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
              The console ships a Metrics view — totals, created-over-time,
              entry types, spaces, tags, and creators — scoped by the same ACL
              as every memory read. Operators get a pulse without paging the
              whole corpus.
            </p>
            <div className="mt-10 sm:mt-12">
              <MetricsConsole />
            </div>
          </div>
        </Reveal>

        <Reveal className="band" id="why">
          <div className="site-shell py-24">
            <p className="mb-3 text-sm font-medium tracking-[0.12em] text-faint uppercase">
              Why people adopt it
            </p>
            <WhyRotator />
          </div>
        </Reveal>

        <Reveal className="cta-band" id="get-started">
          <div className="site-shell flex flex-col gap-10 py-28 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <Mark className="mb-8 h-14 w-14 opacity-90" />
              <h2 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Give your agents a place to put what they learn.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted">
                Self-hosted. MCP-native. Postgres under the hood — relational and
                vectorized.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 sm:pb-1">
              <a
                className="btn-primary"
                href={LINKS.github}
                target="_blank"
                rel="noreferrer"
              >
                View on GitHub
              </a>
              <a
                className="btn-secondary"
                href={LINKS.docs}
                target="_blank"
                rel="noreferrer"
              >
                Read the docs
              </a>
            </div>
          </div>
        </Reveal>

        <footer className="border-t border-border">
          <div className="site-shell flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-muted">
              <img
                src={`${import.meta.env.BASE_URL}mark-white.svg`}
                alt=""
                width={20}
                height={20}
                className="opacity-70"
              />
              <span className="text-sm">memchentic</span>
            </div>
            <div className="flex gap-5 text-sm">
              <a
                href={LINKS.docs}
                target="_blank"
                rel="noreferrer"
                className="text-muted no-underline hover:text-ink"
              >
                Docs
              </a>
              <a
                href={LINKS.github}
                target="_blank"
                rel="noreferrer"
                className="text-muted no-underline hover:text-ink"
              >
                GitHub
              </a>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
