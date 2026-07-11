import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { COMPTOIR_NAME_STORAGE_KEY } from "../hooks/useComptoirName";
import type { LocalAperoEntry } from "../types/encryptedApero";
import { LOCAL_APERO_REGISTRY_STORAGE_KEY } from "./localAperoRegistry";
import {
  collectVaultPayload,
  decryptVault,
  encryptVault,
  mergeVaultPayload,
  VaultError,
  type VaultPayload,
} from "./registryVault";

// Pas de jsdom : le localStorage est un stub global, comme dans les tests du
// registre local.
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

function makeEntry(aperoId: string, overrides: Partial<LocalAperoEntry> = {}): LocalAperoEntry {
  return {
    aperoId,
    encryptionKey: "k".repeat(43),
    writeKey: "w".repeat(32),
    joinedAt: "2026-06-01T10:00:00.000Z",
    updatedAt: "2026-06-01T10:00:00.000Z",
    ...overrides,
  };
}

const payload: VaultPayload = {
  comptoirName: "Éminence Chips",
  aperos: [makeEntry("apero_un"), makeEntry("apero_deux", { role: "creator", adminKey: "a".repeat(32) })],
};

describe("encryptVault / decryptVault", () => {
  it("fait l'aller-retour avec la bonne phrase de passe", async () => {
    const vault = await encryptVault(payload, "une phrase solide", new Date("2026-07-01T10:00:00Z"));

    expect(vault.format).toBe("apero-vault");
    expect(vault.kdf.algorithm).toBe("PBKDF2");
    // Aucune clé en clair dans le fichier sérialisé.
    const serialized = JSON.stringify(vault);
    expect(serialized).not.toContain("k".repeat(43));
    expect(serialized).not.toContain("Éminence");

    const decrypted = await decryptVault(vault, "une phrase solide");
    expect(decrypted.comptoirName).toBe("Éminence Chips");
    expect(decrypted.aperos).toHaveLength(2);
    expect(decrypted.aperos[1].adminKey).toBe("a".repeat(32));
  });

  it("refuse une mauvaise phrase de passe", async () => {
    const vault = await encryptVault(payload, "une phrase solide");
    await expect(decryptVault(vault, "pas la bonne")).rejects.toMatchObject({
      code: "BAD_PASSPHRASE",
    });
  });

  it("refuse un fichier qui n'est pas un coffre", async () => {
    await expect(decryptVault({ hello: "world" }, "x")).rejects.toBeInstanceOf(VaultError);
    await expect(decryptVault(null, "x")).rejects.toBeInstanceOf(VaultError);
  });
});

describe("collectVaultPayload / mergeVaultPayload", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { localStorage: createStorageStub() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rassemble blaze et registre, puis les restaure sur un appareil vierge", () => {
    window.localStorage.setItem(COMPTOIR_NAME_STORAGE_KEY, "Éminence Chips");
    window.localStorage.setItem(
      LOCAL_APERO_REGISTRY_STORAGE_KEY,
      JSON.stringify([makeEntry("apero_un")]),
    );

    const collected = collectVaultPayload();
    expect(collected.comptoirName).toBe("Éminence Chips");
    expect(collected.aperos).toHaveLength(1);

    window.localStorage.clear();
    const result = mergeVaultPayload(collected);
    expect(result.importedAperoCount).toBe(1);
    expect(result.importedComptoirName).toBe("Éminence Chips");
    expect(window.localStorage.getItem(COMPTOIR_NAME_STORAGE_KEY)).toBe("Éminence Chips");
  });

  it("ne remplace jamais un blaze déjà installé et ignore les entrées invalides", () => {
    window.localStorage.setItem(COMPTOIR_NAME_STORAGE_KEY, "Jojo");

    const result = mergeVaultPayload({
      comptoirName: "Usurpateur",
      aperos: [
        makeEntry("apero_valide"),
        { aperoId: "", encryptionKey: "", writeKey: "" } as LocalAperoEntry,
      ],
    });

    expect(result.importedAperoCount).toBe(1);
    expect(result.importedComptoirName).toBeUndefined();
    expect(window.localStorage.getItem(COMPTOIR_NAME_STORAGE_KEY)).toBe("Jojo");
  });

  it("garde le rôle de créateur local lors d'une fusion", () => {
    window.localStorage.setItem(
      LOCAL_APERO_REGISTRY_STORAGE_KEY,
      JSON.stringify([makeEntry("apero_un", { role: "creator", adminKey: "local-admin-key-0000" })]),
    );

    mergeVaultPayload({ aperos: [makeEntry("apero_un", { role: "participant" })] });

    const registry = JSON.parse(
      window.localStorage.getItem(LOCAL_APERO_REGISTRY_STORAGE_KEY) ?? "[]",
    ) as LocalAperoEntry[];
    expect(registry).toHaveLength(1);
    expect(registry[0].role).toBe("creator");
    expect(registry[0].adminKey).toBe("local-admin-key-0000");
  });
});
