import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Cookie Policy for PRs.md — what cookies we use and why.",
  openGraph: {
    title: "Cookie Policy — PRs.md",
    description: "Cookie Policy for PRs.md — what cookies we use and why.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Cookie Policy — PRs.md",
    description: "Cookie Policy for PRs.md — what cookies we use and why.",
  },
};

const EFFECTIVE_DATE = "16 April 2026";
const CONTACT_EMAIL = "legal@prs.md";

export default function CookiePolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-16">
      {/* Header */}
      <div className="mb-8 sm:mb-12">
        <p
          className="font-mono text-[10px] font-bold uppercase tracking-widest mb-4"
          style={{ color: "var(--color-neon)" }}
        >
          Cookies
        </p>
        <h1
          className="text-3xl font-extrabold tracking-tight mb-3"
          style={{ letterSpacing: "-0.03em" }}
        >
          Cookie Policy
        </h1>
        <p className="font-mono text-xs" style={{ color: "var(--color-text-dim)" }}>
          Effective {EFFECTIVE_DATE}
        </p>
      </div>

      <div className="docs-prose">
        <p>
          This Cookie Policy explains what cookies PRs.md (the &ldquo;Service&rdquo;) uses,
          why we use them, and how you can control them.
        </p>

        <h2>1. What are cookies?</h2>
        <p>
          Cookies are small text files stored on your device by your browser. They allow
          websites to remember information between page loads and visits. Some cookies are
          essential for the site to function; others help us understand how the site is used.
        </p>

        <h2>2. Essential cookies</h2>
        <p>
          These cookies are required for the Service to work. They cannot be disabled without
          breaking core functionality.
        </p>

        <div
          className="rounded-xl border overflow-hidden mb-5"
          style={{ borderColor: "var(--color-border)" }}
        >
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "var(--color-surface-raised)" }}>
                <th className="text-left px-3 py-2 font-semibold" style={{ color: "var(--color-text-muted)" }}>Cookie</th>
                <th className="text-left px-3 py-2 font-semibold" style={{ color: "var(--color-text-muted)" }}>Purpose</th>
                <th className="text-left px-3 py-2 font-semibold" style={{ color: "var(--color-text-muted)" }}>Duration</th>
              </tr>
            </thead>
            <tbody style={{ color: "var(--color-text-muted)" }}>
              <tr style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                <td className="px-3 py-2"><code>authjs.session-token</code></td>
                <td className="px-3 py-2">Authenticates your session via GitHub OAuth (NextAuth)</td>
                <td className="px-3 py-2">Session / 30 days</td>
              </tr>
              <tr style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                <td className="px-3 py-2"><code>authjs.csrf-token</code></td>
                <td className="px-3 py-2">Protects against cross-site request forgery attacks</td>
                <td className="px-3 py-2">Session</td>
              </tr>
              <tr style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                <td className="px-3 py-2"><code>authjs.callback-url</code></td>
                <td className="px-3 py-2">Remembers where to redirect after sign-in</td>
                <td className="px-3 py-2">Session</td>
              </tr>
              <tr style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                <td className="px-3 py-2"><code>prs-cookie-consent</code></td>
                <td className="px-3 py-2">Stores your cookie preference choice</td>
                <td className="px-3 py-2">1 year</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2>3. Analytics cookies</h2>
        <p>
          These cookies help us understand how visitors use the Service so we can improve it.
          They are <strong>only set if you click &ldquo;Accept all&rdquo;</strong> in the cookie
          consent banner.
        </p>

        <div
          className="rounded-xl border overflow-hidden mb-5"
          style={{ borderColor: "var(--color-border)" }}
        >
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: "var(--color-surface-raised)" }}>
                <th className="text-left px-3 py-2 font-semibold" style={{ color: "var(--color-text-muted)" }}>Cookie</th>
                <th className="text-left px-3 py-2 font-semibold" style={{ color: "var(--color-text-muted)" }}>Provider</th>
                <th className="text-left px-3 py-2 font-semibold" style={{ color: "var(--color-text-muted)" }}>Purpose</th>
                <th className="text-left px-3 py-2 font-semibold" style={{ color: "var(--color-text-muted)" }}>Duration</th>
              </tr>
            </thead>
            <tbody style={{ color: "var(--color-text-muted)" }}>
              <tr style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                <td className="px-3 py-2"><code>_ga</code></td>
                <td className="px-3 py-2">Google Analytics</td>
                <td className="px-3 py-2">Distinguishes unique visitors</td>
                <td className="px-3 py-2">2 years</td>
              </tr>
              <tr style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                <td className="px-3 py-2"><code>_gid</code></td>
                <td className="px-3 py-2">Google Analytics</td>
                <td className="px-3 py-2">Distinguishes unique visitors (24h window)</td>
                <td className="px-3 py-2">24 hours</td>
              </tr>
              <tr style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
                <td className="px-3 py-2"><code>_gat</code></td>
                <td className="px-3 py-2">Google Analytics</td>
                <td className="px-3 py-2">Throttles request rate</td>
                <td className="px-3 py-2">1 minute</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p>
          Vercel Analytics and Speed Insights are also used but operate without cookies — they
          collect anonymised, aggregated performance data only.
        </p>

        <h2>4. How to manage cookies</h2>
        <p>
          When you first visit PRs.md, a banner at the bottom of the page lets you choose
          between <strong>&ldquo;Accept all&rdquo;</strong> (essential + analytics) and{" "}
          <strong>&ldquo;Essential only&rdquo;</strong> (no analytics tracking).
        </p>
        <p>
          You can change your preference at any time by clearing the{" "}
          <code>prs-cookie-consent</code> entry from your browser&apos;s local storage (or
          clearing cookies for this site) — the banner will reappear on your next visit.
        </p>
        <p>
          Most browsers also let you block or delete cookies from their settings. Note that
          blocking essential cookies will prevent sign-in from working.
        </p>

        <h2>5. Third-party cookies</h2>
        <p>
          PRs.md does not embed advertising trackers or social media widgets that set
          third-party cookies. The only external service that may set cookies is Google
          Analytics, and only when you have consented to analytics cookies.
        </p>

        <h2>6. Changes to this policy</h2>
        <p>
          We may update this Cookie Policy to reflect changes in the cookies we use or for
          other operational, legal, or regulatory reasons. The effective date at the top of this
          page indicates when it was last revised.
        </p>

        <h2>7. Contact</h2>
        <p>
          Questions about this Cookie Policy can be directed to{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="link-neon"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
