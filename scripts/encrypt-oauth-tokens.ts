/**
 * One-time migration: encrypt existing plaintext OAuth tokens in the accounts table.
 *
 * Safe to run multiple times — already-encrypted rows are detected by JSON shape
 * and skipped automatically.
 *
 * Usage:
 *   DATABASE_URL=<owner-role-url> ENCRYPTION_KEY=<key> npx tsx scripts/encrypt-oauth-tokens.ts
 *
 * Use DATABASE_URL_OWNER (the DDL-capable role) so the UPDATE succeeds.
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { accounts } from "../src/db/schema";
import { encryptToken, decryptToken } from "../src/lib/crypto";
import { isNotNull, or } from "drizzle-orm";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
if (!process.env.ENCRYPTION_KEY) throw new Error("ENCRYPTION_KEY is required");

const sql = neon(url);
const db = drizzle(sql);

function isAlreadyEncrypted(value: string | null | undefined): boolean {
  if (!value) return true; // null/empty — nothing to do
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return !!(parsed.encrypted && parsed.iv && parsed.authTag);
  } catch {
    return false;
  }
}

async function main() {
  const rows = await db
    .select({
      provider: accounts.provider,
      providerAccountId: accounts.providerAccountId,
      access_token: accounts.access_token,
      refresh_token: accounts.refresh_token,
    })
    .from(accounts)
    .where(
      or(isNotNull(accounts.access_token), isNotNull(accounts.refresh_token))
    );

  console.log(`Found ${rows.length} account(s) with tokens.`);

  let encrypted = 0;
  let skipped = 0;

  for (const row of rows) {
    const needsAccessEncrypt =
      row.access_token && !isAlreadyEncrypted(row.access_token);
    const needsRefreshEncrypt =
      row.refresh_token && !isAlreadyEncrypted(row.refresh_token);

    if (!needsAccessEncrypt && !needsRefreshEncrypt) {
      skipped++;
      continue;
    }

    const { eq, and } = await import("drizzle-orm");
    await db
      .update(accounts)
      .set({
        ...(needsAccessEncrypt
          ? { access_token: encryptToken(row.access_token!) }
          : {}),
        ...(needsRefreshEncrypt
          ? { refresh_token: encryptToken(row.refresh_token!) }
          : {}),
      })
      .where(
        and(
          eq(accounts.provider, row.provider),
          eq(accounts.providerAccountId, row.providerAccountId)
        )
      );

    encrypted++;
  }

  console.log(`Done. Encrypted: ${encrypted}, already encrypted (skipped): ${skipped}`);

  // Verify a sample row decrypts correctly
  if (encrypted > 0) {
    const sample = rows.find(
      (r) => r.access_token && !isAlreadyEncrypted(r.access_token)
    );
    if (sample?.access_token) {
      const original = sample.access_token;
      const enc = encryptToken(original);
      const dec = decryptToken(enc);
      if (dec !== original) {
        throw new Error("Verification failed: decrypt(encrypt(token)) !== original");
      }
      console.log("Encrypt/decrypt round-trip verified OK.");
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
