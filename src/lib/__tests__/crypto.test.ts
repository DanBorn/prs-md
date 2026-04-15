import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encrypt, decrypt } from "../crypto";

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
});
