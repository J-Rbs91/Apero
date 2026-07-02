// Registre local des apéros créés ou rejoints sur cet appareil.
// C'est la source de la future page « Mes apéros » : on n'y liste QUE ce que
// l'utilisateur connaît déjà, jamais l'ensemble des fichiers du repo.
// Ce registre contient des clés : il ne doit jamais être envoyé à un serveur,
// ni loggué en entier, ni affiché tel quel dans l'interface.

import type { LocalAperoEntry } from "../types/encryptedApero";

export const LOCAL_APERO_REGISTRY_STORAGE_KEY = "apero_local_registry_v1";

export type SaveLocalAperoInput = {
  aperoId: string;
  encryptionKey: string;
  writeKey: string;
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
    // Registre corrompu : on repart de zéro plutôt que de planter l'app.
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  // Dédoublonnage par aperoId, en gardant l'entrée la plus récente.
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
    // localStorage plein ou bloqué : on ne casse pas le flux appelant.
  }
}

/** Apéros connus localement, du plus récemment rejoint au plus ancien. */
export function getLocalAperos(): LocalAperoEntry[] {
  return readEntries().sort((first, second) => second.joinedAt.localeCompare(first.joinedAt));
}

export function findLocalApero(aperoId: string): LocalAperoEntry | null {
  return readEntries().find((entry) => entry.aperoId === aperoId) ?? null;
}

/**
 * Ajoute ou met à jour une entrée (upsert par aperoId).
 * Une entrée existante garde son joinedAt d'origine et son rôle "creator"
 * (on ne rétrograde jamais un créateur en participant).
 */
export function saveLocalApero(input: SaveLocalAperoInput): LocalAperoEntry {
  const now = new Date().toISOString();
  const entries = readEntries();
  const existing = entries.find((entry) => entry.aperoId === input.aperoId);

  const saved: LocalAperoEntry = {
    aperoId: input.aperoId,
    encryptionKey: input.encryptionKey,
    writeKey: input.writeKey,
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
