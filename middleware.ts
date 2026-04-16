import { NextRequest, NextResponse } from "next/server";
import {
  proofLimiter,
  llmLimiter,
  authLimiter,
  generalLimiter,
} from "@/lib/rate-limit";

/**
 * Extract the real client IP.
 * On Vercel, x-forwarded-for is set by the edge network and is trustworthy.
 * Falls back to 127.0.0.1 in local development.
 */
function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1"
  );
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const ip = getIp(req);

  // Choose limiter based on path sensitivity
  let limiter;
  if (path === "/api/cli/proof") {
    limiter = proofLimiter;
  } else if (
    path.startsWith("/api/challenges") ||
    path.startsWith("/api/grade") ||
    path.startsWith("/api/mcp/")
  ) {
    limiter = llmLimiter;
  } else if (path.startsWith("/api/keys") || path.startsWith("/api/tokens")) {
    limiter = authLimiter;
  } else {
    limiter = generalLimiter;
  }

  let result: { success: boolean; limit: number; remaining: number; reset: number };
  try {
    result = await limiter.limit(ip);
  } catch {
    // Redis call failed at runtime — pass through rather than block all traffic
    return NextResponse.next();
  }

  const { success, limit, remaining, reset } = result;

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  const res = NextResponse.next();

  // Surface rate limit headers on successful responses too
  res.headers.set("X-RateLimit-Limit", limit.toString());
  res.headers.set("X-RateLimit-Remaining", remaining.toString());
  res.headers.set("X-RateLimit-Reset", reset.toString());

  return res;
}

export const config = {
  matcher: [
    /*
     * Apply to all /api/* routes except:
     *   /api/auth/*      — NextAuth handles its own flow
     *   /api/action/*    — Called by GitHub Actions (IPs vary); protected by ACTION_SECRET
     *   /api/badge/*     — Public SVG endpoint, cheap, no user data
     */
    "/api/cli/:path*",
    "/api/challenges/:path*",
    "/api/grade/:path*",
    "/api/mcp/:path*",
    "/api/keys/:path*",
    "/api/tokens/:path*",
  ],
};
