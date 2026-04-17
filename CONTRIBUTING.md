# Contributing to prs.md

Thanks for your interest. This document covers how to run the project locally, submit changes, and report issues.

## Running Locally

### Prerequisites

- Node.js 20+
- pnpm
- A [Neon](https://neon.tech) Postgres database (free tier works)
- A GitHub OAuth App

### Setup

```bash
git clone https://github.com/your-org/prs-cert.git
cd prs-cert
cp .env.example .env
# Fill in .env — see README.md for each variable
pnpm install
npx drizzle-kit push   # Applies schema to your Neon DB
pnpm dev               # Starts on http://localhost:3000
```

Pre-commit hooks are installed automatically via `pnpm install` (Husky). On every commit, ESLint (`--fix`) and TypeScript type checking (`tsc --noEmit`) run on staged files.

### Running Tests

```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # Coverage report (target: 80%)
```

Tests use [Vitest](https://vitest.dev). New code should maintain or improve the coverage percentage shown in `pnpm test:coverage`.

### Linting

```bash
pnpm lint
```

ESLint is configured via `eslint.config.mjs`. Fix all lint errors before opening a PR.

## Project Structure

```
src/
  app/          Next.js App Router pages and API routes
  components/   Shared UI components
  db/           Drizzle schema and DB connection
  lib/          Core logic (auth, crypto, LLM calls, GitHub API)
cli/            Standalone CLI tool (prs-md)
mcp/            MCP server for IDE integration
```

Key files to understand before making changes:

- `src/lib/llm.ts` — multi-provider LLM calls (question generation + grading)
- `src/lib/github.ts` — PR URL parser and diff fetcher
- `src/lib/crypto.ts` — AES-256-GCM encryption for API keys at rest
- `src/db/schema.ts` — full Drizzle schema
- `src/lib/auth.ts` — NextAuth config

## Branch and PR Workflow

1. Fork the repo and create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature
   ```
2. Make your changes with focused, conventional commits:
   ```
   feat: add rate limiting to /api/cli/proof
   fix: handle empty diff from GitHub API
   docs: update MCP configuration example
   ```
   Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

3. Run the pre-PR checklist:
   ```bash
   pnpm test:coverage    # Verify coverage stays >= 80%
   pnpm lint             # ESLint (also runs automatically on commit)
   ```
   (Note: `pnpm build` is not needed locally; CI runs it on every push.)

4. Open a PR against `main`. The PR description should explain what changed and why.

## Code Style

- TypeScript throughout — no `any`, use `unknown` for external input and narrow it
- Immutable patterns — return new objects, do not mutate in place
- Functions under 50 lines; files under 800 lines
- No `console.log` in production code paths
- Errors handled explicitly at every level — no silent swallowing

## Security

- Never commit secrets or credentials
- API keys and tokens must go in `.env` only
- Any auth, encryption, or user-data code needs extra scrutiny — flag it in your PR description

### Known gaps that contributions are welcome for:
- GitHub OAuth tokens stored plaintext in the `accounts` table

## CI & Merging

All PRs must pass the CI pipeline before merging:
- **`lint` job**: TypeScript type checking + ESLint (no `any` allowed)
- **`test` job**: Vitest suite with coverage report
- **`deploy` job**: Runs only on `main` after lint + test pass; deploys to Vercel

Additionally:
- At least one review approval from a code owner (`@DanBorn`) is required
- Branch must be up to date with `main` before merging
- Force pushes and branch deletions are blocked

## Issue Labels

| Label | Meaning |
|---|---|
| `bug` | Something is broken |
| `enhancement` | New feature or improvement |
| `security` | Security concern — please disclose privately first |
| `good first issue` | Small, well-scoped, good entry point |
| `help wanted` | Contributions actively sought |
| `cli` | CLI tool (`cli/`) |
| `mcp` | MCP server (`mcp/`) |

## Security Disclosures

Please do not open public issues for security vulnerabilities. Email d.born@make.com with details. We will respond within 48 hours.

## Using Claude Code

This project includes a `CLAUDE.md` that gives Claude Code full context about the stack, database, and commands.

```bash
claude    # Claude Code reads CLAUDE.md automatically
```

Useful for navigating the codebase, understanding the LLM pipeline, or debugging schema changes.
