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
import { createId } from "../utils/createId";
import { findLocalApero, getLocalAperos, removeLocalApero, saveLocalApero } from "./localAperoRegistry";
import { removeSnapshot } from "./notificationSnapshots";
import { addNotifications, removeNotificationsForApero } from "./notificationStore";
import { showSystemNotifications } from "./systemNotifications";

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
 * Sha git d'un blob : sha1("blob <taille>\0<contenu>"). C'est exactement le
 * sha que renvoie la Contents API pour un fichier — le recalculer permet de
 * garder un baseSha anti-conflit valide même quand on lit le fichier via
 * raw.githubusercontent.com, qui ne fournit aucun sha.
 */
async function computeGitBlobSha(bytes: Uint8Array): Promise<string> {
  const header = new TextEncoder().encode(`blob ${bytes.byteLength}\0`);
  const blob = new Uint8Array(header.byteLength + bytes.byteLength);
  blob.set(header, 0);
  blob.set(bytes, header.byteLength);
  const digest = await crypto.subtle.digest("SHA-1", blob);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Lecture de secours via raw.githubusercontent.com : servi par CDN, sans la
 * limite de 60 requetes/heure de l'API anonyme. Contrepartie : cache CDN de
 * quelques minutes (donnee potentiellement un peu perimee — un baseSha
 * perime se solde par un 409 cote serveur, jamais par un ecrasement) et pas
 * de sha fourni, d'ou le recalcul du blob sha ci-dessus.
 */
async function readPublicAperoFileViaRaw(
  aperoId: string,
): Promise<{ file: StoredEncryptedAperoFile; sha: string } | null> {
  const url =
    `https://raw.githubusercontent.com/${githubConfig.owner}/${githubConfig.repo}` +
    `/${githubConfig.branch}/${APEROS_DATA_PATH}/${aperoId}.json`;

  const response = await fetch(url, { cache: "no-store" });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new EncryptedAperoError(
      "UNREADABLE_FILE",
      `Lecture publique impossible (HTTP ${response.status}).`,
    );
  }

  const bytes = new Uint8Array(await response.arrayBuffer());

  try {
    const file = JSON.parse(new TextDecoder().decode(bytes)) as StoredEncryptedAperoFile;
    return { file, sha: await computeGitBlobSha(bytes) };
  } catch {
    throw new EncryptedAperoError("UNREADABLE_FILE", "Fichier apero illisible.");
  }
}

/**
 * Lecture publique du fichier chiffre via GitHub Contents API, SANS token :
 * le repo est public et ce flux ne doit jamais transporter d'Authorization.
 * Retourne aussi le sha GitHub, indispensable comme baseSha anti-conflit.
 * L'API anonyme est plafonnee a 60 requetes/heure par IP : quota epuise
 * (403/429), on bascule sur raw.githubusercontent.com qui n'a pas ce plafond.
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

  if (response.status === 403 || response.status === 429) {
    return readPublicAperoFileViaRaw(aperoId);
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

function cacheLocalAperoEvent(aperoId: string, event: AperitifEvent, seenPublicSha?: string): void {
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
    lastSeenPublicSha: seenPublicSha,
  });
}

/**
 * Purge locale d'un apéro disparu du stockage public (supprimé par son
 * organisateur) : registre local, notifications et instantané « déjà vu »,
 * remplacés par une unique notification d'annulation qui explique la
 * disparition à l'invité.
 * Ne purge que si le fichier a déjà été vu publiquement depuis cet appareil
 * (`lastSeenPublicSha`), pour ne pas confondre une vraie suppression avec le
 * délai de propagation d'une création toute fraîche.
 * Retourne true si la purge a eu lieu.
 */
export function purgeDeletedApero(aperoId: string): boolean {
  const entry = findLocalApero(aperoId);

  if (!entry?.lastSeenPublicSha) {
    return false;
  }

  const aperoName = entry.lastKnownEvent?.ceremonialName ?? "";

  removeLocalApero(aperoId);
  removeNotificationsForApero(aperoId);
  removeSnapshot(aperoId);

  const now = new Date().toISOString();
  const fresh = addNotifications([
    {
      id: createId("notif"),
      aperoId,
      aperoName,
      type: "apero-deleted",
      title: "Apéro annulé",
      body: aperoName
        ? `« ${aperoName} » a été annulé par la personne qui l’organisait. Il a été retiré de ton ardoise.`
        : "Un apéro auquel tu participais a été annulé par la personne qui l’organisait. Il a été retiré de ton ardoise.",
      createdAt: now,
      read: false,
      dedupeKey: `${aperoId}:deleted`,
    },
  ]);

  if (fresh.length > 0) {
    void showSystemNotifications(fresh);
  }

  return true;
}

