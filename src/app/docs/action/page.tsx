import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";

export const metadata: Metadata = {
  title: "GitHub Action — PRs.md Docs",
  description:
    "Add an automated Turing Test to every pull request with the PRs.md GitHub Action. Questions are generated from the diff and graded automatically.",
  keywords: ["prs.md github action", "pull request verification", "ci turing test", "automated pr review"],
  openGraph: {
    title: "GitHub Action — PRs.md Docs",
    description:
      "Add an automated Turing Test to every pull request with the PRs.md GitHub Action.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GitHub Action — PRs.md Docs",
    description: "Add an automated Turing Test to every pull request with the PRs.md GitHub Action.",
  },
};

const WORKFLOW_YAML = `name: "PRs.md Turing Test"

on:
  pull_request:
    types: [opened, synchronize]
  repository_dispatch:
    types: [prs-md-quiz-submitted]

permissions:
  statuses: write
  pull-requests: write

jobs:
  prs-md:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: prs-md/action@v1
        with:
          prs-api-key: \${{ secrets.PRS_API_KEY }}
          prs-provider: \${{ secrets.PRS_PROVIDER }}
          prs-callback-token: \${{ secrets.PRS_CALLBACK_TOKEN }}`;

export default function ActionDocsPage() {
  return (
    <div className="docs-prose">
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-neon)" }}>
        GitHub Action
      </p>
      <h1>GitHub Action</h1>
      <p className="docs-lead">
        Add a Turing Test to every pull request automatically. The action generates questions from
        the diff, posts a quiz link as a PR comment, and updates the commit status after the author
        answers — no prs.md account required for setup.
      </p>

      <h2>How it works</h2>
      <ol>
        <li><strong>PR opened or updated</strong> — the action fetches the diff and generates 3 targeted questions plus 1 hallucination trap.</li>
        <li><strong>Quiz link posted</strong> as a PR comment; commit status set to pending.</li>
        <li><strong>PR author takes the timed quiz</strong> on prs.md (3 minutes, no copy-paste).</li>
        <li><strong>Action grades answers</strong> and updates the commit status to pass or fail.</li>
      </ol>

      <div
        className="docs-callout"
        style={{ borderColor: "oklch(82% 0.22 145 / 0.25)", background: "oklch(82% 0.22 145 / 0.04)" }}
      >
        <strong style={{ color: "var(--color-neon)" }}>No prs.md account needed.</strong>{" "}
        <span style={{ color: "var(--color-text-muted)" }}>
          The action uses your repo&apos;s own LLM API key. PR authors only sign in with GitHub
          to verify identity when taking the quiz. Proofs are attributed to the actual PR author,
          not whoever set up the action.
        </span>
      </div>

      <h2>Step 1 — Add repo secrets</h2>
      <p>
        Go to your repo → <strong>Settings → Secrets and variables → Actions → New repository
        secret</strong> and add these three secrets:
      </p>

      <div
        className="not-prose overflow-x-auto rounded-lg border"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface-raised)" }}
      >
        <table className="w-full min-w-[360px] font-mono text-[11px]">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              <th className="px-4 py-2.5 text-left font-bold" style={{ color: "var(--color-text-dim)" }}>Secret</th>
              <th className="px-4 py-2.5 text-left font-bold" style={{ color: "var(--color-text-dim)" }}>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
              <td className="px-4 py-2.5" style={{ color: "var(--color-neon)" }}>PRS_API_KEY</td>
              <td className="px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Your LLM API key (OpenAI, Anthropic, or Gemini)</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
              <td className="px-4 py-2.5" style={{ color: "var(--color-neon)" }}>PRS_PROVIDER</td>
              <td className="px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}><code>openai</code>, <code>anthropic</code>, or <code>gemini</code></td>
            </tr>
            <tr>
              <td className="px-4 py-2.5" style={{ color: "var(--color-neon)" }}>PRS_CALLBACK_TOKEN</td>
              <td className="px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>GitHub fine-grained PAT (see below)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3>Creating PRS_CALLBACK_TOKEN</h3>
      <p>
        The callback token lets prs.md notify the action when a quiz is completed via a{" "}
        <code>repository_dispatch</code> event. It only needs write access to trigger that event.
      </p>
      <ol>
        <li>Go to <strong>github.com/settings/personal-access-tokens/new</strong></li>
        <li>Select <strong>Fine-grained token</strong></li>
        <li>Repository access → <strong>Only select repositories</strong> → pick your repo</li>
        <li>Permissions → Contents → <strong>Read and write</strong></li>
        <li>Generate the token, copy it, and add it as <code>PRS_CALLBACK_TOKEN</code></li>
      </ol>

      <h2>Step 2 — Add the workflow file</h2>
      <p>
        Create <code>.github/workflows/prs-md.yml</code> in your repository:
      </p>
      <div className="not-prose">
        <CodeBlock code={WORKFLOW_YAML} filename=".github/workflows/prs-md.yml" language="yaml" />
      </div>

      <h2>Step 3 — Open a PR</h2>
      <p>
        That&apos;s it. Open or update a pull request and the action will run automatically. The PR
        author receives a comment with a quiz link, takes the timed quiz on prs.md, and the commit
        status updates to pass or fail once graded.
      </p>

      <h2>Inputs reference</h2>
      <div
        className="not-prose overflow-x-auto rounded-lg border"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface-raised)" }}
      >
        <table className="w-full font-mono text-[11px]">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              <th className="px-4 py-2.5 text-left font-bold" style={{ color: "var(--color-text-dim)" }}>Input</th>
              <th className="px-4 py-2.5 text-left font-bold" style={{ color: "var(--color-text-dim)" }}>Required</th>
              <th className="px-4 py-2.5 text-left font-bold" style={{ color: "var(--color-text-dim)" }}>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
              <td className="px-4 py-2.5" style={{ color: "var(--color-neon)" }}>prs-api-key</td>
              <td className="px-4 py-2.5" style={{ color: "var(--color-text-dim)" }}>Yes</td>
              <td className="px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>LLM API key (OpenAI, Anthropic, or Gemini)</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
              <td className="px-4 py-2.5" style={{ color: "var(--color-neon)" }}>prs-provider</td>
              <td className="px-4 py-2.5" style={{ color: "var(--color-text-dim)" }}>Yes</td>
              <td className="px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}><code>openai</code>, <code>anthropic</code>, or <code>gemini</code> (default: <code>openai</code>)</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
              <td className="px-4 py-2.5" style={{ color: "var(--color-neon)" }}>prs-callback-token</td>
              <td className="px-4 py-2.5" style={{ color: "var(--color-text-dim)" }}>Yes</td>
              <td className="px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>GitHub PAT for dispatching the quiz-submitted event</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5" style={{ color: "var(--color-neon)" }}>prs-server-url</td>
              <td className="px-4 py-2.5" style={{ color: "var(--color-text-dim)" }}>No</td>
              <td className="px-4 py-2.5" style={{ color: "var(--color-text-muted)" }}>Override API base URL (default: <code>https://prs.md</code>). Useful for self-hosted instances.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
