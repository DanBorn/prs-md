import { ImageResponse } from "next/og";
import { db } from "@/db";
import { attempts, challenges, users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const attempt = await db
    .select()
    .from(attempts)
    .where(eq(attempts.id, id))
    .then((rows) => rows[0]);

  if (!attempt || !attempt.passed) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            backgroundColor: "#0f1117",
            fontFamily: "monospace",
            fontSize: 32,
            color: "#5a5e73",
          }}
        >
          PRs.md — Proof not found
        </div>
      ),
      size
    );
  }

  const [challenge, user] = await Promise.all([
    db
      .select()
      .from(challenges)
      .where(eq(challenges.id, attempt.challengeId))
      .then((rows) => rows[0]),
    db
      .select({ name: users.name, githubUsername: users.githubUsername })
      .from(users)
      .where(eq(users.id, attempt.userId))
      .then((rows) => rows[0]),
  ]);

  const username = user?.githubUsername && !user.githubUsername.startsWith("anon-")
    ? `@${user.githubUsername}`
    : "Someone";
  const score = attempt.totalScore ?? 0;
  const prTitle = challenge?.prTitle ?? "Pull Request";
  const prRepo = challenge?.prRepo ?? "";
  const date = new Date(attempt.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timeStr =
    attempt.timeSpentSeconds != null
      ? `${Math.floor(attempt.timeSpentSeconds / 60)}m ${attempt.timeSpentSeconds % 60}s`
      : null;

  const truncatedTitle =
    prTitle.length > 72 ? prTitle.slice(0, 72) + "..." : prTitle;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#0f1117",
          padding: "60px 80px",
          position: "relative",
        }}
      >
        {/* Top gradient accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            backgroundImage:
              "linear-gradient(90deg, #5cf07e, #a78bfa, #5cf07e)",
          }}
        />

        {/* Main content row */}
        <div
          style={{
            display: "flex",
            flex: 1,
            gap: 64,
            alignItems: "center",
          }}
        >
          {/* Score circle */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: "50%",
                backgroundColor: "#191b2a",
                border: "4px solid #5cf07e",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 52,
                  fontWeight: 900,
                  color: "#5cf07e",
                  lineHeight: 1,
                }}
              >
                {score}
              </span>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 11,
                  color: "#5a5e73",
                  letterSpacing: 3,
                  marginTop: 6,
                }}
              >
                SCORE
              </span>
            </div>
          </div>

          {/* Info column */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            {/* Verified pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                backgroundColor: "rgba(92, 240, 126, 0.08)",
                border: "1px solid rgba(92, 240, 126, 0.25)",
                borderRadius: 8,
                padding: "8px 18px",
                marginBottom: 24,
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#5cf07e",
                  letterSpacing: 1,
                }}
              >
                [v] 100% HUMAN VERIFIED
              </span>
            </div>

            {/* Username */}
            <div
              style={{
                fontSize: 40,
                fontWeight: 700,
                color: "#e0e0ee",
                letterSpacing: "-0.02em",
                marginBottom: 14,
              }}
            >
              {username}
            </div>

            {/* PR title */}
            <div
              style={{
                fontSize: 22,
                color: "#8b8fa3",
                lineHeight: 1.45,
                marginBottom: 20,
              }}
            >
              {truncatedTitle}
            </div>

            {/* Repo + date + time */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                fontFamily: "monospace",
                fontSize: 15,
              }}
            >
              {prRepo ? (
                <span style={{ color: "#a78bfa" }}>{prRepo}</span>
              ) : null}
              {prRepo ? (
                <span style={{ color: "#2e3044" }}>·</span>
              ) : null}
              <span style={{ color: "#5a5e73" }}>{date}</span>
              {timeStr ? (
                <span style={{ color: "#2e3044" }}>·</span>
              ) : null}
              {timeStr ? (
                <span style={{ color: "#5a5e73" }}>{timeStr}</span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Bottom: PRs.md branding */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            paddingTop: 20,
            borderTop: "1px solid #1e2035",
          }}
        >
          <span style={{ fontFamily: "monospace", fontSize: 15, color: "#5a5e73" }}>{"<"}</span>
          <span style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 900, color: "#3ab858" }}>PRs</span>
          <span style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 700, color: "#8b8fa3" }}>.md</span>
          <span style={{ fontFamily: "monospace", fontSize: 15, color: "#5a5e73" }}>{"/>"}</span>
        </div>
      </div>
    ),
    size
  );
}
