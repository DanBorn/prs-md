"use client";

import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import { LogoMark } from "./logo";

const GITHUB_URL = "https://github.com/DanBorn/prs-md";

export function Footer() {
  const { data: session } = useSession();

  return (
    <footer
      className="border-t px-4 py-6 sm:py-8"
      style={{ borderColor: "var(--color-border-subtle)" }}
    >
      <div className="mx-auto max-w-5xl space-y-4 sm:flex sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center gap-2">
          <LogoMark />
          <span className="font-mono text-xs" style={{ color: "var(--color-text-dim)" }}>
            open-source, zero cost, BYOK
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Footer navigation">
          <Link href="/about" className="link-dim font-mono text-xs transition-colors">
            about
          </Link>
          <Link href="/docs" className="link-dim font-mono text-xs transition-colors">
            docs
          </Link>
          <Link href="/terms" className="link-dim font-mono text-xs transition-colors">
            terms
          </Link>
          <Link href="/cookies" className="link-dim font-mono text-xs transition-colors">
            cookies
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="link-dim font-mono text-xs transition-colors"
          >
            GitHub &#8599;
          </a>
          {!session?.user && (
            <>
              <button
                onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
                className="link-dim font-mono text-xs transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={() => signIn("github", { callbackUrl: "/accept-terms" })}
                className="link-neon font-mono text-xs font-medium transition-colors"
              >
                Sign up
              </button>
            </>
          )}
        </nav>
      </div>
    </footer>
  );
}
