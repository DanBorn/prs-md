import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MCP / IDE — PRs.md Docs",
};

export default function McpDocsPage() {
  return (
    <div className="docs-prose">
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--color-accent)" }}>
        Guides
      </p>
      <h1>MCP / IDE</h1>
      <p className="docs-lead">
        The PRs.md MCP server lets AI-powered editors (Cursor, Windsurf, Claude Desktop, and any
        other MCP-compatible client) trigger challenges and retrieve proof badges without leaving your
        IDE.
      </p>

      <h2>What is MCP?</h2>
      <p>
        The <strong>Model Context Protocol</strong> is an open standard that lets LLM-powered tools
        call external capabilities defined as &ldquo;tools.&rdquo; PRs.md exposes two:
      </p>
      <ul>
        <li>
          <code>prs_start_challenge</code> — create a quiz from a PR URL and return the questions
        </li>
        <li>
          <code>prs_submit_answers</code> — submit answers and get your score + proof URL back
        </li>
      </ul>

      <h2>Getting your MCP token</h2>
      <p>
        Go to <strong>Dashboard → MCP Server</strong> and generate a token. This token authenticates
        the MCP server with your PRs.md account. Keep it secret — it has the same permissions as
        your full session.
      </p>

      <h2>Cursor setup</h2>
      <p>
        Add the server to your Cursor MCP config. Open{" "}
        <code>~/.cursor/mcp.json</code> (create it if it doesn&apos;t exist) and add:
      </p>
      <pre><code>{`{
  "mcpServers": {
    "prs-md": {
      "command": "npx",
      "args": ["-y", "prs-md-mcp"],
      "env": {
        "PRS_TOKEN": "your-token-here"
      }
    }
  }
}`}</code></pre>
      <p>
        Restart Cursor. You should see <strong>prs-md</strong> appear in the MCP tools panel.
      </p>

      <h2>Windsurf setup</h2>
      <p>
        Open <strong>Settings → MCP Servers</strong> and click <strong>Add server</strong>. Use the
        same <code>npx -y prs-md-mcp</code> command with the <code>PRS_TOKEN</code> environment
        variable set. Windsurf will prompt you for the env value in a secure field.
      </p>

      <h2>Claude Desktop setup</h2>
      <p>
        Edit <code>~/Library/Application Support/Claude/claude_desktop_config.json</code> on macOS
        (or the equivalent on Windows) and add the server under <code>mcpServers</code>:
      </p>
      <pre><code>{`{
  "mcpServers": {
    "prs-md": {
      "command": "npx",
      "args": ["-y", "prs-md-mcp"],
      "env": {
        "PRS_TOKEN": "your-token-here"
      }
    }
  }
}`}</code></pre>

      <h2>Using the tools</h2>
      <p>
        Once configured, you can ask the AI in your editor to run a challenge. For example:
      </p>
      <div
        className="docs-callout"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface-raised)" }}
      >
        <p style={{ marginBottom: "0.5rem", color: "var(--color-text-muted)" }}>
          <em>&ldquo;Run a PRs.md challenge on this PR before I merge it:
          https://github.com/acme/api/pull/247&rdquo;</em>
        </p>
        <p style={{ marginBottom: 0, color: "var(--color-text-dim)", fontSize: "0.8rem" }}>
          The assistant calls <code>prs_start_challenge</code>, shows you the questions, collects
          your answers, and calls <code>prs_submit_answers</code>. You get the score and proof URL
          in chat.
        </p>
      </div>

      <h2>BYOK vs token mode</h2>
      <p>
        The MCP server supports two authentication modes, selectable in the Dashboard → MCP Server
        setup screen:
      </p>
      <ul>
        <li>
          <strong>Token mode</strong> — uses the API key saved to your PRs.md account. Simplest
          setup.
        </li>
        <li>
          <strong>BYOK mode</strong> — you pass an API key directly in the MCP config. Useful if you
          don&apos;t want to save keys to the server.
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <h3>Server not appearing in the tools list</h3>
      <p>
        Make sure <code>npx</code> can reach the internet and is on your <code>PATH</code>. Run{" "}
        <code>npx -y prs-md-mcp --version</code> in a terminal to confirm the package resolves
        correctly.
      </p>
      <h3>Authentication errors</h3>
      <p>
        Regenerate your MCP token from the dashboard and update the <code>PRS_TOKEN</code> value in
        your config. Tokens do not expire but can be revoked from the dashboard.
      </p>
    </div>
  );
}
