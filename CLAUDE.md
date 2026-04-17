@AGENTS.md

# prs.md

A "Turing Test for Pull Requests" — open-source micro-SaaS that verifies developers actually understand their own code changes, stopping unread AI-generated PRs from landing.

## How it works

1. User pastes a GitHub PR URL
2. An LLM (user's own API key) reads the diff and generates 3 targeted questions + 1 hallucination trap
3. The developer answers under a 3-minute timer
4. LLM grades the answers; passing generates a shareable proof badge with a public proof page

## Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Auth | NextAuth v5 beta (GitHub OAuth, DB sessions) |
| Database | Neon Postgres (serverless driver) |
| ORM | Drizzle ORM |
| LLM | OpenAI, Anthropic, Google Gemini (BYOK — user provides their own key) |
| Styling | Tailwind CSS v4, CSS custom properties |
| Deployment | Vercel + Neon free tier |

## Project structure

```
src/
  app/
    api/
      auth/[...nextauth]/   # NextAuth route handlers
      action/
        challenge/          # POST: create challenge from GitHub Action
        result/             # POST: receive pass/fail result from GitHub Action
      badge/[id]/           # GET: SVG badge for a proof
      challenges/           # POST: create challenge from PR URL (web)
      cli/
        challenge/          # POST: create challenge from CLI
        keys/               # GET: fetch saved API keys for CLI (authenticated)
        proof/              # POST: register proof from CLI/MCP (no web auth)
      grade/                # POST: grade quiz answers via LLM
      keys/                 # GET/POST/DELETE: manage user API keys
      mcp/
        challenge/          # POST: create challenge from MCP server
        grade/              # POST: grade answers from MCP server
      terms/accept/         # POST: record terms acceptance
      tokens/               # GET/POST/DELETE: manage MCP bearer tokens
    about/                  # About page
    accept-terms/           # Terms acceptance flow (required before first use)
    challenge/[id]/         # Challenge detail page (public, shareable link)
    cookies/                # Cookie policy page
    dashboard/              # User dashboard (challenges, API key management)
    docs/                   # Documentation pages (web/, cli/, mcp/ subsections)
    proof/[id]/             # Public proof page with badge
    quiz/[id]/              # Timed quiz runner
    terms/                  # Terms of service page
  components/               # Shared UI (header, logo, providers)
  db/
    schema.ts               # Drizzle schema (users, accounts, sessions, api_keys, mcp_tokens, challenges, attempts)
    index.ts                # DB connection singleton (Neon serverless)
  instrumentation.ts        # Next.js instrumentation hook — loads Sentry on server/edge
  lib/
    analytics.ts            # Client-side GA4 + Mixpanel wrapper
    auth.ts                 # NextAuth config (GitHub provider, DrizzleAdapter)
    crypto.ts               # AES-256-GCM encrypt/decrypt for API keys at rest
    github.ts               # PR URL parser + diff fetcher
    llm.ts                  # Multi-provider LLM calls (question generation + grading)
    mcp-auth.ts             # MCP bearer-token authentication helper
    mixpanel-server.ts      # Server-side Mixpanel tracking (funnel events)
    rate-limit.ts           # IP-based rate limiting via Upstash Redis
    require-auth.ts         # Auth guard helper for API routes
    tokens.ts               # MCP token hashing + CRUD helpers
action/                     # GitHub Action (action.yml + TypeScript src)
cli/                        # Standalone CLI tool (`prs-md` — published as npm package)
drizzle/                    # Drizzle migrations (SQL files + meta/)
drizzle.config.ts           # Drizzle Kit config (uses DATABASE_URL_OWNER for migrations)
mcp/                        # MCP server (`@prs-md/mcp-server` — published as npm package)
middleware.ts               # Next.js middleware (auth redirect, CSP headers)
sentry.client.config.ts     # Sentry browser config
sentry.edge.config.ts       # Sentry edge runtime config
sentry.server.config.ts     # Sentry Node.js config
```

## Database

- **Neon Postgres 17** on `aws-eu-central-1`
- **Project ID:** `your-neon-project-id`
- **Org:** `your-neon-org-id` (PRs.md)
- Two roles:
  - `neondb_owner` — DDL/migration role, used only by `drizzle-kit` via `DATABASE_URL_OWNER`
  - `prs_app` — least-privilege DML-only role (SELECT/INSERT/UPDATE/DELETE), used by the app at runtime via `DATABASE_URL`
- Indexes on all FK columns and `users.github_username`
- Unique constraint on `api_keys(user_id, provider)` — one key per provider per user
- All FKs cascade on delete
- Notable schema fields: `users.termsAcceptedAt` (terms gate), `challenges.source` (web/action/mcp/cli), `challenges.callback*` fields (GitHub Action status callbacks)

## Environment variables

See `.env.example`. Key split:
- `NEXT_PUBLIC_APP_URL` — canonical base URL (used for badge/proof links; falls back to `VERCEL_URL` on Vercel)
- `NEXTAUTH_URL` — NextAuth OAuth redirect base URL
- `DATABASE_URL` — app runtime (prs_app role)
- `DATABASE_URL_OWNER` — migrations only (neondb_owner role)
- `AUTH_SECRET` — NextAuth secret (generate with `openssl rand -base64 32`)
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` — GitHub OAuth App credentials
- `ENCRYPTION_KEY` — 32-byte base64 key for AES-256-GCM API key encryption
- `ACTION_SECRET` — shared secret for GitHub Action → `/api/action/challenge` authentication (timing-safe verified)
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — IP-based rate limiting (optional; rate limiter is disabled without these)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` — Google Analytics 4 (optional)
- `NEXT_PUBLIC_MIXPANEL_TOKEN` / `MIXPANEL_TOKEN` — Mixpanel client + server tokens (optional; same project token, kept separate so server token can rotate without a client rebuild)
- `NEXT_PUBLIC_MIXPANEL_API_HOST` / `MIXPANEL_API_HOST` — override for EU/India Mixpanel residency (omit for US default)
- `NEXT_PUBLIC_SENTRY_DSN` — Sentry error tracking (optional)
- `SENTRY_AUTH_TOKEN` / `SENTRY_ORG` / `SENTRY_PROJECT` — Sentry source map upload in CI (optional)

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm lint             # ESLint
pnpm test             # Run vitest suite
pnpm test:coverage    # Tests with coverage report
npx drizzle-kit push      # Push schema to Neon (uses DATABASE_URL_OWNER)
npx drizzle-kit studio    # Browse data
```

## Security model

- API keys encrypted at rest (AES-256-GCM, per-key IV + auth tag)
- Encryption key validated to be exactly 32 bytes at startup
- DB app role has zero DDL privileges (no CREATE/ALTER/DROP/TRUNCATE)
- GitHub OAuth with minimal scope (`read:user user:email`)
- `/api/cli/proof` verifies GitHub identity via token when provided; anonymous otherwise
- Challenge pages and proof pages are intentionally public (shareable)
- **Prompt injection hardening**: Untrusted content (diffs, answers) wrapped in XML tags (`<diff>`, `<answer>`) with explicit anti-injection instructions in system prompts; Gemini uses `systemInstruction` field to prevent concatenation attacks
- **Server-side score validation**: All LLM scores clamped to [0,100] and re-computed on `/api/cli/proof` to prevent tampering
- **ACTION_SECRET auth**: GitHub Action → `/api/action/challenge` calls verified with timing-safe comparison; `/api/action/result` relies on the DB constraint that only `source="action"` challenges can be updated (no shared secret needed — the row must have been legitimately created by the challenge endpoint)
- **SSRF-safe URL parsing**: PR URL parsing uses `URL()` constructor + hostname allowlist (no unanchored regex)
- **Security headers**: X-Frame-Options, HSTS, X-Content-Type-Options, etc. configured in `next.config.ts`
- **IP-based rate limiting**: Upstash Redis sliding-window rate limiter on all public API endpoints (`src/lib/rate-limit.ts`); gracefully disabled when Upstash credentials are absent
- **Attempt rate limiting**: 5-attempt cap per user/challenge on grading endpoints
- **MCP TTL eviction**: `activeChallenges` Map cleaned every 5 minutes to prevent memory exhaustion
- **Terms gate**: `users.termsAcceptedAt` is checked on sign-in; unaccepted users are redirected to `/accept-terms` before accessing the dashboard

## Known gaps / TODOs

**Still open:**
- GitHub OAuth tokens stored plaintext in DB (`accounts` table) — consider encrypting

**Fixed/Addressed:**
- IP-based rate limiting — Upstash Redis sliding-window limiter now covers all public endpoints
- Rate limiting on endpoints — per-attempt cap (5 attempts per user/challenge) now in place
- SSRF in URL parsing — fixed with `URL()` + hostname validation
- Prompt injection — hardened with XML delimiters + anti-injection system prompts
- Anonymous proof submissions — scores now server-side validated to prevent tampering

**Infra:**
- Production branch not marked as protected in Neon (requires Console, not available via CLI)

## Keeping documentation current

When you make a code change, update the relevant docs before closing the PR:

| What changed | Files to update |
|---|---|
| New/removed API route or page | `CLAUDE.md` → Project structure |
| New lib file or top-level directory | `CLAUDE.md` → Project structure |
| New/changed env var (`.env.example`) | `CLAUDE.md` → Environment variables |
| New DB table, column, or constraint | `CLAUDE.md` → Database |
| New security measure or resolved gap | `CLAUDE.md` → Security model / Known gaps |
| CLI or MCP behaviour change | `src/app/docs/cli/page.tsx` or `src/app/docs/mcp/page.tsx` |
| Web integration change | `src/app/docs/web/page.tsx` |
| Setup or workflow change | `CONTRIBUTING.md` |

User-facing docs live in `src/app/docs/` as TSX pages (rendered at `/docs`). They cover the three integration surfaces — web, CLI, MCP — and should stay in sync with the actual behaviour of those surfaces. If you change how the CLI authenticates, how the MCP server is configured, or how the GitHub Action works, update the corresponding docs page.
