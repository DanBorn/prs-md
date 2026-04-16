import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ─── NextAuth tables ────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").unique(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
    githubUsername: text("github_username"),
    termsAcceptedAt: timestamp("terms_accepted_at", { mode: "date" }),
  },
  (t) => [index("users_github_username_idx").on(t.githubUsername)]
);

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ─── App-specific tables ────────────────────────────────────

export type AiProvider = "openai" | "anthropic" | "gemini";

export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").$type<AiProvider>().notNull(),
    encryptedKey: text("encrypted_key").notNull(),
    iv: text("iv").notNull(),
    authTag: text("auth_tag").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("api_keys_user_provider_idx").on(t.userId, t.provider)]
);

// ─── MCP tokens ────────────────────────────────────────────

export const mcpTokens = pgTable(
  "mcp_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** SHA-256 hash of the bearer token (raw token shown once on creation) */
    tokenHash: text("token_hash").notNull().unique(),
    name: text("name").notNull().default("default"),
    lastUsedAt: timestamp("last_used_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [index("mcp_tokens_user_id_idx").on(t.userId)]
);

export type ChallengeStatus = "pending" | "active" | "completed" | "expired";
export type ChallengeSource = "web" | "action" | "mcp" | "cli";

export interface ChallengeQuestion {
  question: string;
  expectedAnswer: string;
  isHallucinationTrap: boolean;
}

export const challenges = pgTable(
  "challenges",
  {
    id: text("id").primaryKey(), // nanoid
    /** Null for action-created challenges (no user account involved) */
    creatorId: text("creator_id")
      .references(() => users.id, { onDelete: "cascade" }),
    prUrl: text("pr_url").notNull(),
    prTitle: text("pr_title"),
    prRepo: text("pr_repo"),
    questions: jsonb("questions").$type<ChallengeQuestion[]>().notNull(),
    status: text("status").$type<ChallengeStatus>().notNull().default("active"),
    timeLimitSeconds: integer("time_limit_seconds").notNull().default(180),
    /** How this challenge was created */
    source: text("source").$type<ChallengeSource>().notNull().default("web"),
    /** GitHub repo for status callback (action-created only, e.g. "owner/repo") */
    callbackRepo: text("callback_repo"),
    /** Commit SHA to set status on (action-created only) */
    callbackSha: text("callback_sha"),
    /** PR number for comment posting (action-created only) */
    callbackPrNumber: integer("callback_pr_number"),
    /** Encrypted GitHub PAT for repository_dispatch callback */
    callbackTokenEncrypted: text("callback_token_encrypted"),
    callbackTokenIv: text("callback_token_iv"),
    callbackTokenAuthTag: text("callback_token_auth_tag"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [index("challenges_creator_id_idx").on(t.creatorId)]
);

export const attempts = pgTable(
  "attempts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    challengeId: text("challenge_id")
      .notNull()
      .references(() => challenges.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    answers: jsonb("answers").$type<string[]>().notNull(),
    scores: jsonb("scores").$type<number[]>(),
    totalScore: integer("total_score"),
    passed: boolean("passed"),
    attemptNumber: integer("attempt_number").notNull().default(1),
    timeSpentSeconds: integer("time_spent_seconds"),
    gradingFeedback: jsonb("grading_feedback").$type<string[]>(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("attempts_challenge_user_idx").on(t.challengeId, t.userId),
    index("attempts_user_id_idx").on(t.userId),
  ]
);
