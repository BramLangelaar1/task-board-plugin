import crypto from "node:crypto";

/**
 * Resolve a GitHub token for reading a board.
 * Prefers a GitHub App installation token (the chosen auth); falls back to a PAT; else undefined
 * (public repos read fine unauthenticated, subject to the lower rate limit).
 */
export async function resolveGitHubToken(): Promise<string | undefined> {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;

  if (appId && privateKey && installationId) {
    return mintInstallationToken(appId, privateKey, installationId);
  }
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  return undefined;
}

async function mintInstallationToken(
  appId: string,
  privateKeyRaw: string,
  installationId: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId }));
  const signingInput = `${header}.${payload}`;
  // Env vars commonly store the PEM with literal `\n`; restore real newlines.
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
  const signature = crypto
    .sign("RSA-SHA256", Buffer.from(signingInput), privateKey)
    .toString("base64url");
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "task-board-plugin",
      },
    },
  );
  if (!res.ok) {
    throw new Error(`GitHub App token mint failed -> ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { token: string };
  return json.token;
}

function base64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}
