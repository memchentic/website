import { LINKS } from "../constants";
import { SessionTrayProvider } from "../context/SessionTrayContext";
import { AccessDoor } from "./AccessDoor";
import { DeployCable } from "./DeployCable";
import { HybridFusion } from "./HybridFusion";
import { KindConstellation } from "./KindConstellation";
import { McpSessionDemo } from "./McpSessionDemo";
import { ProblemTheater } from "./ProblemTheater";
import { Reveal } from "./Reveal";
import { SessionTray } from "./SessionTray";
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
    <SessionTrayProvider>
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
            <div className="hero-scrim" />
          </div>

          <nav className="hero-nav site-shell flex items-center justify-between py-5">
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

          <div className="hero-stage site-shell flex min-h-[calc(100vh-4.5rem)] flex-col justify-center pb-16 pt-8 sm:pb-24">
            <div className="anim-hero-copy flex w-[78%] max-w-[22rem] flex-col items-start gap-5 sm:w-full sm:max-w-md sm:gap-6 md:max-w-xl lg:max-w-3xl lg:flex-row lg:items-center lg:gap-8">
              <div className="anim-mark shrink-0">
                <Mark className="h-20 w-20 drop-shadow-[0_12px_40px_oklch(0_0_0_/_0.55)] sm:h-24 sm:w-24 lg:h-32 lg:w-32" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="mb-3 text-sm font-medium tracking-[0.14em] text-faint uppercase">
                  memchentic
                </p>
                <h1 className="font-display text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl md:text-[3.25rem]">
                  Memory that sticks with your agents
                </h1>
                <p className="hero-lede mt-5 max-w-md text-lg leading-relaxed text-muted text-pretty">
                  Across sessions, tools, and people — so agents stop
                  rediscovering what you already taught them.
                </p>
                <div className="anim-hero-cta mt-8 flex flex-wrap gap-3 sm:mt-10">
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
                  Coding agents lose the preferences you already explained, the
                  decisions your team already made, and the hard-won lessons from
                  last week&apos;s bug hunt.
                </p>
                <p>
                  Shared work makes it worse. One person&apos;s &ldquo;how we do
                  auth here&rdquo; never reaches the next person&apos;s session —
                  until something recalls it.
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
              chat. Hover a kind.
            </p>
            <div className="mt-16 sm:mt-20">
              <KindConstellation />
            </div>
          </div>
        </Reveal>

        <Reveal className="band" id="hybrid">
          <div className="site-shell py-24">
            <p className="mb-3 text-sm font-medium tracking-[0.12em] text-faint uppercase">
              Hybrid retrieval
            </p>
            <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              A real database — relational and vectorized.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
              Memchentic stores memory in Postgres: structured rows you can
              filter, full-text search for exact language, and pgvector
              embeddings for meaning. MCP{" "}
              <code className="hybrid-code">find</code> /{" "}
              <code className="hybrid-code">guide_find</code> run the same
              hybrid path — hard queries and similarity, fused.
            </p>

            <div className="hybrid-stage mt-16 sm:mt-20">
              <VectorSpaceCube />
              <HybridFusion />
            </div>
          </div>
        </Reveal>

        <Reveal className="band band-alt" id="mcp">
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

        <Reveal className="band band-alt" id="why">
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

        <SessionTray />
      </div>
    </SessionTrayProvider>
  );
}
