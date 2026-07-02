import { githubConfig, isGithubStorageConfigured } from "../config/githubConfig";
import type { AperitifEvent, AperitifOption, ParticipantResponse } from "../types/apero";
import type { RewardsLedger } from "../types/rewards";
import { appendEventOption, normalizeEvent, upsertParticipant } from "../utils/eventNormalization";
import {
  buildPurgedEventRecord,
  createEmptyRewardsLedger,
  isEventExpired,
  normalizeRewardsLedger,
  updateRewardsLedger,
} from "./eventPurge";
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
  addOption: "Nouvelle contre-proposition déposée au zinc",
  purgeEvent: "Purge des apéros expirés et mise à jour du registre des récompenses",
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

function getRewardsLedgerPath(): string {
  const normalizedDataPath = githubConfig.dataPath.replace(/\/$/, "");
  const dataRoot = normalizedDataPath.endsWith("/events")
    ? normalizedDataPath.slice(0, -"/events".length)
    : "data";

  return `${dataRoot || "data"}/rewards/ledger.json`;
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
      "Configuration GitHub absente. Ajoute les variables VITE_GITHUB_* avant d’écrire dans le repo.",
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

async function readJsonFile<T>(
  path: string,
  normalize: (value: unknown) => T,
): Promise<{ data: T; sha: string } | null> {
  const response = await fetch(`${getContentsUrlForPath(path)}?ref=${githubConfig.branch}`, {
    headers: createHeaders(false),
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new GitHubStorageError(
      "github-error",
      `GitHub refuse de lire le registre de la Confrérie (${response.status}).`,
    );
  }

  const file = (await response.json()) as GitHubContentResponse;
  return { data: normalize(JSON.parse(decodeBase64(file.content))), sha: file.sha };
}

async function readEventFile(
  eventId: string,
): Promise<{ event: AperitifEvent; sha: string } | null> {
  const file = await readJsonFile(getEventPath(eventId), normalizeEvent);
  return file ? { event: file.data, sha: file.sha } : null;
}

async function readRewardsLedgerFile(): Promise<{ ledger: RewardsLedger; sha?: string }> {
  const file = await readJsonFile(getRewardsLedgerPath(), (value) => normalizeRewardsLedger(value));

  if (!file) {
    return { ledger: createEmptyRewardsLedger() };
  }

  return { ledger: file.data, sha: file.sha };
}

async function listEventFiles(): Promise<GitHubDirectoryItem[]> {
  const response = await fetch(
    `${getContentsUrlForPath(githubConfig.dataPath)}?ref=${githubConfig.branch}`,
    { headers: createHeaders(false), cache: "no-store" },
  );

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new GitHubStorageError(
      "github-error",
      `GitHub refuse de lister les assemblées (${response.status}).`,
    );
  }

  const items = (await response.json()) as GitHubDirectoryItem[];
  return items.filter((item) => item.type === "file" && item.name.endsWith(".json"));
}

async function writeJsonFile(
  path: string,
  value: unknown,
  message: string,
  sha?: string,
): Promise<void> {
  const response = await fetch(getContentsUrlForPath(path), {
    method: "PUT",
    headers: createHeaders(true),
    body: JSON.stringify({
      message,
      content: encodeBase64(JSON.stringify(value, null, 2)),
      branch: githubConfig.branch,
      sha,
    }),
  });

  if (response.status === 409) {
    throw new GitHubStorageError(
      "conflict",
      "Le comptoir est saturé, complètement débordé, à deux doigts de la rupture d’anévrisme administratif. Réessaie dans deux secondes, ça devrait passer.",
    );
  }

  if (!response.ok) {
    throw new GitHubStorageError(
      "github-error",
      `GitHub refuse d’écrire sur le registre (${response.status}).`,
    );
  }
}

async function writeEventFile(
  event: AperitifEvent,
  message: string,
  sha?: string,
): Promise<void> {
  await writeJsonFile(getEventPath(event.id), event, message, sha);
}

async function writeRewardsLedgerFile(ledger: RewardsLedger, sha?: string): Promise<void> {
  await writeJsonFile(getRewardsLedgerPath(), ledger, COMMIT_MESSAGES.purgeEvent, sha);
}

async function deleteEventFile(eventId: string, sha: string): Promise<void> {
  const response = await fetch(getContentsUrl(eventId), {
    method: "DELETE",
    headers: createHeaders(true),
    body: JSON.stringify({
      message: COMMIT_MESSAGES.purgeEvent,
      branch: githubConfig.branch,
      sha,
    }),
  });

  if (response.status === 404) {
    return;
  }

  if (response.status === 409) {
    throw new GitHubStorageError(
      "conflict",
      "Le comptoir est saturé, complètement débordé, à deux doigts de la rupture d’anévrisme administratif. Réessaie dans deux secondes, ça devrait passer.",
    );
  }

  if (!response.ok) {
    throw new GitHubStorageError(
      "github-error",
      `GitHub refuse de retirer l’assemblée expirée (${response.status}).`,
    );
  }
}

async function purgeEventFile(existingFile: { event: AperitifEvent; sha: string }): Promise<void> {
  const { ledger, sha: ledgerSha } = await readRewardsLedgerFile();
  const alreadyPurged = ledger.purgedEvents.some(
    (record) => record.eventId === existingFile.event.id,
  );

  if (alreadyPurged) {
    await deleteEventFile(existingFile.event.id, existingFile.sha);
    return;
  }

  const purgedRecord = buildPurgedEventRecord(existingFile.event, new Date());
  const updatedLedger = updateRewardsLedger(ledger, existingFile.event, purgedRecord);
  await writeRewardsLedgerFile(updatedLedger, ledgerSha);

  const verifiedLedger = await readRewardsLedgerFile();
  const hasVerifiedRecord = verifiedLedger.ledger.purgedEvents.some(
    (record) => record.eventId === existingFile.event.id,
  );

  if (!hasVerifiedRecord) {
    throw new GitHubStorageError(
      "github-error",
      "La Confrérie refuse tout net de purger sans trace vérifiée dans le registre des récompenses : pas de preuve, pas de radiation.",
    );
  }

  await deleteEventFile(existingFile.event.id, existingFile.sha);
}

export const githubEventStorage: EventStorage = {
  async getEvent(id: string) {
    const file = await readEventFile(id);

    if (!file) {
      return null;
    }

    if (isEventExpired(file.event, new Date())) {
      await purgeEventFile(file);
      return null;
    }

    return file.event;
  },

  async isEventPurged(id: string) {
    const { ledger } = await readRewardsLedgerFile();
    return ledger.purgedEvents.some((record) => record.eventId === id);
  },

  async listActiveEvents() {
    const files = await listEventFiles();
    const events = await Promise.all(
      files.map(async (file) => {
        const eventId = file.name.replace(/\.json$/, "");
        const eventFile = await readEventFile(eventId);

        if (!eventFile) {
          return null;
        }

        if (isEventExpired(eventFile.event, new Date())) {
          await purgeEventFile(eventFile);
          return null;
        }

        return eventFile.event;
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
        "Un registre existe déjà avec cet identifiant. Le hasard a trop traîné au bar.",
      );
    }

    await writeEventFile(event, COMMIT_MESSAGES.createEvent);
  },

  async updateEvent(event: AperitifEvent) {
    const existingFile = await readEventFile(event.id);

    if (!existingFile) {
      throw new GitHubStorageError("not-found", "Assemblée introuvable.");
    }

    await writeEventFile(event, COMMIT_MESSAGES.updateEvent, existingFile.sha);
  },

  async addEventOption(eventId: string, option: AperitifOption) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const existingFile = await readEventFile(eventId);

      if (!existingFile) {
        throw new GitHubStorageError("not-found", "Assemblée introuvable.");
      }

      if (isEventExpired(existingFile.event, new Date())) {
        await purgeEventFile(existingFile);
        throw new GitHubStorageError("not-found", "Cette assemblée a quitté le comptoir.");
      }

      const updatedEvent = appendEventOption(existingFile.event, option);

      try {
        await writeEventFile(
          updatedEvent,
          COMMIT_MESSAGES.addOption,
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
      "Le registre du zinc s’entête à refuser de s’ouvrir, avec une mauvaise foi qui force presque le respect. Réessaie dans un instant.",
    );
  },

  async saveParticipantResponse(eventId: string, response: ParticipantResponse) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const existingFile = await readEventFile(eventId);

      if (!existingFile) {
        throw new GitHubStorageError("not-found", "Assemblée introuvable.");
      }

      if (isEventExpired(existingFile.event, new Date())) {
        await purgeEventFile(existingFile);
        throw new GitHubStorageError("not-found", "Cette assemblée a quitté le comptoir.");
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
      "Le comptoir est saturé, complètement débordé, à deux doigts de la rupture d’anévrisme administratif. Réessaie dans deux secondes, ça devrait passer.",
    );
  },

  async deleteEvent(id: string) {
    const existingFile = await readEventFile(id);

    if (!existingFile) {
      return;
    }

    await deleteEventFile(id, existingFile.sha);
  },

  async readRewardsLedger() {
    const { ledger } = await readRewardsLedgerFile();
    return ledger;
  },

  async purgeExpiredEvents() {
    const files = await listEventFiles();

    for (const file of files) {
      const eventId = file.name.replace(/\.json$/, "");
      const eventFile = await readEventFile(eventId);

      if (eventFile && isEventExpired(eventFile.event, new Date())) {
        await purgeEventFile(eventFile);
      }
    }
  },
};