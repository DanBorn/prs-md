/** Interactive terminal quiz with timer */

import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { c, timerBar } from "./ui.js";
import type { ChallengeQuestion } from "./llm.js";

const TIME_LIMIT = 180; // 3 minutes

export interface QuizResult {
  answers: string[];
  timeSpentSeconds: number;
}

export async function runQuiz(
  questions: ChallengeQuestion[],
): Promise<QuizResult> {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const answers: string[] = [];
  const startTime = Date.now();
  let expired = false;

  // Timer display
  let remaining = TIME_LIMIT;
  const timer = setInterval(() => {
    remaining = Math.max(0, TIME_LIMIT - Math.floor((Date.now() - startTime) / 1000));
    if (remaining <= 0 && !expired) {
      expired = true;
      clearInterval(timer);
      console.log(`\n\n  ${c.red(c.bold("⏱  Time's up!"))}`);
      rl.close();
    }
  }, 1000);

  console.log("");
  console.log(timerBar(remaining, TIME_LIMIT));
  console.log("");
  console.log(`  ${c.yellow("⚠")}  ${c.dim("3 questions · 3 minutes · be specific about the diff")}`);
  console.log("");

  // Strip expected answers — only show questions
  const strippedQuestions = questions.map((q) => q.question);

  for (let i = 0; i < strippedQuestions.length; i++) {
    if (expired) {
      answers.push("(time expired)");
      continue;
    }

    const remaining = Math.max(0, TIME_LIMIT - Math.floor((Date.now() - startTime) / 1000));
    console.log(timerBar(remaining, TIME_LIMIT));
    console.log("");
    console.log(`  ${c.neon(`Q${i + 1}:`)} ${c.bold(strippedQuestions[i])}`);
    console.log("");

    try {
      const answer = await rl.question(`  ${c.dim("→")} `);
      answers.push(answer.trim() || "(no answer)");
      console.log("");
    } catch {
      // readline closed (timeout)
      answers.push("(time expired)");
    }
  }

  clearInterval(timer);
  rl.close();

  const timeSpent = Math.floor((Date.now() - startTime) / 1000);

  return { answers, timeSpentSeconds: timeSpent };
}
