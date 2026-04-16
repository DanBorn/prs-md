"use client";

import { useState } from "react";

export function CodeBlock({
  code,
  language = "bash",
  filename,
}: {
  code: string;
  language?: string;
  filename?: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="group relative rounded-lg border overflow-hidden"
      style={{
        borderColor: "var(--color-border)",
        background: "oklch(11% 0.01 260)",
      }}
    >
      {/* Title bar */}
      {filename && (
        <div
          className="flex items-center justify-between px-4 py-2 border-b"
          style={{
            borderColor: "var(--color-border)",
            background: "oklch(14% 0.01 260)",
          }}
        >
          <span className="font-mono text-[10px]" style={{ color: "var(--color-text-dim)" }}>
            {filename}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: "var(--color-text-dim)" }}>
            {language}
          </span>
        </div>
      )}

      {/* Code area */}
      <div className="relative">
        <pre className="overflow-x-auto p-3 pr-16 font-mono text-[11px] leading-relaxed sm:p-4 sm:pr-16 sm:text-[12px]">
          <code style={{ color: "var(--color-text-muted)" }}>{code}</code>
        </pre>

        {/* Copy button — always visible on mobile (no hover), hover-reveal on desktop */}
        <button
          onClick={handleCopy}
          data-copied={String(copied)}
          className="code-copy-btn absolute top-2 right-2 rounded-md border px-2 py-1 font-mono text-[10px] font-medium transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        >
          {copied ? "✓ copied" : "copy"}
        </button>
      </div>
    </div>
  );
}
