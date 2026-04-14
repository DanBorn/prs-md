import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { attempts, challenges, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + "\u2026";
}

function renderBadge({
  score,
  passed,
  username,
  prTitle,
  prRepo,
  timeSeconds,
  date,
  attemptNumber,
}: {
  score: number;
  passed: boolean;
  username: string | null;
  prTitle: string | null;
  prRepo: string | null;
  timeSeconds: number | null;
  date: Date;
  attemptNumber: number;
}): string {
  const W = 480;
  const H = 140;

  const neon = "#5cf07e";
  const neonDim = "#3ab858";
  const accent = "#a78bfa";
  const bgMain = "#1a1b26";
  const bgCard = "#21222e";
  const bgRaised = "#282a3a";
  const textMuted = "#8b8fa3";
  const textDim = "#5a5e73";
  const border = "#2e3044";

  const displayName = username ? `@${escapeXml(username)}` : "Anonymous";
  const displayPr = prTitle ? escapeXml(truncate(prTitle, 42)) : "Pull Request";
  const displayRepo = prRepo ? escapeXml(prRepo) : "";
  const displayDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const displayTime =
    timeSeconds != null
      ? `${Math.floor(timeSeconds / 60)}m ${timeSeconds % 60}s`
      : "";

  // Score ring arc (SVG arc for the score circle)
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const scoreOffset = circumference - (score / 100) * circumference;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
  <defs>
    <!-- Neon glow filter -->
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="glow-lg" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <!-- Noise texture -->
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.03"/>
      </feComponentTransfer>
      <feBlend in="SourceGraphic" mode="overlay"/>
    </filter>
    <!-- Top gradient shimmer -->
    <linearGradient id="shimmer" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${neon}"/>
      <stop offset="50%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="${neon}"/>
    </linearGradient>
    <!-- Background radial glow -->
    <radialGradient id="bg-glow" cx="0.15" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="${neon}" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="${bgMain}" stop-opacity="0"/>
    </radialGradient>
    <!-- Clip to card shape -->
    <clipPath id="card-clip">
      <rect x="0" y="0" width="${W}" height="${H}" rx="12"/>
    </clipPath>
  </defs>

  <!-- Card background -->
  <rect x="0" y="0" width="${W}" height="${H}" rx="12" fill="${bgMain}"/>
  <rect x="0" y="0" width="${W}" height="${H}" rx="12" fill="url(#bg-glow)"/>

  <!-- Border -->
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="12" stroke="${border}" stroke-width="1" fill="none"/>

  <!-- Top shimmer line (clipped to card radius) -->
  <rect x="0" y="0" width="${W}" height="2.5" fill="url(#shimmer)" opacity="0.8" clip-path="url(#card-clip)"/>

  <!-- Noise overlay -->
  <rect x="0" y="0" width="${W}" height="${H}" rx="12" filter="url(#noise)" opacity="0.5"/>

  <!-- Score ring area (left side) -->
  <g transform="translate(52, ${H / 2})">
    <!-- Background ring -->
    <circle cx="0" cy="0" r="${radius}" stroke="${bgRaised}" stroke-width="5" fill="none"/>
    <!-- Score arc -->
    <circle
      cx="0" cy="0" r="${radius}"
      stroke="${passed ? neon : "#f44"}"
      stroke-width="5"
      fill="none"
      stroke-linecap="round"
      stroke-dasharray="${circumference}"
      stroke-dashoffset="${scoreOffset}"
      transform="rotate(-90)"
      filter="url(#glow)"
    />
    <!-- Score text -->
    <text x="0" y="2" text-anchor="middle" dominant-baseline="middle"
      font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-weight="900" font-size="18"
      fill="${passed ? neon : "#f44"}">${score}</text>
    <!-- "SCORE" label -->
    <text x="0" y="${radius + 14}" text-anchor="middle"
      font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-weight="700" font-size="7"
      fill="${textDim}" letter-spacing="1.5">SCORE</text>
  </g>

  <!-- Divider line -->
  <line x1="100" y1="22" x2="100" y2="${H - 22}" stroke="${border}" stroke-width="1"/>

  <!-- Main content area -->
  <g transform="translate(116, 0)">
    <!-- Verified badge -->
    <g transform="translate(0, 22)">
      <!-- Checkmark icon -->
      <rect x="0" y="0" width="16" height="16" rx="4" fill="${passed ? neon : "#f44"}" opacity="0.15"/>
      <text x="8" y="12" text-anchor="middle" font-size="10" fill="${passed ? neon : "#f44"}">&#10003;</text>
      <!-- Status text -->
      <text x="22" y="12"
        font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-weight="800" font-size="12"
        fill="${passed ? neon : "#f44"}" filter="url(#glow)">100% HUMAN VERIFIED</text>
    </g>

    <!-- Username -->
    <text x="0" y="56"
      font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-weight="700" font-size="13"
      fill="#e0e0ee">${displayName}</text>

    <!-- PR title -->
    <text x="0" y="76"
      font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-weight="400" font-size="11"
      fill="${textMuted}">${displayPr}</text>

    <!-- Repo + metadata row -->
    <g transform="translate(0, 96)">
      ${displayRepo ? `<text x="0" y="0"
        font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-weight="500" font-size="9"
        fill="${accent}">${displayRepo}</text>` : ""}
      <text x="${displayRepo ? displayRepo.length * 5.4 + 10 : 0}" y="0"
        font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-weight="400" font-size="9"
        fill="${textDim}">${displayDate}${displayTime ? ` \u00B7 ${displayTime}` : ""}${attemptNumber > 1 ? ` \u00B7 attempt #${attemptNumber}` : ""}</text>
    </g>

    <!-- prs.md logo (bottom right) -->
    <g transform="translate(240, 106)">
      <text font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="9" fill="${textDim}">
        <tspan fill="${textDim}">&lt;</tspan><tspan font-weight="900" fill="${neonDim}">PRs</tspan><tspan font-weight="700" fill="${textMuted}">.md</tspan><tspan fill="${textDim}">/&gt;</tspan>
      </text>
    </g>
  </g>
</svg>`;
}

function renderNotFound(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="48" viewBox="0 0 280 48" fill="none">
  <rect width="280" height="48" rx="8" fill="#1a1b26"/>
  <rect x="0.5" y="0.5" width="279" height="47" rx="8" stroke="#2e3044" fill="none"/>
  <text x="140" y="28" text-anchor="middle" dominant-baseline="middle"
    font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="12" fill="#5a5e73">
    prs.md \u2014 proof not found
  </text>
</svg>`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  const attempt = await db
    .select()
    .from(attempts)
    .where(eq(attempts.id, id))
    .then((rows) => rows[0]);

  if (!attempt || !attempt.passed) {
    return new NextResponse(renderNotFound(), {
      status: 404,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=60",
      },
    });
  }

  const [challenge, user] = await Promise.all([
    db
      .select({ prTitle: challenges.prTitle, prRepo: challenges.prRepo })
      .from(challenges)
      .where(eq(challenges.id, attempt.challengeId))
      .then((rows) => rows[0]),
    db
      .select({ name: users.name, githubUsername: users.githubUsername })
      .from(users)
      .where(eq(users.id, attempt.userId))
      .then((rows) => rows[0]),
  ]);

  const svg = renderBadge({
    score: attempt.totalScore ?? 0,
    passed: true,
    username: user?.githubUsername ?? null,
    prTitle: challenge?.prTitle ?? null,
    prRepo: challenge?.prRepo ?? null,
    timeSeconds: attempt.timeSpentSeconds ?? null,
    date: attempt.createdAt,
    attemptNumber: attempt.attemptNumber,
  });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300, s-maxage=300",
    },
  });
}
