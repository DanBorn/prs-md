import { NextRequest, NextResponse, after } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { apiKeys, challenges, attempts, users } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";
import { gradeAnswers } from "@/lib/llm";
import { trackServer } from "@/lib/mixpanel-server";

const PASS_THRESHOLD = 70;

/**
 * Fire a repository_dispatch event so the GitHub Action re-triggers
 * in grading mode with the quiz answers in the payload.
 */
async function fireCallback(
  challenge: {
    id: string;
    callbackRepo: string | null;
    callbackSha: string | null;
    callbackPrNumber: number | null;
    callbackTokenEncrypted: string | null;
    callbackTokenIv: string | null;
    callbackTokenAuthTag: string | null;
    questions: { question: string; expectedAnswer: string; isHallucinationTrap: boolean }[];
  },
  answers: string[],
  timeSpentSeconds: number,
  quizUserGithub: string | null
) {
  if (
    !challenge.callbackRepo ||
    !challenge.callbackTokenEncrypted ||
    !challenge.callbackTokenIv ||
    !challenge.callbackTokenAuthTag
  ) {
    return;
  }

  const token = decrypt({
    encrypted: challenge.callbackTokenEncrypted,
    iv: challenge.callbackTokenIv,
    authTag: challenge.callbackTokenAuthTag,
  });

  const res = await fetch(
    `https://api.github.com/repos/${challenge.callbackRepo}/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "prs-md",
      },
      body: JSON.stringify({
        event_type: "prs-md-quiz-submitted",
        client_payload: {
          challengeId: challenge.id,
          sha: challenge.callbackSha,
          prNumber: challenge.callbackPrNumber,
          answers,
          questions: challenge.questions,
          timeSpentSeconds,
          quizUserGithub,
        },
      }),
    }
  );

  if (!res.ok) {
    // Log only the status code — not the body which may contain repo/token context
    console.error(`repository_dispatch failed: ${res.status}`);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id as string;

  const body = await req.json();
  const { challengeId, answers, timeSpentSeconds } = body as {
    challengeId: string;
    answers: string[];
    timeSpentSeconds: number;
  };

  if (!challengeId || !Array.isArray(answers)) {
    return NextResponse.json(
      { error: "challengeId and answers are required" },
      { status: 400 }
    );
  }

  // Validate answer array — must be strings, capped at reasonable length
  const MAX_ANSWER_LENGTH = 2000;
  if (
    !answers.every(
      (a) => typeof a === "string" && a.length <= MAX_ANSWER_LENGTH
    )
  ) {
    return NextResponse.json(
      {
        error: `Each answer must be a string of at most ${MAX_ANSWER_LENGTH} characters`,
      },
      { status: 400 }
    );
  }

  // Block if already passed — allow retry on failure
  const existingPassed = await db
    .select()
    .from(attempts)
    .where(
      and(
        eq(attempts.challengeId, challengeId),
        eq(attempts.userId, userId),
        eq(attempts.passed, true)
      )
    )
    .then((rows) => rows[0]);

  if (existingPassed) {
    return NextResponse.json(
      { error: "You have already passed this challenge" },
      { status: 409 }
    );
  }

  // Count previous attempts — cap at 5 to prevent API key exhaustion
  const MAX_ATTEMPTS = 5;
  const [{ value: prevCount }] = await db
    .select({ value: count() })
    .from(attempts)
    .where(
      and(
        eq(attempts.challengeId, challengeId),
        eq(attempts.userId, userId)
      )
    );

  if (prevCount >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Maximum attempts reached for this challenge" },
      { status: 429 }
    );
  }

  const attemptNumber = prevCount + 1;

  // Load challenge
  const challenge = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, challengeId))
    .then((rows) => rows[0]);

  if (!challenge) {
    return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  }

  if (challenge.status !== "active") {
    return NextResponse.json(
      { error: "Challenge is not active" },
      { status: 400 }
    );
  }

  // Validate answers count matches questions count
  if (answers.length !== challenge.questions.length) {
    return NextResponse.json(
      { error: `Expected ${challenge.questions.length} answers, got ${answers.length}` },
      { status: 400 }
    );
  }

  // ── Action-sourced challenges: store answers, fire callback, skip LLM grading ──
  if (challenge.source === "action") {
    const attempt = await db
      .insert(attempts)
      .values({
        challengeId,
        userId: userId,
        answers,
        scores: null,
        totalScore: null,
        passed: null,
        attemptNumber,
        timeSpentSeconds,
        gradingFeedback: null,
      })
      .returning();

    // Look up the quiz-taker's GitHub username for the callback payload
    const quizUser = await db
      .select({ githubUsername: users.githubUsername })
      .from(users)
      .where(eq(users.id, userId))
      .then((rows) => rows[0]);

    // Fire repository_dispatch (non-blocking — don't fail the request if it errors)
    fireCallback(
      challenge,
      answers,
      timeSpentSeconds,
      quizUser?.githubUsername ?? null
    ).catch((err) =>
      console.error("Failed to fire callback:", err)
    );

    after(() =>
      trackServer("quiz_attempt", userId, {
        source: "action",
        passed: null,
        total_score: null,
        attempt_number: attemptNumber,
        time_spent_seconds: timeSpentSeconds ?? null,
      })
    );

    return NextResponse.json({
      attemptId: attempt[0].id,
      status: "grading",
      message:
        "Answers submitted. The GitHub Action will grade them — check your PR for results.",
    });
  }

  // ── Web/MCP challenges: grade inline using creator's API key ──
  if (!challenge.creatorId) {
    return NextResponse.json(
      { error: "Challenge has no creator — cannot grade" },
      { status: 400 }
    );
  }

  const creatorId: string = challenge.creatorId;
  const keys = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.userId, creatorId));

  if (keys.length === 0) {
    return NextResponse.json(
      { error: "Challenge creator's API key is no longer available" },
      { status: 502 }
    );
  }

  const keyRow = keys[0];
  const decryptedKey = decrypt({
    encrypted: keyRow.encryptedKey,
    iv: keyRow.iv,
    authTag: keyRow.authTag,
  });

  let gradeResult;
  try {
    gradeResult = await gradeAnswers(
      keyRow.provider,
      decryptedKey,
      challenge.questions,
      answers
    );
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Grading failed";
    return NextResponse.json(
      { error: `LLM grading error: ${msg}` },
      { status: 502 }
    );
  }

  const totalScore = Math.round(
    gradeResult.scores.reduce((sum, s) => sum + s, 0) /
      gradeResult.scores.length
  );
  const passed = totalScore >= PASS_THRESHOLD;

  const attempt = await db
    .insert(attempts)
    .values({
      challengeId,
      userId: userId,
      answers,
      scores: gradeResult.scores,
      totalScore,
      passed,
      attemptNumber,
      timeSpentSeconds,
      gradingFeedback: gradeResult.feedback,
    })
    .returning();

  after(() =>
    trackServer("quiz_attempt", userId, {
      source: challenge.source ?? "web",
      passed,
      total_score: totalScore,
      attempt_number: attemptNumber,
      time_spent_seconds: timeSpentSeconds ?? null,
    })
  );

  if (passed) {
    after(() =>
      trackServer("challenge_passed", userId, {
        source: challenge.source ?? "web",
        total_score: totalScore,
        time_spent_seconds: timeSpentSeconds ?? null,
      })
    );
  }

  return NextResponse.json({
    attemptId: attempt[0].id,
    scores: gradeResult.scores,
    totalScore,
    passed,
    feedback: gradeResult.feedback,
  });
}
