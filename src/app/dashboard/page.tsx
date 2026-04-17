export const dynamic = "force-dynamic";

import { requireAuth } from "@/lib/require-auth";
import { db } from "@/db";
import { apiKeys, attempts, challenges, mcpTokens } from "@/db/schema";
import { eq, desc, inArray, and } from "drizzle-orm";
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

  // Challenges the user created
  const createdChallenges = await db
    .select()
    .from(challenges)
    .where(eq(challenges.creatorId, session.user.id))
    .orderBy(desc(challenges.createdAt))
    .limit(20);

  // Challenge IDs where the user has attempted (covers action/CLI/MCP challenges
  // where creatorId is null but the user took the quiz)
  const userAttemptedIds = await db
    .selectDistinct({ challengeId: attempts.challengeId })
    .from(attempts)
    .where(eq(attempts.userId, session.user.id))
    .then((rows) => rows.map((r) => r.challengeId));

  const attemptedNotCreated = userAttemptedIds.filter(
    (id) => !createdChallenges.some((c) => c.id === id)
  );

  const attemptedChallenges =
    attemptedNotCreated.length > 0
      ? await db
          .select()
          .from(challenges)
          .where(inArray(challenges.id, attemptedNotCreated))
          .orderBy(desc(challenges.createdAt))
      : [];

  const userChallenges = [...createdChallenges, ...attemptedChallenges].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  ).slice(0, 20);

  // Fetch the user's best attempt per challenge (prefer passed over failed)
  const challengeIds = userChallenges.map((c) => c.id);
  const attemptMap: Record<string, boolean | null> = {};
  if (challengeIds.length > 0) {
    const userAttempts = await db
      .select({ challengeId: attempts.challengeId, passed: attempts.passed })
      .from(attempts)
      .where(
        and(
          inArray(attempts.challengeId, challengeIds),
          eq(attempts.userId, session.user.id)
        )
      );
    for (const attempt of userAttempts) {
      if (!(attempt.challengeId in attemptMap) || attempt.passed === true) {
        attemptMap[attempt.challengeId] = attempt.passed ?? null;
      }
    }
  }

  const challengesWithAttempts = userChallenges.map((c) => ({
    ...c,
    attemptPassed: attemptMap[c.id] ?? null,
  }));

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
        challenges={challengesWithAttempts}
        hasApiKey={hasApiKey}
        hasMcpToken={hasMcpToken}
      />
    </div>
  );
}
