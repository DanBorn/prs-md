import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CLI — Docs",
  description:
    "Run PRs.md from the terminal. `prs verify <pr-url>` — one command, zero ceremony.",
  keywords: ["prs.md CLI", "terminal", "command line", "pull request verification"],
  openGraph: {
    title: "CLI — PRs.md Docs",
    description: "Run PRs.md from the terminal. `prs verify <pr-url>` — one command, zero ceremony.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CLI — PRs.md Docs",
    description: "Run PRs.md from the terminal.",
  },
};

export default function CliDocsPage() {
  return (
    <div className="docs-prose">
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-neon)" }}>
        Guides
      </p>
      <h1>CLI</h1>
      <p className="docs-lead">
        The <code>prs</code> CLI lets you run a Turing Test challenge directly from your terminal —
        no browser needed. It runs via <code>npx</code> so there&apos;s nothing to install globally.
      </p>

      <h2>Requirements</h2>
      <ul>
        <li>Node.js 20 or later</li>
        <li>A PRs.md account with an API key saved</li>
      </ul>

      <h2>Running a challenge</h2>
      <pre><code>{`npx prs-md verify https://github.com/owner/repo/pull/123`}</code></pre>
      <p>
        The CLI authenticates using your stored credentials, fetches the diff, generates questions,
        and launches an interactive quiz in the terminal. Answers are submitted when you type them and
        press Enter at the prompt.
      </p>

      <h2>Configuration</h2>
      <p>
        On first run, the CLI will prompt you for a <strong>PRs.md token</strong>. Generate one from{" "}
        <strong>Dashboard → CLI</strong> and paste it in. The token is stored at{" "}
        <code>~/.config/prs-md/token</code> and reused for subsequent runs.
      </p>
      <p>
        To switch accounts or revoke access, delete that file and re-run the CLI.
      </p>

      <h3>LLM provider</h3>
      <p>
        The CLI uses whichever API key you have saved in your PRs.md account. If you have multiple
        providers, pass <code>--provider</code> to select one:
      </p>
      <pre><code>{`npx prs-md verify <pr-url> --provider anthropic`}</code></pre>
      <p>
        Valid values: <code>openai</code>, <code>anthropic</code>, <code>gemini</code>.
      </p>

      <h2>CI integration</h2>
      <p>
        You can call the CLI from a CI script to require proof before a PR can be merged. Set the
        token as an environment variable:
      </p>
      <pre><code>{`# .github/workflows/verify.yml
- name: PRs.md challenge
  env:
    PRS_TOKEN: \${{ secrets.PRS_TOKEN }}
  run: npx prs-md verify \${{ github.event.pull_request.html_url }}`}</code></pre>
      <div
        className="docs-callout"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface-raised)" }}
      >
        <strong>GitHub Action alternative:</strong>{" "}
        <span style={{ color: "var(--color-text-muted)" }}>
          For tighter GitHub integration (automatic PR comments, status checks), use the{" "}
          <strong>GitHub Action</strong> available from Dashboard → GitHub Action. It posts results
          directly to the PR thread.
        </span>
      </div>

      <h2>Exit codes</h2>
      <ul>
        <li><code>0</code> — challenge passed</li>
        <li><code>1</code> — challenge failed or timed out</li>
        <li><code>2</code> — configuration error (missing token, invalid URL)</li>
      </ul>

      <h2>Flags</h2>
      <pre><code>{`  --provider   openai | anthropic | gemini (default: first saved key)
  --json       Output result as JSON instead of interactive UI
  --no-color   Disable color output`}</code></pre>
    </div>
  );
}
