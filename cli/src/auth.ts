/**
 * GitHub Device Flow authentication for prs-md CLI.
 *
 * Flow:
 * 1. POST /login/device/code → get user_code + verification_uri
 * 2. User visits URL, enters code
 * 3. CLI polls /login/oauth/access_token until complete
 * 4. Token stored in ~/.config/prs-md/auth.json
 *
 * Optional — if not logged in, proofs are still registered
 * with a self-reported username. Logging in links proofs to
 * the user's prs.md web account.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// Same GitHub OAuth App as the web version
const CLIENT_ID = "Iv23liTycPSfEodFzKEZ";

const CONFIG_DIR = path.join(os.homedir(), ".config", "prs-md");
const AUTH_FILE = path.join(CONFIG_DIR, "auth.json");

interface AuthData {
  githubToken: string;
  githubUsername: string;
  createdAt: string;
}

/** Read stored auth, or null if not logged in */
export function loadAuth(): AuthData | null {
  try {
    const raw = fs.readFileSync(AUTH_FILE, "utf-8");
    return JSON.parse(raw) as AuthData;
  } catch {
    return null;
  }
}

/** Save auth to config file */
function saveAuth(data: AuthData): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(AUTH_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
}

/** Remove stored auth */
export function clearAuth(): boolean {
  try {
    fs.unlinkSync(AUTH_FILE);
    return true;
  } catch {
    return false;
  }
}

/** Get GitHub username from token */
async function fetchUsername(token: string): Promise<string> {
  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": "prs-md-cli" },
  });
  if (!res.ok) throw new Error("Failed to verify GitHub token");
  const data = (await res.json()) as { login: string };
  return data.login;
}

/** Start GitHub Device Flow and return auth data */
export async function deviceFlowLogin(): Promise<AuthData> {
  // Step 1: Request device code
  const codeRes = await fetch("https://github.com/login/device/code", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      scope: "read:user",
    }),
  });

  if (!codeRes.ok) {
    throw new Error(`GitHub device flow error: ${codeRes.status}`);
  }

  const codeData = (await codeRes.json()) as {
    device_code: string;
    user_code: string;
    verification_uri: string;
    expires_in: number;
    interval: number;
  };

  // Return the code info — caller handles display + polling
  const { device_code, user_code, verification_uri, interval } = codeData;

  // Step 2: Poll for token
  const pollInterval = (interval ?? 5) * 1000;
  const deadline = Date.now() + 900_000; // 15 min max

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollInterval));

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        device_code,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
    });

    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
    };

    if (tokenData.access_token) {
      const username = await fetchUsername(tokenData.access_token);
      const auth: AuthData = {
        githubToken: tokenData.access_token,
        githubUsername: username,
        createdAt: new Date().toISOString(),
      };
      saveAuth(auth);
      return auth;
    }

    if (tokenData.error === "authorization_pending") {
      continue; // Still waiting
    }

    if (tokenData.error === "slow_down") {
      await new Promise((r) => setTimeout(r, 5000)); // Extra backoff
      continue;
    }

    if (tokenData.error === "expired_token") {
      throw new Error("Device code expired. Please try again.");
    }

    if (tokenData.error === "access_denied") {
      throw new Error("Authorization was denied.");
    }

    throw new Error(`Unexpected OAuth error: ${tokenData.error}`);
  }

  throw new Error("Login timed out. Please try again.");
}

/** Exported for display: get the device code info without polling */
export async function getDeviceCode(): Promise<{
  userCode: string;
  verificationUri: string;
  login: () => Promise<AuthData>;
}> {
  const codeRes = await fetch("https://github.com/login/device/code", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      scope: "read:user",
    }),
  });

  if (!codeRes.ok) {
    throw new Error(`GitHub device flow error: ${codeRes.status}`);
  }

  const codeData = (await codeRes.json()) as {
    device_code: string;
    user_code: string;
    verification_uri: string;
    interval: number;
  };

  return {
    userCode: codeData.user_code,
    verificationUri: codeData.verification_uri,
    login: async () => {
      const pollInterval = (codeData.interval ?? 5) * 1000;
      const deadline = Date.now() + 900_000;

      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, pollInterval));

        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: CLIENT_ID,
            device_code: codeData.device_code,
            grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          }),
        });

        const tokenData = (await tokenRes.json()) as {
          access_token?: string;
          error?: string;
        };

        if (tokenData.access_token) {
          const username = await fetchUsername(tokenData.access_token);
          const auth: AuthData = {
            githubToken: tokenData.access_token,
            githubUsername: username,
            createdAt: new Date().toISOString(),
          };
          saveAuth(auth);
          return auth;
        }

        if (tokenData.error === "authorization_pending" || tokenData.error === "slow_down") {
          if (tokenData.error === "slow_down") {
            await new Promise((r) => setTimeout(r, 5000));
          }
          continue;
        }

        if (tokenData.error === "expired_token") throw new Error("Device code expired.");
        if (tokenData.error === "access_denied") throw new Error("Authorization denied.");
        throw new Error(`OAuth error: ${tokenData.error}`);
      }

      throw new Error("Login timed out.");
    },
  };
}
