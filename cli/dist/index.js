#!/usr/bin/env node

// src/index.ts
import * as readline2 from "readline/promises";
import { stdin as stdin2, stdout as stdout2 } from "process";

// src/ui.ts
var ESC = "\x1B[";
var RESET = `${ESC}0m`;
var code = (n) => (s) => `${ESC}${n}m${s}${RESET}`;
var c = {
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
  neon: (s) => `${ESC}1m${ESC}92m${s}${RESET}`
};
function logo() {
  return `${c.dim("<")}${c.neon("PRs")}${c.dim("/>")}`;
}
function logoFull() {
  return `${c.dim("<")}${c.neon("PRs")}${c.dim(".")}${c.gray("md")}${c.dim(" />")}`;
}
function spinner(message) {
  const frames = ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"];
  let i = 0;
  const id = setInterval(() => {
    process.stdout.write(`\r  ${c.neon(frames[i++ % frames.length])} ${message}`);
  }, 80);
  return {
    stop(finalMsg) {
      clearInterval(id);
      process.stdout.write(`\r  ${c.neon("\u2713")} ${finalMsg ?? message}
`);
    }
  };
}
function timerBar(remaining, total) {
  const width = 30;
  const filled = Math.round(remaining / total * width);
  const bar = "\u2588".repeat(filled) + "\u2591".repeat(width - filled);
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const time = `${mins}:${String(secs).padStart(2, "0")}`;
  const color = remaining < 30 ? c.red : remaining < 60 ? c.yellow : c.neon;
  return `  ${color(bar)} ${c.bold(time)}`;
}
function scoreBar(score) {
  const width = 15;
  const filled = Math.round(score / 100 * width);
  const bar = "\u2588".repeat(filled) + "\u2591".repeat(width - filled);
  const color = score >= 70 ? c.neon : c.red;
  return color(bar);
}
function certificate(opts) {
  const { username, prRepo, prTitle, totalScore, scores, feedback, passed, timeSpent } = opts;
  const mins = Math.floor(timeSpent / 60);
  const secs = timeSpent % 60;
  const W = 52;
  const hr = "\u2500".repeat(W);
  const pad = (s, len) => {
    const visible = s.replace(/\x1b\[[0-9;]*m/g, "");
    return s + " ".repeat(Math.max(0, len - visible.length));
  };
  const status = passed ? c.neon("\u2713 100% HUMAN VERIFIED") : c.red("\u2717 DID NOT PASS");
  const scoreColor = passed ? c.neon : c.red;
  const lines = [
    "",
    `  \u250C${hr}\u2510`,
    `  \u2502${" ".repeat(W)}\u2502`,
    `  \u2502  ${pad(`${status}${" ".repeat(6)}${scoreColor(c.bold(String(totalScore) + "%"))}`, W - 2)}\u2502`,
    `  \u2502${" ".repeat(W)}\u2502`,
    `  \u2502  ${pad(username ? `${c.dim("@")}${c.bold(username)}  ${c.dim("\xB7")}  ${c.dim(`${mins}m ${secs}s`)}` : c.dim(`${mins}m ${secs}s`), W - 2)}\u2502`,
    `  \u2502  ${pad(c.dim(prRepo), W - 2)}\u2502`,
    `  \u2502  ${pad(c.cyan(prTitle.length > 44 ? prTitle.slice(0, 41) + "..." : prTitle), W - 2)}\u2502`,
    `  \u2502${" ".repeat(W)}\u2502`,
    `  \u2502  ${c.dim("\u2500".repeat(W - 4))}  \u2502`
  ];
  scores.forEach((score, i) => {
    const mark = score >= 70 ? c.neon("\u2713") : c.red("\u2717");
    const label = `Q${i + 1}`;
    lines.push(
      `  \u2502  ${pad(`${c.bold(label)}  ${String(score).padStart(3)}% ${scoreBar(score)}  ${mark}`, W - 2)}\u2502`
    );
    if (feedback[i]) {
      const fb = feedback[i].length > 42 ? feedback[i].slice(0, 39) + "..." : feedback[i];
      lines.push(
        `  \u2502  ${pad(`     ${c.dim(c.italic(fb))}`, W - 2)}\u2502`
      );
    }
  });
  lines.push(
    `  \u2502${" ".repeat(W)}\u2502`,
    `  \u2502  ${pad(`${logo()}  ${c.dim("prs.md \u2014 Turing Test for Pull Requests")}`, W - 2)}\u2502`,
    `  \u2514${hr}\u2518`,
    ""
  );
  return lines.join("\n");
}
function badgeBlock(proofUrl) {
  const badgeImg = `https://img.shields.io/badge/prs.md-100%25_Human_Verified-00e676?style=flat-square`;
  const md = `[![prs.md \u2014 100% Human Verified](${badgeImg})](${proofUrl})`;
  return [
    `  ${c.neon("Add to your PR description:")}`,
    "",
    `  ${c.dim(md)}`,
    ""
  ].join("\n");
}

// src/github.ts
var MAX_DIFF_CHARS = 12e3;
function parsePrUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.hostname !== "github.com") return null;
  const parts = parsed.pathname.split("/");
  if (parts.length < 5 || parts[3] !== "pull") return null;
  const owner = parts[1];
  const repo = parts[2];
  const pullStr = parts[4];
  if (!owner || !repo || !/^\d+$/.test(pullStr)) return null;
  return { owner, repo, pull: parseInt(pullStr, 10) };
}
async function fetchPr(owner, repo, pull) {
  const headers = { "User-Agent": "prs-md-cli" };
  const diffRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pull}`,
    { headers: { ...headers, Accept: "application/vnd.github.v3.diff" } }
  );
  if (!diffRes.ok) {
    if (diffRes.status === 404) throw new Error("PR not found \u2014 is the repo public?");
    if (diffRes.status === 403) throw new Error("GitHub rate limit exceeded. Try again in a minute.");
    throw new Error(`GitHub API error: ${diffRes.status} ${diffRes.statusText}`);
  }
  let diff = await diffRes.text();
  if (diff.length > MAX_DIFF_CHARS) {
    diff = diff.slice(0, MAX_DIFF_CHARS) + "\n\n[...diff truncated...]";
  }
  const metaRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pull}`,
    { headers: { ...headers, Accept: "application/vnd.github.v3+json" } }
  );
  const meta = metaRes.ok ? await metaRes.json() : null;
  return {
    owner,
    repo,
    pull,
    title: meta?.title ?? `${owner}/${repo}#${pull}`,
    repoFullName: `${owner}/${repo}`,
    diff
  };
}

