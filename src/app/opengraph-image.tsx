import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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

        {/* Logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 56,
          }}
        >
          <span style={{ fontFamily: "monospace", fontSize: 22, color: "#5a5e73" }}>{"<"}</span>
          <span style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 900, color: "#3ab858" }}>PRs</span>
          <span style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: "#8b8fa3" }}>.md</span>
          <span style={{ fontFamily: "monospace", fontSize: 22, color: "#5a5e73" }}>{"/>"}</span>
        </div>

        {/* Headline block */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginBottom: 28,
            }}
          >
            <span
              style={{
                fontSize: 72,
                fontWeight: 900,
                color: "#e0e0ee",
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
              }}
            >
              The Turing Test
            </span>
            <span
              style={{
                fontSize: 72,
                fontWeight: 900,
                color: "#5cf07e",
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
              }}
            >
              for Pull Requests
            </span>
          </div>

          <div
            style={{
              fontSize: 26,
              color: "#8b8fa3",
              lineHeight: 1.5,
              letterSpacing: "-0.01em",
              marginBottom: 20,
            }}
          >
            Prove you actually read your own code changes.
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              fontFamily: "monospace",
              fontSize: 18,
              color: "#5a5e73",
            }}
          >
            <span>3 questions</span>
            <span style={{ color: "#2e3044" }}>·</span>
            <span>3 minutes</span>
            <span style={{ color: "#2e3044" }}>·</span>
            <span>one verified badge</span>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 32,
            borderTop: "1px solid #2e3044",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              fontFamily: "monospace",
              fontSize: 14,
              color: "#5a5e73",
            }}
          >
            <span>open-source</span>
            <span>zero cost</span>
            <span>bring your own key</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "rgba(92, 240, 126, 0.08)",
              border: "1px solid rgba(92, 240, 126, 0.2)",
              borderRadius: 8,
              padding: "6px 14px",
              fontFamily: "monospace",
              fontSize: 13,
              color: "#5cf07e",
            }}
          >
            100% Human Verified
          </div>
        </div>
      </div>
    ),
    size
  );
}
