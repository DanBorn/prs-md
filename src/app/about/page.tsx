import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Why PRs.md exists, how it works under the hood, and the principles behind it.",
  keywords: [
    "about prs.md",
    "pull request verification",
    "AI code review",
    "developer accountability",
    "open source",
  ],
  openGraph: {
    title: "About — PRs.md",
    description:
      "Why PRs.md exists, how it works under the hood, and the principles behind it.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About — PRs.md",
    description:
      "Why PRs.md exists, how it works under the hood, and the principles behind it.",
  },
};

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "Does PRs.md store my code or diff?",
    a: "No. The diff is fetched from GitHub at challenge time, sent to your LLM provider for question generation, and then discarded. We store the questions, your answers, and your score — nothing from the raw diff.",
  },
  {
    q: "Who can see my proof page?",
    a: "Proof pages are intentionally public. Anyone with the URL can read your Q&A and score. That's the point — reviewers need to be able to verify the badge is real.",
  },
  {
    q: "What happens if I fail?",
    a: "You can retry up to 5 times per challenge. Every attempt is recorded, so the proof page shows your best result alongside the attempt count. There's no penalty for failing — only for not trying.",
  },
  {
    q: "Which LLM providers are supported?",
    a: "OpenAI, Anthropic, and Google Gemini. You bring your own key — we never proxy requests through our own credits. One key per provider can be saved per account.",
  },
  {
    q: "Is it possible to cheat?",
    a: "We don't claim this is cheat-proof. Copy-paste is disabled during the quiz and there's a timed window, but a determined bad actor can work around that. The badge is a signal, not a cryptographic guarantee. The trap question helps catch purely AI-generated answers.",
  },
  {
    q: "Can I self-host PRs.md?",
    a: (
      <>
        Yes. The full source is on GitHub. You&apos;ll need a Postgres database (Neon works on the
        free tier), a GitHub OAuth app, and a deployment target. The{" "}
        <code
          className="font-mono text-xs rounded px-1 py-0.5"
          style={{
            background: "var(--color-surface-raised)",
            border: "1px solid var(--color-border-subtle)",
            color: "var(--color-neon)",
          }}
        >
          .env.example
        </code>{" "}
        in the repo documents every required variable.
      </>
    ),
  },
  {
    q: "How are answers graded?",
    a: "The same LLM that generated the questions grades the answers. It scores each response 0–100 based on correctness, specificity, and whether the answer reflects knowledge of the actual diff rather than general domain knowledge. Your overall score is the average of the three.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* ─── HERO ─── */}
      <section className="border-b px-4 py-20" style={{ borderColor: "var(--color-border-subtle)" }}>
        <div className="mx-auto max-w-2xl">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--color-neon)" }}>
            About
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight mb-6 sm:text-5xl" style={{ letterSpacing: "-0.03em" }}>
            The problem with<br />AI-assisted code review
          </h1>
          <p className="text-base leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
            Copilot, Cursor, and their siblings have made it trivially easy to write code you
            don&apos;t fully understand. The PR description sounds confident. The diff looks clean.
            But when a reviewer asks &ldquo;why did you pick this approach?&rdquo; — the answer is
            often silence.
          </p>
        </div>
      </section>

      {/* ─── WHAT IT IS ─── */}
      <section className="border-b px-4 py-20" style={{ borderColor: "var(--color-border-subtle)" }}>
        <div className="mx-auto max-w-2xl">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--color-text-dim)" }}>
            What it is
          </p>
          <h2 className="text-2xl font-bold tracking-tight mb-6" style={{ letterSpacing: "-0.02em" }}>
            A Turing Test for your own pull request
          </h2>
          <div className="space-y-4 text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
            <p>
              PRs.md is a micro-SaaS that gives developers a way to prove they actually read and
              understood their own changes. You paste a GitHub PR link. An LLM — your LLM, your key —
              reads the diff and writes three targeted questions about the specific code you changed.
              Not general knowledge. Not trivia. The actual decisions in your actual PR.
            </p>
            <p>
              You answer in under three minutes. No copy-paste. No AI assist. The same model grades
              your answers and issues a signed proof badge if you pass.
            </p>
            <p>
              The badge links to a permanent proof page with your full Q&amp;A. Your reviewers can
              click through and read what you wrote. It&apos;s not magic — it&apos;s accountability.
            </p>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="border-b px-4 py-20" style={{ borderColor: "var(--color-border-subtle)" }}>
        <div className="mx-auto max-w-3xl">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--color-text-dim)" }}>
            How it works
          </p>
          <h2 className="text-2xl font-bold tracking-tight mb-10" style={{ letterSpacing: "-0.02em" }}>
            Under the hood
          </h2>

          <div className="space-y-px rounded-xl overflow-hidden border" style={{ borderColor: "var(--color-border)", background: "var(--color-border-subtle)" }}>
            {[
              {
                step: "01",
                title: "Diff fetch",
                body: "PRs.md calls the GitHub API to pull the raw diff for your PR. We request no repo permissions — the diff is fetched as the public API allows. Private repos require the PR to be readable with a token you own.",
              },
              {
                step: "02",
                title: "Question generation",
                body: "The diff is sent to your chosen LLM (OpenAI, Anthropic, or Gemini) with a structured prompt asking it to produce three specific, diff-grounded questions plus one hallucination trap — a question about something that doesn't exist in the PR. Your API key is used; we receive nothing.",
              },
              {
                step: "03",
                title: "Timed quiz",
                body: "You get three minutes to answer. The quiz UI disables copy-paste to reduce the temptation to feed answers back to an AI. The timer is enforced server-side — late submissions aren't accepted.",
              },
              {
                step: "04",
                title: "LLM grading",
                body: "Your answers go back to the same model with a grading prompt. It scores each answer 0–100 and writes feedback. Scores are clamped and re-validated server-side before being persisted — the client can't inflate them.",
              },
              {
                step: "05",
                title: "Proof issuance",
                body: "A passing score (threshold configurable per-team in the future) creates a permanent record in the database. The proof page and SVG badge are generated from that record. Both are public and immutable.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-6 p-6 sm:p-8"
                style={{ background: "var(--color-surface)" }}
              >
                <span
                  className="shrink-0 font-mono text-[10px] font-bold tabular-nums"
                  style={{ color: "var(--color-text-dim)", paddingTop: "2px" }}
                >
                  {item.step}
                </span>
                <div>
                  <p className="text-sm font-bold mb-1">{item.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRINCIPLES ─── */}
      <section className="border-b px-4 py-20" style={{ borderColor: "var(--color-border-subtle)" }}>
        <div className="mx-auto max-w-2xl">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--color-text-dim)" }}>
            Principles
          </p>
          <h2 className="text-2xl font-bold tracking-tight mb-10" style={{ letterSpacing: "-0.02em" }}>
            Built on a few firm opinions
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Bring your own key",
                body: "We have no revenue model tied to LLM usage. Your key, your cost, your provider. We don't see your requests. This keeps the incentives clean.",
              },
              {
                title: "Open source, full stop",
                body: "Every line is on GitHub. Fork it, audit it, self-host it. A trust claim that you can't verify is just marketing.",
              },
              {
                title: "No telemetry on your code",
                body: "Diffs are fetched at challenge time and never written to disk beyond the active request. We store Q&A pairs and scores — not source code.",
              },
              {
                title: "Proof, not theater",
                body: "A badge that links to a real Q&A is harder to fake than a description that says \"I reviewed this.\" We're not trying to eliminate all bad actors — we're raising the floor.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border p-5"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-surface)",
                }}
              >
                <p className="text-sm font-bold mb-2">{item.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="border-b px-4 py-20" style={{ borderColor: "var(--color-border-subtle)" }}>
        <div className="mx-auto max-w-2xl">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--color-text-dim)" }}>
            FAQ
          </p>
          <h2 className="text-2xl font-bold tracking-tight mb-10" style={{ letterSpacing: "-0.02em" }}>
            Common questions
          </h2>

          <div className="space-y-px rounded-xl overflow-hidden border" style={{ borderColor: "var(--color-border)", background: "var(--color-border-subtle)" }}>
            {FAQ.map((item) => (
              <div
                key={item.q}
                className="p-6"
                style={{ background: "var(--color-surface)" }}
              >
                <p className="text-sm font-semibold mb-2">{item.q}</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-3">
            Read the guide or just try it
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
            Sign in with GitHub, drop a PR link, and see how well you actually know your own code.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/docs"
              className="btn-outline rounded-lg px-6 py-3 font-mono text-sm font-medium transition-all"
            >
              Read the docs
            </Link>
            <Link
              href="/dashboard"
              className="btn-primary rounded-lg px-6 py-3 font-mono text-sm font-bold transition-all"
            >
              Go to dashboard &rarr;
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