// src/llm.ts
var GENERATE_SYSTEM = `You are a senior code reviewer. Given a git diff, generate exactly 3 questions to verify that the PR author truly understands their own code changes.

Rules:
- Questions must be highly specific to the domain logic and side-effects in the diff
- Questions should require understanding of WHY changes were made, not just WHAT changed
- Exactly one question must be a "hallucination trap": a trick question about something that looks plausible but did NOT happen in the diff. The expected answer for the trap should explain that it didn't happen.
- Output valid JSON only, no markdown fences

Output format:
[
  { "question": "...", "expectedAnswer": "...", "isHallucinationTrap": false },
  { "question": "...", "expectedAnswer": "...", "isHallucinationTrap": false },
  { "question": "...", "expectedAnswer": "...", "isHallucinationTrap": true }
]`;
var GRADE_SYSTEM = `You are grading a developer's answers to questions about their own pull request. For each question-answer pair, evaluate semantic accuracy (not exact wording).

Score each answer 0-100:
- 90-100: Demonstrates clear understanding of the code change
- 60-89: Partially correct, understands the gist
- 30-59: Vague or incomplete understanding
- 0-29: Wrong, or clearly guessing

For hallucination trap questions: give 100 if the developer correctly identifies that it didn't happen, 0 if they fall for it.

Output valid JSON only, no markdown fences:
{
  "scores": [<number>, <number>, <number>],
  "feedback": ["<brief feedback>", "<brief feedback>", "<brief feedback>"]
}`;
async function callLlm(provider, apiKey, system, user) {
  switch (provider) {
    case "openai": {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user }
          ],
          temperature: 0.3,
          max_tokens: 2e3
        })
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`OpenAI API error ${res.status}: ${body}`);
      }
      const data = await res.json();
      return data.choices[0]?.message?.content ?? "";
    }
    case "anthropic": {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2e3,
          system,
          messages: [{ role: "user", content: user }]
        })
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Anthropic API error ${res.status}: ${body}`);
      }
      const data = await res.json();
      const block = data.content[0];
      return block?.type === "text" ? block.text : "";
    }
    case "gemini": {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${system}

${user}` }] }]
          })
        }
      );
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Gemini API error ${res.status}: ${body}`);
      }
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    }
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
function parseJson(raw) {
  const cleaned = raw.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}
async function generateQuestions(provider, apiKey, diff) {
  const raw = await callLlm(provider, apiKey, GENERATE_SYSTEM, `Here is the git diff:

