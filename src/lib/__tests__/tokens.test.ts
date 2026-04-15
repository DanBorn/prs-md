import { describe, it, expect } from "vitest";
import { generateToken, hashToken } from "../tokens";

describe("generateToken", () => {
  it('starts with the "prs_" prefix', () => {
    expect(generateToken()).toMatch(/^prs_/);
  });

  it("generates unique tokens across many calls", () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateToken()));
    expect(tokens.size).toBe(50);
  });

  it("has sufficient entropy after the prefix (≥30 chars)", () => {
    const raw = generateToken().slice("prs_".length);
    expect(raw.length).toBeGreaterThanOrEqual(30);
  });

  it("only uses URL-safe base64 characters after the prefix", () => {
    const raw = generateToken().slice("prs_".length);
    expect(raw).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe("hashToken", () => {
  it("is deterministic — same input always produces same hash", () => {
    const token = generateToken();
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it("produces different hashes for different tokens", () => {
    const t1 = generateToken();
    const t2 = generateToken();
    expect(hashToken(t1)).not.toBe(hashToken(t2));
  });

  it("produces a 64-character lowercase hex string (SHA-256)", () => {
    const hash = hashToken(generateToken());
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("hashes the full token including the prs_ prefix", () => {
    const withPrefix = hashToken("prs_abc");
    const withoutPrefix = hashToken("abc");
    expect(withPrefix).not.toBe(withoutPrefix);
  });

  it("known-value: hashes a fixed string predictably", () => {
    // SHA-256 of "test" is known
    const expected =
      "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08";
    expect(hashToken("test")).toBe(expected);
  });
});
