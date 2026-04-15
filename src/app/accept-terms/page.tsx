export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LogoMark } from "@/components/logo";
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
    <div className="flex min-h-[calc(100vh-56px)] items-start justify-center px-4 py-16 sm:items-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <LogoMark />
          </div>
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
          className="rounded-2xl border p-6"
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
