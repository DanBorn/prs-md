import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for PRs.md — read before creating an account.",
  openGraph: {
    title: "Terms of Service — PRs.md",
    description: "Terms of Service for PRs.md — read before creating an account.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Terms of Service — PRs.md",
    description: "Terms of Service for PRs.md — read before creating an account.",
  },
};

const EFFECTIVE_DATE = "15 April 2026";
const CONTACT_EMAIL = "legal@prs.md";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      {/* Header */}
      <div className="mb-12">
        <p
          className="font-mono text-[10px] font-bold uppercase tracking-widest mb-4"
          style={{ color: "var(--color-text-dim)" }}
        >
          Legal
        </p>
        <h1
          className="text-3xl font-extrabold tracking-tight mb-3"
          style={{ letterSpacing: "-0.03em" }}
        >
          Terms of Service
        </h1>
        <p className="font-mono text-xs" style={{ color: "var(--color-text-dim)" }}>
          Effective {EFFECTIVE_DATE}
        </p>
      </div>

      <div className="docs-prose">
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of PRs.md
          (the &ldquo;Service&rdquo;), operated by the PRs.md project. By accessing or using the
          Service you agree to be bound by these Terms. If you do not agree, do not use the
          Service.
        </p>

        <h2>1. Description of the Service</h2>
        <p>
          PRs.md is an open-source tool that helps developers demonstrate their understanding of
          their own pull requests. It fetches a GitHub pull request diff, generates quiz questions
          using a large language model (LLM) of your choosing, and issues a verifiable proof badge
          upon a passing score. The Service runs on the Vercel platform and stores data in a
          Neon Postgres database.
        </p>

        <h2>2. Eligibility</h2>
        <p>
          You must be at least 16 years old to use the Service. By using the Service you represent
          that you meet this requirement and that you have the legal capacity to enter into these
          Terms.
        </p>

        <h2>3. Account registration</h2>
        <p>
          Access to the Service requires authentication via GitHub OAuth. You are responsible for
          maintaining the security of your GitHub account. PRs.md requests the minimum OAuth scopes
          needed to identify you (<code>read:user</code> and <code>user:email</code>); we do not
          request access to your repositories or organisations.
        </p>
        <p>
          You must not use the Service on behalf of a third party without that party&apos;s
          knowledge and consent.
        </p>

        <h2>4. API keys and bring-your-own-key (BYOK)</h2>
        <p>
          The Service operates on a bring-your-own-key model. To generate quiz questions you must
          supply a valid API key from a supported LLM provider (currently OpenAI, Anthropic, and
          Google Gemini). By saving a key you acknowledge that:
        </p>
        <ul>
          <li>
            Keys are encrypted at rest using AES-256-GCM with a per-key initialisation vector and
            authentication tag. They are decrypted in memory only during active LLM calls and are
            never logged or transmitted to any party other than the corresponding provider.
          </li>
          <li>
            You are solely responsible for any costs incurred with your LLM provider as a result of
            using the Service. PRs.md does not subsidise or reimburse these costs.
          </li>
          <li>
            You must not share API keys that belong to another party, or use keys that you are not
            authorised to use.
          </li>
          <li>
            You should revoke and rotate any key you believe has been compromised, both at the
            provider level and within the Service.
          </li>
        </ul>

        <h2>5. Pull request data</h2>
        <p>
          When you submit a GitHub pull request URL, PRs.md fetches the publicly accessible diff via
          the GitHub API. This diff is sent to your configured LLM provider to generate questions; it
          is not stored on our servers beyond the duration of the active request. We store the
          generated questions, your answers, and your score. We do not store raw diffs or source
          code.
        </p>
        <p>
          You are responsible for ensuring that you have the right to share the contents of any pull
          request URL you submit with your chosen LLM provider, in accordance with that
          provider&apos;s terms of service and your own organisation&apos;s data policies.
        </p>

        <h2>6. Proof pages and badges</h2>
        <p>
          Proof pages generated by the Service (at <code>/proof/[id]</code>) are intentionally
          public. Anyone with the URL can view the questions, your answers, and your score. By
          completing a challenge you consent to this data being publicly accessible. Do not submit
          answers containing confidential information.
        </p>
        <p>
          Proof badges may be embedded in GitHub pull request descriptions, README files, and other
          public locations. The badge SVG is served by the Service and references the corresponding
          proof page.
        </p>

        <h2>7. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>
            Attempt to circumvent the timed quiz, copy-paste restrictions, or grading mechanism by
            any automated or manual means, for the purpose of fraudulently obtaining a badge.
          </li>
          <li>
            Submit pull request URLs for private repositories that you do not have authorisation to
            share with a third-party LLM provider.
          </li>
          <li>
            Use the Service to process, store, or transmit content that is unlawful, harmful,
            defamatory, or that infringes the intellectual property rights of others.
          </li>
          <li>
            Attempt to disrupt, degrade, or gain unauthorised access to the Service or its
            underlying infrastructure.
          </li>
          <li>
            Use automated scripts or bots to create challenges or submit answers at scale.
          </li>
        </ul>

        <h2>8. Intellectual property</h2>
        <p>
          The PRs.md source code is released under the MIT Licence and is available on GitHub. These
          Terms do not grant you any rights in the PRs.md name, logo, or brand assets beyond what is
          reasonably necessary to describe your use of the Service.
        </p>
        <p>
          You retain all rights to any content you submit (pull request URLs, written answers). By
          submitting answers you grant PRs.md a limited licence to store and display them on the
          corresponding public proof page.
        </p>

        <h2>9. Privacy</h2>
        <p>
          PRs.md collects the minimum data needed to operate the Service: your GitHub profile
          information (username, display name, email, avatar), API keys (encrypted), and challenge
          records (questions, answers, scores, timestamps). We do not sell this data or share it
          with third parties except as required to operate the Service (Neon for database hosting,
          Vercel for compute, and your chosen LLM provider for question generation and grading).
        </p>
        <p>
          Usage events may be tracked with anonymised analytics (Vercel Analytics, Google Analytics)
          to understand how the Service is used. No personally identifiable information is included
          in these events.
        </p>

        <h2>10. Disclaimer of warranties</h2>
        <p>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
          warranty of any kind, express or implied. We do not warrant that the Service will be
          uninterrupted, error-free, or free of harmful components, or that generated questions will
          be accurate, fair, or appropriate for any particular purpose. The grading mechanism is
          automated and imperfect; a passing score is not a guarantee of genuine code comprehension.
        </p>

        <h2>11. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by applicable law, PRs.md and its contributors shall not
          be liable for any indirect, incidental, special, consequential, or punitive damages,
          including but not limited to loss of profits, data, or goodwill, arising out of or in
          connection with your use of the Service, even if advised of the possibility of such
          damages.
        </p>
        <p>
          Our total liability to you for any claim arising under these Terms shall not exceed the
          greater of (a) the amount you paid to use the Service in the twelve months preceding the
          claim, or (b) USD $10.
        </p>

        <h2>12. Modifications to the Service and Terms</h2>
        <p>
          We reserve the right to modify or discontinue the Service at any time without notice. We
          may update these Terms from time to time. Material changes will be indicated by a new
          effective date at the top of this page. Continued use of the Service after changes are
          posted constitutes your acceptance of the revised Terms.
        </p>

        <h2>13. Termination</h2>
        <p>
          We may suspend or terminate your access to the Service at our discretion, without notice,
          for conduct that we believe violates these Terms or is harmful to other users, us, or third
          parties. You may stop using the Service at any time; to delete your account and associated
          data, contact us at the address below.
        </p>

        <h2>14. Governing law</h2>
        <p>
          These Terms are governed by and construed in accordance with the laws of the jurisdiction
          in which the operator is established, without regard to conflict of law principles. Any
          disputes shall be resolved in the courts of that jurisdiction.
        </p>

        <h2>15. Contact</h2>
        <p>
          Questions about these Terms can be directed to{" "}
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
