# prs.md

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![CI](https://github.com/DanBorn/prs-md/actions/workflows/ci.yml/badge.svg)](https://github.com/DanBorn/prs-md/actions/workflows/ci.yml)
[![Vercel](https://img.shields.io/badge/deploy-Vercel-black)](https://vercel.com)
[![Sponsor](https://img.shields.io/badge/sponsor-%E2%9D%A4-pink?logo=github)](https://github.com/sponsors/DanBorn)

A "Turing Test for Pull Requests." Paste a GitHub PR URL, answer 3 targeted questions about the diff under a 3-minute timer, and earn a shareable proof badge. Stops unread AI-generated PRs from landing.

**Live:** [prs.md](https://prs.md) — or self-host in minutes with the guide below.

## How it works

1. Paste a GitHub PR URL
2. An LLM (your own API key) reads the diff and generates 3 targeted questions, one of which is a hallucination trap
3. Answer under a 3-minute timer
4. LLM grades your answers — pass and get a shareable proof badge + public proof page

No hosted AI cost to the operator. Users bring their own key (OpenAI, Anthropic, or Google Gemini).

## Features

- BYOK (Bring Your Own Key) — supports OpenAI, Anthropic, and Google Gemini
- 3-minute timed quiz with hallucination trap question
- Shareable proof badges and public proof pages
- GitHub OAuth login (minimal scope)
- CLI tool (`prs-md`) for terminal workflows
- MCP server for IDE integration (Cursor, Windsurf, etc.)
- API keys encrypted at rest (AES-256-GCM)

## Quick Start

```bash
git clone https://github.com/DanBorn/prs-md.git
cd prs-md
cp .env.example .env
# Edit .env with your values (see Configuration below)
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Prerequisites

- Node.js 20+
- pnpm
- A Neon Postgres database (free tier works)
- A GitHub OAuth App

## Configuration

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon Postgres connection string (app role, DML only) |
| `DATABASE_URL_OWNER` | Yes | Neon Postgres connection string (owner role, for migrations) |
| `AUTH_SECRET` | Yes | Random secret — `openssl rand -base64 32` |
| `AUTH_GITHUB_ID` | Yes | GitHub OAuth App client ID |
| `AUTH_GITHUB_SECRET` | Yes | GitHub OAuth App client secret |
| `ENCRYPTION_KEY` | Yes | 32-byte base64 key — `openssl rand -base64 32` |
| `ACTION_SECRET` | Yes | Shared secret for GitHub Action → API auth — `openssl rand -hex 32` |
| `NEXTAUTH_URL` | Yes | Your app's base URL (e.g. `https://yourdomain.com`) |
| `NEXT_PUBLIC_APP_URL` | Yes | Same as `NEXTAUTH_URL` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | No | Google Analytics measurement ID |
| `NEXT_PUBLIC_MIXPANEL_TOKEN` | No | Mixpanel project token |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry DSN for error tracking |

### GitHub OAuth App

1. Go to GitHub Settings > Developer settings > OAuth Apps > New OAuth App
2. Set **Authorization callback URL** to `https://yourdomain.com/api/auth/callback/github`
3. Copy the Client ID and Client Secret into `.env`

### Database Setup

This project uses [Neon](https://neon.tech) (serverless Postgres). The free tier is enough.

```bash
# After creating your Neon project and filling in DATABASE_URL_OWNER:
npx drizzle-kit push
```

The schema uses two roles:
- `neondb_owner` — DDL only, used by migrations
- `prs_app` — DML only (SELECT/INSERT/UPDATE/DELETE), used at runtime

See `src/db/schema.ts` for the full schema.

## Development

```bash
pnpm dev              # Start dev server on :3000
pnpm build            # Production build
pnpm lint             # ESLint
pnpm test             # Run tests (vitest)
pnpm test:coverage    # Tests with coverage report
npx drizzle-kit push  # Push schema changes to Neon
npx drizzle-kit studio  # Open Drizzle Studio (DB browser)
```

## CLI

The `prs-md` CLI lets developers verify a PR directly from the terminal.

```bash
npx prs-md https://github.com/org/repo/pull/123
```

See [`cli/`](cli/) for source and build instructions.

## MCP Server

An MCP (Model Context Protocol) server is included for IDE integration (Cursor, Windsurf, Claude Desktop, etc.).

```bash
# Add to your MCP config:
{
  "mcpServers": {
    "prs-md": {
      "command": "npx",
      "args": ["@prs-md/mcp-server"]
    }
  }
}
```

See [`mcp/`](mcp/) for source and configuration details.

## Deploy to Vercel

Deployments are triggered automatically by the CI pipeline on merge to `main`. No manual Vercel button click is needed.

**GitHub Secrets Required** (set in your repo):
- `VERCEL_TOKEN` — Personal access token from Vercel
- `VERCEL_ORG_ID` — From `.vercel/project.json`
- `VERCEL_PROJECT_ID` — From `.vercel/project.json`

When you merge a PR to `main`:
1. CI runs (`lint`, `test`, `deploy` jobs in `.github/workflows/ci.yml`)
2. If lint + tests pass, the `deploy` job runs: `vercel build --prod` → `vercel deploy --prebuilt --prod`
3. Your app deploys automatically to Vercel

Set `NEXT_PUBLIC_APP_URL` and other environment variables in the Vercel dashboard or in your `.env` before the first deploy.

## Using with Claude Code

This project includes a `CLAUDE.md` that gives Claude Code full context about the architecture, database setup, and commands.

```bash
claude    # Start Claude Code — reads CLAUDE.md automatically
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

PRs require CI checks to pass (lint and tests) and approval from a maintainer. The `main` branch is protected — no direct pushes allowed, and all branch protection rules must pass before merging.

## License

MIT — see [LICENSE](LICENSE)
