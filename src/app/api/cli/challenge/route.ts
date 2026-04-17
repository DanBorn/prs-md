export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, accounts, challenges } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/cli/challenge?prUrl=...
 *
 * Bearer-token authenticated (GitHub user token) lookup of an existing
 * challenge for the authenticated user + PR URL pair.
 *
 * Used by the CLI before generating questions so that repeat runs on the
 * same PR reuse the stored questions, keeping attempts comparable.
 *
 * Returns 200 with challenge data if found, 404 otherwise.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const githubToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!githubToken) {
    return NextResponse.json({ error: "Bearer token required" }, { status: 401 });
  }

  const prUrl = req.nextUrl.searchParams.get("prUrl");
  if (!prUrl) {
    return NextResponse.json({ error: "prUrl is required" }, { status: 400 });
  }

  // Verify GitHub identity
  let verifiedGithubId: string | null = null;
  try {
    const ghRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "User-Agent": "prs-md-server",
      },
    });
    if (ghRes.ok) {
      const ghUser = (await ghRes.json()) as { login: string; id: number };
      verifiedGithubId = String(ghUser.id);
    }
  } catch {
    // Fall through
  }

  if (!verifiedGithubId) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Resolve user from GitHub account ID
  const accountRow = await db
    .select({ userId: accounts.userId })
    .from(accounts)
    .where(
      and(
        eq(accounts.provider, "github"),
        eq(accounts.providerAccountId, verifiedGithubId)
      )
    )
    .then((rows) => rows[0]);

  let userId: string | null = null;
  if (accountRow) {
    userId = accountRow.userId;
  } else {
    // Fallback: match via githubUsername from /user login
    const ghRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        "User-Agent": "prs-md-server",
      },
    });
    if (ghRes.ok) {
      const ghUser = (await ghRes.json()) as { login: string };
      const userRow = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.githubUsername, ghUser.login))
        .then((rows) => rows[0]);
      userId = userRow?.id ?? null;
    }
  }

  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Look up existing challenge for this user + PR
  const existing = await db
    .select({
      id: challenges.id,
      questions: challenges.questions,
      prTitle: challenges.prTitle,
      prRepo: challenges.prRepo,
    })
    .from(challenges)
    .where(
      and(
        eq(challenges.creatorId, userId),
        eq(challenges.prUrl, prUrl)
      )
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (!existing) {
    return NextResponse.json({ error: "No existing challenge" }, { status: 404 });
  }

  return NextResponse.json({
    challengeId: existing.id,
    questions: existing.questions,
    prTitle: existing.prTitle,
    prRepo: existing.prRepo,
  });
}
