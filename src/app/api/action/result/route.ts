import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { challenges, attempts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const PASS_THRESHOLD = 70;

interface ActionResultBody {
  challengeId: string;
  scores: number[];
  feedback: string[];
}

/**
 * POST /api/action/result
 *
 * Called by the GitHub Action after grading answers.
 * Updates the pending attempt with scores and returns the proof URL.
 * Authorization relies on the DB check: only challenges with source="action"
 * can be updated, meaning the row must have been legitimately created via
 * /api/action/challenge. No shared secret is required here.
 * totalScore and passed are computed server-side from the submitted scores.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as ActionResultBody;
  const { challengeId, scores, feedback } = body;

  if (!challengeId || !Array.isArray(scores) || !Array.isArray(feedback)) {
    return NextResponse.json(
      { error: "challengeId, scores, and feedback are required" },
      { status: 400 }
    );
  }

  if (scores.length === 0) {
    return NextResponse.json(
      { error: "scores must not be empty" },
      { status: 400 }
    );
  }

  if (scores.length > 10) {
    return NextResponse.json(
      { error: "scores array exceeds maximum length" },
      { status: 400 }
    );
  }

  // Clamp scores server-side — never trust caller arithmetic
  const clampedScores = scores.map((s) =>
    Math.max(0, Math.min(100, Math.round(Number(s) || 0)))
  );
  const totalScore = Math.round(
    clampedScores.reduce((sum, s) => sum + s, 0) / clampedScores.length
  );
  const passed = totalScore >= PASS_THRESHOLD;

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
    .where(eq(attempts.challengeId, challengeId))
    .then((rows) => rows.find((r) => r.scores === null));

  if (!attempt) {
    return NextResponse.json(
      { error: "No pending attempt found for this challenge" },
      { status: 404 }
    );
  }

  // Update attempt with grading results (server-computed totalScore and passed)
  await db
    .update(attempts)
    .set({
      scores: clampedScores,
      totalScore,
      passed,
      gradingFeedback: feedback,
    })
    .where(eq(attempts.id, attempt.id));

  const serverUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  return NextResponse.json({
    attemptId: attempt.id,
    passed,
    totalScore,
    proofUrl: passed ? `${serverUrl}/proof/${attempt.id}` : null,
  });
}
