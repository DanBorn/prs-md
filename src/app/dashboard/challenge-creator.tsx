"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";

export function ChallengeCreator() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [prUrl, setPrUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    setError("");
    const trimmed = prUrl.trim();
    if (!trimmed.match(/github\.com\/[^/]+\/[^/]+\/pull\/\d+/)) {
      setError("Please enter a valid GitHub PR URL.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prUrl: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate challenge.");
        return;
      }
      track("challenge_created");
      startTransition(() => { router.push(`/challenge/${data.id}`); });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="rounded-xl border p-6"
      style={{
        borderColor: "var(--color-border)",
        background: "var(--color-surface)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded font-mono text-[8px] font-black"
          style={{ background: "var(--color-accent-dim)", color: "var(--color-accent)" }}
        >
          +
        </span>
        <h2 className="text-base font-bold">Create a Challenge</h2>
      </div>
      <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
        Paste a public GitHub PR URL. We&apos;ll analyze the diff and generate 3 targeted questions.
      </p>

      <div className="flex gap-2">
        <input
          type="url"
          value={prUrl}
          onChange={(e) => setPrUrl(e.target.value)}
          placeholder="https://github.com/owner/repo/pull/123"
          className="input-field flex-1 rounded-lg border px-3 py-2.5 font-mono text-xs transition-colors focus:outline-none"
          onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
        />
        <button
          onClick={handleCreate}
          disabled={loading || isPending}
          className="btn-primary shrink-0 rounded-lg px-5 py-2.5 font-mono text-xs font-bold transition-all"
        >
          {loading ? "Analyzing..." : "Generate →"}
        </button>
      </div>

      {error && <p className="mt-2 font-mono text-xs" style={{ color: "var(--color-danger)" }}>{error}</p>}

      {loading && (
        <div className="mt-4 flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full glow-pulse" style={{ background: "var(--color-neon)" }} />
          <p className="font-mono text-xs" style={{ color: "var(--color-text-dim)" }}>
            Fetching diff and generating questions...
          </p>
        </div>
      )}
    </div>
  );
}
