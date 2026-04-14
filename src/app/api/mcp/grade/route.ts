import { NextRequest, NextResponse } from "next/server";
import { resolveTokenUser } from "@/lib/mcp-auth";
import { gradeAnswers } from "@/lib/llm";
import { db } from "@/db";
import { challenges, attempts } from "@/db/schema";
import type { ChallengeQuestion } from "@/db/schema";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);
const PASS_THRESHOLD = 70;

/**
 * POST /api/mcp/grade
 *
 * Bearer-token authenticated endpoint for MCP servers.
 * Grades answers using the user's stored AI key, registers the
 * proof, and returns scores + proof URL.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json(
      { error: "Bearer token required" },
      { status: 401 }
    );
  }

  const mcpUser = await resolveTokenUser(token);
  if (!mcpUser) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (!mcpUser.aiKey) {
    return NextResponse.json(
      { error: "No AI key configured. Add one at prs.md/dashboard." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const {
    prUrl,
    prTitle,
    prRepo,
    questions,
    answers,
    timeSpentSeconds,
  } = body as {
    prUrl: string;
    prTitle: string;
    prRepo: string;
    questions: ChallengeQuestion[];
    answers: string[];
    timeSpentSeconds?: number;
  };

  if (!prUrl || !questions || !answers) {
    return NextResponse.json(
      { error: "prUrl, questions, and answers are required" },
      { status: 400 }
    );
  }

  // Grade using the user's stored key
  let gradeResult;
  try {
    gradeResult = await gradeAnswers(
      mcpUser.aiKey.provider,
      mcpUser.aiKey.apiKey,
      questions,
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

  // Save challenge + attempt
  const challengeId = nanoid();
  await db.insert(challenges).values({
    id: challengeId,
    creatorId: mcpUser.id,
    prUrl,
    prTitle,
    prRepo,
    questions,
    status: "completed",
    timeLimitSeconds: 180,
  });

  const attempt = await db
    .insert(attempts)
    .values({
      challengeId,
      userId: mcpUser.id,
      answers,
      scores: gradeResult.scores,
      totalScore,
      passed,
      timeSpentSeconds: timeSpentSeconds ?? 0,
      gradingFeedback: gradeResult.feedback,
    })
    .returning();

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://prs.md";
  const proofUrl = passed ? `${baseUrl}/proof/${attempt[0].id}` : null;

  return NextResponse.json({
    scores: gradeResult.scores,
    totalScore,
    passed,
    feedback: gradeResult.feedback,
    proofUrl,
    githubUsername: mcpUser.githubUsername,
  });
}
