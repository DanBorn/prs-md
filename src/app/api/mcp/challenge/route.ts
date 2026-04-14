import { NextRequest, NextResponse } from "next/server";
import { resolveTokenUser } from "@/lib/mcp-auth";
import { parsePrUrl, fetchPrDiff } from "@/lib/github";
import { generateQuestions } from "@/lib/llm";

/**
 * POST /api/mcp/challenge
 *
 * Bearer-token authenticated endpoint for MCP servers.
 * Fetches the PR diff and generates questions using the user's
 * stored AI key from the web dashboard.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return NextResponse.json(
      { error: "Bearer token required" },
      { status: 401 }
    );
  }

  const mcpUser = await resolveTokenUser(token);
  if (!mcpUser) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (!mcpUser.aiKey) {
    return NextResponse.json(
      { error: "No AI key configured. Add one at prs.md/dashboard." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { prUrl } = body as { prUrl: string };

  if (!prUrl) {
    return NextResponse.json(
      { error: "prUrl is required" },
      { status: 400 }
    );
  }

  const parsed = parsePrUrl(prUrl);
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid GitHub PR URL" },
      { status: 400 }
    );
  }

  // Fetch diff (public repos, no auth needed)
  let diff: string;
  let title: string;
  try {
    const result = await fetchPrDiff(parsed.owner, parsed.repo, parsed.pull);
    diff = result.diff;
    title = result.title;
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to fetch PR diff";
    return NextResponse.json({ error: msg }, { status: 422 });
  }

  if (!diff.trim()) {
    return NextResponse.json(
      { error: "PR diff is empty" },
      { status: 422 }
    );
  }

  // Generate questions using the user's stored key
  let questions;
  try {
    questions = await generateQuestions(
      mcpUser.aiKey.provider,
      mcpUser.aiKey.apiKey,
      diff
    );
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Failed to generate questions";
    return NextResponse.json(
      { error: `LLM error: ${msg}` },
      { status: 502 }
    );
  }

  if (!Array.isArray(questions) || questions.length !== 3) {
    return NextResponse.json(
      { error: "LLM returned invalid format. Try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    questions,
    prTitle: title,
    prRepo: `${parsed.owner}/${parsed.repo}`,
    provider: mcpUser.aiKey.provider,
    githubUsername: mcpUser.githubUsername,
  });
}
