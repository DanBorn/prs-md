import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
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
 * Verify the shared secret sent by the GitHub Action.
 * Uses timing-safe comparison to prevent timing attacks.
 */
function verifyActionSecret(req: NextRequest): boolean {
  const secret = process.env.ACTION_SECRET;
  if (!secret) return false;
  const provided = req.headers.get("x-action-secret");
  if (!provided) return false;
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(secret));
  } catch {
    // Buffers different length — definitely wrong
    return false;
  }
}

/**
 * POST /api/action/challenge
 *
 * Called by the GitHub Action after generating questions.
 * Stores the challenge and encrypts the callback token for later use.
 * Protected by ACTION_SECRET shared secret.
 */
export async function POST(req: NextRequest) {
  if (!verifyActionSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  trackServer("challenge_created", "github-action", {
    source: "action",
    repo: prRepo,
  });

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
