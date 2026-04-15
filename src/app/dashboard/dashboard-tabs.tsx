"use client";

import { useState } from "react";
import type { AiProvider, ChallengeStatus } from "@/db/schema";
import { ApiKeyManager } from "./api-key-manager";
import { ChallengeCreator } from "./challenge-creator";
import { ChallengeList } from "./challenge-list";
import { SetupCli } from "./setup-cli";
import { SetupMcp } from "./setup-mcp";

type Tab = "web" | "cli" | "mcp";

interface ExistingKey {
  id: string;
  provider: AiProvider;
  createdAt: Date;
}

interface Challenge {
  id: string;
  prUrl: string;
  prTitle: string | null;
  prRepo: string | null;
  status: ChallengeStatus;
  createdAt: Date;
}

const TABS: { id: Tab; label: string; icon: string; description: string }[] = [
  { id: "web", label: "Web", icon: "◈", description: "Generate challenges from the browser" },
  { id: "cli", label: "CLI", icon: ">_", description: "Run locally from your terminal" },
  { id: "mcp", label: "MCP", icon: "⬡", description: "Use with Claude, Cursor, or any AI" },
];

export function DashboardTabs({
  existingKeys,
  challenges,
  hasApiKey,
  hasMcpToken,
}: {
  existingKeys: ExistingKey[];
  challenges: Challenge[];
  hasApiKey: boolean;
  hasMcpToken: boolean;
}) {
  const [tab, setTab] = useState<Tab>("web");

  return (
    <div>
      {/* Method selector — horizontal cards */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3 mb-8">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="group relative rounded-xl border p-3 sm:p-4 text-left transition-all"
              style={{
                borderColor: active
                  ? "oklch(82% 0.22 145 / 0.3)"
                  : "var(--color-border)",
                background: active
                  ? "oklch(82% 0.22 145 / 0.06)"
                  : "var(--color-surface)",
                boxShadow: active ? "var(--shadow-glow-neon)" : "none",
              }}
            >
              {/* Active indicator dot */}
              {active && (
                <span
                  className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full"
                  style={{
                    background: "var(--color-neon)",
                    boxShadow: "0 0 6px var(--color-neon)",
                  }}
                />
              )}

              <div className="flex items-center gap-2.5 mb-1.5">
                <span
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg font-mono text-[10px] font-black"
                  style={{
                    background: active
                      ? "var(--color-neon-glow)"
                      : "var(--color-surface-raised)",
                    color: active
                      ? "var(--color-neon)"
                      : "var(--color-text-dim)",
                    border: `1px solid ${active ? "oklch(82% 0.22 145 / 0.2)" : "var(--color-border)"}`,
                  }}
                >
                  {t.icon}
                </span>
                <span
                  className="font-mono text-sm font-bold"
                  style={{
                    color: active ? "var(--color-neon)" : "var(--color-text-muted)",
                  }}
                >
                  {t.label}
                </span>
              </div>
              <p
                className="hidden sm:block font-mono text-[10px] leading-relaxed"
                style={{ color: "var(--color-text-dim)" }}
              >
                {t.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="space-y-6">
        {tab === "web" && (
          <>
            <section>
              <ApiKeyManager existingKeys={existingKeys} />
            </section>

            {hasApiKey && (
              <section>
                <ChallengeCreator />
              </section>
            )}
          </>
        )}

        {tab === "cli" && (
          <section
            className="rounded-xl border p-4 sm:p-6"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded font-mono text-[9px] font-black"
                style={{ background: "var(--color-neon-glow)", color: "var(--color-neon)" }}
              >
                {">_"}
              </span>
              <h2 className="text-base font-bold">CLI Setup</h2>
            </div>
            <p className="text-xs mb-5" style={{ color: "var(--color-text-dim)" }}>
              Zero install &mdash; runs via npx. Node 20+ required.
            </p>
            <SetupCli />
          </section>
        )}

        {tab === "mcp" && (
          <section
            className="rounded-xl border p-4 sm:p-6"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded font-mono text-[9px] font-black"
                style={{ background: "var(--color-accent-dim)", color: "var(--color-accent)" }}
              >
                ⬡
              </span>
              <h2 className="text-base font-bold">MCP Server</h2>
            </div>
            <p className="text-xs mb-5" style={{ color: "var(--color-text-dim)" }}>
              Model Context Protocol &mdash; works with any MCP client.
            </p>
            <SetupMcp mcpToken={hasMcpToken ? "(active)" : null} />
          </section>
        )}
      </div>

      {/* Challenge history — always visible */}
      {challenges.length > 0 && (
        <section className="mt-10">
          <ChallengeList challenges={challenges} />
        </section>
      )}
    </div>
  );
}
