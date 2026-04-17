import { pgTable, index, foreignKey, text, jsonb, integer, timestamp, uniqueIndex, boolean, unique, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const challenges = pgTable("challenges", {
	id: text().primaryKey().notNull(),
	creatorId: text("creator_id"),
	prUrl: text("pr_url").notNull(),
	prTitle: text("pr_title"),
	prRepo: text("pr_repo"),
	questions: jsonb().notNull(),
	status: text().default('active').notNull(),
	timeLimitSeconds: integer("time_limit_seconds").default(180).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	source: text().default('web').notNull(),
	callbackRepo: text("callback_repo"),
	callbackSha: text("callback_sha"),
	callbackPrNumber: integer("callback_pr_number"),
	callbackTokenEncrypted: text("callback_token_encrypted"),
	callbackTokenIv: text("callback_token_iv"),
	callbackTokenAuthTag: text("callback_token_auth_tag"),
}, (table) => [
	index("challenges_creator_id_idx").using("btree", table.creatorId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.creatorId],
			foreignColumns: [users.id],
			name: "challenges_creator_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const apiKeys = pgTable("api_keys", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	provider: text().notNull(),
	encryptedKey: text("encrypted_key").notNull(),
	iv: text().notNull(),
	authTag: text("auth_tag").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	uniqueIndex("api_keys_user_provider_idx").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.provider.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "api_keys_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const attempts = pgTable("attempts", {
	id: text().primaryKey().notNull(),
	challengeId: text("challenge_id").notNull(),
	userId: text("user_id").notNull(),
	answers: jsonb().notNull(),
	scores: jsonb(),
	totalScore: integer("total_score"),
	passed: boolean(),
	timeSpentSeconds: integer("time_spent_seconds"),
	gradingFeedback: jsonb("grading_feedback"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	attemptNumber: integer("attempt_number").default(1).notNull(),
}, (table) => [
	index("attempts_challenge_user_idx").using("btree", table.challengeId.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("text_ops")),
	index("attempts_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.challengeId],
			foreignColumns: [challenges.id],
			name: "attempts_challenge_id_challenges_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "attempts_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	name: text(),
	email: text(),
	emailVerified: timestamp({ mode: 'string' }),
	image: text(),
	githubUsername: text("github_username"),
	termsAcceptedAt: timestamp("terms_accepted_at", { mode: 'string' }),
}, (table) => [
	index("users_github_username_idx").using("btree", table.githubUsername.asc().nullsLast().op("text_ops")),
	unique("users_email_unique").on(table.email),
]);

export const sessions = pgTable("sessions", {
	sessionToken: text().primaryKey().notNull(),
	userId: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_userId_users_id_fk"
		}).onDelete("cascade"),
]);

export const mcpTokens = pgTable("mcp_tokens", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	tokenHash: text("token_hash").notNull(),
	name: text().default('default').notNull(),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("mcp_tokens_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "mcp_tokens_user_id_users_id_fk"
		}).onDelete("cascade"),
	unique("mcp_tokens_token_hash_unique").on(table.tokenHash),
]);

export const verificationTokens = pgTable("verificationTokens", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verificationTokens_identifier_token_pk"}),
]);

export const accounts = pgTable("accounts", {
	userId: text().notNull(),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text().notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_userId_users_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.provider, table.providerAccountId], name: "accounts_provider_providerAccountId_pk"}),
]);
