"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogoMark } from "@/components/logo";
import { track } from "@/lib/analytics";

function BadgePreview() {
  const W = 480;
  const H = 140;
  const score = 94;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = circumference - (score / 100) * circumference;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      className="rounded-xl"
    >
      <defs>
        <filter id="hp-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="hp-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.03" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" mode="overlay" />
        </filter>
        <linearGradient id="hp-shimmer" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5cf07e" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#5cf07e" />
        </linearGradient>
        <radialGradient id="hp-bg-glow" cx="0.15" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#5cf07e" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#1a1b26" stopOpacity="0" />
        </radialGradient>
        <clipPath id="hp-card-clip">
          <rect x="0" y="0" width={W} height={H} rx="12" />
        </clipPath>
      </defs>

      <rect x="0" y="0" width={W} height={H} rx="12" fill="#1a1b26" />
      <rect x="0" y="0" width={W} height={H} rx="12" fill="url(#hp-bg-glow)" />
      <rect x="0.5" y="0.5" width={W - 1} height={H - 1} rx="12" stroke="#2e3044" strokeWidth="1" fill="none" />
      <rect x="0" y="0" width={W} height="2.5" fill="url(#hp-shimmer)" opacity="0.8" clipPath="url(#hp-card-clip)" />
      <rect x="0" y="0" width={W} height={H} rx="12" filter="url(#hp-noise)" opacity="0.5" />

      {/* Score ring */}
      <g transform={`translate(52, ${H / 2})`}>
        <circle cx="0" cy="0" r={radius} stroke="#282a3a" strokeWidth="5" fill="none" />
        <circle
          cx="0" cy="0" r={radius}
          stroke="#5cf07e"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={scoreOffset}
          transform="rotate(-90)"
          filter="url(#hp-glow)"
        />
        <text x="0" y="2" textAnchor="middle" dominantBaseline="middle"
          fontFamily="ui-monospace,SFMono-Regular,Menlo,monospace" fontWeight="900" fontSize="18"
          fill="#5cf07e">{score}</text>
        <text x="0" y={radius + 14} textAnchor="middle"
          fontFamily="ui-monospace,SFMono-Regular,Menlo,monospace" fontWeight="700" fontSize="7"
          fill="#5a5e73" letterSpacing="1.5">SCORE</text>
      </g>

      <line x1="100" y1="22" x2="100" y2={H - 22} stroke="#2e3044" strokeWidth="1" />

      {/* Content */}
      <g transform="translate(116, 0)">
        <g transform="translate(0, 22)">
          <rect x="0" y="0" width="16" height="16" rx="4" fill="#5cf07e" opacity="0.15" />
          <text x="8" y="12" textAnchor="middle" fontSize="10" fill="#5cf07e">&#10003;</text>
          <text x="22" y="12"
            fontFamily="ui-monospace,SFMono-Regular,Menlo,monospace" fontWeight="800" fontSize="12"
            fill="#5cf07e" filter="url(#hp-glow)">100% HUMAN VERIFIED</text>
        </g>

        <text x="0" y="56"
          fontFamily="ui-monospace,SFMono-Regular,Menlo,monospace" fontWeight="700" fontSize="13"
          fill="#e0e0ee">@yourname</text>

        <text x="0" y="76"
          fontFamily="ui-monospace,SFMono-Regular,Menlo,monospace" fontWeight="400" fontSize="11"
          fill="#8b8fa3">Add sliding window rate limiter to API gateway</text>

        <g transform="translate(0, 96)">
          <text x="0" y="0"
            fontFamily="ui-monospace,SFMono-Regular,Menlo,monospace" fontWeight="500" fontSize="9"
            fill="#a78bfa">acme/api</text>
          <text x="50" y="0"
            fontFamily="ui-monospace,SFMono-Regular,Menlo,monospace" fontWeight="400" fontSize="9"
            fill="#5a5e73">Apr 14, 2026 · 1m 42s</text>
        </g>

        <g transform="translate(240, 106)">
          <text fontFamily="ui-monospace,SFMono-Regular,Menlo,monospace" fontSize="9" fill="#5a5e73">
            <tspan fill="#5a5e73">&lt;</tspan>
            <tspan fontWeight="900" fill="#3ab858">PRs</tspan>
            <tspan fontWeight="700" fill="#8b8fa3">.md</tspan>
            <tspan fill="#5a5e73">/&gt;</tspan>
          </text>
        </g>
      </g>
    </svg>
  );
}

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  function handleSignUp() {
    if (session?.user) {
      track("cta_clicked", { action: "dashboard" });
      router.push("/dashboard");
    } else {
      track("cta_clicked", { action: "sign_up" });
      signIn("github", { callbackUrl: "/accept-terms" });
    }
  }

  function handleSignIn() {
    track("cta_clicked", { action: "sign_in" });
    signIn("github", { callbackUrl: "/dashboard" });
  }

  return (
    <div className="flex flex-col">
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden px-4 pt-16 pb-20 sm:pt-24 sm:pb-32">
        {/* Gradient orbs */}
        <div
          className="absolute top-[-200px] left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full blur-[120px] -z-10"
          style={{ background: "oklch(82% 0.22 145 / 0.07)" }}
        />
        <div
          className="absolute top-[100px] right-[-200px] h-[400px] w-[400px] rounded-full blur-[100px] -z-10"
          style={{ background: "oklch(70% 0.2 280 / 0.06)" }}
        />

        {/* Grid lines */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: `
              linear-gradient(oklch(25% 0.01 260 / 0.5) 1px, transparent 1px),
              linear-gradient(90deg, oklch(25% 0.01 260 / 0.5) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
          }}
        />

        <div className="relative mx-auto max-w-3xl text-center">
          {/* Badge pill — hide logo on mobile (redundant with header) */}
          <div
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1 sm:mb-8 sm:gap-2.5 sm:px-4 sm:py-1.5"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
            }}
          >
            <span className="hidden sm:inline-flex"><LogoMark /></span>
            <span className="font-mono text-[10px] font-medium sm:text-[11px]" style={{ color: "var(--color-text-muted)" }}>
              open-source &middot; zero cost &middot; bring your own key
            </span>
          </div>

          {/* Main headline */}
          <h1
            className="text-[2.5rem] font-extrabold leading-[1.05] tracking-tight sm:text-7xl"
            style={{ letterSpacing: "-0.04em" }}
          >
            <span style={{ color: "var(--color-text)" }}>The Turing Test</span>
            <br />
            <span
              className="inline-block"
              style={{
                background: "linear-gradient(135deg, var(--color-neon), var(--color-accent))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              for Pull Requests
            </span>
          </h1>

          <p
            className="mx-auto mt-4 max-w-xl text-sm leading-relaxed sm:mt-6 sm:text-lg"
            style={{ color: "var(--color-text-muted)" }}
          >
            Anyone can merge AI-generated code. Fewer can explain it.
            <br className="hidden sm:block" />
            3 questions from your actual diff. 3 minutes. One badge that proves you meant it.
          </p>

          {/* CTA row */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:justify-center">
            <button
              onClick={handleSignUp}
              className="btn-primary group relative w-full overflow-hidden rounded-lg px-8 py-3.5 font-mono text-sm font-bold transition-all sm:w-auto"
            >
              {session?.user ? "Go to Dashboard" : "Create free account"}
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-0.5">&rarr;</span>
            </button>
            {!session?.user && (
              <button
                onClick={handleSignIn}
                className="btn-outline w-full rounded-lg px-8 py-3.5 font-mono text-sm font-medium transition-all sm:w-auto"
              >
                Sign in
              </button>
            )}
            {session?.user && (
              <a
                href="#how-it-works"
                className="btn-outline w-full rounded-lg px-8 py-3.5 font-mono text-sm font-medium transition-all sm:w-auto"
              >
                How it works
              </a>
            )}
          </div>

          {/* Works via row */}
          <p className="mt-4 font-mono text-[11px] sm:mt-5" style={{ color: "var(--color-text-dim)" }}>
            Works via{" "}
            <span style={{ color: "var(--color-text-muted)" }}>Web</span>
            <span className="mx-2">&middot;</span>
            <span style={{ color: "var(--color-text-muted)" }}>CLI</span>
            <span className="mx-2">&middot;</span>
            <span style={{ color: "var(--color-text-muted)" }}>MCP&thinsp;/&thinsp;IDE</span>
            <span className="mx-2">&middot;</span>
            <span style={{ color: "var(--color-text-muted)" }}>GitHub&thinsp;Action</span>
          </p>

          {/* Terminal preview */}
          <div
            className="mx-auto mt-10 max-w-lg rounded-xl border overflow-hidden text-left sm:mt-16"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
              boxShadow: "var(--shadow-elevated)",
            }}
          >
            {/* Title bar */}
            <div
              className="flex items-center gap-2 border-b px-3 py-2 sm:px-4 sm:py-2.5"
              style={{ borderColor: "var(--color-border-subtle)" }}
            >
              <span className="h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3" style={{ background: "oklch(65% 0.22 25)" }} />
              <span className="h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3" style={{ background: "oklch(78% 0.16 70)" }} />
              <span className="h-2.5 w-2.5 rounded-full sm:h-3 sm:w-3" style={{ background: "oklch(72% 0.18 145)" }} />
              <span className="ml-2 font-mono text-[9px] sm:text-[10px]" style={{ color: "var(--color-text-dim)" }}>
                prs.md — challenge
              </span>
            </div>
            {/* Terminal content */}
            <div className="p-3 font-mono text-[11px] leading-relaxed space-y-1.5 sm:p-5 sm:text-xs sm:space-y-2">
              <p style={{ color: "var(--color-text-dim)" }}>
                <span style={{ color: "var(--color-neon)" }}>$</span>{" "}
                <span className="hidden sm:inline">prs-md https://github.com/acme/api/pull/247</span>
                <span className="sm:hidden">prs-md .../acme/api/pull/247</span>
              </p>
              <p style={{ color: "var(--color-text-muted)" }}>
                Fetching diff... <span style={{ color: "var(--color-neon)" }}>done</span>
              </p>
              <p style={{ color: "var(--color-text-muted)" }}>Generating questions...</p>
              <div className="mt-2 rounded-lg border p-2.5 sm:mt-3 sm:p-3" style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-surface-raised)" }}>
                <p style={{ color: "var(--color-accent)" }}>Q1:</p>
                <p style={{ color: "var(--color-text)" }}>
                  Why does the new rate limiter use a sliding window instead of fixed buckets?
                </p>
              </div>
              <div className="rounded-lg border p-2.5 sm:p-3" style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-surface-raised)" }}>
                <p style={{ color: "var(--color-accent)" }}>Q2:</p>
                <p style={{ color: "var(--color-text)" }}>
                  What happens to in-flight requests when the Redis connection drops?
                </p>
              </div>
              <div className="rounded-lg border p-2.5 sm:p-3" style={{ borderColor: "oklch(78% 0.16 70 / 0.3)", background: "var(--color-surface-raised)" }}>
                <p style={{ color: "var(--color-warning)" }}>Q3 (trap):</p>
                <p style={{ color: "var(--color-text)" }}>
                  Which config option did you add to disable the cache warmup on deploy?
                </p>
              </div>
              <p className="mt-1.5 sm:mt-2" style={{ color: "var(--color-text-dim)" }}>
                Timer: <span style={{ color: "var(--color-neon)" }}>3:00</span> &middot; Type your answers below
                <span className="cursor-blink" />
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section
        id="how-it-works"
        className="relative border-t px-4 py-16 sm:py-24"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        <div className="mx-auto max-w-4xl">
          <p className="text-center font-mono text-[10px] font-medium uppercase tracking-widest mb-2 sm:text-xs sm:mb-3" style={{ color: "var(--color-neon)" }}>
            Process
          </p>
          <h2 className="text-center text-2xl font-bold tracking-tight mb-10 sm:text-4xl sm:mb-16">
            From PR link to verified badge
          </h2>

          <div className="grid gap-px grid-cols-2 sm:grid-cols-4 rounded-xl overflow-hidden border" style={{ borderColor: "var(--color-border)", background: "var(--color-border-subtle)" }}>
            {[
              {
                num: "01",
                title: "Drop a PR link",
                desc: "Paste any GitHub PR URL — into the dashboard, CLI, or your editor.",
              },
              {
                num: "02",
                title: "Questions generated",
                desc: "Your LLM reads the diff and writes 3 targeted questions — plus a trap.",
              },
              {
                num: "03",
                title: "Answer under pressure",
                desc: "Three minutes. No AI assist, no copy-paste. Just what you know.",
              },
              {
                num: "04",
                title: "Earn your badge",
                desc: "Pass and get a permanent proof page your reviewers can verify.",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="relative p-4 sm:p-8"
                style={{ background: "var(--color-surface)" }}
              >
                <span className="block font-mono text-[9px] font-bold uppercase tracking-widest mb-2 sm:text-[10px] sm:mb-4" style={{ color: "var(--color-text-dim)" }}>
                  Step {step.num}
                </span>
                <h3 className="text-xs font-bold mb-1 sm:text-sm">{step.title}</h3>
                <p className="text-[11px] leading-relaxed sm:text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WORKS EVERYWHERE ─── */}
      <section
        className="border-t px-4 py-16 sm:py-24"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        <div className="mx-auto max-w-4xl">
          <p className="text-center font-mono text-[10px] font-medium uppercase tracking-widest mb-2 sm:text-xs sm:mb-3" style={{ color: "var(--color-neon)" }}>
            Integrations
          </p>
          <h2 className="text-center text-2xl font-bold tracking-tight mb-3 sm:text-4xl sm:mb-4">
            Works wherever you do
          </h2>
          <p className="text-center text-sm mb-10 sm:text-base sm:mb-14" style={{ color: "var(--color-text-muted)" }}>
            Web dashboard, terminal, or straight from your editor — pick your workflow.
          </p>

          {/* Horizontal scroll on mobile, grid on sm+ */}
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
            {/* Web */}
            <div
              className="flex w-[280px] shrink-0 flex-col rounded-xl border p-5 snap-start sm:w-auto sm:p-6"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-surface)",
              }}
            >
              <div
                className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg font-mono text-[10px] font-black sm:mb-4 sm:h-10 sm:w-10 sm:text-xs"
                style={{ background: "var(--color-neon-glow)", color: "var(--color-neon)" }}
              >
                WEB
              </div>
              <h3 className="text-sm font-bold mb-1.5 sm:mb-2">Web Dashboard</h3>
              <p className="text-[11px] leading-relaxed flex-1 sm:text-xs" style={{ color: "var(--color-text-muted)" }}>
                Paste a URL, pick your LLM, answer in the browser. No install, no config — just start.
              </p>
              <div
                className="mt-3 rounded-lg border px-3 py-2 font-mono text-[10px] sm:mt-4"
                style={{
                  borderColor: "var(--color-border-subtle)",
                  background: "var(--color-surface-raised)",
                  color: "var(--color-text-dim)",
                }}
              >
                prs.md/dashboard
              </div>
            </div>

            {/* CLI */}
            <div
              className="flex w-[280px] shrink-0 flex-col rounded-xl border p-5 snap-start sm:w-auto sm:p-6"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-surface)",
              }}
            >
              <div
                className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg font-mono text-sm font-black sm:mb-4 sm:h-10 sm:w-10"
                style={{ background: "var(--color-neon-glow)", color: "var(--color-neon)" }}
              >
                $
              </div>
              <h3 className="text-sm font-bold mb-1.5 sm:mb-2">Command Line</h3>
              <p className="text-[11px] leading-relaxed flex-1 sm:text-xs" style={{ color: "var(--color-text-muted)" }}>
                One command, zero ceremony. Run it in your terminal, pipe it into your workflow, or wire it into CI.
              </p>
              <div
                className="mt-3 rounded-lg border px-3 py-2 font-mono text-[10px] sm:mt-4"
                style={{
                  borderColor: "var(--color-border-subtle)",
                  background: "var(--color-surface-raised)",
                  color: "var(--color-text-dim)",
                }}
              >
                <span style={{ color: "var(--color-neon)" }}>$</span>{" "}
                <span style={{ color: "var(--color-text-muted)" }}>prs-md &lt;pr-url&gt;</span>
              </div>
            </div>

            {/* MCP */}
            <div
              className="flex w-[280px] shrink-0 flex-col rounded-xl border p-5 snap-start sm:w-auto sm:p-6"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-surface)",
              }}
            >
              <div
                className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg font-mono text-[10px] font-black sm:mb-4 sm:h-10 sm:w-10 sm:text-xs"
                style={{ background: "var(--color-accent-dim)", color: "var(--color-accent)" }}
              >
                MCP
              </div>
              <h3 className="text-sm font-bold mb-1.5 sm:mb-2">MCP &amp; IDE</h3>
              <p className="text-[11px] leading-relaxed flex-1 sm:text-xs" style={{ color: "var(--color-text-muted)" }}>
                Runs inside Cursor, Windsurf, and any MCP-compatible editor. Trigger a challenge without leaving your IDE.
              </p>
              <div
                className="mt-3 rounded-lg border px-3 py-2 font-mono text-[10px] sm:mt-4"
                style={{
                  borderColor: "var(--color-border-subtle)",
                  background: "var(--color-surface-raised)",
                  color: "var(--color-text-dim)",
                }}
              >
                <span style={{ color: "var(--color-accent)" }}>tool:</span>{" "}
                <span style={{ color: "var(--color-text-muted)" }}>prs_start_challenge</span>
              </div>
            </div>

            {/* GitHub Action */}
            <div
              className="flex w-[280px] shrink-0 flex-col rounded-xl border p-5 snap-start sm:w-auto sm:p-6"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-surface)",
              }}
            >
              <div
                className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg font-mono text-sm font-black sm:mb-4 sm:h-10 sm:w-10"
                style={{ background: "var(--color-neon-glow)", color: "var(--color-neon)" }}
              >
                ⚙
              </div>
              <h3 className="text-sm font-bold mb-1.5 sm:mb-2">GitHub Action</h3>
              <p className="text-[11px] leading-relaxed flex-1 sm:text-xs" style={{ color: "var(--color-text-muted)" }}>
                Automatic Turing Test on every PR. Questions posted as a comment, commit status updated after grading. No account needed.
              </p>
              <div
                className="mt-3 rounded-lg border px-3 py-2 font-mono text-[10px] sm:mt-4"
                style={{
                  borderColor: "var(--color-border-subtle)",
                  background: "var(--color-surface-raised)",
                  color: "var(--color-text-dim)",
                }}
              >
                <span style={{ color: "var(--color-neon)" }}>uses:</span>{" "}
                <span style={{ color: "var(--color-text-muted)" }}>prs-md/action@v1</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BADGE PREVIEW ─── */}
      <section
        className="border-t px-4 py-16 sm:py-24"
        style={{ borderColor: "var(--color-border-subtle)" }}
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[10px] font-medium uppercase tracking-widest mb-2 sm:text-xs sm:mb-3" style={{ color: "var(--color-neon)" }}>
            The reward
          </p>
          <h2 className="text-2xl font-bold tracking-tight mb-3 sm:text-4xl sm:mb-4">
            Proof, not just a PR description
          </h2>
          <p className="text-sm leading-relaxed mb-8 sm:text-base sm:mb-12" style={{ color: "var(--color-text-muted)" }}>
            Every badge links to a permanent proof page with your full Q&amp;A.
            <br className="hidden sm:block" />
            Not just &ldquo;approved&rdquo; — actually verified.
          </p>

          {/* Badge mockup */}
          <div
            className="relative mx-auto w-full max-w-xl rounded-xl border p-4 overflow-hidden sm:rounded-2xl sm:p-6 md:p-8"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
              boxShadow: "var(--shadow-elevated)",
            }}
          >
            <div className="text-left mb-4 sm:mb-6">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div className="h-5 w-5 rounded-full sm:h-6 sm:w-6" style={{ background: "var(--color-surface-raised)" }} />
                <span className="font-mono text-[10px] sm:text-xs" style={{ color: "var(--color-text-dim)" }}>yourname</span>
                <span className="hidden font-mono text-xs sm:inline" style={{ color: "var(--color-text-dim)" }}>commented 2 hours ago</span>
              </div>
              <div className="rounded-lg border p-3 overflow-hidden sm:p-4" style={{ borderColor: "var(--color-border-subtle)", background: "var(--color-surface-raised)" }}>
                <p className="text-xs mb-3 sm:text-sm sm:mb-4" style={{ color: "var(--color-text-muted)" }}>
                  This PR adds rate limiting to the API gateway using a sliding window algorithm...
                </p>
                <BadgePreview />
              </div>
            </div>

            <p className="font-mono text-[9px] text-center sm:text-[10px]" style={{ color: "var(--color-text-dim)" }}>
              Click the badge &rarr; proof page with full Q&amp;A breakdown
            </p>
          </div>
        </div>
      </section>

      {/* ─── TRUST ─── */}
      <section
        className="relative border-t px-4 py-16 noise sm:py-24"
        style={{
          borderColor: "var(--color-border-subtle)",
          background: "var(--color-surface)",
        }}
      >
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="font-mono text-[10px] font-medium uppercase tracking-widest mb-2 sm:text-xs sm:mb-3" style={{ color: "var(--color-neon)" }}>
            Security
          </p>
          <h2 className="text-2xl font-bold tracking-tight mb-3 sm:text-4xl sm:mb-4">
            Your key, your rules
          </h2>
          <p className="text-sm leading-relaxed mb-8 sm:text-base sm:mb-12" style={{ color: "var(--color-text-muted)" }}>
            We store your API key. That&apos;s a real ask. Here&apos;s exactly what we do — and don&apos;t do — with it.
          </p>

          <div className="grid gap-3 text-left sm:grid-cols-3 sm:gap-4">
            {[
              {
                icon: "{ }",
                title: "Fully open-source",
                text: "Every line is public on GitHub. Fork it, audit it, self-host it. No magic, no black boxes.",
              },
              {
                icon: "AES",
                title: "Encrypted at rest",
                text: "AES-256-GCM with a per-key IV and auth tag. Decrypted in-memory only — never stored in plaintext.",
              },
              {
                icon: "$0",
                title: "No revenue, no motive",
                text: "Built on Vercel and Neon free tiers. Zero cost means zero incentive to sell your data.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border p-4 sm:p-5"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-bg)",
                }}
              >
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg font-mono text-[10px] font-black mb-2 sm:h-9 sm:w-9 sm:text-xs sm:mb-3"
                  style={{
                    background: "var(--color-neon-glow)",
                    color: "var(--color-neon)",
                  }}
                >
                  {item.icon}
                </span>
                <p className="text-sm font-semibold mb-1">{item.title}</p>
                <p className="text-[11px] leading-relaxed sm:text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="border-t px-4 py-14 sm:py-20" style={{ borderColor: "var(--color-border-subtle)" }}>
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-xl font-bold tracking-tight mb-2 sm:text-3xl sm:mb-3">
            Your next PR deserves this.
          </h2>
          <p className="text-xs mb-6 sm:text-sm sm:mb-8" style={{ color: "var(--color-text-muted)" }}>
            Sign in with GitHub, add your API key, drop a PR link.
            <br />
            Your first verified badge is five minutes away.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={handleSignUp}
              className="btn-primary group w-full rounded-lg px-8 py-3.5 font-mono text-sm font-bold transition-all sm:w-auto"
            >
              {session?.user ? "Go to Dashboard" : "Create free account"}
              <span className="ml-2 inline-block transition-transform group-hover:translate-x-0.5">&rarr;</span>
            </button>
            {!session?.user && (
              <button
                onClick={handleSignIn}
                className="btn-outline w-full rounded-lg px-8 py-3.5 font-mono text-sm font-medium transition-all sm:w-auto"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