${diff}`);
  return parseJson(raw);
}
async function gradeAnswers(provider, apiKey, questions, answers) {
  const prompt = questions.map(
    (q, i) => `Question ${i + 1}: ${q.question}
Expected: ${q.expectedAnswer}
User answered: ${answers[i] ?? "(no answer)"}
Is hallucination trap: ${q.isHallucinationTrap}`
  ).join("\n\n");
  const raw = await callLlm(provider, apiKey, GRADE_SYSTEM, prompt);
  return parseJson(raw);
}

// src/quiz.ts
import * as readline from "readline/promises";
import { stdin, stdout } from "process";
var TIME_LIMIT = 180;
async function runQuiz(questions) {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const answers = [];
  const startTime = Date.now();
  let expired = false;
  let remaining = TIME_LIMIT;
  const timer = setInterval(() => {
    remaining = Math.max(0, TIME_LIMIT - Math.floor((Date.now() - startTime) / 1e3));
    if (remaining <= 0 && !expired) {
      expired = true;
      clearInterval(timer);
      console.log(`

  ${c.red(c.bold("\u23F1  Time's up!"))}`);
      rl.close();
    }
  }, 1e3);
  console.log("");
  console.log(timerBar(remaining, TIME_LIMIT));
  console.log("");
  console.log(`  ${c.yellow("\u26A0")}  ${c.dim("3 questions \xB7 3 minutes \xB7 be specific about the diff")}`);
  console.log("");
  const strippedQuestions = questions.map((q) => q.question);
  for (let i = 0; i < strippedQuestions.length; i++) {
    if (expired) {
      answers.push("(time expired)");
      continue;
    }
    const remaining2 = Math.max(0, TIME_LIMIT - Math.floor((Date.now() - startTime) / 1e3));
    console.log(timerBar(remaining2, TIME_LIMIT));
    console.log("");
    console.log(`  ${c.neon(`Q${i + 1}:`)} ${c.bold(strippedQuestions[i])}`);
    console.log("");
    try {
      const answer = await rl.question(`  ${c.dim("\u2192")} `);
      answers.push(answer.trim() || "(no answer)");
      console.log("");
    } catch {
      answers.push("(time expired)");
    }
  }
  clearInterval(timer);
  rl.close();
  const timeSpent = Math.floor((Date.now() - startTime) / 1e3);
  return { answers, timeSpentSeconds: timeSpent };
}

// src/proof.ts
var API_BASE = process.env.PRS_API_URL ?? "https://prs.md";
async function registerProof(payload) {
  const res = await fetch(`${API_BASE}/api/cli/proof`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to register proof: ${res.status} ${body}`);
  }
  return await res.json();
}

// src/auth.ts
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
var CLIENT_ID = "Iv23liTycPSfEodFzKEZ";
var CONFIG_DIR = path.join(os.homedir(), ".config", "prs-md");
var AUTH_FILE = path.join(CONFIG_DIR, "auth.json");
function loadAuth() {
  try {
    const raw = fs.readFileSync(AUTH_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function saveAuth(data) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(AUTH_FILE, JSON.stringify(data, null, 2), { mode: 384 });
}
function clearAuth() {
  try {
    fs.unlinkSync(AUTH_FILE);
    return true;
  } catch {
    return false;
  }
}
async function fetchUsername(token) {
  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": "prs-md-cli" }
  });
  if (!res.ok) throw new Error("Failed to verify GitHub token");
  const data = await res.json();
  return data.login;
}
async function getDeviceCode() {
  const codeRes = await fetch("https://github.com/login/device/code", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      scope: "read:user"
    })
  });
  if (!codeRes.ok) {
    throw new Error(`GitHub device flow error: ${codeRes.status}`);
  }
  const codeData = await codeRes.json();
  return {
    userCode: codeData.user_code,
    verificationUri: codeData.verification_uri,
    login: async () => {
      const pollInterval = (codeData.interval ?? 5) * 1e3;
      const deadline = Date.now() + 9e5;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, pollInterval));
        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            client_id: CLIENT_ID,
            device_code: codeData.device_code,
            grant_type: "urn:ietf:params:oauth:grant-type:device_code"
          })
        });
        const tokenData = await tokenRes.json();
        if (tokenData.access_token) {
          const username = await fetchUsername(tokenData.access_token);
          const auth = {
            githubToken: tokenData.access_token,
            githubUsername: username,
            createdAt: (/* @__PURE__ */ new Date()).toISOString()
          };
          saveAuth(auth);
          return auth;
        }
        if (tokenData.error === "authorization_pending" || tokenData.error === "slow_down") {
          if (tokenData.error === "slow_down") {
            await new Promise((r) => setTimeout(r, 5e3));
          }
          continue;
        }
        if (tokenData.error === "expired_token") throw new Error("Device code expired.");
        if (tokenData.error === "access_denied") throw new Error("Authorization denied.");
        throw new Error(`OAuth error: ${tokenData.error}`);
      }
      throw new Error("Login timed out.");
    }
  };
}

