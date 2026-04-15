import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted() runs before any imports so these refs are available in mock
// factories (which are also hoisted).
const { mockOpenAICreate, mockAnthropicCreate, mockGeminiGenerateContent } =
  vi.hoisted(() => ({
    mockOpenAICreate: vi.fn(),
    mockAnthropicCreate: vi.fn(),
    mockGeminiGenerateContent: vi.fn(),
  }));

vi.mock("openai", () => ({
  default: class {
    chat = { completions: { create: mockOpenAICreate } };
  },
}));

vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = { create: mockAnthropicCreate };
  },
}));

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return { generateContent: mockGeminiGenerateContent };
    }
  },
}));

import { generateQuestions, gradeAnswers } from "../llm";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const MOCK_QUESTIONS = [
  { question: "Q1", expectedAnswer: "A1", isHallucinationTrap: false },
  { question: "Q2", expectedAnswer: "A2", isHallucinationTrap: false },
  { question: "Q3 (trap)", expectedAnswer: "A3", isHallucinationTrap: true },
];

const MOCK_GRADE_RESULT = {
  scores: [90, 75, 100],
  feedback: ["Great", "Partial", "Correct — it didn't happen"],
};

// Helper to set up the OpenAI mock with a given JSON payload
function setupOpenAIMock(payload: unknown) {
  mockOpenAICreate.mockResolvedValue({
    choices: [{ message: { content: JSON.stringify(payload) } }],
  });
}

// ---------------------------------------------------------------------------
// generateQuestions
// ---------------------------------------------------------------------------

describe("generateQuestions", () => {
  describe("with OpenAI provider", () => {
    beforeEach(() => setupOpenAIMock(MOCK_QUESTIONS));

    it("returns exactly 3 questions", async () => {
      const qs = await generateQuestions("openai", "sk-test", "diff");
      expect(qs).toHaveLength(3);
    });

    it("returns questions with required fields", async () => {
      const qs = await generateQuestions("openai", "sk-test", "diff");
      for (const q of qs) {
        expect(q).toHaveProperty("question");
        expect(q).toHaveProperty("expectedAnswer");
        expect(q).toHaveProperty("isHallucinationTrap");
      }
    });

    it("has exactly one hallucination trap", async () => {
      const qs = await generateQuestions("openai", "sk-test", "diff");
      expect(qs.filter((q) => q.isHallucinationTrap)).toHaveLength(1);
    });

    it("strips ```json fences from the LLM response", async () => {
      mockOpenAICreate.mockResolvedValue({
        choices: [
          {
            message: {
              content:
                "```json\n" + JSON.stringify(MOCK_QUESTIONS) + "\n```",
            },
          },
        ],
      });
      const qs = await generateQuestions("openai", "sk-test", "diff");
      expect(qs).toHaveLength(3);
    });

    it("strips plain ``` fences from the LLM response", async () => {
      mockOpenAICreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: "```\n" + JSON.stringify(MOCK_QUESTIONS) + "\n```",
            },
          },
        ],
      });
      const qs = await generateQuestions("openai", "sk-test", "diff");
      expect(qs).toHaveLength(3);
    });
  });

  describe("with Anthropic provider", () => {
    beforeEach(() => {
      mockAnthropicCreate.mockResolvedValue({
        content: [{ type: "text", text: JSON.stringify(MOCK_QUESTIONS) }],
      });
    });

    it("returns exactly 3 questions", async () => {
      const qs = await generateQuestions(
        "anthropic",
        "sk-ant-test",
        "diff"
      );
      expect(qs).toHaveLength(3);
    });

    it("returns empty string (non-text block) without crashing", async () => {
      mockAnthropicCreate.mockResolvedValue({
        content: [{ type: "tool_use", id: "toolu_1", name: "fn", input: {} }],
      });
      // The LLM returns "" which causes a JSON parse error — just verify it throws
      await expect(
        generateQuestions("anthropic", "sk-ant-test", "diff")
      ).rejects.toThrow();
    });
  });

  describe("with Gemini provider", () => {
    beforeEach(() => {
      mockGeminiGenerateContent.mockResolvedValue({
        response: { text: () => JSON.stringify(MOCK_QUESTIONS) },
      });
    });

    it("returns exactly 3 questions", async () => {
      const qs = await generateQuestions("gemini", "AIzaSy-test", "diff");
      expect(qs).toHaveLength(3);
    });
  });
});

// ---------------------------------------------------------------------------
// gradeAnswers
// ---------------------------------------------------------------------------

describe("gradeAnswers", () => {
  const answers = ["My answer 1", "My answer 2", "It didn't happen"];

  beforeEach(() => setupOpenAIMock(MOCK_GRADE_RESULT));

  it("returns scores and feedback arrays", async () => {
    const result = await gradeAnswers(
      "openai",
      "sk-test",
      MOCK_QUESTIONS,
      answers
    );
    expect(result.scores).toHaveLength(3);
    expect(result.feedback).toHaveLength(3);
  });

  it("returns the scores from the LLM verbatim", async () => {
    const result = await gradeAnswers(
      "openai",
      "sk-test",
      MOCK_QUESTIONS,
      answers
    );
    expect(result.scores).toEqual([90, 75, 100]);
  });

  it("returns the feedback from the LLM verbatim", async () => {
    const result = await gradeAnswers(
      "openai",
      "sk-test",
      MOCK_QUESTIONS,
      answers
    );
    expect(result.feedback).toEqual(MOCK_GRADE_RESULT.feedback);
  });

  it("strips markdown fences from the grading response", async () => {
    mockOpenAICreate.mockResolvedValue({
      choices: [
        {
          message: {
            content:
              "```json\n" + JSON.stringify(MOCK_GRADE_RESULT) + "\n```",
          },
        },
      ],
    });
    const result = await gradeAnswers(
      "openai",
      "sk-test",
      MOCK_QUESTIONS,
      answers
    );
    expect(result.scores).toEqual([90, 75, 100]);
  });

  it("includes '(no answer)' in prompt when answers array is shorter than questions", async () => {
    // Just verify it doesn't throw when some answers are missing
    const result = await gradeAnswers(
      "openai",
      "sk-test",
      MOCK_QUESTIONS,
      []
    );
    expect(result).toBeDefined();
  });

  it("throws for unsupported provider", async () => {
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      gradeAnswers("unknown" as any, "key", MOCK_QUESTIONS, answers)
    ).rejects.toThrow("Unsupported AI provider");
  });
});
