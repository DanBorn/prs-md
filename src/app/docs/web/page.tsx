import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Web Dashboard — Docs",
  description:
    "How to use the PRs.md web dashboard — paste a PR URL, pick your LLM, and take the challenge in your browser.",
  openGraph: {
    title: "Web Dashboard — PRs.md Docs",
    description:
      "How to use the PRs.md web dashboard — paste a PR URL, pick your LLM, and take the challenge in your browser.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Web Dashboard — PRs.md Docs",
    description: "How to use the PRs.md web dashboard.",
  },
};

export default function WebDocsPage() {
  return (
    <div className="docs-prose">
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-neon)" }}>
        Guides
      </p>
      <h1>Web Dashboard</h1>
      <p className="docs-lead">
        The web dashboard is the quickest way to create challenges and manage your setup. No install
        required — just a browser.
      </p>

      <h2>Challenges tab</h2>
      <p>
        This is the main view after sign-in. If you have an API key saved, a URL input appears at the
        top. Paste a GitHub PR link (e.g.{" "}
        <code>https://github.com/owner/repo/pull/123</code>) and click <strong>Generate</strong>.
      </p>
      <p>
        PRs.md fetches the diff via the GitHub API and sends it to your chosen LLM. Generation
        typically takes 5–15 seconds depending on the diff size and the provider.
      </p>
      <div
        className="docs-callout"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface-raised)" }}
      >
        <strong>Supported URL formats</strong>
        <ul style={{ marginTop: "0.5rem", marginBottom: 0 }}>
          <li><code>https://github.com/owner/repo/pull/123</code></li>
          <li><code>https://github.com/owner/repo/pull/123/files</code></li>
        </ul>
      </div>

      <h3>Challenge list</h3>
      <p>
        Below the creator, all your past challenges appear in reverse chronological order. Each card
        shows the PR title, repo, status (<strong>pending</strong>, <strong>passed</strong>, or{" "}
        <strong>failed</strong>), and the date created. Click a card to view the challenge detail or
        resume a quiz in progress.
      </p>

      <h2>Taking the quiz</h2>
      <p>
        Once a challenge is ready, click <strong>Start Quiz</strong>. The timer counts down from{" "}
        <strong>3:00</strong>. You must answer all three questions before it reaches zero.
      </p>
      <ul>
        <li>Questions are generated from your actual diff — not generic knowledge</li>
        <li>One question is a hallucination trap (it references something that isn&apos;t in the PR)</li>
        <li>Copy-paste is disabled in the answer boxes during the quiz</li>
        <li>You have up to <strong>5 attempts</strong> per challenge</li>
      </ul>
      <p>
        After submitting, the LLM grades each answer 0–100 and returns written feedback. Your overall
        score is the average across the three answers.
      </p>

      <h2>Proof page and badge</h2>
      <p>
        A passing result creates a permanent proof page at <code>/proof/[id]</code>. From there you
        can copy the Markdown badge snippet and paste it into your PR description:
      </p>
      <pre><code>{`[![PRs.md Verified](https://prs.md/api/badge/[id])](https://prs.md/proof/[id])`}</code></pre>
      <p>
        The badge is an SVG served by the app and can be embedded anywhere images are rendered —
        GitHub PR descriptions, README files, or Notion pages.
      </p>
      <div
        className="docs-callout"
        style={{ borderColor: "oklch(82% 0.22 145 / 0.2)", background: "var(--color-neon-glow)" }}
      >
        <strong style={{ color: "var(--color-neon)" }}>Proof pages are public.</strong>{" "}
        <span style={{ color: "var(--color-text-muted)" }}>
          Anyone with the URL can view your Q&amp;A and score. This is intentional — the whole point
          is to give reviewers something they can verify.
        </span>
      </div>

      <h2>API Keys tab</h2>
      <p>
        Manage your stored API keys here. You can save one key per LLM provider (OpenAI, Anthropic,
        Gemini). Keys are encrypted with AES-256-GCM before storage and are never returned in
        plaintext after being saved.
      </p>
      <p>
        To update a key, delete the existing one and add the new value. To rotate keys, do the same —
        revoke in your provider dashboard first, then swap here.
      </p>

      <h2>Integrations tab</h2>
      <p>
        The dashboard also contains setup guides for the <strong>CLI</strong>,{" "}
        <strong>MCP Server</strong>, and <strong>GitHub Action</strong> integrations. Each section
        generates a pre-filled config snippet using your account&apos;s MCP token.
      </p>
    </div>
  );
}
