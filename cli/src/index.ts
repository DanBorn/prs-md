/** prs-md CLI — Turing Test for Pull Requests */

import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { c, logoFull, spinner, certificate, badgeBlock } from "./ui.js";
import { parsePrUrl, fetchPr } from "./github.js";
import { generateQuestions, gradeAnswers, type AiProvider } from "./llm.js";
import { runQuiz } from "./quiz.js";
import { registerProof } from "./proof.js";
import { loadAuth, clearAuth, getDeviceCode } from "./auth.js";

const PASS_THRESHOLD = 70;

function printUsage(): void {
  console.log(`
  ${logoFull()}  ${c.dim("Turing Test for Pull Requests")}

  ${c.bold("Usage:")}
    ${c.neon("prs-md")} ${c.cyan("<pr-url>")} ${c.dim("[options]")}
    ${c.neon("prs-md")} ${c.cyan("login")}                          ${c.dim("Link tests to your prs.md account")}
    ${c.neon("prs-md")} ${c.cyan("logout")}                         ${c.dim("Remove stored credentials")}
    ${c.neon("prs-md")} ${c.cyan("whoami")}                         ${c.dim("Show current auth status")}

  ${c.bold("Examples:")}
    ${c.dim("$")} prs-md https://github.com/acme/api/pull/247
    ${c.dim("$")} prs-md https://github.com/acme/api/pull/247 --provider anthropic
    ${c.dim("$")} PRS_PROVIDER=openai PRS_API_KEY=sk-... prs-md https://github.com/acme/api/pull/247

  ${c.bold("Options:")}
    --provider, -p    AI provider: openai, anthropic, gemini  ${c.dim("(or PRS_PROVIDER env)")}
    --key, -k         AI API key                              ${c.dim("(or PRS_API_KEY env)")}
    --help, -h        Show this help

  ${c.bold("Auth:")} ${c.dim("Optional — run")} ${c.neon("prs-md login")} ${c.dim("to link results to your prs.md dashboard.")}
  ${c.bold("Note:")} Only public repos are supported.
  Your AI key never leaves your machine — grading happens locally.
`);
}

function parseArgs(argv: string[]): {
  subcommand: string | null;
  prUrl: string | null;
  provider: AiProvider | null;
  apiKey: string | null;
  help: boolean;
} {
  let subcommand: string | null = null;
  let prUrl: string | null = null;
  let provider: AiProvider | null = null;
  let apiKey: string | null = null;
  let help = false;

  const subcommands = new Set(["login", "logout", "whoami"]);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      help = true;
    } else if (arg === "--provider" || arg === "-p") {
      provider = argv[++i] as AiProvider;
    } else if (arg === "--key" || arg === "-k") {
      apiKey = argv[++i];
    } else if (arg?.startsWith("https://")) {
      prUrl = arg;
    } else if (i === 0 && arg && subcommands.has(arg)) {
      subcommand = arg;
    }
  }

  return { subcommand, prUrl, provider, apiKey, help };
}

async function promptChoice(
  rl: readline.Interface,
  question: string,
  choices: string[],
): Promise<string> {
  while (true) {
    const answer = await rl.question(question);
    const trimmed = answer.trim().toLowerCase();
    if (choices.includes(trimmed)) return trimmed;
    console.log(`  ${c.red("Invalid choice.")} Options: ${choices.join(", ")}`);
  }
}

/** Handle `prs-md login` — GitHub Device Flow */
async function handleLogin(): Promise<void> {
  console.log("");
  console.log(`  ${logoFull()}  ${c.dim("— Login with GitHub")}`);
  console.log("");

  const existing = loadAuth();
  if (existing) {
    console.log(`  ${c.neon("✓")} Already logged in as ${c.bold(`@${existing.githubUsername}`)}`);
    console.log(`  ${c.dim("Run")} ${c.cyan("prs-md logout")} ${c.dim("to switch accounts.")}`);
    console.log("");
    return;
  }

  const loginSpin = spinner("Requesting device code...");
  const device = await getDeviceCode();
  loginSpin.stop("Ready");

  console.log("");
  console.log(`  ${c.bold("1.")} Open: ${c.underline(c.cyan(device.verificationUri))}`);
  console.log(`  ${c.bold("2.")} Enter code: ${c.bold(c.neon(device.userCode))}`);
  console.log("");
  console.log(`  ${c.dim("Waiting for authorization...")}`);

  const auth = await device.login();

  console.log("");
  console.log(`  ${c.neon("✓")} Logged in as ${c.bold(`@${auth.githubUsername}`)}`);
  console.log(`  ${c.dim("Your test results will now appear on your prs.md dashboard.")}`);
  console.log("");
}

