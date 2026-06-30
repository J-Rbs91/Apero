import { githubConfig, isGithubStorageConfigured } from "../config/githubConfig";
import type { AperitifEvent, ParticipantResponse } from "../types/apero";
import { normalizeEvent, upsertParticipant } from "../utils/eventNormalization";
import type { EventStorage } from "./EventStorage";

type GitHubContentResponse = {
  content: string;
  sha: string;
};

type GitHubErrorCode =
  | "missing-config"
  | "not-found"
  | "conflict"
  | "github-error";

export class GitHubStorageError extends Error {
  code: GitHubErrorCode;

  constructor(code: GitHubErrorCode, message: string) {
    super(message);
    this.name = "GitHubStorageError";
    this.code = code;
  }
}

function getEventPath(eventId: string): string {
  return `${githubConfig.dataPath.replace(/\/$/, "")}/${eventId}.json`;
}

function getContentsUrl(eventId: string): string {
  const path = encodeURIComponent(getEventPath(eventId)).replaceAll("%2F", "/");
  return `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${path}`;
}

function assertConfigured() {
  if (!isGithubStorageConfigured()) {
    throw new GitHubStorageError(
      "missing-config",
      "Configuration GitHub absente. Ajoute les variables VITE_GITHUB_* avant d'ecrire dans le repo.",
    );
  }
}

function createHeaders(requireToken = true): HeadersInit {
  if (requireToken) {
    assertConfigured();
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (githubConfig.token) {
    headers.Authorization = `Bearer ${githubConfig.token}`;
  }

  return headers;
}

function encodeBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function decodeBase64(value: string): string {
  const binary = atob(value.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function readEventFile(
  eventId: string,
): Promise<{ event: AperitifEvent; sha: string } | null> {
  const response = await fetch(`${getContentsUrl(eventId)}?ref=${githubConfig.branch}`, {
    headers: createHeaders(false),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new GitHubStorageError(
      "github-error",
      `GitHub refuse de lire le ticket du comptoir (${response.status}).`,
    );
  }

  const file = (await response.json()) as GitHubContentResponse;
  const event = normalizeEvent(JSON.parse(decodeBase64(file.content)));

  return { event, sha: file.sha };
}

async function writeEventFile(
  event: AperitifEvent,
  message: string,
  sha?: string,
): Promise<void> {
  const response = await fetch(getContentsUrl(event.id), {
    method: "PUT",
    headers: createHeaders(true),
    body: JSON.stringify({
      message,
      content: encodeBase64(JSON.stringify(event, null, 2)),
      branch: githubConfig.branch,
      sha,
    }),
  });

  if (response.status === 409) {
    throw new GitHubStorageError(
      "conflict",
      "Le comptoir est sature, retente dans deux secondes.",
    );
  }

  if (!response.ok) {
    throw new GitHubStorageError(
      "github-error",
      `GitHub refuse d'ecrire sur le ticket (${response.status}).`,
    );
  }
}

export const githubEventStorage: EventStorage = {
  async getEvent(id: string) {
    const file = await readEventFile(id);
    return file?.event ?? null;
  },

  async createEvent(event: AperitifEvent) {
    const existingFile = await readEventFile(event.id);

    if (existingFile) {
      throw new GitHubStorageError(
        "conflict",
        "Un ticket existe deja avec cet identifiant. Le hasard a trop traine au bar.",
      );
    }

    await writeEventFile(event, "Nouvel apero pose sur le comptoir");
  },

  async updateEvent(event: AperitifEvent) {
    const existingFile = await readEventFile(event.id);

    if (!existingFile) {
      throw new GitHubStorageError("not-found", "Evenement introuvable.");
    }

    await writeEventFile(event, "Mise a jour de l'apero", existingFile.sha);
  },

  async saveParticipantResponse(eventId: string, response: ParticipantResponse) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const existingFile = await readEventFile(eventId);

      if (!existingFile) {
        throw new GitHubStorageError("not-found", "Evenement introuvable.");
      }

      const updatedEvent = upsertParticipant(existingFile.event, response);

      try {
        await writeEventFile(
          updatedEvent,
          `Vote ajoute au scrutin du zinc par ${response.participantName}`,
          existingFile.sha,
        );
        return updatedEvent;
      } catch (error) {
        const isLastAttempt = attempt === 1;

        if (
          error instanceof GitHubStorageError &&
          error.code === "conflict" &&
          !isLastAttempt
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new GitHubStorageError(
      "conflict",
      "Le comptoir est sature, retente dans deux secondes.",
    );
  },
};
