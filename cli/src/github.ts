/** GitHub PR fetching for public repos — raw fetch, no auth, no dependencies */

const MAX_DIFF_CHARS = 12_000;

export interface PrInfo {
  owner: string;
  repo: string;
  pull: number;
  title: string;
  repoFullName: string;
  diff: string;
}

export function parsePrUrl(url: string): { owner: string; repo: string; pull: number } | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.hostname !== "github.com") return null;
  const parts = parsed.pathname.split("/");
  if (parts.length < 5 || parts[3] !== "pull") return null;
  const owner = parts[1];
  const repo = parts[2];
  const pullStr = parts[4];
  if (!owner || !repo || !/^\d+$/.test(pullStr)) return null;
  return { owner, repo, pull: parseInt(pullStr, 10) };
}

/** Fetch PR metadata and diff from a public repo */
export async function fetchPr(
  owner: string,
  repo: string,
  pull: number,
): Promise<PrInfo> {
  const headers = { "User-Agent": "prs-md-cli" };

  // Fetch diff
  const diffRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pull}`,
    { headers: { ...headers, Accept: "application/vnd.github.v3.diff" } },
  );

  if (!diffRes.ok) {
    if (diffRes.status === 404) throw new Error("PR not found — is the repo public?");
    if (diffRes.status === 403) throw new Error("GitHub rate limit exceeded. Try again in a minute.");
    throw new Error(`GitHub API error: ${diffRes.status} ${diffRes.statusText}`);
  }

  let diff = await diffRes.text();
  if (diff.length > MAX_DIFF_CHARS) {
    diff = diff.slice(0, MAX_DIFF_CHARS) + "\n\n[...diff truncated...]";
  }

  // Fetch metadata for PR title
  const metaRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pull}`,
    { headers: { ...headers, Accept: "application/vnd.github.v3+json" } },
  );
  const meta = metaRes.ok ? (await metaRes.json() as Record<string, unknown>) : null;

  return {
    owner,
    repo,
    pull,
    title: (meta?.title as string) ?? `${owner}/${repo}#${pull}`,
    repoFullName: `${owner}/${repo}`,
    diff,
  };
}
