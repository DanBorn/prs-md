import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encrypt, decrypt, encryptToken, decryptToken } from "../crypto";

// 32 zero bytes as base64 — valid key for testing
const VALID_KEY_B64 = Buffer.alloc(32).toString("base64");

describe("crypto", () => {
  const originalKey = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = VALID_KEY_B64;
  });

  afterEach(() => {
    process.env.ENCRYPTION_KEY = originalKey;
  });

  describe("encrypt", () => {
    it("returns encrypted, iv, and authTag fields", () => {
      const result = encrypt("hello world");
      expect(result).toHaveProperty("encrypted");
      expect(result).toHaveProperty("iv");
      expect(result).toHaveProperty("authTag");
      expect(typeof result.encrypted).toBe("string");
      expect(typeof result.iv).toBe("string");
      expect(typeof result.authTag).toBe("string");
    });

    it("produces different ciphertext on each call due to random IV", () => {
      const r1 = encrypt("same plaintext");
      const r2 = encrypt("same plaintext");
      expect(r1.encrypted).not.toBe(r2.encrypted);
      expect(r1.iv).not.toBe(r2.iv);
    });

    it("throws when ENCRYPTION_KEY is missing", () => {
      delete process.env.ENCRYPTION_KEY;
      expect(() => encrypt("test")).toThrow(
        "ENCRYPTION_KEY environment variable is not set"
      );
    });

    it("throws when ENCRYPTION_KEY decodes to fewer than 32 bytes", () => {
      process.env.ENCRYPTION_KEY = Buffer.alloc(16).toString("base64");
      expect(() => encrypt("test")).toThrow(
        /ENCRYPTION_KEY must be exactly 32 bytes/
      );
    });

    it("throws when ENCRYPTION_KEY decodes to more than 32 bytes", () => {
      process.env.ENCRYPTION_KEY = Buffer.alloc(48).toString("base64");
      expect(() => encrypt("test")).toThrow(
        /ENCRYPTION_KEY must be exactly 32 bytes/
      );
    });
  });

  describe("decrypt", () => {
    it("roundtrips a typical API key", () => {
      const plaintext = "sk-proj-abc123XYZ9876";
      const encrypted = encrypt(plaintext);
      expect(decrypt(encrypted)).toBe(plaintext);
    });

    it("roundtrips an empty string", () => {
      const encrypted = encrypt("");
      expect(decrypt(encrypted)).toBe("");
    });

    it("roundtrips unicode text", () => {
      const plaintext = "こんにちは 🔑 special";
      const encrypted = encrypt(plaintext);
      expect(decrypt(encrypted)).toBe(plaintext);
    });

    it("roundtrips a long string", () => {
      const plaintext = "x".repeat(5_000);
      const encrypted = encrypt(plaintext);
      expect(decrypt(encrypted)).toBe(plaintext);
    });

    it("throws when authTag is tampered", () => {
      const encrypted = encrypt("secret");
      const tampered = {
        ...encrypted,
        authTag: Buffer.alloc(16).toString("base64"),
      };
      expect(() => decrypt(tampered)).toThrow();
    });

    it("throws when encrypted data is tampered", () => {
      const encrypted = encrypt("secret");
      const tampered = {
        ...encrypted,
        encrypted: Buffer.from("tampered data").toString("base64"),
      };
      expect(() => decrypt(tampered)).toThrow();
    });

    it("each encrypt call produces independently decryptable output", () => {
      const e1 = encrypt("value-one");
      const e2 = encrypt("value-two");
      expect(decrypt(e1)).toBe("value-one");
      expect(decrypt(e2)).toBe("value-two");
    });
  });

  describe("encryptToken / decryptToken", () => {
    it("roundtrips a GitHub OAuth token", () => {
      const token = "ghs_abc123XYZ9876realToken";
      const stored = encryptToken(token);
      expect(decryptToken(stored)).toBe(token);
    });

    it("encryptToken produces a JSON string with encrypted/iv/authTag", () => {
      const stored = encryptToken("any-token");
      const parsed = JSON.parse(stored) as Record<string, unknown>;
      expect(typeof parsed.encrypted).toBe("string");
      expect(typeof parsed.iv).toBe("string");
      expect(typeof parsed.authTag).toBe("string");
    });

    it("decryptToken returns null for null input", () => {
      expect(decryptToken(null)).toBeNull();
    });

    it("decryptToken returns null for undefined input", () => {
      expect(decryptToken(undefined)).toBeNull();
    });

    it("decryptToken returns null for empty string", () => {
      expect(decryptToken("")).toBeNull();
    });

    it("decryptToken returns plaintext as-is for legacy unencrypted tokens", () => {
      // Simulates a row written before encryption was introduced
      const legacyToken = "ghs_legacyPlaintextToken";
      expect(decryptToken(legacyToken)).toBe(legacyToken);
    });

    it("decryptToken treats arbitrary JSON without encrypted/iv/authTag as legacy", () => {
      expect(decryptToken('{"foo":"bar"}')).toBe('{"foo":"bar"}');
    });

    it("each encryptToken call is unique due to random IV", () => {
      const t = "ghs_sameToken";
      expect(encryptToken(t)).not.toBe(encryptToken(t));
    });
  });
});
