export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { db } from "@/db";
import { challenges, attempts, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { ChallengeView } from "./challenge-view";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChallengePage({ params }: Props) {
  const { id } = await params;

  const challenge = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, id))
    .then((rows) => rows[0]);

  if (!challenge) {
    notFound();
  }

  const creator = challenge.creatorId
    ? await db
        .select({ name: users.name, image: users.image, githubUsername: users.githubUsername })
        .from(users)
        .where(eq(users.id, challenge.creatorId))
        .then((rows) => rows[0])
    : null;

  const session = await auth();

  // Get the user's latest attempt (most recent)
  let latestAttempt = null;
  let attemptCount = 0;
  if (session?.user?.id) {
    const userAttempts = await db
      .select()
      .from(attempts)
      .where(
        and(
          eq(attempts.challengeId, id),
          eq(attempts.userId, session.user.id)
        )
      )
      .orderBy(desc(attempts.createdAt));

    attemptCount = userAttempts.length;
    // Prefer the passing attempt if one exists, otherwise latest
    latestAttempt = userAttempts.find((a) => a.passed) ?? userAttempts[0] ?? null;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <ChallengeView
        challenge={{
          id: challenge.id,
          prUrl: challenge.prUrl,
          prTitle: challenge.prTitle,
          prRepo: challenge.prRepo,
          status: challenge.status,
          timeLimitSeconds: challenge.timeLimitSeconds,
          questionCount: challenge.questions.length,
          createdAt: challenge.createdAt.toISOString(),
        }}
        creator={creator}
        isAuthenticated={!!session?.user?.id}
        hasAttempted={!!latestAttempt}
        attemptPassed={latestAttempt?.passed ?? null}
        attemptId={latestAttempt?.id ?? null}
        attemptCount={attemptCount}
      />
    </div>
  );
}
