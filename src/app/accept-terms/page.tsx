export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AcceptTermsForm } from "./accept-terms-form";

export const metadata: Metadata = {
  title: "Terms of Service — PRs.md",
};

export default async function AcceptTermsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const termsAcceptedAt =
    (session.user as { termsAcceptedAt?: Date | null }).termsAcceptedAt ?? null;

  if (termsAcceptedAt) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] items-start justify-center px-4 py-10 sm:py-16 sm:items-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--color-neon)" }}>
            Terms
          </p>
          <h1
            className="text-2xl font-extrabold tracking-tight mb-2"
            style={{ letterSpacing: "-0.03em" }}
          >
            One quick thing
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Before you start, please review and accept the Terms of Service.
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-4 sm:p-6"
          style={{
            borderColor: "var(--color-border)",
            background: "var(--color-surface)",
            boxShadow: "var(--shadow-elevated)",
          }}
        >
          <AcceptTermsForm />
        </div>
      </div>
    </div>
  );
}
