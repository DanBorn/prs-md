import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

type AuthedSession = {
  user: {
    id: string;
    termsAcceptedAt: Date | null;
    githubUsername?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

/**
 * Call at the top of any protected server component.
 * Redirects to "/" if unauthenticated, or "/accept-terms" if terms not yet accepted.
 * Returns a typed session on success.
 */
export async function requireAuth(): Promise<AuthedSession> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const termsAcceptedAt =
    (session.user as { termsAcceptedAt?: Date | null }).termsAcceptedAt ?? null;

  if (!termsAcceptedAt) {
    redirect("/accept-terms");
  }

  return {
    user: {
      id: session.user.id,
      termsAcceptedAt,
      githubUsername: (session.user as { githubUsername?: string }).githubUsername,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
    },
  };
}
