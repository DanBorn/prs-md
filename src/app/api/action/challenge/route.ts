import { NextRequest, NextResponse, after } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { challenges } from "@/db/schema";
import type { ChallengeQuestion } from "@/db/schema";
import { encrypt } from "@/lib/crypto";
import { trackServer } from "@/lib/mixpanel-server";

interface ActionChallengeBody {
  prUrl: string;
  prTitle: string;
  prRepo: string;
  sha: string;
  prNumber: number;
  questions: ChallengeQuestion[];
  callbackToken: string;
}

/**
 * Verify the callbackToken is a valid GitHub PAT by calling the GitHub API.
 * This confirms the request originates from a real GitHub Action runner
 * without requiring callers to know any server-side secret.
 */
async function verifyGitHubToken(token: string): Promise<boolean> {
  try {
    const res = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "prs.md",
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * POST /api/action/challenge
 *
 * Called by the GitHub Action after generating questions.
 * Stores the challenge and encrypts the callback token for later use.
 * Authorization: validates callbackToken against the GitHub API — any real
 * GitHub PAT is accepted, so any user can set up the action without needing
 * access to server-side secrets.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as ActionChallengeBody;

  const { prUrl, prTitle, prRepo, sha, prNumber, questions, callbackToken } =
    body;

  if (!prUrl || !prRepo || !sha || !callbackToken || !prNumber) {
    return NextResponse.json(
      { error: "prUrl, prRepo, sha, prNumber, and callbackToken are required" },
      { status: 400 }
    );
  }

  if (!Array.isArray(questions) || questions.length !== 3) {
    return NextResponse.json(
      { error: "Exactly 3 questions required" },
      { status: 400 }
    );
  }

  const tokenValid = await verifyGitHubToken(callbackToken);
  if (!tokenValid) {
    return NextResponse.json({ error: "Invalid callback token" }, { status: 401 });
  }

  // Encrypt the callback token at rest
  const encrypted = encrypt(callbackToken);

  const id = nanoid(10);
  await db.insert(challenges).values({
    id,
    creatorId: null,
    prUrl,
    prTitle,
    prRepo,
    questions,
    status: "active",
    source: "action",
    callbackRepo: prRepo,
    callbackSha: sha,
    callbackPrNumber: prNumber,
    callbackTokenEncrypted: encrypted.encrypted,
    callbackTokenIv: encrypted.iv,
    callbackTokenAuthTag: encrypted.authTag,
  });

  after(() =>
    trackServer("challenge_created", "github-action", {
      source: "action",
      repo: prRepo,
    })
  );

  const serverUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  return NextResponse.json({
    id,
    quizUrl: `${serverUrl}/challenge/${id}`,
  });
}
