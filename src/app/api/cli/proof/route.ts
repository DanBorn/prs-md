export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, challenges, attempts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { trackServer } from "@/lib/mixpanel-server";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

const PASS_THRESHOLD = 70;
const MAX_ANSWER_LENGTH = 2000;

/**
 * POST /api/cli/proof
 *
 * Register a proof from the CLI or MCP server.
 *
 * Authentication:
 * - With githubToken: Verifies token via GitHub API, links proof to
 *   the user's existing prs.md account (or creates one). Username on
 *   the badge comes from the verified GitHub identity.
 * - Without githubToken: Anonymous proof. No username on badge.
 *   The proof page still shows all questions and answers transparently.
 *
 * Only public repos are supported.
 *
 * Security: totalScore and passed are re-computed server-side from the
 * submitted scores. The client's passed/totalScore values are ignored.
 * Individual scores are clamped to [0, 100].
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    githubToken,
    prUrl,
    prTitle,
    prRepo,
    questions,
    answers,
    scores,
    timeSpentSeconds,
    gradingFeedback,
  } = body as {
    githubToken?: string;
    prUrl: string;
    prTitle: string;
    prRepo: string;
    questions: Array<{
      question: string;
      expectedAnswer: string;
      isHallucinationTrap: boolean;
    }>;
    answers: string[];
    scores: number[];
    timeSpentSeconds: number;
    gradingFeedback: string[];
  };

  if (!prUrl || !questions || !answers || !scores) {
    return NextResponse.json(
      { error: "Missing required fields: prUrl, questions, answers, scores" },
      { status: 400 },
    );
  }

  if (!Array.isArray(questions) || questions.length !== 3) {
    return NextResponse.json(
      { error: "Exactly 3 questions are required" },
      { status: 400 },
    );
  }

  if (!Array.isArray(answers) || answers.length !== questions.length) {
    return NextResponse.json(
      { error: `Expected ${questions.length} answers` },
      { status: 400 },
    );
  }

  if (
    !answers.every(
      (a) => typeof a === "string" && a.length <= MAX_ANSWER_LENGTH
    )
  ) {
    return NextResponse.json(
      { error: `Each answer must be a string of at most ${MAX_ANSWER_LENGTH} characters` },
      { status: 400 },
    );
  }

  if (!Array.isArray(scores) || scores.length !== questions.length) {
    return NextResponse.json(
      { error: `Expected ${questions.length} scores` },
      { status: 400 },
    );
  }

  // Re-compute totalScore and passed server-side — never trust the caller
  const clampedScores = scores.map((s) =>
    Math.max(0, Math.min(100, Math.round(Number(s) || 0)))
  );
  const totalScore = Math.round(
    clampedScores.reduce((sum, s) => sum + s, 0) / clampedScores.length
  );
  const passed = totalScore >= PASS_THRESHOLD;

  if (!passed) {
    return NextResponse.json(
      { error: "Only passing attempts can be registered as proofs" },
      { status: 400 },
    );
  }

  // Verify GitHub identity if token provided
  let verifiedUsername: string | null = null;

  if (githubToken) {
    try {
      const ghRes = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${githubToken}`,
          "User-Agent": "prs-md-server",
        },
      });

      if (ghRes.ok) {
        const ghUser = (await ghRes.json()) as { login: string };
        verifiedUsername = ghUser.login;
      }
    } catch {
      // Token verification failed — proceed as anonymous
    }
  }

  // Find or create user
  let user;

  if (verifiedUsername) {
    // Authenticated — link to existing account or create one
    user = await db
      .select()
      .from(users)
      .where(eq(users.githubUsername, verifiedUsername))
      .then((rows) => rows[0]);

    if (!user) {
      const inserted = await db
        .insert(users)
        .values({
          name: verifiedUsername,
          image: `https://github.com/${verifiedUsername}.png`,
          githubUsername: verifiedUsername,
        })
        .returning();
      user = inserted[0];
    }
  } else {
    // Anonymous — create a throwaway anonymous user
    const anonId = `anon-${nanoid()}`;
    const inserted = await db
      .insert(users)
      .values({
        name: "Anonymous",
        githubUsername: anonId,
      })
      .returning();
    user = inserted[0];
  }

  // Create challenge record
  const challengeId = nanoid();
  await db.insert(challenges).values({
    id: challengeId,
    creatorId: user.id,
    prUrl,
    prTitle,
    prRepo,
    questions,
    status: "completed",
    timeLimitSeconds: 180,
  });

  // Create attempt record with server-computed scores
  const attempt = await db
    .insert(attempts)
    .values({
      challengeId,
      userId: user.id,
      answers,
      scores: clampedScores,
      totalScore,
      passed,
      timeSpentSeconds: typeof timeSpentSeconds === "number" ? timeSpentSeconds : 0,
      gradingFeedback: Array.isArray(gradingFeedback) ? gradingFeedback : [],
    })
    .returning();

  const proofId = attempt[0].id;

  trackServer("challenge_created", user.id, {
    source: "cli",
    is_authenticated: verifiedUsername !== null,
  });

  trackServer("challenge_passed", user.id, {
    source: "cli",
    total_score: totalScore,
    time_spent_seconds: typeof timeSpentSeconds === "number" ? timeSpentSeconds : null,
    is_authenticated: verifiedUsername !== null,
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://prs.md";

  return NextResponse.json({
    proofId,
    proofUrl: `${baseUrl}/proof/${proofId}`,
  });
}
