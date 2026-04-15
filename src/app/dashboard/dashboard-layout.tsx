"use client";

import { useState } from "react";
import type { AiProvider, ChallengeStatus } from "@/db/schema";
import { ApiKeyManager } from "./api-key-manager";
import { ChallengeCreator } from "./challenge-creator";
import { ChallengeList } from "./challenge-list";
import { SetupCli } from "./setup-cli";
import { SetupMcp } from "./setup-mcp";
import { SetupAction } from "./setup-action";

type Section = "challenges" | "keys" | "cli" | "mcp" | "action";

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

const NAV_ITEMS: {
  id: Section;
  label: string;
  icon: string;
  group?: string;
}[] = [
  { id: "challenges", label: "Challenges", icon: "⚡" },
  { id: "keys", label: "API Keys", icon: "🔑" },
  { id: "cli", label: "CLI", icon: ">_", group: "Integrations" },
  { id: "mcp", label: "MCP Server", icon: "⬡", group: "Integrations" },
  { id: "action", label: "GitHub Action", icon: "⚙", group: "Integrations" },
];

export function DashboardLayout({
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
  const [section, setSection] = useState<Section>("challenges");

  // Pre-compute showGroup outside render to avoid mutating a variable inside map
  const navItems = NAV_ITEMS.reduce<
    Array<(typeof NAV_ITEMS)[number] & { showGroup: boolean }>
  >((acc, item) => {
    const prevGroup = acc.at(-1)?.group;
    return [...acc, { ...item, showGroup: !!(item.group && item.group !== prevGroup) }];
  }, []);

  return (
    <div className="md:flex md:gap-8">
      {/* ── Mobile: horizontal scrollable tabs ── */}
      <nav
        className="dash-mobile-nav -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-2 md:hidden"
        aria-label="Dashboard navigation"
      >
        {NAV_ITEMS.map((item) => {
          const active = section === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              data-active={active}
              className="docs-mobile-tab flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 font-mono text-xs font-medium whitespace-nowrap transition-colors"
            >
              <span className="text-[10px] opacity-60">{item.icon}</span>
              {item.label}
              {item.id === "challenges" && challenges.length > 0 && (
                <span
                  className="ml-0.5 font-mono text-[10px]"
                  style={{ color: "var(--color-text-dim)" }}
                >
                  {challenges.length}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Desktop: vertical sidebar ── */}
      <nav
        className="hidden w-48 shrink-0 md:block"
        aria-label="Dashboard navigation"
      >
        <div className="sticky top-20 space-y-0.5">
          {navItems.map((item) => {
            const active = section === item.id;
            const { showGroup } = item;

            return (
              <div key={item.id}>
                {showGroup && (
                  <p
                    className="mt-5 mb-2 px-3 font-mono text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: "var(--color-text-dim)" }}
                  >
                    {item.group}
                  </p>
                )}
                <button
                  onClick={() => setSection(item.id)}
                  data-active={active}
                  className="sidebar-item flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left font-mono text-xs font-medium transition-colors"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded text-[9px] opacity-60">

                    {item.icon}
                  </span>
                  {item.label}
                  {item.id === "challenges" && challenges.length > 0 && (
                    <span
                      className="ml-auto font-mono text-[10px]"
                      style={{ color: "var(--color-text-dim)" }}
                    >
                      {challenges.length}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-6">
        {section === "challenges" && (
          <>
            {hasApiKey && (
              <section>
                <ChallengeCreator />
              </section>
            )}
            {!hasApiKey && (
              <div
                className="rounded-xl border p-6"
                style={{
                  borderColor: "oklch(78% 0.16 70 / 0.2)",
                  background: "oklch(78% 0.16 70 / 0.04)",
                }}
              >
                <p className="text-sm font-medium" style={{ color: "var(--color-warning)" }}>
                  Add an API key to create challenges from the web.
                </p>
                <button
                  onClick={() => setSection("keys")}
                  className="btn-neon-text mt-2 rounded-md px-1 py-0.5 font-mono text-xs font-bold transition-all"
                >
                  Go to API Keys →
                </button>
              </div>
            )}
            {challenges.length > 0 && (
              <section>
                <ChallengeList challenges={challenges} />
              </section>
            )}
            {challenges.length === 0 && hasApiKey && (
              <p
                className="pt-4 text-center font-mono text-xs"
                style={{ color: "var(--color-text-dim)" }}
              >
                No challenges yet. Paste a PR URL above to create your first one.
              </p>
            )}
          </>
        )}

        {section === "keys" && (
          <section>
            <ApiKeyManager existingKeys={existingKeys} />
          </section>
        )}

        {section === "cli" && (
          <SectionCard icon=">_" title="CLI Setup" subtitle="Zero install — runs via npx. Node 20+ required.">
            <SetupCli />
          </SectionCard>
        )}

        {section === "mcp" && (
          <SectionCard icon="⬡" title="MCP Server" subtitle="Model Context Protocol — works with any MCP client.">
            <SetupMcp mcpToken={hasMcpToken ? "(active)" : null} />
          </SectionCard>
        )}

        {section === "action" && (
          <SectionCard icon="⚙" title="GitHub Action" subtitle="Automated Turing Test on every pull request.">
            <SetupAction />
          </SectionCard>
        )}
      </div>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-xl border p-6"
      style={{
        borderColor: "var(--color-border)",
        background: "var(--color-surface)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded font-mono text-[9px] font-black"
          style={{
            background: "var(--color-neon-glow)",
            color: "var(--color-neon)",
          }}
        >
          {icon}
        </span>
        <h2 className="text-base font-bold">{title}</h2>
      </div>
      <p
        className="text-xs mb-5"
        style={{ color: "var(--color-text-dim)" }}
      >
        {subtitle}
      </p>
      {children}
    </section>
  );
}
