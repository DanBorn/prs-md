import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";

export const metadata: Metadata = {
  title: "CLI — Docs",
  description:
    "Run a PRs.md Turing Test challenge directly from your terminal with the prs-md CLI.",
  keywords: ["prs.md CLI", "terminal", "command line", "pull request verification"],
  openGraph: {
    title: "CLI — PRs.md Docs",
    description: "Run a PRs.md Turing Test challenge directly from your terminal.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CLI — PRs.md Docs",
    description: "Run a PRs.md Turing Test challenge directly from your terminal.",
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
        The <code>prs-md</code> CLI runs a Turing Test challenge directly in your terminal —
        no browser required. Your AI key is used locally for grading; it never leaves your machine.
      </p>

      <h2>Requirements</h2>
      <ul>
        <li>Node.js 20 or later</li>
        <li>An API key for OpenAI, Anthropic, or Gemini</li>
      </ul>

      <h2>Running a challenge</h2>
      <CodeBlock code="npx prs-md https://github.com/owner/repo/pull/123" />
      <p>
        The CLI fetches the PR diff, generates 3 targeted questions via your AI key, and launches an
        interactive timed quiz in your terminal. On pass, a shareable proof link is printed and (if
        you&apos;re logged in) recorded to your dashboard.
      </p>
      <p>
        You can also install globally and skip the <code>npx</code> prefix:
      </p>
      <CodeBlock code="npm install -g prs-md" />

      <h2>Authentication (optional)</h2>
      <p>
        Authentication links your CLI results to your PRs.md web account. It&apos;s optional —
        anonymous runs still get a shareable proof URL on pass. Log in with GitHub Device Flow:
      </p>
      <CodeBlock code={`prs-md login   # Opens github.com — enter the displayed code
prs-md whoami  # Confirm who you're logged in as
prs-md logout  # Remove stored credentials`} />
      <p>
        Credentials are stored at <code>~/.config/prs-md/auth.json</code> (mode 600).
      </p>
      <p>
        Once logged in, two things happen automatically on each run:
      </p>
      <ul>
        <li>API keys you&apos;ve saved on the dashboard are fetched and used — no manual key entry needed.</li>
        <li>Pass and fail attempts both appear on your dashboard, and re-running the same PR reuses the original questions so attempts stay comparable.</li>
      </ul>

      <h2>Providing an AI key</h2>
      <p>
        If you&apos;re not logged in (or want to override the saved key), supply a key in any of
        these ways — highest precedence first:
      </p>
      <ol>
        <li>Flags: <code>--provider anthropic --key sk-ant-...</code></li>
        <li>Environment variables: <code>PRS_PROVIDER</code> and <code>PRS_API_KEY</code></li>
        <li>Keys saved in your PRs.md dashboard (requires login)</li>
        <li>Interactive prompt (if none of the above resolve)</li>
      </ol>
      <p>
        The provider is inferred automatically from the key prefix when not specified:{" "}
        <code>sk-ant-</code> → Anthropic, <code>sk-</code> → OpenAI, <code>AI</code> → Gemini.
      </p>
      <CodeBlock code={`# Explicit flags
prs-md https://github.com/owner/repo/pull/123 --provider anthropic --key sk-ant-...

# Environment variables
PRS_PROVIDER=openai PRS_API_KEY=sk-... prs-md https://github.com/owner/repo/pull/123`} />

      <h2>Flags</h2>
      <CodeBlock code={`  --provider, -p   AI provider: openai | anthropic | gemini
  --key, -k        AI API key
  --help, -h       Show usage`} />

      <h2>Exit codes</h2>
      <ul>
        <li><code>0</code> — challenge passed</li>
        <li><code>1</code> — challenge failed, timed out, or an error occurred</li>
      </ul>

      <h2>Environment variables</h2>
      <ul>
        <li><code>PRS_PROVIDER</code> — AI provider (<code>openai</code>, <code>anthropic</code>, <code>gemini</code>)</li>
        <li><code>PRS_API_KEY</code> — AI API key</li>
        <li><code>PRS_API_URL</code> — Override the API base URL (default: <code>https://www.prs.md</code>). Useful for self-hosted instances or local development.</li>
      </ul>

      <div
        className="docs-callout"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface-raised)" }}
      >
        <strong>GitHub Action alternative:</strong>{" "}
        <span style={{ color: "var(--color-text-muted)" }}>
          For tighter GitHub integration — automatic PR comments and commit status checks — use the{" "}
          <strong>GitHub Action</strong> from your dashboard. It runs server-side using your saved
          key and posts results directly to the PR thread without any local setup.
        </span>
      </div>
    </div>
  );
}
