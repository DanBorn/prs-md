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
      auth/[...nextauth]/  # NextAuth route handlers
      challenges/           # POST: create challenge from PR URL
      cli/proof/            # POST: register proof from CLI/MCP (no web auth)
      grade/                # POST: grade quiz answers via LLM
      keys/                 # GET/POST/DELETE: manage user API keys
    challenge/[id]/         # Challenge detail page (public, shareable link)
    dashboard/              # User dashboard (challenges, API key management)
    proof/[id]/             # Public proof page with badge
    quiz/[id]/              # Timed quiz runner
  components/               # Shared UI (header, logo, providers)
  db/
    schema.ts               # Drizzle schema (users, accounts, sessions, api_keys, mcp_tokens, challenges, attempts)
    index.ts                # DB connection singleton (Neon serverless)
  lib/
    auth.ts                 # NextAuth config (GitHub provider, DrizzleAdapter)
    crypto.ts               # AES-256-GCM encrypt/decrypt for API keys at rest
    github.ts               # PR URL parser + diff fetcher
    llm.ts                  # Multi-provider LLM calls (question generation + grading)
cli/                        # Standalone CLI tool (`prs verify <url>`)
mcp/                        # MCP server for IDE integration
drizzle.config.ts           # Drizzle Kit config (uses DATABASE_URL_OWNER for migrations)
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

## Environment variables

See `.env.example`. Key split:
- `DATABASE_URL` — app runtime (prs_app role)
- `DATABASE_URL_OWNER` — migrations only (neondb_owner role)
- `ACTION_SECRET` — shared secret for GitHub Action → API authentication (timing-safe verified)

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
- **ACTION_SECRET auth**: GitHub Action → API calls verified with timing-safe comparison
- **SSRF-safe URL parsing**: PR URL parsing uses `URL()` constructor + hostname allowlist (no unanchored regex)
- **Security headers**: X-Frame-Options, HSTS, X-Content-Type-Options, etc. configured in `next.config.ts`
- **Attempt rate limiting**: 5-attempt cap per user/challenge on grading endpoints
- **MCP TTL eviction**: `activeChallenges` Map cleaned every 5 minutes to prevent memory exhaustion

## Known gaps / TODOs

**Still open:**
- No IP-level rate limiting (per-attempt cap is in place, but IP-based flood protection for `/api/cli/proof` is not implemented)
- GitHub OAuth tokens stored plaintext in DB (`accounts` table) — consider encrypting

**Fixed/Addressed:**
- Rate limiting on endpoints — per-attempt cap (5 attempts per user/challenge) now in place
- SSRF in URL parsing — fixed with `URL()` + hostname validation
- Prompt injection — hardened with XML delimiters + anti-injection system prompts
- Anonymous proof submissions — scores now server-side validated to prevent tampering

**Infra:**
- Production branch not marked as protected in Neon (requires Console, not available via CLI)
