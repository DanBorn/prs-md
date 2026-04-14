"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CodeBlock } from "./code-block";

type McpMode = "token" | "byok" | "piggyback";

export function SetupMcp({ mcpToken }: { mcpToken?: string | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<McpMode>(mcpToken ? "token" : "piggyback");
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [error, setError] = useState("");

  const tokenConfig = `{
  "mcpServers": {
    "prs-md": {
      "command": "npx",
      "args": ["-y", "@prs-md/mcp-server"],
      "env": {
        "PRS_TOKEN": "${generatedToken ?? mcpToken ?? "<your-token>"}"
      }
    }
  }
}`;

  const piggybackConfig = `{
  "mcpServers": {
    "prs-md": {
      "command": "npx",
      "args": ["-y", "@prs-md/mcp-server"]
    }
  }
}`;

  const byokConfig = `{
  "mcpServers": {
    "prs-md": {
      "command": "npx",
      "args": ["-y", "@prs-md/mcp-server"],
      "env": {
        "PRS_PROVIDER": "anthropic",
        "PRS_API_KEY": "sk-ant-..."
      }
    }
  }
}`;

  async function handleGenerateToken() {
    setError("");
    const res = await fetch("/api/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "mcp" }),
    });

    if (!res.ok) {
      setError("Failed to generate token.");
      return;
    }

    const data = (await res.json()) as { token: string };
    setGeneratedToken(data.token);
    startTransition(() => router.refresh());
  }

  async function handleRevokeToken() {
    // Revoke all tokens — simple for now
    const res = await fetch("/api/tokens");
    if (!res.ok) return;
    const data = (await res.json()) as { tokens: Array<{ id: string }> };
    for (const t of data.tokens) {
      await fetch(`/api/tokens?id=${t.id}`, { method: "DELETE" });
    }
    setGeneratedToken(null);
    startTransition(() => router.refresh());
  }

  function getConfig(): string {
    if (mode === "token") return tokenConfig;
    if (mode === "byok") return byokConfig;
    return piggybackConfig;
  }

  return (
    <div className="space-y-5">
      {/* Intro */}
      <div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
          Add prs.md as an MCP server to Claude Desktop, Cursor, or any MCP-compatible client.
          Ask your AI to run a Turing Test on any PR.
        </p>
      </div>

      {/* Mode toggle — three options */}
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-dim)" }}>
          Choose a mode
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setMode("token")}
            data-active={mode === "token" ? "token" : ""}
            className="mcp-mode-btn rounded-lg p-3 text-left transition-all"
          >
            <p className="font-mono text-xs font-bold" style={{ color: mode === "token" ? "var(--color-neon)" : "var(--color-text-muted)" }}>
              Dashboard Key
            </p>
            <p className="font-mono text-[10px] mt-0.5" style={{ color: "var(--color-text-dim)" }}>
              Use your stored API key &mdash; recommended
            </p>
          </button>
          <button
            onClick={() => setMode("byok")}
            data-active={mode === "byok" ? "byok" : ""}
            className="mcp-mode-btn rounded-lg p-3 text-left transition-all"
          >
            <p className="font-mono text-xs font-bold" style={{ color: mode === "byok" ? "var(--color-accent)" : "var(--color-text-muted)" }}>
              Local BYOK
            </p>
            <p className="font-mono text-[10px] mt-0.5" style={{ color: "var(--color-text-dim)" }}>
              Pass API key directly in MCP config
            </p>
          </button>
          <button
            onClick={() => setMode("piggyback")}
            data-active={mode === "piggyback" ? "piggyback" : ""}
            className="mcp-mode-btn rounded-lg p-3 text-left transition-all"
          >
            <p className="font-mono text-xs font-bold" style={{ color: mode === "piggyback" ? "var(--color-text-muted)" : "var(--color-text-dim)" }}>
              Piggyback
            </p>
            <p className="font-mono text-[10px] mt-0.5" style={{ color: "var(--color-text-dim)" }}>
              No key &mdash; the calling AI handles it
            </p>
          </button>
        </div>
      </div>

      {/* Token generation (token mode only) */}
      {mode === "token" && (
        <div
          className="rounded-lg border p-4"
          style={{
            borderColor: "oklch(82% 0.22 145 / 0.15)",
            background: "oklch(82% 0.22 145 / 0.04)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-black"
              style={{ background: "var(--color-neon-glow)", color: "var(--color-neon)" }}
            >
              &#128273;
            </span>
            <span className="font-mono text-xs font-bold" style={{ color: "var(--color-neon)" }}>
              MCP Token
            </span>
          </div>
          <p className="text-[11px] leading-relaxed mb-3" style={{ color: "var(--color-text-dim)" }}>
            Generate a token to let the MCP server use your dashboard API keys and identity.
            The token is shown once &mdash; copy it to your MCP config.
          </p>

          {generatedToken && (
            <div className="mb-3">
              <p className="font-mono text-[10px] font-bold mb-1" style={{ color: "var(--color-neon)" }}>
                Your token (copy now &mdash; shown once):
              </p>
              <CodeBlock code={generatedToken} />
            </div>
          )}

          {!generatedToken && mcpToken && (
            <p className="text-[11px] mb-3 font-mono" style={{ color: "var(--color-text-dim)" }}>
              You have an active token. Generate a new one to replace it, or revoke it.
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleGenerateToken}
              disabled={isPending}
              className="btn-secondary rounded-lg px-3 py-1.5 font-mono text-[11px] font-bold transition-all"
            >
              {mcpToken || generatedToken ? "Regenerate" : "Generate"} Token
            </button>
            {(mcpToken || generatedToken) && (
              <button
                onClick={handleRevokeToken}
                disabled={isPending}
                className="btn-danger rounded-lg px-3 py-1.5 font-mono text-[11px] font-medium transition-all disabled:opacity-50"
              >
                Revoke
              </button>
            )}
          </div>

          {error && <p className="mt-2 font-mono text-xs" style={{ color: "var(--color-danger)" }}>{error}</p>}
        </div>
      )}

      {/* Config */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-black"
            style={{ background: "var(--color-neon-glow)", color: "var(--color-neon)" }}
          >
            {mode === "token" ? "2" : "1"}
          </span>
          <span className="font-mono text-xs font-medium">
            Add to your MCP config
          </span>
        </div>
        <CodeBlock
          code={getConfig()}
          filename="claude_desktop_config.json"
          language="json"
        />
      </div>

      {/* How it works */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-black"
            style={{ background: "var(--color-neon-glow)", color: "var(--color-neon)" }}
          >
            {mode === "token" ? "3" : "2"}
          </span>
          <span className="font-mono text-xs font-medium">
            Ask your AI to run a challenge
          </span>
        </div>
        <div
          className="rounded-lg border p-4 font-mono text-[12px] leading-relaxed"
          style={{
            borderColor: "var(--color-border)",
            background: "oklch(11% 0.01 260)",
          }}
        >
          <div style={{ color: "var(--color-text-dim)" }}>
            <span style={{ color: "var(--color-accent)" }}>You:</span>{" "}
            <span style={{ color: "var(--color-text-muted)" }}>
              Run a prs.md Turing Test on https://github.com/acme/api/pull/247
            </span>
          </div>
        </div>
      </div>

      {/* Tools exposed */}
      <div
        className="rounded-lg border p-3"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-surface-raised)",
        }}
      >
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--color-text-dim)" }}>
          Exposed tools
        </p>
        <div className="space-y-1.5 font-mono text-[11px]">
          <div>
            <span style={{ color: "var(--color-neon)" }}>prs_start_challenge</span>
            <span style={{ color: "var(--color-text-dim)" }}> — Fetch PR diff, generate questions</span>
          </div>
          <div>
            <span style={{ color: "var(--color-neon)" }}>prs_submit_answers</span>
            <span style={{ color: "var(--color-text-dim)" }}> — Grade answers, register proof</span>
          </div>
          <div>
            <span style={{ color: "var(--color-neon)" }}>prs_get_diff</span>
            <span style={{ color: "var(--color-text-dim)" }}> — Fetch raw diff for review</span>
          </div>
        </div>
      </div>

      {/* Mode explanation */}
      {mode === "token" && (
        <div
          className="rounded-lg border p-3"
          style={{
            borderColor: "oklch(82% 0.22 145 / 0.15)",
            background: "oklch(82% 0.22 145 / 0.04)",
          }}
        >
          <p className="font-mono text-[10px] font-bold mb-1" style={{ color: "var(--color-neon)" }}>
            How dashboard key mode works
          </p>
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-text-dim)" }}>
            The MCP server sends your token to prs.md, which decrypts your stored API key
            server-side to generate questions and grade answers. Your AI key is never exposed
            to the MCP process. Results are automatically linked to your account.
            {" "}If you also pass <code className="font-mono" style={{ color: "var(--color-neon)" }}>PRS_PROVIDER</code> +{" "}
            <code className="font-mono" style={{ color: "var(--color-neon)" }}>PRS_API_KEY</code>,
            those local keys take precedence.
          </p>
        </div>
      )}

      {mode === "piggyback" && (
        <div
          className="rounded-lg border p-3"
          style={{
            borderColor: "oklch(82% 0.22 145 / 0.15)",
            background: "oklch(82% 0.22 145 / 0.04)",
          }}
        >
          <p className="font-mono text-[10px] font-bold mb-1" style={{ color: "var(--color-neon)" }}>
            How piggyback mode works
          </p>
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-text-dim)" }}>
            The MCP server fetches the PR diff, then returns it to the calling AI (Claude).
            Claude generates the questions, presents them to you, grades your answers, and
            registers the proof &mdash; no extra API key needed.
          </p>
        </div>
      )}

      {mode === "byok" && (
        <div
          className="rounded-lg border p-3"
          style={{
            borderColor: "oklch(70% 0.2 280 / 0.15)",
            background: "oklch(70% 0.2 280 / 0.04)",
          }}
        >
          <p className="font-mono text-[10px] font-bold mb-1" style={{ color: "var(--color-accent)" }}>
            How local BYOK mode works
          </p>
          <p className="text-[11px] leading-relaxed" style={{ color: "var(--color-text-dim)" }}>
            The MCP server uses your own API key (passed in the config) to independently generate questions
            and grade answers on your machine. More trustworthy since grading happens
            separately from the AI you&apos;re talking to.
          </p>
        </div>
      )}
    </div>
  );
}
