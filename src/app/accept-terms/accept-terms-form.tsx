"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function AcceptTermsForm() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    if (!agreed) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/terms/accept", { method: "POST" });
      if (!res.ok) throw new Error("Something went wrong. Please try again.");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div
        className="rounded-xl border p-5 space-y-3 text-xs leading-relaxed"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-surface)",
          color: "var(--color-text-muted)",
        }}
      >
        {[
          { icon: "🔑", text: "You bring your own LLM API key. You're responsible for any costs with your provider." },
          { icon: "📄", text: "Diffs are never stored — only your questions, answers, and score." },
          { icon: "🌐", text: "Proof pages are intentionally public. Anyone with the link can see your Q&A and score." },
          { icon: "⚖️", text: "The Service is provided as-is. A passing score isn't a guarantee of code comprehension." },
          { icon: "🔒", text: "API keys are encrypted at rest (AES-256-GCM). We never send them to anyone except your chosen provider." },
        ].map((item) => (
          <div key={item.icon} className="flex gap-3">
            <span className="shrink-0 text-base leading-none mt-0.5">{item.icon}</span>
            <span>{item.text}</span>
          </div>
        ))}
      </div>

      <p className="text-xs" style={{ color: "var(--color-text-dim)" }}>
        These are the highlights. Read the{" "}
        <Link href="/terms" target="_blank" className="link-neon">
          full Terms of Service
        </Link>{" "}
        before agreeing.
      </p>

      {/* Checkbox */}
      <label
        className="flex cursor-pointer items-start gap-3"
        htmlFor="agree-checkbox"
      >
        <div className="relative mt-0.5 shrink-0">
          <input
            id="agree-checkbox"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="sr-only"
          />
          <div
            className="flex h-4 w-4 items-center justify-center rounded"
            style={{
              border: `1.5px solid ${agreed ? "var(--color-neon)" : "var(--color-border)"}`,
              background: agreed ? "var(--color-neon-glow)" : "var(--color-surface-raised)",
              transition: "all 150ms",
            }}
          >
            {agreed && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path
                  d="M1 4L3.5 6.5L9 1"
                  stroke="var(--color-neon)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
        <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          I have read and agree to the{" "}
          <Link href="/terms" target="_blank" className="link-neon">
            Terms of Service
          </Link>
        </span>
      </label>

      {error && (
        <p className="text-xs font-medium" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}

      {/* CTA */}
      <button
        onClick={handleAccept}
        disabled={!agreed || loading}
        className="btn-primary w-full rounded-lg py-3 font-mono text-sm font-bold transition-all"
      >
        {loading ? "Saving…" : "Accept & continue →"}
      </button>
    </div>
  );
}
