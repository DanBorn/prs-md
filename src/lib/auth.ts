import NextAuth, { type NextAuthResult } from "next-auth";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";
import { encryptToken } from "@/lib/crypto";

/**
 * Wrap an Auth.js adapter to:
 *   1. Encrypt OAuth access_token / refresh_token at rest before storage.
 *   2. Reuse a pre-existing user when their githubUsername matches the
 *      GitHub profile `login`. This avoids creating a duplicate user when
 *      someone used the CLI before ever signing in to the web (the CLI
 *      creates a users row but — on older submissions — may not have an
 *      accounts row for NextAuth to match).
 *
 * Tokens are stored as JSON: { encrypted, iv, authTag }.
 * Use decryptToken() from src/lib/crypto.ts to read them back.
 */
function withEncryptedTokens(adapter: Adapter): Adapter {
  return {
    ...adapter,
    async createUser(user) {
      const login = (user as AdapterUser & { githubUsername?: string })
        .githubUsername;
      if (login) {
        const db = getDb();
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.githubUsername, login))
          .then((rows) => rows[0]);
        if (existing) {
          return existing as AdapterUser;
        }
      }
      // Strip our custom field before delegating — Drizzle will reject columns it doesn't know.
      const { githubUsername: _unused, ...rest } = user as AdapterUser & {
        githubUsername?: string;
      };
      void _unused;
      return adapter.createUser!(rest);
    },
    // Intercept linkAccount to encrypt tokens before the base adapter writes them
    linkAccount(account) {
      return adapter.linkAccount!({
        ...account,
        access_token: account.access_token
          ? encryptToken(account.access_token)
          : account.access_token,
        refresh_token: account.refresh_token
          ? encryptToken(account.refresh_token)
          : account.refresh_token,
      });
    },
  };
}

let _instance: NextAuthResult | null = null;

function getInstance(): NextAuthResult {
  if (!_instance) {
    const db = getDb();
    _instance = NextAuth({
      adapter: withEncryptedTokens(
        DrizzleAdapter(db, {
          usersTable: users,
          accountsTable: accounts,
          sessionsTable: sessions,
          verificationTokensTable: verificationTokens,
        })
      ),
      providers: [
        GitHub({
          clientId: process.env.AUTH_GITHUB_ID,
          clientSecret: process.env.AUTH_GITHUB_SECRET,
          authorization: { params: { scope: "read:user user:email" } },
          // Expose the GitHub login so our adapter's createUser wrapper can
          // reuse an existing CLI-created user with the same githubUsername.
          profile(profile) {
            return {
              id: profile.id.toString(),
              name: profile.name ?? profile.login,
              email: profile.email,
              image: profile.avatar_url,
              githubUsername: profile.login,
            } as AdapterUser & { githubUsername: string };
          },
        }),
      ],
      callbacks: {
        async session({ session, user }) {
          if (session.user) {
            session.user.id = user.id;
            const u = user as { githubUsername?: string; termsAcceptedAt?: Date | null };
            (session.user as { githubUsername?: string }).githubUsername =
              u.githubUsername ?? undefined;
            (session.user as { termsAcceptedAt?: Date | null }).termsAcceptedAt =
              u.termsAcceptedAt ?? null;
          }
          return session;
        },
        async signIn({ user, profile }) {
          if (profile?.login && user?.id) {
            const db = getDb();
            const { eq } = await import("drizzle-orm");
            await db
              .update(users)
              .set({ githubUsername: profile.login as string })
              .where(eq(users.id, user.id));
          }
          return true;
        },
      },
      pages: {
        signIn: "/",
      },
    });
  }
  return _instance;
}

export const handlers = {
  GET: ((...args: unknown[]) =>
    getInstance().handlers.GET(
      ...(args as Parameters<NextAuthResult["handlers"]["GET"]>)
    )) as NextAuthResult["handlers"]["GET"],
  POST: ((...args: unknown[]) =>
    getInstance().handlers.POST(
      ...(args as Parameters<NextAuthResult["handlers"]["POST"]>)
    )) as NextAuthResult["handlers"]["POST"],
};

export const auth: NextAuthResult["auth"] = ((...args: unknown[]) =>
  (getInstance().auth as (...a: unknown[]) => unknown)(...args)) as NextAuthResult["auth"];

export const signIn: NextAuthResult["signIn"] = ((...args: unknown[]) =>
  (getInstance().signIn as (...a: unknown[]) => unknown)(...args)) as NextAuthResult["signIn"];

export const signOut: NextAuthResult["signOut"] = ((...args: unknown[]) =>
  (getInstance().signOut as (...a: unknown[]) => unknown)(...args)) as NextAuthResult["signOut"];
