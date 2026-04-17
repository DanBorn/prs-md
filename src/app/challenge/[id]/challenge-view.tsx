"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import type { ChallengeStatus } from "@/db/schema";
import { LogoMark } from "@/components/logo";
import { Breadcrumbs } from "@/components/breadcrumbs";

interface ChallengeInfo {
  id: string;
  prUrl: string;
  prTitle: string | null;
  prRepo: string | null;
  status: ChallengeStatus;
  timeLimitSeconds: number;
  questionCount: number;
  createdAt: string;
}

interface Creator {
  name: string | null;
  image: string | null;
  githubUsername: string | null;
}

export function ChallengeView({
  challenge,
  creator,
  isAuthenticated,
  hasAttempted,
  attemptPassed,
  attemptId,
  attemptCount,
  gradingPending,
}: {
  challenge: ChallengeInfo;
  creator: Creator | null;
  isAuthenticated: boolean;
  hasAttempted: boolean;
  attemptPassed: boolean | null;
  attemptId: string | null;
  attemptCount: number;
  gradingPending?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!gradingPending) return;
    const interval = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(interval);
  }, [gradingPending, router]);

  return (
    <div>
      {isAuthenticated && (
        <Breadcrumbs
          items={[
            { label: "dashboard", href: "/dashboard" },
            { label: challenge.prUrl.match(/\/pull\/(\d+)/)?.[1] ? `#${challenge.prUrl.match(/\/pull\/(\d+)/)![1]}` : challenge.id },
          ]}
        />
      )}
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        borderColor: "var(--color-border)",
        background: "var(--color-surface)",
        boxShadow: "var(--shadow-elevated)",
      }}
    >
      {/* Top accent */}
      <div className="h-1" style={{ background: "linear-gradient(90deg, var(--color-accent), var(--color-neon))" }} />

      <div className="p-5 sm:p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <LogoMark />
            <span className="font-mono text-[11px]" style={{ color: "var(--color-text-dim)" }}>
              challenge
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight mb-1 break-words">
            {challenge.prTitle ?? "PR Challenge"}
          </h1>
          <a
            href={challenge.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="link-accent font-mono text-xs sm:text-sm break-all"
          >
            {challenge.prRepo} &nearr;
          </a>
          {creator?.githubUsername && (
            <p className="font-mono text-xs mt-2" style={{ color: "var(--color-text-dim)" }}>
              by @{creator.githubUsername}
            </p>
          )}
        </div>

        {hasAttempted && attemptPassed ? (
          /* Passed: badge + proof link only */
          <div className="text-center py-4">
            <a href={`/proof/${attemptId}`} className="block mb-3 rounded-xl transition-all hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/badge/${attemptId}`}
                alt="prs.md — 100% Human Verified"
                width={480}
                height={140}
                className="mx-auto rounded-xl transition-transform hover:scale-[1.02]"
              />
            </a>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              <a href={`/proof/${attemptId}`} className="link-neon font-mono">
                View full proof &rarr;
              </a>
            </p>
          </div>
        ) : (
          <>
            {/* Stats row */}
            <div
              className="grid grid-cols-3 gap-px rounded-xl overflow-hidden border mb-6"
              style={{ borderColor: "var(--color-border)", background: "var(--color-border-subtle)" }}
            >
              {[
                { value: String(challenge.questionCount), label: "Questions" },
                {
                  value: `${Math.floor(challenge.timeLimitSeconds / 60)}:${String(challenge.timeLimitSeconds % 60).padStart(2, "0")}`,
                  label: "Time limit",
                },
                { value: "70%", label: "Pass threshold" },
              ].map((stat) => (
                <div key={stat.label} className="p-3 sm:p-4 text-center" style={{ background: "var(--color-surface-raised)" }}>
                  <p className="font-mono text-lg sm:text-xl font-black" style={{ color: "var(--color-neon)" }}>
                    {stat.value}
                  </p>
                  <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "var(--color-text-dim)" }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Rules */}
            <div
              className="rounded-xl border p-4 mb-6"
              style={{
                borderColor: "oklch(78% 0.16 70 / 0.2)",
                background: "oklch(78% 0.16 70 / 0.04)",
              }}
            >
              <p className="font-mono text-xs font-bold mb-2" style={{ color: "var(--color-warning)" }}>
                &#9888; Before you begin
              </p>
              <ul className="space-y-1">
                {[
                  "3 questions about the PR diff — be specific",
                  "Timer starts when you click Start",
                  "Copy-paste is disabled in answer fields",
                  "One question may be a hallucination trap",
                ].map((rule) => (
                  <li key={rule} className="flex items-start gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    <span className="mt-0.5 shrink-0" style={{ color: "var(--color-text-dim)" }}>&middot;</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action */}
            {!isAuthenticated ? (
              <button
                onClick={() => signIn("github")}
                className="btn-secondary w-full rounded-xl py-3.5 font-mono text-sm font-bold transition-all"
              >
                Sign in with GitHub to take the challenge
              </button>
            ) : hasAttempted && gradingPending ? (
              <div className="rounded-xl border p-4" style={{ borderColor: "oklch(78% 0.16 250 / 0.2)", background: "oklch(78% 0.16 250 / 0.05)" }}>
                <p className="font-mono text-sm font-bold" style={{ color: "var(--color-accent)" }}>
                  &#8987; Grading in progress&hellip;
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                  The GitHub Action is grading your answers. This page will update automatically.
                </p>
              </div>
            ) : hasAttempted ? (
              <div className="space-y-3">
                <div className="rounded-xl border p-4" style={{ borderColor: "oklch(65% 0.22 25 / 0.2)", background: "oklch(65% 0.22 25 / 0.05)" }}>
                  <p className="font-mono text-sm font-bold" style={{ color: "var(--color-danger)" }}>
                    &#10007; Did not pass
                    {attemptCount > 1 && (
                      <span className="font-normal ml-2" style={{ color: "var(--color-text-dim)" }}>
                        (attempt {attemptCount})
                      </span>
                    )}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
                    Review the PR diff and try to understand the changes better.
                  </p>
                </div>
                {challenge.status === "active" && (
                  <a
                    href={`/quiz/${challenge.id}`}
                    className="btn-secondary block w-full rounded-xl py-3 text-center font-mono text-sm font-bold transition-all"
                  >
                    Retry the Turing Test &rarr;
                  </a>
                )}
              </div>
            ) : challenge.status !== "active" ? (
              <p className="text-center font-mono text-sm" style={{ color: "var(--color-text-dim)" }}>
                This challenge is no longer active.
              </p>
            ) : (
              <a
                href={`/quiz/${challenge.id}`}
                className="btn-primary block w-full rounded-xl py-3.5 text-center font-mono text-sm font-bold transition-all"
              >
                Start the Turing Test &rarr;
              </a>
            )}
          </>
        )}
      </div>
    </div>
    </div>
  );
}
