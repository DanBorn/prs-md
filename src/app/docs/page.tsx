import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Getting Started — Docs",
  description:
    "Get started with PRs.md — web dashboard, CLI, and MCP integration guides.",
  keywords: ["prs.md docs", "getting started", "pull request verification", "CLI", "MCP"],
  openGraph: {
    title: "Getting Started — PRs.md Docs",
    description:
      "Get started with PRs.md — web dashboard, CLI, and MCP integration guides.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Getting Started — PRs.md Docs",
    description: "Get started with PRs.md — web dashboard, CLI, and MCP integration guides.",
  },
};

export default function DocsPage() {
  return (
    <div className="docs-prose">
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-neon)" }}>
        Docs
      </p>
      <h1>Getting Started</h1>
      <p className="docs-lead">
        PRs.md proves you actually read your own pull request. Paste a GitHub PR URL, answer three
        questions generated from the real diff, and earn a shareable verified badge.
      </p>

      <h2>Prerequisites</h2>
      <ul>
        <li>A GitHub account — used for sign-in only (read:user scope)</li>
        <li>An API key from <strong>OpenAI</strong>, <strong>Anthropic</strong>, or <strong>Google Gemini</strong></li>
        <li>A <strong>public</strong> GitHub pull request — private repos are not currently supported</li>
      </ul>
      <p>
        PRs.md is <strong>bring-your-own-key</strong>. We never proxy your requests through our own
        credits — your key talks directly to the provider.
      </p>
      <div
        className="docs-callout"
        style={{ borderColor: "oklch(78% 0.16 70 / 0.25)", background: "oklch(78% 0.16 70 / 0.04)" }}
      >
        <strong style={{ color: "var(--color-warning)" }}>Public repos only.</strong>{" "}
        <span style={{ color: "var(--color-text-muted)" }}>
          Even with BYOK, the questions and answers we generate are stored on our servers to power
          the proof page. Submitting a private repo would expose its code through those stored
          records. Private repo support is on the roadmap.
        </span>
      </div>

      <h2>Step 1 — Sign in</h2>
      <p>
        Go to <strong>prs.md</strong> and click <strong>Sign in with GitHub</strong>. We request the
        minimal <code>read:user</code> and <code>user:email</code> scopes — no repo access, no write
        permissions.
      </p>

      <h2>Step 2 — Add your API key</h2>
      <p>
        Head to <strong>Dashboard → API Keys</strong> and paste in your key. Keys are encrypted at
        rest with AES-256-GCM before being written to the database. You can store one key per
        provider and swap them anytime.
      </p>
      <div
        className="docs-callout"
        style={{ borderColor: "oklch(78% 0.16 70 / 0.25)", background: "oklch(78% 0.16 70 / 0.04)" }}
      >
        <strong style={{ color: "var(--color-warning)" }}>Tip:</strong>{" "}
        <span style={{ color: "var(--color-text-muted)" }}>
          Create a separate API key for PRs.md rather than reusing your personal key. That way you
          can revoke it independently and monitor its usage in your provider dashboard.
        </span>
      </div>

      <h2>Step 3 — Create your first challenge</h2>
      <p>
        Paste any public GitHub PR URL into the input on the Challenges tab and hit{" "}
        <strong>Generate</strong>. PRs.md fetches the diff, sends it to your chosen LLM, and returns
        three targeted questions plus one hallucination trap.
      </p>
      <p>
        The quiz is timed at <strong>three minutes</strong>. When the timer starts, copy-paste is
        disabled so your answers reflect what you actually know.
      </p>

      <h2>Step 4 — Earn your badge</h2>
      <p>
        Submit your answers and the LLM grades them. A passing score generates a permanent proof page
        at <code>prs.md/proof/[id]</code> containing your full Q&amp;A. Drop the badge into your PR
        description — reviewers can click through to verify it&apos;s real.
      </p>

      <hr />

      <h2>Choose your workflow</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 not-prose" style={{ marginTop: "1rem" }}>
        {[
          {
            href: "/docs/web",
            icon: "WEB",
            label: "Web Dashboard",
            desc: "Full UI in the browser. Best for one-off checks.",
          },
          {
            href: "/docs/cli",
            icon: ">_",
            label: "CLI",
            desc: "One command. Wire it into scripts or CI.",
          },
          {
            href: "/docs/mcp",
            icon: "MCP",
            label: "MCP / IDE",
            desc: "Trigger challenges without leaving Cursor or Windsurf.",
            accent: true,
          },
          {
            href: "/docs/action",
            icon: "⚙",
            label: "GitHub Action",
            desc: "Automatic Turing Test on every PR — no account needed.",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="challenge-item flex flex-col rounded-xl border p-4 transition-colors"
          >
            <span
              className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg font-mono text-[9px] font-black"
              style={{
                background: item.accent ? "var(--color-accent-dim)" : "var(--color-neon-glow)",
                color: item.accent ? "var(--color-accent)" : "var(--color-neon)",
              }}
            >
              {item.icon}
            </span>
            <p className="mb-1 text-xs font-bold" style={{ color: "var(--color-text)" }}>
              {item.label}
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-text-dim)" }}>
              {item.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
