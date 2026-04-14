import { db } from "@/db";
import { mcpTokens, users, apiKeys } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashToken } from "@/lib/tokens";
import { decrypt } from "@/lib/crypto";

export interface McpUser {
  id: string;
  githubUsername: string | null;
  /** Decrypted AI API key + provider, if the user has one stored */
  aiKey: { provider: "openai" | "anthropic" | "gemini"; apiKey: string } | null;
}

/**
 * Resolve a bearer token to a user with their stored AI key.
 * Returns null if the token is invalid.
 * Updates `lastUsedAt` as a side effect.
 */
export async function resolveTokenUser(
  bearerToken: string
): Promise<McpUser | null> {
  const hashed = hashToken(bearerToken);

  const row = await db
    .select({
      tokenId: mcpTokens.id,
      userId: mcpTokens.userId,
    })
    .from(mcpTokens)
    .where(eq(mcpTokens.tokenHash, hashed))
    .then((rows) => rows[0]);

  if (!row) return null;

  // Touch lastUsedAt (fire-and-forget)
  db.update(mcpTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(mcpTokens.id, row.tokenId))
    .catch(() => {});

  const user = await db
    .select({
      id: users.id,
      githubUsername: users.githubUsername,
    })
    .from(users)
    .where(eq(users.id, row.userId))
    .then((rows) => rows[0]);

  if (!user) return null;

  // Get first available AI key
  const keyRow = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.userId, user.id))
    .then((rows) => rows[0]);

  let aiKey: McpUser["aiKey"] = null;
  if (keyRow) {
    try {
      const decrypted = decrypt({
        encrypted: keyRow.encryptedKey,
        iv: keyRow.iv,
        authTag: keyRow.authTag,
      });
      aiKey = { provider: keyRow.provider, apiKey: decrypted };
    } catch {
      // Decryption failed — treat as no key
    }
  }

  return {
    id: user.id,
    githubUsername: user.githubUsername,
    aiKey,
  };
}
