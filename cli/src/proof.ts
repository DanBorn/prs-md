/** Register proof on prs.md server */

import type { ChallengeQuestion } from "./llm.js";

const API_BASE = process.env.PRS_API_URL ?? "https://www.prs.md";

export interface ProofPayload {
  githubUsername: string | null;
  githubToken?: string;
  prUrl: string;
  prTitle: string;
  prRepo: string;
  questions: ChallengeQuestion[];
  answers: string[];
  scores: number[];
  totalScore: number;
  passed: boolean;
  timeSpentSeconds: number;
  gradingFeedback: string[];
  challengeId?: string;
}

export interface ProofResponse {
  proofId: string;
  proofUrl: string;
  challengeId?: string;
  challengeUrl?: string;
  dashboardUrl?: string | null;
}

/** Post proof to prs.md server for permanent badge hosting */
export async function registerProof(payload: ProofPayload): Promise<ProofResponse> {
  const res = await fetch(`${API_BASE}/api/cli/proof`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to register proof: ${res.status} ${body}`);
  }

  return (await res.json()) as ProofResponse;
}
