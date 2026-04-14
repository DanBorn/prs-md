export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { db } from "@/db";
import { attempts, challenges, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { ProofBadge } from "./proof-badge";
import { LogoMark } from "@/components/logo";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { auth } from "@/lib/auth";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const attempt = await db
    .select()
    .from(attempts)
    .where(eq(attempts.id, id))
    .then((rows) => rows[0]);

  if (!attempt || !attempt.passed) {
    return { title: "Proof Not Found — prs.md" };
  }

  return {
    title: "100% Human Verified — prs.md",
    description: "This developer proved they understand their own code.",
    openGraph: {
      title: "100% Human Verified — prs.md",
      description: "Turing Test for Pull Requests. This dev passed.",
    },
  };
}

export default async function ProofPage({ params }: Props) {
  const { id } = await params;

  const attempt = await db
    .select()
    .from(attempts)
    .where(eq(attempts.id, id))
    .then((rows) => rows[0]);

  if (!attempt || !attempt.passed) {
    notFound();
  }

  const challenge = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, attempt.challengeId))
    .then((rows) => rows[0]);

  const user = await db
    .select({
      name: users.name,
      image: users.image,
      githubUsername: users.githubUsername,
    })
    .from(users)
    .where(eq(users.id, attempt.userId))
    .then((rows) => rows[0]);

  const scores = (attempt.scores as number[]) ?? [];
  const feedback = (attempt.gradingFeedback as string[]) ?? [];
  const questions = challenge?.questions ?? [];

  const session = await auth();

  const proofUrl = `https://prs.md/proof/${id}`;
  const badgeImgUrl = `https://prs.md/api/badge/${id}`;
  const badgeMarkdown = `[![prs.md — 100% Human Verified](${badgeImgUrl})](${proofUrl})`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {session?.user && (
        <Breadcrumbs
          items={[
            { label: "dashboard", href: "/dashboard" },
            { label: challenge?.prUrl?.match(/\/pull\/(\d+)/)?.[1] ? `#${challenge.prUrl.match(/\/pull\/(\d+)/)![1]}` : "challenge", href: `/challenge/${attempt.challengeId}` },
            { label: "proof" },
          ]}
        />
      )}
      {/* Proof certificate */}
      <div
        className="relative rounded-2xl border overflow-hidden"
        style={{
          borderColor: "oklch(82% 0.22 145 / 0.2)",
          background: "var(--color-surface)",
          boxShadow: "var(--shadow-elevated), var(--shadow-glow-neon)",
        }}
      >
        {/* Top gradient accent line */}
        <div
          className="h-1"
          style={{
            background: "linear-gradient(90deg, var(--color-neon), var(--color-accent), var(--color-neon))",
            backgroundSize: "200% 100%",
            animation: "shimmer 3s linear infinite",
          }}
        />

        {/* Header */}
        <div className="relative px-8 pt-8 pb-6">
          {/* Glow behind badge */}
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 h-32 w-64 rounded-full blur-[60px] -z-0"
            style={{ background: "oklch(82% 0.22 145 / 0.1)" }}
          />

          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-3">
              {user?.image && (
                <img
                  src={user.image}
                  alt=""
                  className="h-12 w-12 rounded-full"
                  style={{ outline: "2px solid oklch(82% 0.22 145 / 0.3)", outlineOffset: "2px" }}
                />
              )}
              <div>
                <p className="font-bold text-lg">
                  {user?.githubUsername
                    ? `@${user.githubUsername}`
                    : user?.name ?? "Anonymous"}
                </p>
                <p className="font-mono text-[11px]" style={{ color: "var(--color-text-dim)" }}>
                  Verified {new Date(attempt.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                  {attempt.timeSpentSeconds && (
                    <> &middot; {Math.floor(attempt.timeSpentSeconds / 60)}m {attempt.timeSpentSeconds % 60}s</>
                  )}
                  {attempt.attemptNumber > 1 && (
                    <> &middot; attempt #{attempt.attemptNumber}</>
                  )}
                </p>
              </div>
            </div>

            {/* Score ring */}
            <div className="text-center">
              <div
                className="relative inline-flex h-16 w-16 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(var(--color-neon) ${(attempt.totalScore ?? 0) * 3.6}deg, var(--color-border) 0deg)`,
                }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{ background: "var(--color-surface)" }}
                >
                  <span className="font-mono text-lg font-black" style={{ color: "var(--color-neon)" }}>
                    {attempt.totalScore}
                  </span>
                </div>
              </div>
              <p className="font-mono text-[10px] mt-1" style={{ color: "var(--color-text-dim)" }}>SCORE</p>
            </div>
          </div>

          {/* Verified banner */}
          <div
            className="mt-5 flex items-center gap-3 rounded-xl border px-5 py-3"
            style={{
              borderColor: "oklch(82% 0.22 145 / 0.2)",
              background: "oklch(82% 0.22 145 / 0.06)",
            }}
          >
            <span className="text-xl" style={{ color: "var(--color-neon)" }}>&#10003;</span>
            <div>
              <p className="font-mono text-sm font-bold" style={{ color: "var(--color-neon)" }}>
                100% Human Verified
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <LogoMark />
                <span className="font-mono text-[10px]" style={{ color: "var(--color-text-dim)" }}>
                  Turing Test for Pull Requests
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PR info */}
        {challenge && (
          <div className="px-8 pb-4">
            <div
              className="rounded-lg border px-4 py-3"
              style={{ borderColor: "var(--color-border)", background: "var(--color-surface-raised)" }}
            >
              <p className="text-sm font-medium truncate">{challenge.prTitle}</p>
              <a
                href={challenge.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="link-accent font-mono text-xs"
              >
                {challenge.prRepo} &nearr;
              </a>
            </div>
          </div>
        )}

        {/* Q&A breakdown */}
        <div className="px-8 py-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-text-dim)" }}>
            Challenge breakdown
          </p>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div
                key={i}
                className="rounded-lg border p-4"
                style={{ borderColor: "var(--color-border)", background: "var(--color-surface-raised)" }}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-medium leading-snug flex-1">{q.question}</p>
                  <span
                    className="shrink-0 rounded-md px-2 py-0.5 font-mono text-xs font-bold"
                    style={{
                      background: scores[i] >= 70 ? "var(--color-neon-glow)" : "oklch(65% 0.22 25 / 0.12)",
                      color: scores[i] >= 70 ? "var(--color-neon)" : "var(--color-danger)",
                    }}
                  >
                    {scores[i]}%
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                  {attempt.answers[i]}
                </p>
                {feedback[i] && (
                  <p className="font-mono text-[11px] mt-2 italic" style={{ color: "var(--color-text-dim)" }}>
                    {feedback[i]}
                  </p>
                )}
                {q.isHallucinationTrap && (
                  <span
                    className="mt-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-mono text-[10px] font-medium"
                    style={{
                      background: "oklch(78% 0.16 70 / 0.1)",
                      color: "var(--color-warning)",
                    }}
                  >
                    &#9888; hallucination trap
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Badge preview + copy section */}
        <div
          className="mx-8 mb-8 mt-4 rounded-xl border p-5"
          style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}
        >
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-neon)" }}>
            Add to your PR
          </p>

          {/* Live badge preview */}
          <div className="mb-4 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/badge/${id}`}
              alt="prs.md proof badge"
              width={480}
              height={140}
              className="rounded-xl"
            />
          </div>

          <div
            className="rounded-lg border p-3 font-mono text-[11px] break-all leading-relaxed"
            style={{
              borderColor: "var(--color-border-subtle)",
              background: "var(--color-surface)",
              color: "var(--color-text-muted)",
            }}
          >
            {badgeMarkdown}
          </div>
          <ProofBadge markdown={badgeMarkdown} />
        </div>
      </div>
    </div>
  );
}
