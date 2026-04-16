import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Returns true when Upstash credentials look valid enough to use.
 * Requires a well-formed https:// URL so the @upstash/redis constructor
 * never throws a UrlError and crashes the Edge middleware.
 */
export const rateLimitEnabled = !!(
  process.env.UPSTASH_REDIS_REST_URL?.startsWith("https://") &&
  process.env.UPSTASH_REDIS_REST_TOKEN
);

function makeRedis() {
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

/**
 * Shared pass-through used when Upstash is not configured.
 * Keeps the middleware logic uniform — callers never need to branch on
 * rateLimitEnabled themselves.
 */
const passthrough = {
  limit: async () => ({
    success: true,
    limit: 0,
    remaining: 0,
    reset: 0,
    pending: Promise.resolve(),
  }),
};

function makeLimiter(
  requests: number,
  window: `${number} ${"s" | "m" | "h" | "d"}`,
  prefix: string
) {
  if (!rateLimitEnabled) return passthrough;
  try {
    return new Ratelimit({
      redis: makeRedis(),
      limiter: Ratelimit.slidingWindow(requests, window),
      prefix,
      analytics: false,
    });
  } catch {
    // Bad credentials at init time — degrade gracefully rather than crash middleware
    return passthrough;
  }
}

/**
 * /api/cli/proof — unauthenticated, creates DB rows on every hit.
 * Tightest limit: 10 requests per IP per hour.
 */
export const proofLimiter = makeLimiter(10, "1 h", "rl:proof");

/**
 * LLM-calling routes — /api/challenges, /api/grade, /api/mcp/challenge, /api/mcp/grade.
 * Each call invokes an external LLM and may consume the creator's API quota.
 * 30 requests per IP per 10 minutes.
 */
export const llmLimiter = makeLimiter(30, "10 m", "rl:llm");

/**
 * Key/token management — /api/keys, /api/tokens.
 * Moderate limit to prevent enumeration or brute-force.
 * 20 requests per IP per minute.
 */
export const authLimiter = makeLimiter(20, "1 m", "rl:auth");

/**
 * General fallback for all other API routes.
 * 100 requests per IP per minute.
 */
export const generalLimiter = makeLimiter(100, "1 m", "rl:general");
