/** Tag-style logo for PRs.md — capital P and R to signal "Pull Requests" */

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center font-mono text-sm tracking-tight ${className}`}
    >
      <span style={{ color: "var(--color-text-dim)" }}>&lt;</span>
      <span className="font-black" style={{ color: "var(--color-neon)" }}>PRs</span>
      <span className="font-bold" style={{ color: "var(--color-text-muted)" }}>.md</span>
      <span className="ml-px" style={{ color: "var(--color-text-dim)" }}>/&gt;</span>
    </span>
  );
}

/** Compact mark version for tight spaces */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center font-mono text-xs tracking-tight ${className}`}
    >
      <span style={{ color: "var(--color-text-dim)" }}>&lt;</span>
      <span className="font-black" style={{ color: "var(--color-neon)" }}>PRs</span>
      <span style={{ color: "var(--color-text-dim)" }}>/&gt;</span>
    </span>
  );
}
