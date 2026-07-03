// Repository frontend du nouveau flux chiffre (mode api-vps).
// Fait le pont entre : chiffrement client (aperoEncryption), registre local
// (localAperoRegistry), lecture publique du fichier apero (GitHub Contents
// API SANS token) et ecriture via la mini API VPS (aperoApiClient).
// Aucun appel GitHub authentifie ne part d'ici.

import { githubConfig } from "../config/githubConfig";
import type { AperitifEvent, AperitifOption, ParticipantResponse } from "../types/apero";
import type { LocalAperoEntry, StoredEncryptedAperoFile } from "../types/encryptedApero";
import { appendEventOption, normalizeEvent, upsertParticipant } from "../utils/eventNormalization";
import { sanitizeAperoEvent } from "../utils/aperoValidation";
import {
  AperoApiError,
  createOrUpdateEncryptedApero,
  deleteEncryptedApero as deleteEncryptedAperoApi,
} from "./aperoApiClient";
import { generateAperoId, generateBase64UrlRandomKey, isValidAperoId, sha256Hex } from "./aperoCryptoKeys";
import { decryptAperoData, encryptAperoData, ENCRYPTION_KEY_BYTE_LENGTH } from "./aperoEncryption";
import { findLocalApero, getLocalAperos, removeLocalApero, saveLocalApero } from "./localAperoRegistry";

// 24 octets => 32 caracteres base64url, compatible avec les contraintes API.
const WRITE_KEY_BYTE_LENGTH = 24;
const ADMIN_KEY_BYTE_LENGTH = 24;

// Chemin public des fichiers chiffres, miroir de server/src/config.ts.
const APEROS_DATA_PATH = "data/aperos";

export type EncryptedAperoErrorCode = "NOT_FOUND" | "UNREADABLE_FILE";

export class EncryptedAperoError extends Error {
  readonly code: EncryptedAperoErrorCode;

  constructor(code: EncryptedAperoErrorCode, message: string) {
    super(message);
    this.name = "EncryptedAperoError";
    this.code = code;
  }
}

