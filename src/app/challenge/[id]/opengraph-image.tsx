import { ImageResponse } from "next/og";
import { db } from "@/db";
import { challenges } from "@/db/schema";
import { eq } from "drizzle-orm";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const challenge = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, id))
    .then((rows) => rows[0]);

  const prTitle = challenge?.prTitle ?? "Pull Request Challenge";
  const prRepo = challenge?.prRepo ?? "";
  const questionCount = (challenge?.questions as unknown[])?.length ?? 3;
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
          padding: "72px 88px",
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

        {/* Label */}
        <div
          style={{
            display: "flex",
            fontFamily: "monospace",
            fontSize: 14,
            fontWeight: 700,
            color: "#5cf07e",
            letterSpacing: 3,
            marginBottom: 40,
          }}
        >
          PR CHALLENGE
        </div>

        {/* PR title block */}
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: "#e0e0ee",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: 28,
            }}
          >
            {truncatedTitle}
          </div>

          {/* Repo + question count */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              fontFamily: "monospace",
              fontSize: 18,
            }}
          >
            {prRepo ? (
              <span style={{ color: "#a78bfa" }}>{prRepo}</span>
            ) : null}
            {prRepo ? (
              <span style={{ color: "#2e3044" }}>·</span>
            ) : null}
            <span style={{ color: "#5a5e73" }}>
              {questionCount} question{questionCount !== 1 ? "s" : ""}
            </span>
            <span style={{ color: "#2e3044" }}>·</span>
            <span style={{ color: "#5a5e73" }}>3 min timer</span>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 28,
            borderTop: "1px solid #1e2035",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              backgroundColor: "rgba(92, 240, 126, 0.08)",
              border: "1px solid rgba(92, 240, 126, 0.2)",
              borderRadius: 8,
              padding: "8px 18px",
              fontFamily: "monospace",
              fontSize: 14,
              color: "#8b8fa3",
            }}
          >
            <span style={{ color: "#5cf07e" }}>?</span>
            <span>Can you prove you read this PR?</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={{ fontFamily: "monospace", fontSize: 15, color: "#5a5e73" }}>{"<"}</span>
            <span style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 900, color: "#3ab858" }}>PRs</span>
            <span style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 700, color: "#8b8fa3" }}>.md</span>
            <span style={{ fontFamily: "monospace", fontSize: 15, color: "#5a5e73" }}>{"/>"}</span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
