import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  findLocalApero,
  getLocalAperos,
  LOCAL_APERO_REGISTRY_STORAGE_KEY,
  removeLocalApero,
  saveLocalApero,
} from "./localAperoRegistry";

function createStorageStub(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

let storage: Storage;

beforeEach(() => {
  storage = createStorageStub();
  vi.stubGlobal("window", { localStorage: storage });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("localAperoRegistry", () => {
  it("retourne une liste vide sans registre", () => {
    expect(getLocalAperos()).toEqual([]);
    expect(findLocalApero("apero_absent1")).toBeNull();
  });

  it("sauvegarde puis retrouve une entrée", () => {
    saveLocalApero({
      aperoId: "apero_abc123",
      encryptionKey: "cle-chiffrement",
      writeKey: "cle-ecriture",
      adminKey: "cle-admin",
      displayName: "Tonton Ricard",
      role: "creator",
    });

    const found = findLocalApero("apero_abc123");
    expect(found?.encryptionKey).toBe("cle-chiffrement");
    expect(found?.role).toBe("creator");
    expect(found?.adminKey).toBe("cle-admin");
    expect(found?.joinedAt).toBeTruthy();
  });

  it("met à jour sans créer de doublon (upsert par aperoId)", () => {
    const first = saveLocalApero({
      aperoId: "apero_abc123",
      encryptionKey: "cle-1",
      writeKey: "w-1",
      role: "participant",
    });
    saveLocalApero({
      aperoId: "apero_abc123",
      encryptionKey: "cle-2",
      writeKey: "w-2",
      displayName: "Mémé Cacahuète",
    });

    const entries = getLocalAperos();
    expect(entries).toHaveLength(1);
    expect(entries[0].encryptionKey).toBe("cle-2");
    expect(entries[0].displayName).toBe("Mémé Cacahuète");
    // Le joinedAt d'origine est conservé lors d'un upsert.
    expect(entries[0].joinedAt).toBe(first.joinedAt);
  });

  it("ne rétrograde jamais un créateur en participant", () => {
    saveLocalApero({ aperoId: "apero_abc123", encryptionKey: "k", writeKey: "w", role: "creator" });
    saveLocalApero({
      aperoId: "apero_abc123",
      encryptionKey: "k",
      writeKey: "w",
      role: "participant",
    });

    expect(findLocalApero("apero_abc123")?.role).toBe("creator");
  });

  it("conserve la cle admin locale lors d'un upsert participant", () => {
    saveLocalApero({
      aperoId: "apero_abc123",
      encryptionKey: "k",
      writeKey: "w",
      adminKey: "admin-secret",
      role: "creator",
    });
    saveLocalApero({
      aperoId: "apero_abc123",
      encryptionKey: "k2",
      writeKey: "w2",
      role: "participant",
    });

    expect(findLocalApero("apero_abc123")?.adminKey).toBe("admin-secret");
  });

  it("supprime une entrée", () => {
    saveLocalApero({ aperoId: "apero_abc123", encryptionKey: "k", writeKey: "w" });
    saveLocalApero({ aperoId: "apero_def456", encryptionKey: "k", writeKey: "w" });

    removeLocalApero("apero_abc123");

    expect(findLocalApero("apero_abc123")).toBeNull();
    expect(findLocalApero("apero_def456")).not.toBeNull();
  });

  it("survit à un registre corrompu", () => {
    storage.setItem(LOCAL_APERO_REGISTRY_STORAGE_KEY, "{pas du json[");
    expect(getLocalAperos()).toEqual([]);

    storage.setItem(LOCAL_APERO_REGISTRY_STORAGE_KEY, JSON.stringify({ pas: "un tableau" }));
    expect(getLocalAperos()).toEqual([]);

    storage.setItem(
      LOCAL_APERO_REGISTRY_STORAGE_KEY,
      JSON.stringify([{ aperoId: "apero_ok12345", encryptionKey: "k", writeKey: "w", joinedAt: "2026-01-01", updatedAt: "2026-01-01" }, { entree: "invalide" }, null]),
    );
    expect(getLocalAperos()).toHaveLength(1);
  });

  it("trie du plus récemment rejoint au plus ancien", () => {
    storage.setItem(
      LOCAL_APERO_REGISTRY_STORAGE_KEY,
      JSON.stringify([
        { aperoId: "apero_vieux1", encryptionKey: "k", writeKey: "w", joinedAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" },
        { aperoId: "apero_jeune1", encryptionKey: "k", writeKey: "w", joinedAt: "2026-06-01T00:00:00.000Z", updatedAt: "2026-06-01T00:00:00.000Z" },
      ]),
    );

    expect(getLocalAperos().map((entry) => entry.aperoId)).toEqual([
      "apero_jeune1",
      "apero_vieux1",
    ]);
  });
});
