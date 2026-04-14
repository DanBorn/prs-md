import { readFileSync } from "node:fs";
import { fetchPrDiff, setCommitStatus, postComment } from "./github.mjs";
import { generateQuestions, gradeAnswers } from "./llm.mjs";

const PRS_API_KEY = process.env.PRS_API_KEY;
const PRS_PROVIDER = process.env.PRS_PROVIDER;
const PRS_CALLBACK_TOKEN = process.env.PRS_CALLBACK_TOKEN;
const PRS_SERVER_URL = (process.env.PRS_SERVER_URL ?? "https://prs.md").replace(
  /\/$/,
  ""
);
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PASS_THRESHOLD = 70;

// Read the GitHub event payload
const event = JSON.parse(
  readFileSync(process.env.GITHUB_EVENT_PATH, "utf8")
);
const eventName = process.env.GITHUB_EVENT_NAME;
const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");

function log(msg) {
  console.log(`[prs.md] ${msg}`);
}

function fail(msg) {
  console.error(`::error::${msg}`);
  process.exit(1);
}

// ─── Mode: pull_request → generate questions, create challenge ───

async function handlePullRequest() {
  const pr = event.pull_request;
  if (!pr) fail("No pull_request in event payload");

  const prNumber = pr.number;
  const prUrl = pr.html_url;
  const sha = pr.head.sha;

  log(`PR #${prNumber}: ${pr.title}`);
  log(`Fetching diff...`);

  const { diff, title } = await fetchPrDiff(owner, repo, prNumber, GITHUB_TOKEN);

  if (!diff.trim()) {
    log("PR diff is empty, skipping.");
    return;
  }

  log(`Generating questions via ${PRS_PROVIDER}...`);
  const questions = await generateQuestions(PRS_PROVIDER, PRS_API_KEY, diff);
  log(`Generated ${questions.length} questions.`);

  // Set pending status
  await setCommitStatus(
    owner,
    repo,
    sha,
    {
      state: "pending",
      description: "Waiting for PR author to take the quiz",
    },
    GITHUB_TOKEN
  );

  // Create challenge on prs.md
  log(`Creating challenge on ${PRS_SERVER_URL}...`);
  const res = await fetch(`${PRS_SERVER_URL}/api/action/challenge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prUrl,
      prTitle: title,
      prRepo: `${owner}/${repo}`,
      sha,
      prNumber,
      questions,
      callbackToken: PRS_CALLBACK_TOKEN,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    fail(`Failed to create challenge: ${res.status} ${text}`);
  }

  const { id, quizUrl } = await res.json();
  log(`Challenge created: ${id}`);

  // Post PR comment
  const comment = [
    `## <PRs.md/> Turing Test`,
    "",
    `A quiz has been generated to verify you understand this PR.`,
    "",
    `**[Take the quiz →](${quizUrl})**`,
    "",
    `| | |`,
    `|---|---|`,
    `| Questions | 3 (including 1 hallucination trap) |`,
    `| Time limit | 3 minutes |`,
    `| Pass threshold | 70% |`,
    "",
    `Sign in with GitHub and prove you wrote this code.`,
  ].join("\n");

  await postComment(owner, repo, prNumber, comment, GITHUB_TOKEN);
  log("Posted quiz comment on PR.");
}

// ─── Mode: repository_dispatch → grade answers, update status ───

async function handleDispatch() {
  const payload = event.client_payload;
  if (!payload) fail("No client_payload in repository_dispatch event");

  const {
    challengeId,
    sha,
    prNumber,
    answers,
    questions,
    timeSpentSeconds,
    quizUserGithub,
  } = payload;

  log(`Grading challenge ${challengeId} for @${quizUserGithub ?? "unknown"}...`);

  let gradeResult;
  try {
    gradeResult = await gradeAnswers(PRS_PROVIDER, PRS_API_KEY, questions, answers);
  } catch (err) {
    // Set error status and bail
    await setCommitStatus(
      owner,
      repo,
      sha,
      { state: "error", description: "Grading failed — LLM error" },
      GITHUB_TOKEN
    );
    fail(`Grading failed: ${err.message}`);
  }

  const totalScore = Math.round(
    gradeResult.scores.reduce((sum, s) => sum + s, 0) /
      gradeResult.scores.length
  );
  const passed = totalScore >= PASS_THRESHOLD;

  log(`Score: ${totalScore}% — ${passed ? "PASSED" : "FAILED"}`);

  // Post results to prs.md
  const res = await fetch(`${PRS_SERVER_URL}/api/action/result`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      challengeId,
      scores: gradeResult.scores,
      feedback: gradeResult.feedback,
      totalScore,
      passed,
    }),
  });

  let proofUrl = null;
  if (res.ok) {
    const data = await res.json();
    proofUrl = data.proofUrl;
  } else {
    console.error(
      `Warning: failed to post results to prs.md: ${res.status}`
    );
  }

  // Update commit status
  await setCommitStatus(
    owner,
    repo,
    sha,
    {
      state: passed ? "success" : "failure",
      description: passed
        ? `Passed (${totalScore}%) — code comprehension verified`
        : `Failed (${totalScore}%) — below 70% threshold`,
      targetUrl: proofUrl,
    },
    GITHUB_TOKEN
  );

  // Post result comment on PR
  const user = quizUserGithub ? `@${quizUserGithub}` : "The quiz taker";
  const emoji = passed ? "white_check_mark" : "x";
  const badge = passed && proofUrl
    ? `\n\n[![PRs.md verified](https://img.shields.io/badge/PRs.md-verified-brightgreen)](${proofUrl})`
    : "";

  const comment = [
    `## <PRs.md/> Result`,
    "",
    `:${emoji}: ${user} scored **${totalScore}%** — ${passed ? "**passed**" : "**did not pass**"}`,
    "",
    ...gradeResult.scores.map(
      (score, i) =>
        `- Q${i + 1}: ${score}% — ${gradeResult.feedback[i]}`
    ),
    badge,
  ].join("\n");

  await postComment(owner, repo, prNumber, comment, GITHUB_TOKEN);
  log("Posted result comment on PR.");
}

// ─── Dispatch ───

try {
  if (eventName === "pull_request") {
    await handlePullRequest();
  } else if (eventName === "repository_dispatch") {
    await handleDispatch();
  } else {
    log(`Ignoring event: ${eventName}`);
  }
} catch (err) {
  fail(err.message);
}
