// Registre local des tablées connues de cet appareil (fondées ou rejointes).
// Même philosophie que localAperoRegistry : contient des clés, ne quitte
// jamais le navigateur (sauf via le Coffre, chiffré par phrase de passe).

import type { LocalTableeEntry } from "../types/tablee";

export const LOCAL_TABLEE_REGISTRY_STORAGE_KEY = "apero_tablee_registry_v1";

export type SaveLocalTableeInput = {
  tableeId: string;
  encryptionKey: string;
  writeKey: string;
  adminKey?: string;
  name?: string;
  role?: LocalTableeEntry["role"];
};

function getStorage(): Storage | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  return window.localStorage;
}

function isValidEntry(value: unknown): value is LocalTableeEntry {
  const entry = value as LocalTableeEntry | null;

  return Boolean(
    entry &&
      typeof entry === "object" &&
      typeof entry.tableeId === "string" &&
      entry.tableeId.length > 0 &&
      typeof entry.encryptionKey === "string" &&
      entry.encryptionKey.length > 0 &&
      typeof entry.writeKey === "string" &&
      entry.writeKey.length > 0 &&
      typeof entry.joinedAt === "string" &&
      typeof entry.updatedAt === "string",
  );
}

function readEntries(): LocalTableeEntry[] {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  let parsed: unknown;

  try {
    const raw = storage.getItem(LOCAL_TABLEE_REGISTRY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) {
    return [];
  }

  const byId = new Map<string, LocalTableeEntry>();
  for (const value of parsed) {
    if (!isValidEntry(value)) {
      continue;
    }
    const existing = byId.get(value.tableeId);
    if (!existing || value.updatedAt >= existing.updatedAt) {
      byId.set(value.tableeId, value);
    }
  }

  return Array.from(byId.values());
}

function writeEntries(entries: LocalTableeEntry[]): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(LOCAL_TABLEE_REGISTRY_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage plein ou bloqué : on ne casse pas le flux appelant.
  }
}

/** Tablées connues localement, de la plus récente à la plus ancienne. */
export function getLocalTablees(): LocalTableeEntry[] {
  return readEntries().sort((first, second) => second.joinedAt.localeCompare(first.joinedAt));
}

export function findLocalTablee(tableeId: string): LocalTableeEntry | null {
  return readEntries().find((entry) => entry.tableeId === tableeId) ?? null;
}

/** Upsert par tableeId. Une entrée existante garde son joinedAt et son rôle de fondateur. */
export function saveLocalTablee(input: SaveLocalTableeInput): LocalTableeEntry {
  const now = new Date().toISOString();
  const entries = readEntries();
  const existing = entries.find((entry) => entry.tableeId === input.tableeId);

  const saved: LocalTableeEntry = {
    tableeId: input.tableeId,
    encryptionKey: input.encryptionKey,
    writeKey: input.writeKey,
    adminKey: input.adminKey ?? existing?.adminKey,
    name: input.name ?? existing?.name,
    role: existing?.role === "founder" ? "founder" : (input.role ?? existing?.role),
    joinedAt: existing?.joinedAt ?? now,
    updatedAt: now,
  };

  writeEntries([...entries.filter((entry) => entry.tableeId !== input.tableeId), saved]);
  return saved;
}

export function removeLocalTablee(tableeId: string): void {
  writeEntries(readEntries().filter((entry) => entry.tableeId !== tableeId));
}
