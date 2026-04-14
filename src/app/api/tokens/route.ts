import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { mcpTokens } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { generateToken, hashToken } from "@/lib/tokens";

/** POST /api/tokens — Create a new MCP bearer token */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const name = (body as { name?: string }).name ?? "default";

  const rawToken = generateToken();
  const hashed = hashToken(rawToken);

  await db.insert(mcpTokens).values({
    userId: session.user.id,
    tokenHash: hashed,
    name,
  });

  // Return the raw token exactly once — it cannot be retrieved again
  return NextResponse.json({ token: rawToken, name });
}

/** GET /api/tokens — List user's tokens (no raw values) */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokens = await db
    .select({
      id: mcpTokens.id,
      name: mcpTokens.name,
      createdAt: mcpTokens.createdAt,
      lastUsedAt: mcpTokens.lastUsedAt,
    })
    .from(mcpTokens)
    .where(eq(mcpTokens.userId, session.user.id));

  return NextResponse.json({ tokens });
}

/** DELETE /api/tokens?id=<token-id> — Revoke a token */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokenId = req.nextUrl.searchParams.get("id");
  if (!tokenId) {
    return NextResponse.json({ error: "Token id required" }, { status: 400 });
  }

  await db
    .delete(mcpTokens)
    .where(
      and(eq(mcpTokens.id, tokenId), eq(mcpTokens.userId, session.user.id))
    );

  return NextResponse.json({ success: true });
}
