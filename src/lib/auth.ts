import NextAuth, { type NextAuthResult } from "next-auth";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "@/db";
import { accounts, sessions, users, verificationTokens } from "@/db/schema";

let _instance: NextAuthResult | null = null;

function getInstance(): NextAuthResult {
  if (!_instance) {
    const db = getDb();
    _instance = NextAuth({
      adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
      }),
      providers: [
        GitHub({
          clientId: process.env.AUTH_GITHUB_ID,
          clientSecret: process.env.AUTH_GITHUB_SECRET,
          authorization: { params: { scope: "read:user user:email" } },
        }),
      ],
      callbacks: {
        async session({ session, user }) {
          if (session.user) {
            session.user.id = user.id;
            (session.user as { githubUsername?: string }).githubUsername =
              (user as { githubUsername?: string }).githubUsername ?? undefined;
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
  (getInstance().auth as Function)(...args)) as NextAuthResult["auth"];

export const signIn: NextAuthResult["signIn"] = ((...args: unknown[]) =>
  (getInstance().signIn as Function)(...args)) as NextAuthResult["signIn"];

export const signOut: NextAuthResult["signOut"] = ((...args: unknown[]) =>
  (getInstance().signOut as Function)(...args)) as NextAuthResult["signOut"];
