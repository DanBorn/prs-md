"use client";

import type { ChallengeStatus } from "@/db/schema";

interface Challenge {
  id: string;
  prUrl: string;
  prTitle: string | null;
  prRepo: string | null;
  status: ChallengeStatus;
  createdAt: Date;
}

const STATUS_STYLES: Record<ChallengeStatus, { bg: string; color: string; label: string }> = {
  pending: { bg: "oklch(78% 0.16 70 / 0.1)", color: "var(--color-warning)", label: "Pending" },
  active: { bg: "var(--color-neon-glow)", color: "var(--color-neon)", label: "Active" },
  completed: { bg: "var(--color-accent-dim)", color: "var(--color-accent)", label: "Done" },
  expired: { bg: "oklch(45% 0.01 260 / 0.1)", color: "var(--color-text-dim)", label: "Expired" },
};

export function ChallengeList({ challenges }: { challenges: Challenge[] }) {
  return (
    <div>
      <h2 className="text-base font-bold mb-3">Your Challenges</h2>
      <div className="space-y-2">
        {challenges.map((c) => {
          const style = STATUS_STYLES[c.status];
          return (
            <a
              key={c.id}
              href={`/challenge/${c.id}`}
              className="challenge-item flex items-center justify-between rounded-lg border px-4 py-3 transition-all"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {c.prTitle ?? c.prRepo ?? c.prUrl}
                </p>
                <p className="font-mono text-[11px] mt-0.5 truncate" style={{ color: "var(--color-text-dim)" }}>
                  {c.prRepo} &middot; {new Date(c.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span
                className="ml-3 shrink-0 rounded-md px-2 py-0.5 font-mono text-[10px] font-bold"
                style={{ background: style.bg, color: style.color }}
              >
                {style.label}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
