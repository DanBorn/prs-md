export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/require-auth";
import { db } from "@/db";
import { apiKeys, challenges, mcpTokens } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { DashboardLayout } from "./dashboard-layout";

export default async function DashboardPage() {
  const session = await requireAuth();

  const keys = await db
    .select({
      id: apiKeys.id,
      provider: apiKeys.provider,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, session.user.id));

  const userChallenges = await db
    .select()
    .from(challenges)
    .where(eq(challenges.creatorId, session.user.id))
    .orderBy(desc(challenges.createdAt))
    .limit(20);

  const tokens = await db
    .select({ id: mcpTokens.id })
    .from(mcpTokens)
    .where(eq(mcpTokens.userId, session.user.id))
    .limit(1);

  const hasApiKey = keys.length > 0;
  const hasMcpToken = tokens.length > 0;
  const username = (session.user as { githubUsername?: string }).githubUsername
    ?? session.user.name
    ?? "developer";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-neon)" }}>
          Dashboard
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          Hey, <span style={{ color: "var(--color-neon)" }}>@{username}</span>
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
          Choose how you want to run the Turing Test.
        </p>
      </div>

      <DashboardLayout
        existingKeys={keys}
        challenges={userChallenges}
        hasApiKey={hasApiKey}
        hasMcpToken={hasMcpToken}
      />
    </div>
  );
}
