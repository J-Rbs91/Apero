import { githubConfig, isGithubStorageConfigured } from "../config/githubConfig";
import type { AperitifEvent, ParticipantResponse } from "../types/apero";
import { normalizeEvent, upsertParticipant } from "../utils/eventNormalization";
import type { EventStorage } from "./EventStorage";

type GitHubContentResponse = {
  content: string;
  sha: string;
};

type GitHubDirectoryItem = {
  name: string;
  path: string;
  type: "file" | "dir" | "symlink" | "submodule";
};

const COMMIT_MESSAGES = {
  createEvent: "Nouvelle assemblée créée dans La Confrérie du Petit Jaune",
  updateEvent: "Mise à jour du scrutin du zinc",
  addVote: "Nouveau suffrage déposé au comptoir",
  updateVote: "Suffrage modifié dans le registre",
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

function getContentsUrlForPath(path: string): string {
  const encodedPath = encodeURIComponent(path).replaceAll("%2F", "/");
  return `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}/contents/${encodedPath}`;
}

function getContentsUrl(eventId: string): string {
  return getContentsUrlForPath(getEventPath(eventId));
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
      `GitHub refuse de lire le registre de la Confrerie (${response.status}).`,
    );
  }

  const file = (await response.json()) as GitHubContentResponse;
  const event = normalizeEvent(JSON.parse(decodeBase64(file.content)));

  return { event, sha: file.sha };
}

async function listEventFiles(): Promise<GitHubDirectoryItem[]> {
  const response = await fetch(
    `${getContentsUrlForPath(githubConfig.dataPath)}?ref=${githubConfig.branch}`,
    { headers: createHeaders(false) },
  );

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new GitHubStorageError(
      "github-error",
      `GitHub refuse de lister les assemblees (${response.status}).`,
    );
  }

  const items = (await response.json()) as GitHubDirectoryItem[];
  return items.filter((item) => item.type === "file" && item.name.endsWith(".json"));
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
      `GitHub refuse d'ecrire sur le registre (${response.status}).`,
    );
  }
}

export const githubEventStorage: EventStorage = {
  async getEvent(id: string) {
    const file = await readEventFile(id);
    return file?.event ?? null;
  },

  async listActiveEvents() {
    const files = await listEventFiles();
    const events = await Promise.all(
      files.map(async (file) => {
        const eventId = file.name.replace(/\.json$/, "");
        return this.getEvent(eventId);
      }),
    );

    return events.filter(
      (event): event is AperitifEvent => Boolean(event) && event?.status === "active",
    );
  },

  async createEvent(event: AperitifEvent) {
    const existingFile = await readEventFile(event.id);

    if (existingFile) {
      throw new GitHubStorageError(
        "conflict",
        "Un registre existe deja avec cet identifiant. Le hasard a trop traine au bar.",
      );
    }

    await writeEventFile(event, COMMIT_MESSAGES.createEvent);
  },

  async updateEvent(event: AperitifEvent) {
    const existingFile = await readEventFile(event.id);

    if (!existingFile) {
      throw new GitHubStorageError("not-found", "Assemblee introuvable.");
    }

    await writeEventFile(event, COMMIT_MESSAGES.updateEvent, existingFile.sha);
  },

  async saveParticipantResponse(eventId: string, response: ParticipantResponse) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const existingFile = await readEventFile(eventId);

      if (!existingFile) {
        throw new GitHubStorageError("not-found", "Assemblee introuvable.");
      }

      const updatedEvent = upsertParticipant(existingFile.event, response);

      try {
        await writeEventFile(
          updatedEvent,
          COMMIT_MESSAGES.addVote,
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

