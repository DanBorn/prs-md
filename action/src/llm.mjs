// Direct HTTP LLM calls — no SDK dependencies

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

function parseJson(raw) {
  const cleaned = raw
    .replace(/```(?:json)?\s*/g, "")
    .replace(/```/g, "")
    .trim();
  return JSON.parse(cleaned);
}

async function callOpenAI(apiKey, systemPrompt, userPrompt) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.choices[0]?.message?.content ?? "";
}

async function callAnthropic(apiKey, systemPrompt, userPrompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API error: ${res.status} ${text}`);
  }
  const data = await res.json();
  const block = data.content?.[0];
  return block?.type === "text" ? block.text : "";
}

async function callGemini(apiKey, systemPrompt, userPrompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
        ],
      }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini API error: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function callLlm(provider, apiKey, systemPrompt, userPrompt) {
  switch (provider) {
    case "openai":
      return callOpenAI(apiKey, systemPrompt, userPrompt);
    case "anthropic":
      return callAnthropic(apiKey, systemPrompt, userPrompt);
    case "gemini":
      return callGemini(apiKey, systemPrompt, userPrompt);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

export async function generateQuestions(provider, apiKey, diff) {
  const raw = await callLlm(
    provider,
    apiKey,
    GENERATE_SYSTEM_PROMPT,
    `Here is the git diff:\n\n${diff}`
  );
  const questions = parseJson(raw);
  if (!Array.isArray(questions) || questions.length !== 3) {
    throw new Error("LLM returned invalid question format");
  }
  return questions;
}

export async function gradeAnswers(provider, apiKey, questions, answers) {
  const prompt = questions
    .map(
      (q, i) =>
        `Question ${i + 1}: ${q.question}\nExpected: ${q.expectedAnswer}\nUser answered: ${answers[i] ?? "(no answer)"}\nIs hallucination trap: ${q.isHallucinationTrap}`
    )
    .join("\n\n");

  const raw = await callLlm(provider, apiKey, GRADE_SYSTEM_PROMPT, prompt);
  return parseJson(raw);
}
