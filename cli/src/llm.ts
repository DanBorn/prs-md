/** LLM calls via raw fetch — zero SDK dependencies */

export type AiProvider = "openai" | "anthropic" | "gemini";

export interface ChallengeQuestion {
  question: string;
  expectedAnswer: string;
  isHallucinationTrap: boolean;
}

export interface GradeResult {
  scores: number[];
  feedback: string[];
}

const GENERATE_SYSTEM = `You are a senior code reviewer. Given a git diff, generate exactly 3 questions to verify that the PR author truly understands their own code changes.

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

const GRADE_SYSTEM = `You are grading a developer's answers to questions about their own pull request. For each question-answer pair, evaluate semantic accuracy (not exact wording).

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

async function callLlm(
  provider: AiProvider,
  apiKey: string,
  system: string,
  user: string,
): Promise<string> {
  switch (provider) {
    case "openai": {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`OpenAI API error ${res.status}: ${body}`);
      }
      const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
      return data.choices[0]?.message?.content ?? "";
    }

    case "anthropic": {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system,
          messages: [{ role: "user", content: user }],
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Anthropic API error ${res.status}: ${body}`);
      }
      const data = (await res.json()) as { content: Array<{ type: string; text: string }> };
      const block = data.content[0];
      return block?.type === "text" ? block.text : "";
    }

    case "gemini": {
      // Use header instead of query param — API keys in URLs appear in server/proxy logs
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${system}\n\n${user}` }] }],
          }),
        },
      );
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Gemini API error ${res.status}: ${body}`);
      }
      const data = (await res.json()) as {
        candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
      };
      return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    }

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

export async function generateQuestions(
  provider: AiProvider,
  apiKey: string,
  diff: string,
): Promise<ChallengeQuestion[]> {
  const raw = await callLlm(provider, apiKey, GENERATE_SYSTEM, `Here is the git diff:\n\n${diff}`);
  return parseJson<ChallengeQuestion[]>(raw);
}

export async function gradeAnswers(
  provider: AiProvider,
  apiKey: string,
  questions: ChallengeQuestion[],
  answers: string[],
): Promise<GradeResult> {
  const prompt = questions
    .map(
      (q, i) =>
        `Question ${i + 1}: ${q.question}\nExpected: ${q.expectedAnswer}\nUser answered: ${answers[i] ?? "(no answer)"}\nIs hallucination trap: ${q.isHallucinationTrap}`,
    )
    .join("\n\n");

  const raw = await callLlm(provider, apiKey, GRADE_SYSTEM, prompt);
  return parseJson<GradeResult>(raw);
}
