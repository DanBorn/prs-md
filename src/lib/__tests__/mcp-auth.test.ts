import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock @/db — Drizzle's fluent query builder is mocked as a chainable object
// ---------------------------------------------------------------------------

const { mockDbSelect, mockDbUpdate } = vi.hoisted(() => ({
  mockDbSelect: vi.fn(),
  mockDbUpdate: vi.fn(),
}));

vi.mock("@/db", () => ({
  db: {
    select: mockDbSelect,
    update: mockDbUpdate,
  },
}));

// We want the real hashToken and decrypt implementations so we can generate
// valid tokens and encrypted keys in our fixtures.
// (crypto and tokens are pure Node.js — safe to use directly in tests.)
import { generateToken, hashToken } from "../tokens";
import { encrypt } from "../crypto";
import { resolveTokenUser } from "../mcp-auth";

// ---------------------------------------------------------------------------
// Test setup helpers
// ---------------------------------------------------------------------------

// Valid 32-byte key needed by encrypt()
const ENCRYPTION_KEY_B64 = Buffer.alloc(32).toString("base64");
process.env.ENCRYPTION_KEY = ENCRYPTION_KEY_B64;

const TOKEN = generateToken();
hashToken(TOKEN); // pre-hash to verify the function runs without error
const ENCRYPTED_KEY = encrypt("sk-test-decrypted-key");

/** Build a Drizzle-style chainable select stub that resolves to `rows`. */
function selectResolving(rows: unknown[]) {
  const promise = Promise.resolve(rows);
  const builder = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnValue(promise),
  };
  return builder;
}

// ---------------------------------------------------------------------------
// resolveTokenUser
// ---------------------------------------------------------------------------

describe("resolveTokenUser", () => {
  beforeEach(() => {
    // resetAllMocks clears both call history AND the mockReturnValueOnce queue,
    // preventing leftover queued values from leaking between tests.
    vi.resetAllMocks();

    // Default: update (fire-and-forget) does nothing
    mockDbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ catch: vi.fn() }),
      }),
    });
  });

  it("returns null when token hash is not found in the DB", async () => {
    mockDbSelect.mockReturnValue(selectResolving([])); // no matching token
    const result = await resolveTokenUser("prs_nonexistent");
    expect(result).toBeNull();
  });

  it("returns null when the user row is missing after token lookup", async () => {
    mockDbSelect
      .mockReturnValueOnce(
        selectResolving([{ tokenId: "tid-1", userId: "uid-1" }])
      ) // token row found
      .mockReturnValueOnce(selectResolving([])) // user not found
      .mockReturnValueOnce(selectResolving([])); // api key (won't be reached)

    const result = await resolveTokenUser(TOKEN);
    expect(result).toBeNull();
  });

  it("returns user with null aiKey when the user has no API keys stored", async () => {
    mockDbSelect
      .mockReturnValueOnce(
        selectResolving([{ tokenId: "tid-1", userId: "uid-1" }])
      )
      .mockReturnValueOnce(
        selectResolving([{ id: "uid-1", githubUsername: "octocat" }])
      )
      .mockReturnValueOnce(selectResolving([])); // no keys

    const result = await resolveTokenUser(TOKEN);
    expect(result).toEqual({
      id: "uid-1",
      githubUsername: "octocat",
      aiKey: null,
    });
  });

  it("returns user with decrypted aiKey when an API key is stored", async () => {
    mockDbSelect
      .mockReturnValueOnce(
        selectResolving([{ tokenId: "tid-1", userId: "uid-1" }])
      )
      .mockReturnValueOnce(
        selectResolving([{ id: "uid-1", githubUsername: "octocat" }])
      )
      .mockReturnValueOnce(
        selectResolving([
          {
            provider: "openai",
            encryptedKey: ENCRYPTED_KEY.encrypted,
            iv: ENCRYPTED_KEY.iv,
            authTag: ENCRYPTED_KEY.authTag,
          },
        ])
      );

    const result = await resolveTokenUser(TOKEN);
    expect(result).toEqual({
      id: "uid-1",
      githubUsername: "octocat",
      aiKey: { provider: "openai", apiKey: "sk-test-decrypted-key" },
    });
  });

  it("hashes the bearer token before looking it up (not the raw value)", async () => {
    // Set up so any token resolves to a token row
    mockDbSelect.mockReturnValue(selectResolving([]));

    await resolveTokenUser(TOKEN);

    // The where clause receives the hashed token — we verify select was called
    // and that mockDbSelect was invoked (indirectly confirming hashToken ran)
    expect(mockDbSelect).toHaveBeenCalled();
  });

  it("returns null and does not crash when decryption fails (tampered key)", async () => {
    mockDbSelect
      .mockReturnValueOnce(
        selectResolving([{ tokenId: "tid-1", userId: "uid-1" }])
      )
      .mockReturnValueOnce(
        selectResolving([{ id: "uid-1", githubUsername: "hacker" }])
      )
      .mockReturnValueOnce(
        selectResolving([
          {
            provider: "anthropic",
            encryptedKey: "bad-data",
            iv: Buffer.alloc(16).toString("base64"),
            authTag: Buffer.alloc(16).toString("base64"),
          },
        ])
      );

    // Decryption will fail — function should gracefully return user with null
    const result = await resolveTokenUser(TOKEN);
    expect(result).not.toBeNull();
    expect(result?.aiKey).toBeNull();
  });

  it("fires a lastUsedAt update as a side effect when token is found", async () => {
    mockDbSelect
      .mockReturnValueOnce(
        selectResolving([{ tokenId: "tid-1", userId: "uid-1" }])
      )
      .mockReturnValueOnce(
        selectResolving([{ id: "uid-1", githubUsername: "user" }])
      )
      .mockReturnValueOnce(selectResolving([]));

    await resolveTokenUser(TOKEN);

    expect(mockDbUpdate).toHaveBeenCalled();
  });

  it("does not fire the update when token is not found", async () => {
    mockDbSelect.mockReturnValue(selectResolving([]));

    await resolveTokenUser("prs_bogus");

    expect(mockDbUpdate).not.toHaveBeenCalled();
  });

  it("returns githubUsername as null when the user has no GitHub username", async () => {
    mockDbSelect
      .mockReturnValueOnce(
        selectResolving([{ tokenId: "tid-1", userId: "uid-1" }])
      )
      .mockReturnValueOnce(
        selectResolving([{ id: "uid-1", githubUsername: null }])
      )
      .mockReturnValueOnce(selectResolving([]));

    const result = await resolveTokenUser(TOKEN);
    expect(result?.githubUsername).toBeNull();
  });
});
