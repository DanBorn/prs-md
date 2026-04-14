import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { apiKeys, challenges, accounts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";
import { parsePrUrl, fetchPrDiff } from "@/lib/github";
import { generateQuestions } from "@/lib/llm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { prUrl } = body as { prUrl: string };

  if (!prUrl) {
    return NextResponse.json(
      { error: "prUrl is required" },
      { status: 400 }
    );
  }

  const parsed = parsePrUrl(prUrl);
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid GitHub PR URL" },
      { status: 400 }
    );
  }

  // Get user's API key (pick the first available)
  const keys = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.userId, session.user.id));

  if (keys.length === 0) {
    return NextResponse.json(
      { error: "No API key configured. Add one in your dashboard." },
      { status: 400 }
    );
  }

  const keyRow = keys[0];
  const decryptedKey = decrypt({
    encrypted: keyRow.encryptedKey,
    iv: keyRow.iv,
    authTag: keyRow.authTag,
  });

  // Get user's GitHub access token for higher rate limits
  const userAccounts = await db
    .select()
    .from(accounts)
    .where(eq(accounts.userId, session.user.id));
  const ghAccount = userAccounts.find((a) => a.provider === "github");

  // Fetch the diff
  let diff: string;
  let title: string;
  try {
    const result = await fetchPrDiff(
      parsed.owner,
      parsed.repo,
      parsed.pull,
      ghAccount?.access_token ?? undefined
    );
    diff = result.diff;
    title = result.title;
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to fetch PR diff";
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  if (!diff.trim()) {
    return NextResponse.json(
      { error: "PR diff is empty" },
      { status: 422 }
    );
  }

  // Generate questions via LLM
  let questions;
  try {
    questions = await generateQuestions(keyRow.provider, decryptedKey, diff);
  } catch (error: unknown) {
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to generate questions";
    return NextResponse.json(
      { error: `LLM error: ${msg}` },
      { status: 502 }
    );
  }

  if (!Array.isArray(questions) || questions.length !== 3) {
    return NextResponse.json(
      { error: "LLM returned invalid question format. Try again." },
      { status: 502 }
    );
  }

  // Save challenge
  const id = nanoid(10);
  await db.insert(challenges).values({
    id,
    creatorId: session.user.id,
    prUrl,
    prTitle: title,
    prRepo: `${parsed.owner}/${parsed.repo}`,
    questions,
    status: "active",
  });

  return NextResponse.json({ id, success: true });
}
