import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parsePrUrl, fetchPrDiff } from "../github";

// ---------------------------------------------------------------------------
// parsePrUrl — pure regex, no mocks needed
// ---------------------------------------------------------------------------

describe("parsePrUrl", () => {
  it("parses a standard HTTPS GitHub PR URL", () => {
    const result = parsePrUrl("https://github.com/owner/repo/pull/123");
    expect(result).toEqual({ owner: "owner", repo: "repo", pull: 123 });
  });

  it("handles URLs with query params and fragments", () => {
    const result = parsePrUrl(
      "https://github.com/owner/repo/pull/42?tab=files#diff-abc"
    );
    expect(result).toEqual({ owner: "owner", repo: "repo", pull: 42 });
  });

  it("parses org/repo names containing dashes and dots", () => {
    const result = parsePrUrl(
      "https://github.com/acme-corp/my-repo.js/pull/99"
    );
    expect(result).toEqual({
      owner: "acme-corp",
      repo: "my-repo.js",
      pull: 99,
    });
  });

  it("also matches bare domain (no https://)", () => {
    // The regex is not anchored to https://, so bare domains match too
    const result = parsePrUrl("github.com/owner/repo/pull/1");
    expect(result).toEqual({ owner: "owner", repo: "repo", pull: 1 });
  });

  it("returns null for non-GitHub domains", () => {
    expect(
      parsePrUrl("https://gitlab.com/owner/repo/merge_requests/1")
    ).toBeNull();
  });

  it("returns null for GitHub issue URLs (not PR URLs)", () => {
    expect(
      parsePrUrl("https://github.com/owner/repo/issues/5")
    ).toBeNull();
  });

  it("returns null for bare repo URLs with no PR path", () => {
    expect(parsePrUrl("https://github.com/owner/repo")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(parsePrUrl("")).toBeNull();
  });

  it("returns null for arbitrary non-URL strings", () => {
    expect(parsePrUrl("not a url at all")).toBeNull();
  });

  it("converts the PR number to a JavaScript integer", () => {
    const result = parsePrUrl("https://github.com/a/b/pull/007");
    expect(result?.pull).toBe(7);
    expect(typeof result?.pull).toBe("number");
  });

  it("handles large PR numbers", () => {
    const result = parsePrUrl("https://github.com/a/b/pull/99999");
    expect(result?.pull).toBe(99999);
  });
});

// ---------------------------------------------------------------------------
// fetchPrDiff — fetch is mocked via vi.stubGlobal
// ---------------------------------------------------------------------------

describe("fetchPrDiff", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches diff text and PR title on success", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "diff content here",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ title: "My PR Title" }),
      } as Response);

    const result = await fetchPrDiff("owner", "repo", 1);
    expect(result.diff).toBe("diff content here");
    expect(result.title).toBe("My PR Title");
  });

  it("truncates diffs longer than 12 000 chars and appends marker", async () => {
    const mockFetch = vi.mocked(fetch);
    const longDiff = "x".repeat(15_000);
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: async () => longDiff,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ title: "Big PR" }),
      } as Response);

    const result = await fetchPrDiff("owner", "repo", 1);
    expect(result.diff.length).toBeLessThan(15_000);
    expect(result.diff).toContain("[...diff truncated...]");
    // Sliced portion is exactly 12 000 chars before the marker
    expect(result.diff.startsWith("x".repeat(12_000))).toBe(true);
  });

  it("does not truncate diffs at exactly 12 000 chars", async () => {
    const mockFetch = vi.mocked(fetch);
    const exactDiff = "y".repeat(12_000);
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: async () => exactDiff,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ title: "Exact PR" }),
      } as Response);

    const result = await fetchPrDiff("owner", "repo", 1);
    expect(result.diff).toBe(exactDiff);
    expect(result.diff).not.toContain("[...diff truncated...]");
  });

  it("throws when the GitHub API returns an error status", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    } as Response);

    await expect(fetchPrDiff("owner", "repo", 999)).rejects.toThrow(
      "GitHub API error: 404 Not Found"
    );
  });

  it("includes Authorization header when accessToken is supplied", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "diff",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ title: "Authed PR" }),
      } as Response);

    await fetchPrDiff("owner", "repo", 1, "ghs_token123");

    const headers = (mockFetch.mock.calls[0][1] as RequestInit)
      ?.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer ghs_token123");
  });

  it("omits Authorization header when no accessToken is provided", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "diff",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ title: "Public PR" }),
      } as Response);

    await fetchPrDiff("owner", "repo", 1);

    const headers = (mockFetch.mock.calls[0][1] as RequestInit)
      ?.headers as Record<string, string>;
    expect(headers["Authorization"]).toBeUndefined();
  });

  it("falls back to owner/repo#pull as title when metadata fetch fails", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "diff content",
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
      } as Response);

    const result = await fetchPrDiff("myorg", "myrepo", 5);
    expect(result.title).toBe("myorg/myrepo#5");
  });

  it("uses the prs-md User-Agent on requests", async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "diff",
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ title: "PR" }),
      } as Response);

    await fetchPrDiff("owner", "repo", 1);

    const headers = (mockFetch.mock.calls[0][1] as RequestInit)
      ?.headers as Record<string, string>;
    expect(headers["User-Agent"]).toBe("prs-md");
  });
});
