export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, accounts, apiKeys } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";

/**
 * GET /api/cli/keys
 *
 * Returns the authenticated user's stored AI provider keys (decrypted).
 * Used by the CLI to avoid prompting for a key when one is already
 * saved on the user's prs.md account.
 *
 * Authentication: GitHub token in Authorization header.
 *   Authorization: Bearer <github_token>
 *
 * Returns:
 *   { keys: Array<{ provider: string; apiKey: string }> }
 *   ordered by most-recently updated.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const githubToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!githubToken) {
    return NextResponse.json({ error: "Authorization header required" }, { status: 401 });
  }

  // Verify GitHub token and get identity
  let verifiedUsername: string | null = null;
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
      verifiedUsername = ghUser.login;
      verifiedGithubId = String(ghUser.id);
    }
  } catch {
    // fall through
  }

  if (!verifiedUsername) {
    return NextResponse.json({ error: "Invalid GitHub token" }, { status: 401 });
  }

  // Find user — primary: GitHub account ID, fallback: githubUsername
  let userId: string | null = null;

  if (verifiedGithubId) {
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

    if (accountRow) userId = accountRow.userId;
  }

  if (!userId) {
    const userRow = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.githubUsername, verifiedUsername))
      .then((rows) => rows[0]);

    if (userRow) userId = userRow.id;
  }

  if (!userId) {
    return NextResponse.json({ keys: [] });
  }

  const rows = await db
    .select({
      provider: apiKeys.provider,
      encryptedKey: apiKeys.encryptedKey,
      iv: apiKeys.iv,
      authTag: apiKeys.authTag,
      updatedAt: apiKeys.updatedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, userId));

  const keys = rows.map((row) => ({
    provider: row.provider,
    apiKey: decrypt({ encrypted: row.encryptedKey, iv: row.iv, authTag: row.authTag }),
  }));

  return NextResponse.json({ keys });
}