function decodeBase64Content(value: string): string {
  const binary = atob(value.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * Lecture publique du fichier chiffre via GitHub Contents API, SANS token :
 * le repo est public et ce flux ne doit jamais transporter d'Authorization.
 * Retourne aussi le sha GitHub, indispensable comme baseSha anti-conflit.
 */
export async function readPublicAperoFile(
  aperoId: string,
): Promise<{ file: StoredEncryptedAperoFile; sha: string } | null> {
  if (!isValidAperoId(aperoId)) {
    return null;
  }

  const url =
    `https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}` +
    `/contents/${APEROS_DATA_PATH}/${aperoId}.json?ref=${githubConfig.branch}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new EncryptedAperoError(
      "UNREADABLE_FILE",
      `Lecture publique impossible (HTTP ${response.status}).`,
    );
  }

  try {
    const body = (await response.json()) as { content: string; sha: string };
    const file = JSON.parse(decodeBase64Content(body.content)) as StoredEncryptedAperoFile;
    return { file, sha: body.sha };
  } catch {
    throw new EncryptedAperoError("UNREADABLE_FILE", "Fichier apero illisible.");
  }
}

function getCachedEvent(entry: LocalAperoEntry): AperitifEvent | null {
  if (!entry.lastKnownEvent) {
    return null;
  }

  try {
    return normalizeEvent(entry.lastKnownEvent, entry.aperoId);
  } catch {
    return null;
  }
}

function cacheLocalAperoEvent(aperoId: string, event: AperitifEvent): void {
  const entry = findLocalApero(aperoId);

  if (!entry) {
    return;
  }

  saveLocalApero({
    aperoId,
    encryptionKey: entry.encryptionKey,
    writeKey: entry.writeKey,
    adminKey: entry.adminKey,
    lastKnownEvent: event,
    displayName: entry.displayName,
    role: entry.role,
  });
}

export type CreateEncryptedAperoInput = Omit<AperitifEvent, "id">;

export type CreateEncryptedAperoResult = {
  aperoId: string;
  encryptionKey: string;
  writeKey: string;
  event: AperitifEvent;
  sha: string;
};

/**
 * Creation complete : identifiant + cles generes ici, donnees chiffrees,
 * envoi a l'API VPS, puis memorisation dans le registre local (role creator).
 */
export async function createEncryptedApero(
  input: CreateEncryptedAperoInput,
): Promise<CreateEncryptedAperoResult> {
  const aperoId = generateAperoId();
  const encryptionKey = generateBase64UrlRandomKey(ENCRYPTION_KEY_BYTE_LENGTH);
  const writeKey = generateBase64UrlRandomKey(WRITE_KEY_BYTE_LENGTH);
  // Cette cle ne va jamais dans le lien d'invitation : elle reste sur l'appareil
  // du createur et sert uniquement aux actions destructives.
  const adminKey = generateBase64UrlRandomKey(ADMIN_KEY_BYTE_LENGTH);

  const event = sanitizeAperoEvent({ ...input, id: aperoId }, aperoId);
  const encryptedPayload = await encryptAperoData(event, encryptionKey);
  const writeKeyHash = await sha256Hex(writeKey);
  const adminKeyHash = await sha256Hex(adminKey);

  const result = await createOrUpdateEncryptedApero({
    aperoId,
    writeKey,
    encryptedPayload,
    writeKeyHash,
    adminKeyHash,
  });

  saveLocalApero({
    aperoId,
    encryptionKey,
    writeKey,
    adminKey,
    lastKnownEvent: event,
    displayName: event.organizerName,
    role: "creator",
  });

  return { aperoId, encryptionKey, writeKey, event, sha: result.sha };
}

/**
 * Lecture + dechiffrement d'un apero. Retourne null si le fichier n'existe
 * pas. Laisse remonter AperoCryptoError si la cle est invalide.
 */
export async function getEncryptedAperoById(
  aperoId: string,
  encryptionKey: string,
): Promise<{ event: AperitifEvent; sha: string } | null> {
  const stored = await readPublicAperoFile(aperoId);

  if (!stored) {
    return null;
  }

  const rawEvent = await decryptAperoData<unknown>(
    { version: 1, encryption: stored.file.encryption },
    encryptionKey,
  );
  const event = normalizeEvent(rawEvent, aperoId);

  return { event, sha: stored.sha };
}

/**
 * Mise a jour : relit la derniere version publique, applique `updater`,
 * rechiffre, envoie avec baseSha. En cas de 409, retente une fois sur la
 * version fraiche. Jamais d'ecrasement silencieux.
 */
export async function updateEncryptedApero(
  aperoId: string,
  writeKey: string,
  encryptionKey: string,
  updater: (event: AperitifEvent) => AperitifEvent,
): Promise<AperitifEvent> {
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const current = await getEncryptedAperoById(aperoId, encryptionKey);

    if (!current) {
      throw new EncryptedAperoError("NOT_FOUND", "Cet apero n'existe pas ou plus.");
    }

    const updatedEvent = sanitizeAperoEvent(
      {
        ...updater(current.event),
        id: aperoId,
        updatedAt: new Date().toISOString(),
      },
      aperoId,
    );

    const encryptedPayload = await encryptAperoData(updatedEvent, encryptionKey);

    try {
      await createOrUpdateEncryptedApero({
        aperoId,
        writeKey,
        encryptedPayload,
        baseSha: current.sha,
      });
      cacheLocalAperoEvent(aperoId, updatedEvent);
      return updatedEvent;
    } catch (error) {
      const isRetryableConflict =
        error instanceof AperoApiError && error.code === "CONFLICT" && attempt < maxAttempts;

      if (!isRetryableConflict) {
        throw error;
      }
    }
  }

  throw new AperoApiError("CONFLICT", "Conflit d'ecriture persistant.");
}

/**
 * Rejoindre un apero : ajoute/actualise la reponse du participant dans les
 * donnees chiffrees et memorise l'apero dans le registre local.
 */
export async function joinApero(
  aperoId: string,
  writeKey: string,
  encryptionKey: string,
  participant: ParticipantResponse,
): Promise<AperitifEvent> {
  saveLocalApero({
    aperoId,
    encryptionKey,
    writeKey,
    displayName: participant.participantName,
    role: "participant",
  });

  return updateEncryptedApero(aperoId, writeKey, encryptionKey, (event) =>
    upsertParticipant(event, participant),
  );
}

/** Ajoute un creneau propose par un porteur de la write key. */
export async function addEncryptedAperoOption(
  aperoId: string,
  writeKey: string,
  encryptionKey: string,
  option: AperitifOption,
): Promise<AperitifEvent> {
  return updateEncryptedApero(aperoId, writeKey, encryptionKey, (event) =>
    appendEventOption(event, option),
  );
}

/**
 * Suppression definitive d'un apero par le createur. Les nouveaux aperos utilisent
 * adminKey. Les anciens peuvent utiliser legacyWriteKey seulement si le serveur
 * l'autorise explicitement, le temps de purger les anciens fichiers.
 */
export async function deleteEncryptedApero(
  aperoId: string,
  credentials: { adminKey?: string; legacyWriteKey?: string },
): Promise<void> {
  const current = await readPublicAperoFile(aperoId);

  await deleteEncryptedAperoApi({
    aperoId,
    adminKey: credentials.adminKey,
    legacyWriteKey: credentials.legacyWriteKey,
    baseSha: current?.sha,
  });
  removeLocalApero(aperoId);
}

export type MyAperoItem = {
  entry: LocalAperoEntry;
  event: AperitifEvent | null;
};

/** "Mes aperos" : uniquement les aperos du registre local. */
export async function getMyAperos(): Promise<MyAperoItem[]> {
  const entries = getLocalAperos();

  return Promise.all(
    entries.map(async (entry) => {
      const cachedEvent = getCachedEvent(entry);

      try {
        const loaded = await getEncryptedAperoById(entry.aperoId, entry.encryptionKey);

        if (loaded?.event) {
          cacheLocalAperoEvent(entry.aperoId, loaded.event);
          return { entry: findLocalApero(entry.aperoId) ?? entry, event: loaded.event };
        }

        return { entry, event: cachedEvent };
      } catch {
        return { entry, event: cachedEvent };
      }
    }),
  );
}

export function findLocalAperoEntry(aperoId: string): LocalAperoEntry | null {
  return findLocalApero(aperoId);
}