/** Handle `prs-md logout` */
function handleLogout(): void {
  console.log("");
  const removed = clearAuth();
  if (removed) {
    console.log(`  ${c.neon("✓")} Logged out. Stored credentials removed.`);
  } else {
    console.log(`  ${c.dim("Not logged in — nothing to do.")}`);
  }
  console.log("");
}

/** Handle `prs-md whoami` */
function handleWhoami(): void {
  console.log("");
  const auth = loadAuth();
  if (auth) {
    console.log(`  ${c.neon("✓")} Logged in as ${c.bold(`@${auth.githubUsername}`)}`);
    console.log(`  ${c.dim(`Since ${new Date(auth.createdAt).toLocaleDateString()}`)}`);
  } else {
    console.log(`  ${c.dim("Not logged in.")}`);
    console.log(`  ${c.dim("Run")} ${c.cyan("prs-md login")} ${c.dim("to link results to your prs.md dashboard.")}`);
  }
  console.log("");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  // Handle subcommands
  if (args.subcommand === "login") {
    await handleLogin();
    return;
  }
  if (args.subcommand === "logout") {
    handleLogout();
    return;
  }
  if (args.subcommand === "whoami") {
    handleWhoami();
    return;
  }

  if (args.help || (!args.prUrl && process.argv.length <= 2)) {
    printUsage();
    process.exit(0);
  }

  // Check for stored auth
  const storedAuth = loadAuth();

  console.log("");
  console.log(`  ${logoFull()}  ${c.dim("— Turing Test for Pull Requests")}`);
  if (storedAuth) {
    console.log(`  ${c.dim("Authenticated as")} ${c.neon(`@${storedAuth.githubUsername}`)} ${c.dim("— results linked to dashboard")}`);
  }
  console.log("");

  // ── Resolve PR URL ───────────────────────────────────────
  const prUrl = args.prUrl;
  if (!prUrl) {
    console.error(`  ${c.red("✗")} Please provide a GitHub PR URL`);
    process.exit(1);
  }

  const parsed = parsePrUrl(prUrl);
  if (!parsed) {
    console.error(`  ${c.red("✗")} Invalid GitHub PR URL: ${prUrl}`);
    process.exit(1);
  }

  // ── Resolve AI provider + key ────────────────────────────
  let provider = args.provider ?? (process.env.PRS_PROVIDER as AiProvider | undefined) ?? null;
  let apiKey = args.apiKey ?? process.env.PRS_API_KEY ?? null;

  // Auto-detect provider from key prefix
  if (!provider && apiKey) {
    if (apiKey.startsWith("sk-ant-")) provider = "anthropic";
    else if (apiKey.startsWith("sk-")) provider = "openai";
    else if (apiKey.startsWith("AI")) provider = "gemini";
  }

  // Fetch saved keys from prs.md when logged in and no key resolved yet
  if ((!provider || !apiKey) && storedAuth?.githubToken) {
    try {
      const keysRes = await fetch("https://prs.md/api/cli/keys", {
        headers: { Authorization: `Bearer ${storedAuth.githubToken}` },
      });
      if (keysRes.ok) {
        const keysData = (await keysRes.json()) as { keys: Array<{ provider: string; apiKey: string }> };
        if (keysData.keys.length > 0) {
          // Pick the first available key, preferring provider already selected
          const match = provider
            ? keysData.keys.find((k) => k.provider === provider)
            : keysData.keys[0];
          if (match) {
            provider = match.provider as AiProvider;
            apiKey = match.apiKey;
            console.log(`  ${c.neon("✓")} Using saved ${c.bold(provider)} key from prs.md`);
          }
        }
      }
    } catch {
      // Server unreachable — fall through to interactive prompt
    }
  }

  // Interactive prompt if still not resolved
  if (!provider || !apiKey) {
    const rl = readline.createInterface({ input: stdin, output: stdout });

    if (!provider) {
      console.log(`  ${c.bold("Select AI provider:")}`);
      console.log(`    ${c.neon("1")} OpenAI    ${c.dim("(gpt-4o-mini)")}`);
      console.log(`    ${c.neon("2")} Anthropic ${c.dim("(claude-sonnet)")}`);
      console.log(`    ${c.neon("3")} Gemini    ${c.dim("(gemini-2.0-flash)")}`);
      console.log("");
      const choice = await promptChoice(rl, `  ${c.dim("→")} `, ["1", "2", "3"]);
      provider = (["openai", "anthropic", "gemini"] as const)[parseInt(choice) - 1];
    }

    if (!apiKey) {
      apiKey = await rl.question(`  ${c.dim("API key:")} `);
      apiKey = apiKey.trim();
    }

    rl.close();
  }

  if (!provider || !apiKey) {
    console.error(`  ${c.red("✗")} AI provider and API key are required`);
    process.exit(1);
  }

  console.log(`  ${c.neon("✓")} Provider: ${c.bold(provider)}`);
  console.log("");

  // ── Fetch PR diff ────────────────────────────────────────
  const fetchSpin = spinner(`Fetching ${parsed.owner}/${parsed.repo}#${parsed.pull}...`);
  let pr;
  try {
    pr = await fetchPr(parsed.owner, parsed.repo, parsed.pull);
    fetchSpin.stop(`${c.bold(pr.title)} ${c.dim(`(${pr.repoFullName}#${parsed.pull})`)}`);
  } catch (err) {
    fetchSpin.stop(c.red("Failed to fetch PR"));
    console.error(`  ${c.red((err as Error).message)}`);
    process.exit(1);
  }

  // ── Generate questions ───────────────────────────────────
  const genSpin = spinner("Generating questions...");
  let questions;
  try {
    questions = await generateQuestions(provider, apiKey, pr.diff);
    genSpin.stop(`${questions.length} questions generated`);
  } catch (err) {
    genSpin.stop(c.red("Failed to generate questions"));
    console.error(`  ${c.red((err as Error).message)}`);
    process.exit(1);
  }

  // ── Run quiz ─────────────────────────────────────────────
  console.log("");
  console.log(`  ${c.bold(c.yellow("⏱  Ready?"))} 3 questions, 3 minutes. Be specific about the diff.`);
  console.log("");

  {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    await rl.question(`  ${c.dim("Press Enter to start...")} `);
    rl.close();
  }

  const { answers, timeSpentSeconds } = await runQuiz(questions);

  // ── Grade answers ────────────────────────────────────────
  console.log("");
  const gradeSpin = spinner("Grading...");
  let gradeResult;
  try {
    gradeResult = await gradeAnswers(provider, apiKey, questions, answers);
    gradeSpin.stop("Grading complete");
  } catch (err) {
    gradeSpin.stop(c.red("Failed to grade answers"));
    console.error(`  ${c.red((err as Error).message)}`);
    process.exit(1);
  }

  const totalScore = Math.round(
    gradeResult.scores.reduce((sum, s) => sum + s, 0) / gradeResult.scores.length,
  );
  const passed = totalScore >= PASS_THRESHOLD;

  // ── Resolve username (only from GitHub auth) ──────────────
  const username = storedAuth?.githubUsername ?? null;

  // ── Show certificate ─────────────────────────────────────
  console.log(
    certificate({
      username,
      prRepo: pr.repoFullName,
      prTitle: pr.title,
      totalScore,
      scores: gradeResult.scores,
      feedback: gradeResult.feedback,
      passed,
      timeSpent: timeSpentSeconds,
    }),
  );

  if (!passed) {
    console.log(`  ${c.red("Review the PR diff and try again to prove understanding.")}`);
    if (!storedAuth) {
      console.log(`  ${c.dim("Tip: run")} ${c.cyan("prs-md login")} ${c.dim("to link results to your dashboard.")}`);
    }
    console.log("");
    process.exit(1);
  }

  // ── Register proof on server ─────────────────────────────
  const regSpin = spinner("Registering proof on prs.md...");
  try {
    const proof = await registerProof({
      githubUsername: username,
      githubToken: storedAuth?.githubToken,
      prUrl,
      prTitle: pr.title,
      prRepo: pr.repoFullName,
      questions,
      answers,
      scores: gradeResult.scores,
      totalScore,
      passed,
      timeSpentSeconds,
      gradingFeedback: gradeResult.feedback,
    });

    regSpin.stop(`Proof registered: ${c.underline(proof.proofUrl)}`);
    console.log("");
    console.log(badgeBlock(proof.proofUrl));
    if (!storedAuth) {
      console.log(`  ${c.dim("Tip: run")} ${c.cyan("prs-md login")} ${c.dim("to link future results to your dashboard.")}`);
      console.log("");
    }
  } catch {
    regSpin.stop(c.yellow("Could not register proof on prs.md (server unreachable)"));
    console.log("");
    console.log(`  ${c.dim("Your results are shown above. The prs.md server may be down — try again later to get a shareable badge.")}`);
  }

  console.log("");
}

main().catch((err) => {
  console.error(`\n  ${c.red("✗")} ${(err as Error).message}\n`);
  process.exit(1);
});
