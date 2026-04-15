"use client";

import { CodeBlock } from "./code-block";

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

export function SetupAction() {
  return (
    <div className="space-y-5">
      <div>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          Add a Turing Test to every PR automatically. The action generates
          questions from the diff, posts a quiz link on the PR, and updates the
          commit status after grading.
        </p>
      </div>

      {/* Step 1 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-black"
            style={{
              background: "var(--color-neon-glow)",
              color: "var(--color-neon)",
            }}
          >
            1
          </span>
          <span className="font-mono text-xs font-medium">
            Add repo secrets
          </span>
        </div>
        <p
          className="text-xs mb-3 leading-relaxed"
          style={{ color: "var(--color-text-dim)" }}
        >
          Go to your repo → Settings → Secrets and variables → Actions → New
          repository secret. Add these three:
        </p>
        <div
          className="overflow-x-auto rounded-lg border"
          style={{
            borderColor: "var(--color-border)",
            background: "var(--color-surface-raised)",
            WebkitOverflowScrolling: "touch" as never,
          }}
        >
          <table className="w-full min-w-[360px] font-mono text-[11px]">
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <th
                  className="px-3 py-2 text-left font-bold"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  Secret
                </th>
                <th
                  className="px-3 py-2 text-left font-bold"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                style={{
                  borderBottom: "1px solid var(--color-border-subtle)",
                }}
              >
                <td
                  className="px-3 py-2"
                  style={{ color: "var(--color-neon)" }}
                >
                  PRS_API_KEY
                </td>
                <td
                  className="px-3 py-2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Your LLM API key (OpenAI, Anthropic, or Gemini)
                </td>
              </tr>
              <tr
                style={{
                  borderBottom: "1px solid var(--color-border-subtle)",
                }}
              >
                <td
                  className="px-3 py-2"
                  style={{ color: "var(--color-neon)" }}
                >
                  PRS_PROVIDER
                </td>
                <td
                  className="px-3 py-2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  openai, anthropic, or gemini
                </td>
              </tr>
              <tr>
                <td
                  className="px-3 py-2"
                  style={{ color: "var(--color-neon)" }}
                >
                  PRS_CALLBACK_TOKEN
                </td>
                <td
                  className="px-3 py-2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  GitHub fine-grained PAT (see below)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Callback token instructions */}
      <div
        className="rounded-lg border p-3 sm:p-4"
        style={{
          borderColor: "oklch(82% 0.22 145 / 0.15)",
          background: "oklch(82% 0.22 145 / 0.04)",
        }}
      >
        <p
          className="font-mono text-[10px] font-bold mb-2"
          style={{ color: "var(--color-neon)" }}
        >
          Creating PRS_CALLBACK_TOKEN
        </p>
        <ol
          className="space-y-1 text-[11px] leading-relaxed list-decimal list-inside"
          style={{ color: "var(--color-text-dim)" }}
        >
          <li>
            Go to{" "}
            <span className="break-all" style={{ color: "var(--color-accent)" }}>
              github.com/settings/personal-access-tokens/new
            </span>
          </li>
          <li>
            Select <strong>Fine-grained token</strong>
          </li>
          <li>
            Repository access → Only select repositories → pick your repo
          </li>
          <li>
            Permissions → Contents →{" "}
            <strong>Read and write</strong>
          </li>
          <li>Generate → copy → add as repo secret</li>
        </ol>
        <p
          className="mt-2 text-[10px]"
          style={{ color: "var(--color-text-dim)" }}
        >
          This token lets prs.md notify the action when a quiz is completed.
          It only needs write access to trigger repository_dispatch events.
        </p>
      </div>

      {/* Step 2 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-black"
            style={{
              background: "var(--color-neon-glow)",
              color: "var(--color-neon)",
            }}
          >
            2
          </span>
          <span className="font-mono text-xs font-medium">
            Add the workflow file
          </span>
        </div>
        <CodeBlock
          code={WORKFLOW_YAML}
          filename=".github/workflows/prs-md.yml"
          language="yaml"
        />
      </div>

      {/* Step 3 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-black"
            style={{
              background: "var(--color-neon-glow)",
              color: "var(--color-neon)",
            }}
          >
            3
          </span>
          <span className="font-mono text-xs font-medium">
            Open a PR and watch it work
          </span>
        </div>
        <p
          className="text-xs leading-relaxed"
          style={{ color: "var(--color-text-dim)" }}
        >
          When a PR is opened, the action generates 3 questions from the diff
          and posts a comment with a quiz link. The PR author signs in with
          GitHub, takes the timed quiz, and the action grades the answers and
          updates the commit status.
        </p>
      </div>

      {/* How it works */}
      <div
        className="rounded-lg border p-4 font-mono text-[11px] leading-loose"
        style={{
          borderColor: "var(--color-border)",
          background: "oklch(11% 0.01 260)",
          color: "var(--color-text-dim)",
        }}
      >
        <div>
          <span style={{ color: "var(--color-text-dim)" }}>1.</span>{" "}
          <span style={{ color: "var(--color-neon)" }}>PR opened</span>{" "}
          → action fetches diff, generates Qs
        </div>
        <div>
          <span style={{ color: "var(--color-text-dim)" }}>2.</span>{" "}
          <span style={{ color: "var(--color-neon)" }}>Quiz link</span>{" "}
          posted as PR comment, status → pending
        </div>
        <div>
          <span style={{ color: "var(--color-text-dim)" }}>3.</span>{" "}
          <span style={{ color: "var(--color-neon)" }}>Author takes quiz</span>{" "}
          on prs.md (timed, no copy-paste)
        </div>
        <div>
          <span style={{ color: "var(--color-text-dim)" }}>4.</span>{" "}
          <span style={{ color: "var(--color-neon)" }}>Action grades</span>{" "}
          → status updates to pass/fail
        </div>
      </div>

      {/* No account needed */}
      <div
        className="rounded-lg border p-3"
        style={{
          borderColor: "oklch(82% 0.22 145 / 0.15)",
          background: "oklch(82% 0.22 145 / 0.04)",
        }}
      >
        <p
          className="font-mono text-[10px] font-bold mb-1"
          style={{ color: "var(--color-neon)" }}
        >
          No prs.md account needed
        </p>
        <p
          className="text-[11px] leading-relaxed"
          style={{ color: "var(--color-text-dim)" }}
        >
          The action uses your repo&apos;s LLM key directly — no prs.md signup
          required. PR authors only sign in with GitHub to verify their identity
          when taking the quiz. Proofs are attributed to the actual PR author,
          not whoever set up the action.
        </p>
      </div>
    </div>
  );
}
