"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";

interface Question {
  index: number;
  question: string;
}

export function QuizRunner({
  challengeId,
  prTitle,
  prRepo,
  questions,
  timeLimitSeconds,
}: {
  challengeId: string;
  prTitle: string;
  prRepo: string | null;
  questions: Question[];
  timeLimitSeconds: number;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<string[]>(
    () => new Array(questions.length).fill("")
  );
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSubmit = useCallback(async (finalAnswers?: string[]) => {
    if (submitting) return;
    setSubmitting(true);
    setError("");

    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const answersToSubmit = finalAnswers ?? answers;
    track("quiz_submitted", { challenge_id: challengeId, time_spent_seconds: elapsed });

    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          answers: answersToSubmit,
          timeSpentSeconds: elapsed,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Grading failed.");
        setSubmitting(false);
        return;
      }

      // Action-sourced challenges are graded async by the GitHub Action
      if (data.status === "grading") {
        router.push(`/challenge/${challengeId}?grading=pending`);
        router.refresh();
        return;
      }

      router.push(`/challenge/${challengeId}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }, [submitting, answers, challengeId, router]);

  useEffect(() => {
    if (!started) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, handleSubmit]);

  function handleStart() {
    startTimeRef.current = Date.now();
    setStarted(true);
    track("quiz_started", { challenge_id: challengeId });
  }

  function updateAnswer(index: number, value: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft <= 30;
  const progress = timeLeft / timeLimitSeconds;

  if (!started) {
    return (
      <div
        className="rounded-2xl border overflow-hidden"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-surface)",
          boxShadow: "var(--shadow-elevated)",
        }}
      >
        <div className="h-1" style={{ background: "linear-gradient(90deg, var(--color-accent), var(--color-neon))" }} />
        <div className="p-5 sm:p-8 text-center">
          <span
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl mb-4 text-lg"
            style={{ background: "var(--color-neon-glow)", color: "var(--color-neon)" }}
          >
            &#9201;
          </span>
          <h1 className="text-lg sm:text-xl font-bold mb-1 break-words">{prTitle}</h1>
          {prRepo && (
            <p className="font-mono text-xs mb-6" style={{ color: "var(--color-text-dim)" }}>
              {prRepo}
            </p>
          )}
          <p className="text-sm mb-8 max-w-md mx-auto" style={{ color: "var(--color-text-muted)" }}>
            You&apos;ll have <span className="font-mono font-bold" style={{ color: "var(--color-neon)" }}>{Math.floor(timeLimitSeconds / 60)} minutes</span> to
            answer {questions.length} questions. The timer starts when you click below.
          </p>
          <button
            onClick={handleStart}
            className="btn-primary group rounded-xl px-10 py-3.5 font-mono text-sm font-bold transition-all"
          >
            Start Timer
            <span className="ml-2 inline-block transition-transform group-hover:translate-x-0.5">&rarr;</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Timer bar */}
      <div
        className="sticky top-14 z-40 mb-6 rounded-xl border overflow-hidden backdrop-blur-xl"
        style={{
          borderColor: isUrgent ? "oklch(65% 0.22 25 / 0.3)" : "var(--color-border)",
          background: isUrgent ? "oklch(65% 0.22 25 / 0.06)" : "oklch(13% 0.01 260 / 0.9)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-mono text-xs truncate mr-3" style={{ color: "var(--color-text-muted)" }}>{prTitle}</span>
          <span
            className="font-mono text-xl font-black tabular-nums"
            style={{ color: isUrgent ? "var(--color-danger)" : "var(--color-neon)" }}
          >
            {minutes}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-0.5" style={{ background: "var(--color-border-subtle)" }}>
          <div
            className="h-full transition-all duration-1000 ease-linear"
            style={{
              width: `${progress * 100}%`,
              background: isUrgent
                ? "var(--color-danger)"
                : "linear-gradient(90deg, var(--color-neon), var(--color-accent))",
            }}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-5 no-copy-paste">
        {questions.map((q, i) => (
          <div
            key={q.index}
            className="rounded-xl border p-4 sm:p-6"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="flex items-start gap-3 mb-4">
              <span
                className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-black"
                style={{ background: "var(--color-accent-dim)", color: "var(--color-accent)" }}
              >
                {i + 1}
              </span>
              <p className="text-sm font-medium leading-relaxed">
                {q.question}
              </p>
            </div>
            <textarea
              value={answers[i]}
              onChange={(e) => updateAnswer(i, e.target.value)}
              onPaste={handlePaste}
              onDrop={(e) => e.preventDefault()}
              placeholder="Type your answer..."
              rows={3}
              className="input-field w-full resize-y rounded-lg border px-3 py-2.5 text-sm leading-relaxed font-mono transition-colors focus:outline-none"
            />
          </div>
        ))}
      </div>

      {error && (
        <p className="mt-4 font-mono text-xs" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      )}

      {/* Submit */}
      <div className="mt-8 text-center">
        <button
          onClick={() => handleSubmit()}
          disabled={submitting || timeLeft === 0}
          className="btn-primary rounded-xl px-10 py-3.5 font-mono text-sm font-bold transition-all"
        >
          {submitting ? "Grading..." : "Submit Answers"}
        </button>
      </div>
    </div>
  );
}
