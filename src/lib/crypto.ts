import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  const buf = Buffer.from(key, "base64");
  if (buf.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must be exactly 32 bytes (got ${buf.length})`
    );
  }
  return buf;
}

export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}

export function encrypt(plaintext: string): EncryptedData {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function decrypt(data: EncryptedData): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(data.iv, "base64");
  const authTag = Buffer.from(data.authTag, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(data.encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Encrypt an OAuth token for storage in the database.
 * Returns a JSON string containing the ciphertext, IV, and auth tag.
 */
export function encryptToken(plaintext: string): string {
  return JSON.stringify(encrypt(plaintext));
}

/**
 * Decrypt a stored OAuth token.
 *
 * Handles two formats:
 *  - Encrypted: JSON string with { encrypted, iv, authTag } — decrypt and return
 *  - Legacy plaintext: return as-is (rows written before encryption was added)
 *
 * Returns null for null/undefined/empty input, or if decryption fails
 * (so callers never receive raw ciphertext by mistake).
 */
export function decryptToken(stored: string | null | undefined): string | null {
  if (!stored) return null;

  // Step 1: try to parse as JSON. If it fails, it's a legacy plaintext token.
  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return stored; // legacy plaintext — return as-is
  }

  // Step 2: if the JSON has our encrypted-token shape, decrypt it.
  if (
    parsed !== null &&
    typeof parsed === "object" &&
    "encrypted" in parsed &&
    "iv" in parsed &&
    "authTag" in parsed
  ) {
    try {
      return decrypt(parsed as EncryptedData);
    } catch {
      // Decryption failed (wrong key, corrupted data).
      // Return null so callers skip the token rather than sending ciphertext to GitHub.
      console.error("[decryptToken] Failed to decrypt OAuth token — token will not be used");
      return null;
    }
  }

  // Valid JSON but not our format — shouldn't happen in practice.
  return stored;
}
