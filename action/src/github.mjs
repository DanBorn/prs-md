// GitHub API helpers — zero dependencies, uses native fetch

const GITHUB_API = "https://api.github.com";

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "prs-md-action",
  };
}

/** Fetch the .diff content and title for a PR. */
export async function fetchPrDiff(owner, repo, pull, token) {
  const diffRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/pulls/${pull}`,
    {
      headers: {
        ...headers(token),
        Accept: "application/vnd.github.v3.diff",
      },
    }
  );
  if (!diffRes.ok) {
    throw new Error(`Failed to fetch diff: ${diffRes.status}`);
  }
  const diff = await diffRes.text();

  const metaRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/pulls/${pull}`,
    { headers: headers(token) }
  );
  const meta = metaRes.ok ? await metaRes.json() : {};

  // Truncate very large diffs to stay within LLM context
  const MAX_DIFF = 12_000;
  const truncated =
    diff.length > MAX_DIFF
      ? diff.slice(0, MAX_DIFF) + "\n\n[...diff truncated...]"
      : diff;

  return {
    diff: truncated,
    title: meta.title ?? `${owner}/${repo}#${pull}`,
    sha: meta.head?.sha ?? "",
  };
}

/** Set a commit status (pending, success, failure, error). */
export async function setCommitStatus(
  owner,
  repo,
  sha,
  { state, description, targetUrl },
  token
) {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/statuses/${sha}`,
    {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({
        state,
        description,
        target_url: targetUrl ?? "",
        context: "prs.md / turing-test",
      }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    console.error(`Failed to set status: ${res.status} ${text}`);
  }
}

/** Post a comment on a PR. */
export async function postComment(owner, repo, prNumber, body, token) {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/issues/${prNumber}/comments`,
    {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ body }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    console.error(`Failed to post comment: ${res.status} ${text}`);
  }
}
