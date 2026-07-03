// Registre local des aperos crees ou rejoints sur cet appareil.
// C'est la source de la future page "Mes aperos" : on n'y liste QUE ce que
// l'utilisateur connait deja, jamais l'ensemble des fichiers du repo.
// Ce registre contient des cles : il ne doit jamais etre envoye a un serveur,
// ni loggue en entier, ni affiche tel quel dans l'interface.

import type { LocalAperoEntry } from "../types/encryptedApero";

export const LOCAL_APERO_REGISTRY_STORAGE_KEY = "apero_local_registry_v1";

export type SaveLocalAperoInput = {
  aperoId: string;
  encryptionKey: string;
  writeKey: string;
  adminKey?: string;
  lastKnownEvent?: LocalAperoEntry["lastKnownEvent"];
  displayName?: string;
  role?: LocalAperoEntry["role"];
};

function getStorage(): Storage | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  return window.localStorage;
}

function isValidEntry(value: unknown): value is LocalAperoEntry {
  const entry = value as LocalAperoEntry | null;

  return Boolean(
    entry &&
      typeof entry === "object" &&
      typeof entry.aperoId === "string" &&
      entry.aperoId.length > 0 &&
      typeof entry.encryptionKey === "string" &&
      entry.encryptionKey.length > 0 &&
      typeof entry.writeKey === "string" &&
      entry.writeKey.length > 0 &&
      (entry.adminKey === undefined || typeof entry.adminKey === "string") &&
      (entry.lastKnownEvent === undefined ||
        (typeof entry.lastKnownEvent === "object" && entry.lastKnownEvent !== null)) &&
      typeof entry.joinedAt === "string" &&
      typeof entry.updatedAt === "string",
  );
}

function readEntries(): LocalAperoEntry[] {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  let parsed: unknown;

  try {
    const raw = storage.getItem(LOCAL_APERO_REGISTRY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    parsed = JSON.parse(raw);
  } catch {
    // Registre corrompu : on repart de zero plutot que de planter l'app.
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  // Dedoublonnage par aperoId, en gardant l'entree la plus recente.
  const byId = new Map<string, LocalAperoEntry>();
  for (const value of parsed) {
    if (!isValidEntry(value)) {
      continue;
    }
    const existing = byId.get(value.aperoId);
    if (!existing || value.updatedAt >= existing.updatedAt) {
      byId.set(value.aperoId, value);
    }
  }

  return Array.from(byId.values());
}

function writeEntries(entries: LocalAperoEntry[]): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(LOCAL_APERO_REGISTRY_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage plein ou bloque : on ne casse pas le flux appelant.
  }
}

/** Aperos connus localement, du plus recemment rejoint au plus ancien. */
export function getLocalAperos(): LocalAperoEntry[] {
  return readEntries().sort((first, second) => second.joinedAt.localeCompare(first.joinedAt));
}

export function findLocalApero(aperoId: string): LocalAperoEntry | null {
  return readEntries().find((entry) => entry.aperoId === aperoId) ?? null;
}

/**
 * Ajoute ou met a jour une entree (upsert par aperoId).
 * Une entree existante garde son joinedAt d'origine, son role "creator" et sa
 * cle admin locale (on ne retrograde jamais un createur en participant).
 */
export function saveLocalApero(input: SaveLocalAperoInput): LocalAperoEntry {
  const now = new Date().toISOString();
  const entries = readEntries();
  const existing = entries.find((entry) => entry.aperoId === input.aperoId);

  const saved: LocalAperoEntry = {
    aperoId: input.aperoId,
    encryptionKey: input.encryptionKey,
    writeKey: input.writeKey,
    adminKey: input.adminKey ?? existing?.adminKey,
    lastKnownEvent: input.lastKnownEvent ?? existing?.lastKnownEvent,
    displayName: input.displayName ?? existing?.displayName,
    role: existing?.role === "creator" ? "creator" : (input.role ?? existing?.role),
    joinedAt: existing?.joinedAt ?? now,
    updatedAt: now,
  };

  writeEntries([...entries.filter((entry) => entry.aperoId !== input.aperoId), saved]);
  return saved;
}

export function removeLocalApero(aperoId: string): void {
  writeEntries(readEntries().filter((entry) => entry.aperoId !== aperoId));
}