// src/index.ts
var PASS_THRESHOLD = 70;
function printUsage() {
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

  ${c.bold("Auth:")} ${c.dim("Optional \u2014 run")} ${c.neon("prs-md login")} ${c.dim("to link results to your prs.md dashboard.")}
  ${c.bold("Note:")} Only public repos are supported.
  Your AI key never leaves your machine \u2014 grading happens locally.
`);
}
function parseArgs(argv) {
  let subcommand = null;
  let prUrl = null;
  let provider = null;
  let apiKey = null;
  let help = false;
  const subcommands = /* @__PURE__ */ new Set(["login", "logout", "whoami"]);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      help = true;
    } else if (arg === "--provider" || arg === "-p") {
      provider = argv[++i];
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
async function promptChoice(rl, question, choices) {
  while (true) {
    const answer = await rl.question(question);
    const trimmed = answer.trim().toLowerCase();
    if (choices.includes(trimmed)) return trimmed;
    console.log(`  ${c.red("Invalid choice.")} Options: ${choices.join(", ")}`);
  }
}
async function handleLogin() {
  console.log("");
  console.log(`  ${logoFull()}  ${c.dim("\u2014 Login with GitHub")}`);
  console.log("");
  const existing = loadAuth();
  if (existing) {
    console.log(`  ${c.neon("\u2713")} Already logged in as ${c.bold(`@${existing.githubUsername}`)}`);
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
  console.log(`  ${c.neon("\u2713")} Logged in as ${c.bold(`@${auth.githubUsername}`)}`);
  console.log(`  ${c.dim("Your test results will now appear on your prs.md dashboard.")}`);
  console.log("");
}
function handleLogout() {
  console.log("");
  const removed = clearAuth();
  if (removed) {
    console.log(`  ${c.neon("\u2713")} Logged out. Stored credentials removed.`);
  } else {
    console.log(`  ${c.dim("Not logged in \u2014 nothing to do.")}`);
  }
  console.log("");
}
function handleWhoami() {
  console.log("");
  const auth = loadAuth();
  if (auth) {
    console.log(`  ${c.neon("\u2713")} Logged in as ${c.bold(`@${auth.githubUsername}`)}`);
    console.log(`  ${c.dim(`Since ${new Date(auth.createdAt).toLocaleDateString()}`)}`);
  } else {
    console.log(`  ${c.dim("Not logged in.")}`);
    console.log(`  ${c.dim("Run")} ${c.cyan("prs-md login")} ${c.dim("to link results to your prs.md dashboard.")}`);
  }
  console.log("");
}
async function main() {
  const args = parseArgs(process.argv.slice(2));
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
  if (args.help || !args.prUrl && process.argv.length <= 2) {
    printUsage();
    process.exit(0);
  }
  const storedAuth = loadAuth();
  console.log("");
  console.log(`  ${logoFull()}  ${c.dim("\u2014 Turing Test for Pull Requests")}`);
  if (storedAuth) {
    console.log(`  ${c.dim("Authenticated as")} ${c.neon(`@${storedAuth.githubUsername}`)} ${c.dim("\u2014 results linked to dashboard")}`);
  }
  console.log("");
  const prUrl = args.prUrl;
  if (!prUrl) {
    console.error(`  ${c.red("\u2717")} Please provide a GitHub PR URL`);
    process.exit(1);
  }
  const parsed = parsePrUrl(prUrl);
  if (!parsed) {
    console.error(`  ${c.red("\u2717")} Invalid GitHub PR URL: ${prUrl}`);
    process.exit(1);
  }
  let provider = args.provider ?? process.env.PRS_PROVIDER ?? null;
  let apiKey = args.apiKey ?? process.env.PRS_API_KEY ?? null;
  if (!provider && apiKey) {
    if (apiKey.startsWith("sk-ant-")) provider = "anthropic";
    else if (apiKey.startsWith("sk-")) provider = "openai";
    else if (apiKey.startsWith("AI")) provider = "gemini";
  }
  if ((!provider || !apiKey) && storedAuth?.githubToken) {
    try {
      const keysRes = await fetch("https://prs.md/api/cli/keys", {
        headers: { Authorization: `Bearer ${storedAuth.githubToken}` }
      });
      if (keysRes.ok) {
        const keysData = await keysRes.json();
        if (keysData.keys.length > 0) {
          const match = provider ? keysData.keys.find((k) => k.provider === provider) : keysData.keys[0];
          if (match) {
            provider = match.provider;
            apiKey = match.apiKey;
            console.log(`  ${c.neon("\u2713")} Using saved ${c.bold(provider)} key from prs.md`);
          }
        }
      }
    } catch {
    }
  }
  if (!provider || !apiKey) {
    const rl = readline2.createInterface({ input: stdin2, output: stdout2 });
    if (!provider) {
      console.log(`  ${c.bold("Select AI provider:")}`);
      console.log(`    ${c.neon("1")} OpenAI    ${c.dim("(gpt-4o-mini)")}`);
      console.log(`    ${c.neon("2")} Anthropic ${c.dim("(claude-sonnet)")}`);
      console.log(`    ${c.neon("3")} Gemini    ${c.dim("(gemini-2.0-flash)")}`);
      console.log("");
      const choice = await promptChoice(rl, `  ${c.dim("\u2192")} `, ["1", "2", "3"]);
      provider = ["openai", "anthropic", "gemini"][parseInt(choice) - 1];
    }
    if (!apiKey) {
      apiKey = await rl.question(`  ${c.dim("API key:")} `);
      apiKey = apiKey.trim();
    }
    rl.close();
  }
  if (!provider || !apiKey) {
    console.error(`  ${c.red("\u2717")} AI provider and API key are required`);
    process.exit(1);
  }
  console.log(`  ${c.neon("\u2713")} Provider: ${c.bold(provider)}`);
  console.log("");
  const fetchSpin = spinner(`Fetching ${parsed.owner}/${parsed.repo}#${parsed.pull}...`);
  let pr;
  try {
    pr = await fetchPr(parsed.owner, parsed.repo, parsed.pull);
    fetchSpin.stop(`${c.bold(pr.title)} ${c.dim(`(${pr.repoFullName}#${parsed.pull})`)}`);
  } catch (err) {
    fetchSpin.stop(c.red("Failed to fetch PR"));
    console.error(`  ${c.red(err.message)}`);
    process.exit(1);
  }
  const genSpin = spinner("Generating questions...");
  let questions;
  try {
    questions = await generateQuestions(provider, apiKey, pr.diff);
    genSpin.stop(`${questions.length} questions generated`);
  } catch (err) {
    genSpin.stop(c.red("Failed to generate questions"));
    console.error(`  ${c.red(err.message)}`);
    process.exit(1);
  }
  console.log("");
  console.log(`  ${c.bold(c.yellow("\u23F1  Ready?"))} 3 questions, 3 minutes. Be specific about the diff.`);
  console.log("");
  {
    const rl = readline2.createInterface({ input: stdin2, output: stdout2 });
    await rl.question(`  ${c.dim("Press Enter to start...")} `);
    rl.close();
  }
  const { answers, timeSpentSeconds } = await runQuiz(questions);
  console.log("");
  const gradeSpin = spinner("Grading...");
  let gradeResult;
  try {
    gradeResult = await gradeAnswers(provider, apiKey, questions, answers);
    gradeSpin.stop("Grading complete");
  } catch (err) {
    gradeSpin.stop(c.red("Failed to grade answers"));
    console.error(`  ${c.red(err.message)}`);
    process.exit(1);
  }
  const totalScore = Math.round(
    gradeResult.scores.reduce((sum, s) => sum + s, 0) / gradeResult.scores.length
  );
  const passed = totalScore >= PASS_THRESHOLD;
  const username = storedAuth?.githubUsername ?? null;
  console.log(
    certificate({
      username,
      prRepo: pr.repoFullName,
      prTitle: pr.title,
      totalScore,
      scores: gradeResult.scores,
      feedback: gradeResult.feedback,
      passed,
      timeSpent: timeSpentSeconds
    })
  );
  if (!passed) {
    console.log(`  ${c.red("Review the PR diff and try again to prove understanding.")}`);
    if (!storedAuth) {
      console.log(`  ${c.dim("Tip: run")} ${c.cyan("prs-md login")} ${c.dim("to link results to your dashboard.")}`);
    }
    console.log("");
    process.exit(1);
  }
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
      gradingFeedback: gradeResult.feedback
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
    console.log(`  ${c.dim("Your results are shown above. The prs.md server may be down \u2014 try again later to get a shareable badge.")}`);
  }
  console.log("");
}
main().catch((err) => {
  console.error(`
  ${c.red("\u2717")} ${err.message}
`);
  process.exit(1);
});
