import { config, isGithubWriteConfigured } from "./config.js";
import { ApiError } from "./errors.js";
import { logger } from "./logger.js";

export type AperoEncryption = {
  algorithm: "AES-GCM";
  iv: string;
  ciphertext: string;
};

// Format du fichier data/aperos/{aperoId}.json stocké dans le repo.
// Le serveur ne stocke jamais writeKey ni encryptionKey, et ne déchiffre rien.
export type StoredAperoFile = {
  id: string;
  version: number;
  writeKeyHash: string;
  adminKeyHash?: string;
  encryption: AperoEncryption;
  createdAt: string;
  updatedAt: string;
};

type GitHubContentResponse = {
  content?: string;
  sha?: string;
};

type GitHubWriteResponse = {
  content?: { sha?: string } | null;
};

function aperoFilePath(aperoId: string): string {
  return `${config.aperosDataPath}/${aperoId}.json`;
}

function contentsUrl(aperoId: string): string {
  return `https://api.github.com/repos/${config.githubOwner}/${config.githubRepo}/contents/${aperoFilePath(aperoId)}`;
}

function githubHeaders(): Record<string, string> {
  if (!isGithubWriteConfigured()) {
    throw new ApiError(
      500,
      "SERVER_MISCONFIGURED",
      "GitHub access is not configured on the server.",
    );
  }

  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${config.githubToken}`,
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "apero-api",
  };
}

async function fetchGitHub(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(config.githubRequestTimeoutMs),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`GitHub request failed before response: ${message}`);
    throw new ApiError(502, "GITHUB_ERROR", "GitHub API is unreachable or timed out.");
  }
}

export async function getAperoFile(
  aperoId: string,
): Promise<{ json: unknown; sha: string } | null> {
  const response = await fetchGitHub(`${contentsUrl(aperoId)}?ref=${config.githubBranch}`, {
    headers: githubHeaders(),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    logger.warn(`GitHub read failed for ${aperoId} (status ${response.status})`);
    throw new ApiError(502, "GITHUB_ERROR", "GitHub API rejected the read request.");
  }

  const file = (await response.json()) as GitHubContentResponse;

  if (typeof file.content !== "string" || typeof file.sha !== "string") {
    throw new ApiError(502, "GITHUB_ERROR", "Unexpected GitHub API response.");
  }

  try {
    const decoded = Buffer.from(file.content.replaceAll("\n", ""), "base64").toString("utf8");
    return { json: JSON.parse(decoded), sha: file.sha };
  } catch {
    throw new ApiError(502, "GITHUB_ERROR", "Stored apero file is not valid JSON.");
  }
}

export async function createOrUpdateAperoFile(
  aperoId: string,
  content: StoredAperoFile,
  sha?: string,
): Promise<{ sha: string }> {
  const message = sha ? `chore: update apero ${aperoId}` : `chore: create apero ${aperoId}`;

  const response = await fetchGitHub(contentsUrl(aperoId), {
    method: "PUT",
    headers: githubHeaders(),
    body: JSON.stringify({
      message,
      content: Buffer.from(`${JSON.stringify(content, null, 2)}\n`, "utf8").toString("base64"),
      branch: config.githubBranch,
      ...(sha ? { sha } : {}),
    }),
  });

  // 409 : conflit de branche. 422 : sha manquant ou périmé pour un fichier
  // qui existe déjà. Dans les deux cas le client doit relire puis réessayer.
  if (response.status === 409 || response.status === 422) {
    logger.warn(`GitHub write conflict for ${aperoId} (status ${response.status})`);
    throw new ApiError(
      409,
      "CONFLICT",
      "The apero file changed on GitHub. Fetch the latest version and retry.",
    );
  }

  if (!response.ok) {
    logger.warn(`GitHub write failed for ${aperoId} (status ${response.status})`);
    throw new ApiError(502, "GITHUB_ERROR", "GitHub API rejected the write request.");
  }

  const result = (await response.json()) as GitHubWriteResponse;
  const newSha = result.content?.sha;

  if (typeof newSha !== "string") {
    throw new ApiError(502, "GITHUB_ERROR", "Unexpected GitHub API response.");
  }

  return { sha: newSha };
}

export async function deleteAperoFile(aperoId: string, sha: string): Promise<void> {
  const response = await fetchGitHub(contentsUrl(aperoId), {
    method: "DELETE",
    headers: githubHeaders(),
    body: JSON.stringify({
      message: `chore: delete apero ${aperoId}`,
      sha,
      branch: config.githubBranch,
    }),
  });

  // Fichier déjà disparu entre le get et le delete : on considère l'objectif
  // atteint (idempotence).
  if (response.status === 404) {
    return;
  }

  // 409 / 422 : le sha a bougé (course d'écriture). Le client doit relire.
  if (response.status === 409 || response.status === 422) {
    logger.warn(`GitHub delete conflict for ${aperoId} (status ${response.status})`);
    throw new ApiError(
      409,
      "CONFLICT",
      "The apero file changed on GitHub. Fetch the latest version and retry.",
    );
  }

  if (!response.ok) {
    logger.warn(`GitHub delete failed for ${aperoId} (status ${response.status})`);
    throw new ApiError(502, "GITHUB_ERROR", "GitHub API rejected the delete request.");
  }
}
