import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { apiKeys, type AiProvider } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { encrypt } from "@/lib/crypto";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await db
    .select({
      id: apiKeys.id,
      provider: apiKeys.provider,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, session.user.id));

  return NextResponse.json({ data: keys });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { provider, apiKey } = body as {
    provider: AiProvider;
    apiKey: string;
  };

  if (!provider || !apiKey) {
    return NextResponse.json(
      { error: "provider and apiKey are required" },
      { status: 400 }
    );
  }

  const validProviders: AiProvider[] = ["openai", "anthropic", "gemini"];
  if (!validProviders.includes(provider)) {
    return NextResponse.json(
      { error: "Invalid provider" },
      { status: 400 }
    );
  }

  // Upsert: delete existing key for this provider, then insert
  await db
    .delete(apiKeys)
    .where(
      and(
        eq(apiKeys.userId, session.user.id),
        eq(apiKeys.provider, provider)
      )
    );

  const encrypted = encrypt(apiKey);

  await db.insert(apiKeys).values({
    userId: session.user.id,
    provider,
    encryptedKey: encrypted.encrypted,
    iv: encrypted.iv,
    authTag: encrypted.authTag,
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider") as AiProvider | null;

  if (!provider) {
    return NextResponse.json(
      { error: "provider query param required" },
      { status: 400 }
    );
  }

  await db
    .delete(apiKeys)
    .where(
      and(
        eq(apiKeys.userId, session.user.id),
        eq(apiKeys.provider, provider)
      )
    );

  return NextResponse.json({ success: true });
}
