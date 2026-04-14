"use client";

import { CodeBlock } from "./code-block";

export function SetupCli() {
  return (
    <div className="space-y-5">
      {/* Intro */}
      <div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
          Run the Turing Test locally. Your AI key stays on your machine &mdash;
          nothing is stored on our servers.
        </p>
      </div>

      {/* Step 1 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-black"
            style={{ background: "var(--color-neon-glow)", color: "var(--color-neon)" }}
          >
            1
          </span>
          <span className="font-mono text-xs font-medium">Run on any public PR</span>
        </div>
        <CodeBlock code="npx prs-md https://github.com/owner/repo/pull/123" />
      </div>

      {/* Step 2 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-black"
            style={{ background: "var(--color-neon-glow)", color: "var(--color-neon)" }}
          >
            2
          </span>
          <span className="font-mono text-xs font-medium">Pick your AI provider</span>
        </div>
        <p className="text-xs mb-2 leading-relaxed" style={{ color: "var(--color-text-dim)" }}>
          The CLI will prompt interactively, or set env vars to skip prompts:
        </p>
        <CodeBlock
          code={`# OpenAI
export PRS_PROVIDER=openai
export PRS_API_KEY=sk-...

# Anthropic
export PRS_PROVIDER=anthropic
export PRS_API_KEY=sk-ant-...

# Gemini
export PRS_PROVIDER=gemini
export PRS_API_KEY=AIza...`}
          filename=".bashrc / .zshrc"
          language="bash"
        />
      </div>

      {/* Step 3 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-black"
            style={{ background: "var(--color-neon-glow)", color: "var(--color-neon)" }}
          >
            3
          </span>
          <span className="font-mono text-xs font-medium">Pass, get your badge</span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-dim)" }}>
          Score 70%+ and you&apos;ll get a shareable proof URL and badge markdown
          to paste into your PR description.
        </p>
        <div
          className="mt-3 rounded-lg border p-4 font-mono text-[11px] leading-relaxed"
          style={{
            borderColor: "var(--color-border)",
            background: "oklch(11% 0.01 260)",
            color: "var(--color-text-dim)",
          }}
        >
          <div style={{ color: "var(--color-neon)" }}>  ┌────────────────────────────────────────────┐</div>
          <div style={{ color: "var(--color-neon)" }}>  │  ✓ 100% HUMAN VERIFIED           87%      │</div>
          <div style={{ color: "var(--color-neon)" }}>  │  Q1  92% ████████████░  ✓                 │</div>
          <div style={{ color: "var(--color-neon)" }}>  │  Q2  85% █████████░░░░  ✓                 │</div>
          <div style={{ color: "var(--color-neon)" }}>  │  Q3  84% █████████░░░░  ✓                 │</div>
          <div style={{ color: "var(--color-neon)" }}>  └────────────────────────────────────────────┘</div>
        </div>
      </div>

      {/* Link to dashboard */}
      <div
        className="rounded-lg border p-3"
        style={{
          borderColor: "oklch(82% 0.22 145 / 0.15)",
          background: "oklch(82% 0.22 145 / 0.04)",
        }}
      >
        <p className="font-mono text-[10px] font-bold mb-1" style={{ color: "var(--color-neon)" }}>
          Link results to your dashboard
        </p>
        <p className="text-[11px] leading-relaxed mb-2" style={{ color: "var(--color-text-dim)" }}>
          Log in once to link all future CLI test results to your prs.md account:
        </p>
        <CodeBlock code="npx prs-md login" />
      </div>

      {/* Options */}
      <div
        className="rounded-lg border p-3"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-surface-raised)",
        }}
      >
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-dim)" }}>
          All commands &amp; flags
        </p>
        <div className="space-y-1 font-mono text-[11px]" style={{ color: "var(--color-text-muted)" }}>
          <div><span style={{ color: "var(--color-accent)" }}>login</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Link tests to your prs.md account</div>
          <div><span style={{ color: "var(--color-accent)" }}>logout</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Remove stored credentials</div>
          <div><span style={{ color: "var(--color-accent)" }}>whoami</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Show current auth status</div>
          <div className="pt-1.5 border-t" style={{ borderColor: "var(--color-border)" }}>
            <span style={{ color: "var(--color-neon)" }}>--provider, -p</span> &nbsp; openai | anthropic | gemini
          </div>
          <div><span style={{ color: "var(--color-neon)" }}>--key, -k</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; AI API key</div>
        </div>
      </div>
    </div>
  );
}