function isAdminKeyHashUnsupported(error: unknown): error is AperoApiError {
  return Boolean(
    error instanceof AperoApiError &&
      error.code === "INVALID_REQUEST" &&
      error.serverCode === "INVALID_PAYLOAD" &&
      /adminKeyHash/i.test(error.message) &&
      /unrecognized key/i.test(error.message),
  );
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

  let result: Awaited<ReturnType<typeof createOrUpdateEncryptedApero>>;
  let adminKeyForLocalStorage: string | undefined = adminKey;

  try {
    result = await createOrUpdateEncryptedApero({
      aperoId,
      writeKey,
      encryptedPayload,
      writeKeyHash,
      adminKeyHash,
    });
  } catch (error) {
    if (!isAdminKeyHashUnsupported(error)) {
      throw error;
    }

    // Compatibilite temporaire avec l'API VPS deja deployee, qui ne connait
    // pas encore adminKeyHash. Ces aperos restent en mode suppression legacy.
    result = await createOrUpdateEncryptedApero({
      aperoId,
      writeKey,
      encryptedPayload,
      writeKeyHash,
    });
    adminKeyForLocalStorage = undefined;
  }

  saveLocalApero({
    aperoId,
    encryptionKey,
    writeKey,
    adminKey: adminKeyForLocalStorage,
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
      const written = await createOrUpdateEncryptedApero({
        aperoId,
        writeKey,
        encryptedPayload,
        baseSha: current.sha,
      });
      // Le fichier vient d'être lu publiquement puis réécrit : son existence
      // publique est confirmée, un futur 404 signifiera une vraie suppression.
      cacheLocalAperoEvent(aperoId, updatedEvent, written.sha);
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
 *
 * On n'envoie volontairement PAS de baseSha : c'est une action destructive et
 * definitive, deja confirmee par l'organisateur, sans concurrence a arbitrer
 * (on efface tout, peu importe les votes en cours). Aller chercher un baseSha
 * imposerait une lecture publique GitHub non authentifiee — limitee a 60 req/h
 * par IP et servie via CDN — qui peut echouer (403 rate limit) ou renvoyer un
 * sha perime, faisant capoter une suppression pourtant legitime. Le serveur
 * relit de toute facon son propre sha frais et authentifie pour effacer le
 * fichier, donc ce garde anti-conflit cote client n'apporte rien ici.
 */
export async function deleteEncryptedApero(
  aperoId: string,
  credentials: { adminKey?: string; legacyWriteKey?: string },
): Promise<void> {
  await deleteEncryptedAperoApi({
    aperoId,
    adminKey: credentials.adminKey,
    legacyWriteKey: credentials.legacyWriteKey,
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
          cacheLocalAperoEvent(entry.aperoId, loaded.event, loaded.sha);
          return { entry: findLocalApero(entry.aperoId) ?? entry, event: loaded.event };
        }

        // 404 définitif (les erreurs réseau, elles, passent par le catch) :
        // si l'apéro avait déjà été vu publiquement, il a été supprimé par
        // son organisateur — il doit aussi disparaître de cet appareil.
        // Second garde-fou : si l'entrée n'est plus dans le registre (purgée
        // par un getMyAperos concurrent — sync de notifications et agenda
        // chargent en parallèle), ne surtout pas ressusciter le cache.
        if (purgeDeletedApero(entry.aperoId) || !findLocalApero(entry.aperoId)) {
          return { entry, event: null };
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

/**
 * Derniere version de l'apero connue sur cet appareil (registre local).
 * Sert de repli d'affichage quand la lecture publique GitHub echoue
 * (quota anonyme epuise, reseau), comme le fait deja l'agenda.
 */
export function getCachedAperoEvent(aperoId: string): AperitifEvent | null {
  const entry = findLocalApero(aperoId);
  return entry ? getCachedEvent(entry) : null;
}
