import Link from "next/link";
import { LogoMark } from "./logo";

const GITHUB_URL = "https://github.com/DanBorn/prs-md";

export function Footer() {
  return (
    <footer
      className="border-t px-4 py-8"
      style={{ borderColor: "var(--color-border-subtle)" }}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <LogoMark />
          <span className="font-mono text-xs" style={{ color: "var(--color-text-dim)" }}>
            open-source, zero cost, BYOK
          </span>
        </div>

        <nav className="flex items-center gap-4" aria-label="Footer navigation">
          <Link href="/about" className="link-dim font-mono text-xs transition-colors">
            about
          </Link>
          <Link href="/docs" className="link-dim font-mono text-xs transition-colors">
            docs
          </Link>
          <Link href="/terms" className="link-dim font-mono text-xs transition-colors">
            terms
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="link-dim font-mono text-xs transition-colors"
          >
            GitHub &#8599;
          </a>
        </nav>
      </div>
    </footer>
  );
}
