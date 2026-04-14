export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { challenges, attempts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { QuizRunner } from "./quiz-runner";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QuizPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const challenge = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, id))
    .then((rows) => rows[0]);

  if (!challenge) {
    notFound();
  }

  if (challenge.status !== "active") {
    redirect(`/challenge/${id}`);
  }

  // Block if already passed — allow retry on failure
  const existingPassed = await db
    .select()
    .from(attempts)
    .where(
      and(
        eq(attempts.challengeId, id),
        eq(attempts.userId, session.user.id),
        eq(attempts.passed, true)
      )
    )
    .then((rows) => rows[0]);

  if (existingPassed) {
    redirect(`/challenge/${id}`);
  }

  // Strip expected answers — only send questions to client
  const questionsForClient = challenge.questions.map((q, i) => ({
    index: i,
    question: q.question,
  }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <QuizRunner
        challengeId={challenge.id}
        prTitle={challenge.prTitle ?? "PR Challenge"}
        prRepo={challenge.prRepo}
        questions={questionsForClient}
        timeLimitSeconds={challenge.timeLimitSeconds}
      />
    </div>
  );
}
