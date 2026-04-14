/** ANSI terminal colors and formatting — zero dependencies */

const ESC = "\x1b[";
const RESET = `${ESC}0m`;

const code = (n: number) => (s: string) => `${ESC}${n}m${s}${RESET}`;

export const c = {
  bold: code(1),
  dim: code(2),
  italic: code(3),
  underline: code(4),
  green: code(32),
  red: code(31),
  yellow: code(33),
  cyan: code(36),
  gray: code(90),
  brightGreen: code(92),
  brightCyan: code(96),
  bgGreen: code(42),
  bgRed: code(41),
  neon: (s: string) => `${ESC}1m${ESC}92m${s}${RESET}`,
};

export function logo(): string {
  return `${c.dim("<")}${c.neon("PRs")}${c.dim("/>")}`;
}

export function logoFull(): string {
  return `${c.dim("<")}${c.neon("PRs")}${c.dim(".")}${c.gray("md")}${c.dim(" />")}`;
}

/** Simple inline spinner. Returns { stop } to clear it. */
export function spinner(message: string): { stop: (finalMsg?: string) => void } {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  const id = setInterval(() => {
    process.stdout.write(`\r  ${c.neon(frames[i++ % frames.length])} ${message}`);
  }, 80);

  return {
    stop(finalMsg?: string) {
      clearInterval(id);
      process.stdout.write(`\r  ${c.neon("✓")} ${finalMsg ?? message}\n`);
    },
  };
}

/** Render the progress bar for quiz timer */
export function timerBar(remaining: number, total: number): string {
  const width = 30;
  const filled = Math.round((remaining / total) * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const time = `${mins}:${String(secs).padStart(2, "0")}`;
  const color = remaining < 30 ? c.red : remaining < 60 ? c.yellow : c.neon;
  return `  ${color(bar)} ${c.bold(time)}`;
}

/** Score bar for results */
function scoreBar(score: number): string {
  const width = 15;
  const filled = Math.round((score / 100) * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  const color = score >= 70 ? c.neon : c.red;
  return color(bar);
}

/** ASCII art certificate */
export function certificate(opts: {
  username: string | null;
  prRepo: string;
  prTitle: string;
  totalScore: number;
  scores: number[];
  feedback: string[];
  passed: boolean;
  timeSpent: number;
}): string {
  const { username, prRepo, prTitle, totalScore, scores, feedback, passed, timeSpent } = opts;
  const mins = Math.floor(timeSpent / 60);
  const secs = timeSpent % 60;
  const W = 52;
  const hr = "─".repeat(W);
  const pad = (s: string, len: number) => {
    // Strip ANSI for length calc
    const visible = s.replace(/\x1b\[[0-9;]*m/g, "");
    return s + " ".repeat(Math.max(0, len - visible.length));
  };

  const status = passed
    ? c.neon("✓ 100% HUMAN VERIFIED")
    : c.red("✗ DID NOT PASS");

  const scoreColor = passed ? c.neon : c.red;

  const lines = [
    "",
    `  ┌${hr}┐`,
    `  │${" ".repeat(W)}│`,
    `  │  ${pad(`${status}${" ".repeat(6)}${scoreColor(c.bold(String(totalScore) + "%"))}`, W - 2)}│`,
    `  │${" ".repeat(W)}│`,
    `  │  ${pad(username ? `${c.dim("@")}${c.bold(username)}  ${c.dim("·")}  ${c.dim(`${mins}m ${secs}s`)}` : c.dim(`${mins}m ${secs}s`), W - 2)}│`,
    `  │  ${pad(c.dim(prRepo), W - 2)}│`,
    `  │  ${pad(c.cyan(prTitle.length > 44 ? prTitle.slice(0, 41) + "..." : prTitle), W - 2)}│`,
    `  │${" ".repeat(W)}│`,
    `  │  ${c.dim("─".repeat(W - 4))}  │`,
  ];

  scores.forEach((score, i) => {
    const mark = score >= 70 ? c.neon("✓") : c.red("✗");
    const label = `Q${i + 1}`;
    lines.push(
      `  │  ${pad(`${c.bold(label)}  ${String(score).padStart(3)}% ${scoreBar(score)}  ${mark}`, W - 2)}│`
    );
    if (feedback[i]) {
      const fb = feedback[i].length > 42 ? feedback[i].slice(0, 39) + "..." : feedback[i];
      lines.push(
        `  │  ${pad(`     ${c.dim(c.italic(fb))}`, W - 2)}│`
      );
    }
  });

  lines.push(
    `  │${" ".repeat(W)}│`,
    `  │  ${pad(`${logo()}  ${c.dim("prs.md — Turing Test for Pull Requests")}`, W - 2)}│`,
    `  └${hr}┘`,
    "",
  );

  return lines.join("\n");
}

/** Print the badge markdown for copy-paste */
export function badgeBlock(proofUrl: string): string {
  const badgeImg = `https://img.shields.io/badge/prs.md-100%25_Human_Verified-00e676?style=flat-square`;
  const md = `[![prs.md — 100% Human Verified](${badgeImg})](${proofUrl})`;

  return [
    `  ${c.neon("Add to your PR description:")}`,
    "",
    `  ${c.dim(md)}`,
    "",
  ].join("\n");
}
