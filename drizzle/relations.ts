import { relations } from "drizzle-orm/relations";
import { users, challenges, apiKeys, attempts, sessions, mcpTokens, accounts } from "./schema";

export const challengesRelations = relations(challenges, ({one, many}) => ({
	user: one(users, {
		fields: [challenges.creatorId],
		references: [users.id]
	}),
	attempts: many(attempts),
}));

export const usersRelations = relations(users, ({many}) => ({
	challenges: many(challenges),
	apiKeys: many(apiKeys),
	attempts: many(attempts),
	sessions: many(sessions),
	mcpTokens: many(mcpTokens),
	accounts: many(accounts),
}));

export const apiKeysRelations = relations(apiKeys, ({one}) => ({
	user: one(users, {
		fields: [apiKeys.userId],
		references: [users.id]
	}),
}));

export const attemptsRelations = relations(attempts, ({one}) => ({
	challenge: one(challenges, {
		fields: [attempts.challengeId],
		references: [challenges.id]
	}),
	user: one(users, {
		fields: [attempts.userId],
		references: [users.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const mcpTokensRelations = relations(mcpTokens, ({one}) => ({
	user: one(users, {
		fields: [mcpTokens.userId],
		references: [users.id]
	}),
}));

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));