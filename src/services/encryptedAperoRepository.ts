// Repository frontend du nouveau flux chiffré (mode api-vps).
// Fait le pont entre : chiffrement client (aperoEncryption), registre local
// (localAperoRegistry), lecture publique du fichier apéro (GitHub Contents
// API SANS token — le repo est public) et écriture via la mini API VPS
// (aperoApiClient). Aucun appel GitHub authentifié ne part d'ici.

import { githubConfig } from "../config/githubConfig";
import type { AperitifEvent, AperitifOption, ParticipantResponse } from "../types/apero";
import type { LocalAperoEntry, StoredEncryptedAperoFile } from "../types/encryptedApero";
import { appendEventOption, upsertParticipant } from "../utils/eventNormalization";
import {
  AperoApiError,
  createOrUpdateEncryptedApero,
  deleteEncryptedApero as deleteEncryptedAperoApi,
} from "./aperoApiClient";
import { generateAperoId, generateBase64UrlRandomKey, isValidAperoId, sha256Hex } from "./aperoCryptoKeys";
import { decryptAperoData, encryptAperoData, ENCRYPTION_KEY_BYTE_LENGTH } from "./aperoEncryption";
import { findLocalApero, getLocalAperos, removeLocalApero, saveLocalApero } from "./localAperoRegistry";

// Longueur du writeKey en octets (24 octets => 32 caractères base64url,
// compatible avec la contrainte serveur de 8 à 256 caractères).
const WRITE_KEY_BYTE_LENGTH = 24;

// Chemin public des fichiers chiffrés — miroir de server/src/config.ts.
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
 * Lecture publique du fichier chiffré via GitHub Contents API, SANS token :
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
    throw new EncryptedAperoError("UNREADABLE_FILE", "Fichier apéro illisible.");
  }
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
 * Création complète : identifiant + clés générés ici, données chiffrées,
 * envoi à l'API VPS, puis mémorisation dans le registre local (rôle creator).
 */
export async function createEncryptedApero(
  input: CreateEncryptedAperoInput,
): Promise<CreateEncryptedAperoResult> {
  const aperoId = generateAperoId();
  const encryptionKey = generateBase64UrlRandomKey(ENCRYPTION_KEY_BYTE_LENGTH);
  const writeKey = generateBase64UrlRandomKey(WRITE_KEY_BYTE_LENGTH);

  const event: AperitifEvent = { ...input, id: aperoId };
  const encryptedPayload = await encryptAperoData(event, encryptionKey);
  const writeKeyHash = await sha256Hex(writeKey);

  const result = await createOrUpdateEncryptedApero({
    aperoId,
    writeKey,
    encryptedPayload,
    writeKeyHash,
  });

  saveLocalApero({
    aperoId,
    encryptionKey,
    writeKey,
    displayName: event.organizerName,
    role: "creator",
  });

  return { aperoId, encryptionKey, writeKey, event, sha: result.sha };
}

/**
 * Lecture + déchiffrement d'un apéro. Retourne null si le fichier n'existe
 * pas. Laisse remonter AperoCryptoError si la clé est invalide.
 */
export async function getEncryptedAperoById(
  aperoId: string,
  encryptionKey: string,
): Promise<{ event: AperitifEvent; sha: string } | null> {
  const stored = await readPublicAperoFile(aperoId);

  if (!stored) {
    return null;
  }

  const event = await decryptAperoData<AperitifEvent>(
    { version: 1, encryption: stored.file.encryption },
    encryptionKey,
  );

  return { event, sha: stored.sha };
}

/**
 * Mise à jour : relit la dernière version publique, applique `updater`,
 * rechiffre, envoie avec baseSha. En cas de 409 (le fichier a bougé entre
 * temps), retente une fois sur la version fraîche — jamais d'écrasement
 * silencieux, c'est l'API qui arbitre via le sha.
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
      throw new EncryptedAperoError("NOT_FOUND", "Cet apéro n'existe pas ou plus.");
    }

    const updatedEvent: AperitifEvent = {
      ...updater(current.event),
      id: aperoId,
      updatedAt: new Date().toISOString(),
    };

    const encryptedPayload = await encryptAperoData(updatedEvent, encryptionKey);

    try {
      await createOrUpdateEncryptedApero({
        aperoId,
        writeKey,
        encryptedPayload,
        baseSha: current.sha,
      });
      return updatedEvent;
    } catch (error) {
      const isRetryableConflict =
        error instanceof AperoApiError && error.code === "CONFLICT" && attempt < maxAttempts;

      if (!isRetryableConflict) {
        throw error;
      }
    }
  }

  // Jamais atteint (le dernier échec est relancé ci-dessus), mais TypeScript
  // et la prudence aiment les fins explicites.
  throw new AperoApiError("CONFLICT", "Conflit d'écriture persistant.");
}

/**
 * Rejoindre un apéro : ajoute/actualise la réponse du participant dans les
 * données chiffrées et mémorise l'apéro dans le registre local.
 */
export async function joinApero(
  aperoId: string,
  writeKey: string,
  encryptionKey: string,
  participant: ParticipantResponse,
): Promise<AperitifEvent> {
  // Mémorisé avant l'écriture réseau : même si l'API est momentanément
  // injoignable, l'invité garde le lien de l'apéro dans « Mes apéros ».
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

/**
 * Ajoute un créneau (proposition de date / horaire / lieu) à un apéro chiffré.
 * Ouvert à tous les porteurs de la write key : organisateur comme invités.
 */
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
 * Suppression définitive d'un apéro par l'organisateur (fausse manip, erreur
 * de création, annulation). Authentifiée par la write key côté serveur. On
 * nettoie ensuite tout ce qui reste localement (registre « Mes apéros »).
 */
export async function deleteEncryptedApero(aperoId: string, writeKey: string): Promise<void> {
  await deleteEncryptedAperoApi({ aperoId, writeKey });
  removeLocalApero(aperoId);
}

export type MyAperoItem = {
  entry: LocalAperoEntry;
  event: AperitifEvent | null;
};

/**
 * « Mes apéros » : uniquement les apéros du registre local, chargés via la
 * lecture publique puis déchiffrés. Un apéro illisible (supprimé, clé
 * invalide…) est renvoyé avec event: null — l'UI décide quoi en faire.
 */
export async function getMyAperos(): Promise<MyAperoItem[]> {
  const entries = getLocalAperos();

  return Promise.all(
    entries.map(async (entry) => {
      try {
        const loaded = await getEncryptedAperoById(entry.aperoId, entry.encryptionKey);
        return { entry, event: loaded?.event ?? null };
      } catch {
        return { entry, event: null };
      }
    }),
  );
}

export function findLocalAperoEntry(aperoId: string): LocalAperoEntry | null {
  return findLocalApero(aperoId);
}
