export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, challenges, attempts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10);

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
    totalScore,
    passed,
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
    totalScore: number;
    passed: boolean;
    timeSpentSeconds: number;
    gradingFeedback: string[];
  };

  if (!prUrl || !questions || !answers) {
    return NextResponse.json(
      { error: "Missing required fields: prUrl, questions, answers" },
      { status: 400 },
    );
  }

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

  // Create attempt record
  const attempt = await db
    .insert(attempts)
    .values({
      challengeId,
      userId: user.id,
      answers,
      scores,
      totalScore,
      passed,
      timeSpentSeconds,
      gradingFeedback,
    })
    .returning();

  const proofId = attempt[0].id;
  const baseUrl = process.env.NEXTAUTH_URL ?? "https://prs.md";

  return NextResponse.json({
    proofId,
    proofUrl: `${baseUrl}/proof/${proofId}`,
  });
}
