/** Parse a GitHub PR URL into owner, repo, and PR number. */
export function parsePrUrl(url: string): {
  owner: string;
  repo: string;
  pull: number;
} | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  // Reject anything that isn't github.com — prevents SSRF via crafted URLs
  if (parsed.hostname !== "github.com") return null;
  const parts = parsed.pathname.split("/");
  // Expected: ["", owner, repo, "pull", number]
  if (parts.length < 5 || parts[3] !== "pull") return null;
  const owner = parts[1];
  const repo = parts[2];
  const pullStr = parts[4];
  if (!owner || !repo || !/^\d+$/.test(pullStr)) return null;
  return { owner, repo, pull: parseInt(pullStr, 10) };
}

/** Fetch the .diff content for a PR using a GitHub token for higher rate limits. */
export async function fetchPrDiff(
  owner: string,
  repo: string,
  pull: number,
  accessToken?: string
): Promise<{ diff: string; title: string }> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3.diff",
    "User-Agent": "prs-md",
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const diffRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pull}`,
    { headers: { ...headers, Accept: "application/vnd.github.v3.diff" } }
  );
  if (!diffRes.ok) {
    // Stored GitHub token is expired/revoked — retry unauthenticated (works for public PRs)
    if (diffRes.status === 401 && accessToken) {
      return fetchPrDiff(owner, repo, pull, undefined);
    }
    throw new Error(`GitHub API error: ${diffRes.status} ${diffRes.statusText}`);
  }
  const diff = await diffRes.text();

  // Fetch PR metadata for title
  const metaHeaders: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "prs-md",
  };
  if (accessToken) {
    metaHeaders.Authorization = `Bearer ${accessToken}`;
  }
  const metaRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pull}`,
    { headers: metaHeaders }
  );
  const meta = metaRes.ok ? await metaRes.json() : null;

  // Truncate very large diffs to ~12k chars to stay within LLM context
  const MAX_DIFF_CHARS = 12_000;
  const truncatedDiff =
    diff.length > MAX_DIFF_CHARS
      ? diff.slice(0, MAX_DIFF_CHARS) + "\n\n[...diff truncated...]"
      : diff;

  return {
    diff: truncatedDiff,
    title: meta?.title ?? `${owner}/${repo}#${pull}`,
  };
}
