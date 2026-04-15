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
 * Returns null for null/undefined/empty input.
 */
export function decryptToken(stored: string | null | undefined): string | null {
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as Partial<EncryptedData>;
    if (parsed.encrypted && parsed.iv && parsed.authTag) {
      return decrypt(parsed as EncryptedData);
    }
  } catch {
    // Not JSON — legacy plaintext token, return as-is
  }
  return stored;
}
