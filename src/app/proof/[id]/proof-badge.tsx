"use client";

import { useState } from "react";

export function ProofBadge({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      data-copied={String(copied)}
      className="copy-badge-btn mt-3 w-full rounded-lg py-2.5 font-mono text-xs font-bold transition-all"
    >
      {copied ? "✓ Copied!" : "Copy badge markdown"}
    </button>
  );
}
