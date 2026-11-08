import { LINKS } from "../constants";
import { Reveal } from "./Reveal";

const ENTRY_TYPES = [
  { name: "Facts & decisions", blurb: "What is true, and what you already chose." },
  { name: "Preferences & instructions", blurb: "How you want the agent to work." },
  {
    name: "Insights, feedback & notes",
    blurb: "Lessons from the last bug hunt and catch-alls.",
  },
  {
    name: "Guides",
    blurb: "Reusable advice that gets stronger the more it proves useful.",
  },
] as const;

const WHY = [
  {
    title: "Continuity",
    body: "Across sessions and tools — without pasting the same brief every time.",
  },
  {
    title: "Multi-user by design",
    body: "Personal isolation, optional shared groups, ACL enforced on the server.",
  },
  {
    title: "Operator-owned",
    body: "Run it where you already run containers. Your data stays yours.",
  },
  {
    title: "Agent-native",
    body: "MCP-first, with a polished console when humans need to look.",
  },
] as const;

function Mark({ className = "" }: { className?: string }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}mark-white.svg`}
      alt=""
      width={112}
      height={112}
      className={className}
      decoding="async"
    />
  );
}

export function LandingPage() {
  return (
    <>
      <div className="site-atmosphere" aria-hidden="true" />
      <div className="site-content">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <a
            href="#top"
            className="flex items-center gap-2.5 text-ink no-underline"
          >
            <img
              src={`${import.meta.env.BASE_URL}mark-white.svg`}
              alt=""
              width={28}
              height={28}
              className="opacity-95"
            />
            <span className="text-[0.9375rem] font-semibold tracking-tight">
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

        <header
          id="top"
          className="mx-auto flex min-h-[calc(100vh-4.5rem)] max-w-5xl flex-col justify-center px-6 pb-24 pt-8"
        >
          <div className="flex items-center gap-6 sm:gap-8">
            <div className="anim-mark shrink-0">
              <Mark className="h-20 w-20 drop-shadow-[0_12px_40px_oklch(0_0_0_/_0.45)] sm:h-28 sm:w-28" />
            </div>
            <div className="anim-hero-copy min-w-0 max-w-2xl">
              <p className="mb-3 text-sm font-medium tracking-[0.14em] text-faint uppercase">
                memchentic
              </p>
              <h1 className="font-display text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl md:text-[3.25rem]">
                Memory that sticks with your agents
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted text-pretty">
                Across sessions, tools, and people — so agents stop rediscovering
                what you already taught them.
              </p>
            </div>
          </div>
          <div className="anim-hero-cta mt-10 flex flex-wrap gap-3">
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
        </header>

        <hr className="section-rule mx-auto max-w-5xl" />

        <Reveal className="mx-auto max-w-5xl px-6 py-24" id="problem">
          <p className="mb-3 text-sm font-medium tracking-[0.12em] text-faint uppercase">
            The problem
          </p>
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Brilliant in the moment. Amnesiac the next.
          </h2>
          <div className="mt-8 max-w-2xl space-y-5 text-base leading-relaxed text-muted">
            <p>
              Coding agents lose the preferences you already explained, the
              decisions your team already made, and the hard-won lessons from
              last week&apos;s bug hunt. You end up repeating yourself, pasting
              the same context into every chat, and watching the agent reinvent
              choices you thought were settled.
            </p>
            <p>
              Shared work makes it worse. One person&apos;s &ldquo;how we do auth
              here&rdquo; never reaches the next person&apos;s session. There is
              no durable place for{" "}
              <em className="text-ink not-italic">your</em> memory and{" "}
              <em className="text-ink not-italic">your team&apos;s</em> memory
              that agents can actually use.
            </p>
          </div>
        </Reveal>

        <hr className="section-rule mx-auto max-w-5xl" />

        <Reveal className="mx-auto max-w-5xl px-6 py-24" id="solution">
          <p className="mb-3 text-sm font-medium tracking-[0.12em] text-faint uppercase">
            The product
          </p>
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            A self-hosted memory service built for agentic work.
          </h2>
          <div className="mt-8 max-w-2xl space-y-5 text-base leading-relaxed text-muted">
            <p>
              You run it. Your agents connect to it. They remember what matters,
              find it again later, and respect who is allowed to see what.
            </p>
            <p>
              Personal memory stays private to you. Optional groups let a team
              share a collection without turning every note into a free-for-all.
              A web console is there when you want to browse; day to day, the
              agents do the remembering.
            </p>
          </div>
        </Reveal>

        <hr className="section-rule mx-auto max-w-5xl" />

        <Reveal className="mx-auto max-w-5xl px-6 py-24" id="memory">
          <p className="mb-3 text-sm font-medium tracking-[0.12em] text-faint uppercase">
            Memory model
          </p>
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Shaped the way people think — not one blob of text.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
            Search is hybrid: plain language and meaning. Agents get a short
            digest first, then open the full memory when they need it — so
            context stays useful instead of drowning the chat.
          </p>
          <ul className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {ENTRY_TYPES.map((item) => (
              <li key={item.name} className="list-none border-t border-border pt-5">
                <h3 className="text-base font-semibold tracking-tight text-ink">
                  {item.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.blurb}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>

        <hr className="section-rule mx-auto max-w-5xl" />

        <Reveal className="mx-auto max-w-5xl px-6 py-24" id="product">
          <p className="mb-3 text-sm font-medium tracking-[0.12em] text-faint uppercase">
            The console
          </p>
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Browse what agents remembered — by person and by group.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted">
            Entries, guides, owners, and spaces in one greyscale console. Shared
            groups keep team knowledge out of anyone&apos;s personal silo.
          </p>
          <figure className="mt-12">
            <div className="shot-frame">
              <img
                src={`${import.meta.env.BASE_URL}screenshots/memories.png`}
                alt="memchentic Memories page listing enterprise guides, decisions, and insights across shared groups"
                width={1440}
                height={900}
                loading="lazy"
                decoding="async"
              />
            </div>
            <figcaption className="shot-caption">
              Memories — hybrid search across personal and group spaces
            </figcaption>
          </figure>
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <figure>
              <div className="shot-frame">
                <img
                  src={`${import.meta.env.BASE_URL}screenshots/groups.png`}
                  alt="memchentic Groups page showing Platform Engineering, Payments Core, Incident Response, and Agent Tooling"
                  width={1440}
                  height={900}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <figcaption className="shot-caption">
                Groups — shared collections with membership and roles
              </figcaption>
            </figure>
            <figure>
              <div className="shot-frame">
                <img
                  src={`${import.meta.env.BASE_URL}screenshots/group-detail.png`}
                  alt="Platform Engineering group detail with Jordan Lee, Priya Shah, Marcus Chen, and Alex Kim"
                  width={1440}
                  height={900}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <figcaption className="shot-caption">
                Group detail — who can see shared memory
              </figcaption>
            </figure>
          </div>
        </Reveal>

        <hr className="section-rule mx-auto max-w-5xl" />

        <Reveal className="mx-auto max-w-5xl px-6 py-24" id="mcp">
          <p className="mb-3 text-sm font-medium tracking-[0.12em] text-faint uppercase">
            MCP-native
          </p>
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            The same application is the MCP server.
          </h2>
          <div className="mt-8 max-w-2xl space-y-5 text-base leading-relaxed text-muted">
            <p>
              Point Cursor, Claude Code, Copilot, Codex, or another MCP client
              at it; authenticate; and the agent can save and recall without a
              separate glue layer.
            </p>
            <p>
              You are not bolting memory onto the model with prompts alone. You
              are giving the agent a real place to put knowledge — with isolation
              and a clear contract.
            </p>
          </div>
          <ol className="mt-14 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Deploy",
                body: "Run memchentic where you already operate containers.",
              },
              {
                step: "02",
                title: "Connect",
                body: "Point your MCP client at the streamable HTTP endpoint.",
              },
              {
                step: "03",
                title: "Remember",
                body: "Agents capture after verification and recall before rediscovery.",
              },
            ].map((item) => (
              <li key={item.step} className="list-none">
                <span className="font-mono text-xs tracking-wider text-faint">
                  {item.step}
                </span>
                <h3 className="mt-3 text-lg font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>

        <hr className="section-rule mx-auto max-w-5xl" />

        <Reveal className="mx-auto max-w-5xl px-6 py-24" id="why">
          <p className="mb-3 text-sm font-medium tracking-[0.12em] text-faint uppercase">
            Why people adopt it
          </p>
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Continuity without rediscovery.
          </h2>
          <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {WHY.map((item) => (
              <li key={item.title} className="list-none">
                <h3 className="text-lg font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </Reveal>

        <hr className="section-rule mx-auto max-w-5xl" />

        <Reveal className="mx-auto max-w-5xl px-6 py-28" id="get-started">
          <div className="max-w-2xl">
            <Mark className="mb-8 h-16 w-16 opacity-90" />
            <h2 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Give your agents a place to put what they learn.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted">
              Clone the repo, bring it up with Compose or Helm, connect an MCP
              client, and stop re-teaching the same lessons.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
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
          <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={`${import.meta.env.BASE_URL}mark-white.svg`}
                alt=""
                width={22}
                height={22}
                className="opacity-70"
              />
              <span className="text-sm text-muted">
                memchentic — memory for agents
              </span>
            </div>
            <div className="flex gap-5 text-sm">
              <a
                href={LINKS.docs}
                target="_blank"
                rel="noreferrer"
                className="text-faint no-underline hover:text-muted"
              >
                Docs
              </a>
              <a
                href={LINKS.github}
                target="_blank"
                rel="noreferrer"
                className="text-faint no-underline hover:text-muted"
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
