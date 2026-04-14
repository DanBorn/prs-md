import type { AiProvider, ChallengeQuestion } from "@/db/schema";

const GENERATE_SYSTEM_PROMPT = `You are a senior code reviewer. Given a git diff, generate exactly 3 questions to verify that the PR author truly understands their own code changes.

Rules:
- Questions must be highly specific to the domain logic and side-effects in the diff
- Questions should require understanding of WHY changes were made, not just WHAT changed
- Exactly one question must be a "hallucination trap": a trick question about something that looks plausible but did NOT happen in the diff. The expected answer for the trap should explain that it didn't happen.
- Output valid JSON only, no markdown fences

Output format:
[
  {
    "question": "...",
    "expectedAnswer": "...",
    "isHallucinationTrap": false
  },
  {
    "question": "...",
    "expectedAnswer": "...",
    "isHallucinationTrap": false
  },
  {
    "question": "...",
    "expectedAnswer": "...",
    "isHallucinationTrap": true
  }
]`;

const GRADE_SYSTEM_PROMPT = `You are grading a developer's answers to questions about their own pull request. For each question-answer pair, evaluate semantic accuracy (not exact wording).

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
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  switch (provider) {
    case "openai": {
      const OpenAI = (await import("openai")).default;
      const client = new OpenAI({ apiKey });
      const res = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });
      return res.choices[0]?.message?.content ?? "";
    }

    case "anthropic": {
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({ apiKey });
      const res = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
      const block = res.content[0];
      return block.type === "text" ? block.text : "";
    }

    case "gemini": {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const res = await model.generateContent(
        `${systemPrompt}\n\n${userPrompt}`
      );
      return res.response.text();
    }

    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

function parseJsonFromLlm<T>(raw: string): T {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/```(?:json)?\s*/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

export async function generateQuestions(
  provider: AiProvider,
  apiKey: string,
  diff: string
): Promise<ChallengeQuestion[]> {
  const raw = await callLlm(
    provider,
    apiKey,
    GENERATE_SYSTEM_PROMPT,
    `Here is the git diff:\n\n${diff}`
  );
  return parseJsonFromLlm<ChallengeQuestion[]>(raw);
}

export interface GradeResult {
  scores: number[];
  feedback: string[];
}

export async function gradeAnswers(
  provider: AiProvider,
  apiKey: string,
  questions: ChallengeQuestion[],
  answers: string[]
): Promise<GradeResult> {
  const prompt = questions
    .map(
      (q, i) =>
        `Question ${i + 1}: ${q.question}\nExpected: ${q.expectedAnswer}\nUser answered: ${answers[i] ?? "(no answer)"}\nIs hallucination trap: ${q.isHallucinationTrap}`
    )
    .join("\n\n");

  const raw = await callLlm(provider, apiKey, GRADE_SYSTEM_PROMPT, prompt);
  return parseJsonFromLlm<GradeResult>(raw);
}
