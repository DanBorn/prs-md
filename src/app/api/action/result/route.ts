import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { challenges, attempts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface ActionResultBody {
  challengeId: string;
  scores: number[];
  feedback: string[];
  totalScore: number;
  passed: boolean;
}

/**
 * POST /api/action/result
 *
 * Called by the GitHub Action after grading answers.
 * Updates the pending attempt with scores and returns the proof URL.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as ActionResultBody;
  const { challengeId, scores, feedback, totalScore, passed } = body;

  if (!challengeId || !Array.isArray(scores) || !Array.isArray(feedback)) {
    return NextResponse.json(
      { error: "challengeId, scores, and feedback are required" },
      { status: 400 }
    );
  }

  const challenge = await db
    .select()
    .from(challenges)
    .where(
      and(eq(challenges.id, challengeId), eq(challenges.source, "action"))
    )
    .then((rows) => rows[0]);

  if (!challenge) {
    return NextResponse.json(
      { error: "Action challenge not found" },
      { status: 404 }
    );
  }

  // Find the pending attempt (scores are null)
  const attempt = await db
    .select()
    .from(attempts)
    .where(
      and(
        eq(attempts.challengeId, challengeId),
        // Pending attempts have no scores yet
      )
    )
    .then((rows) => rows.find((r) => r.scores === null));

  if (!attempt) {
    return NextResponse.json(
      { error: "No pending attempt found for this challenge" },
      { status: 404 }
    );
  }

  // Update attempt with grading results
  await db
    .update(attempts)
    .set({
      scores,
      totalScore,
      passed,
      gradingFeedback: feedback,
    })
    .where(eq(attempts.id, attempt.id));

  const serverUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

  return NextResponse.json({
    attemptId: attempt.id,
    passed,
    totalScore,
    proofUrl: passed ? `${serverUrl}/proof/${attempt.id}` : null,
  });
}
