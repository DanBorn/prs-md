import { createHash, randomBytes } from "crypto";

/** Generate a random MCP bearer token with a recognizable prefix */
export function generateToken(): string {
  const raw = randomBytes(32).toString("base64url");
  return `prs_${raw}`;
}

/** SHA-256 hash a token for safe storage */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
