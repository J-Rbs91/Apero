import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AperitifEvent, AperitifOption } from "../types/apero";
import type { StoredEncryptedAperoFile } from "../types/encryptedApero";
import { generateAperoId, generateBase64UrlRandomKey } from "./aperoCryptoKeys";
import { decryptAperoData, encryptAperoData, ENCRYPTION_KEY_BYTE_LENGTH } from "./aperoEncryption";
import {
  addEncryptedAperoOption,
  createEncryptedApero,
  deleteEncryptedApero,
  getCachedAperoEvent,
  getMyAperos,
  readPublicAperoFile,
} from "./encryptedAperoRepository";
import { findLocalApero, saveLocalApero } from "./localAperoRegistry";
import { getSnapshot, saveSnapshot } from "./notificationSnapshots";
import { addNotifications, getNotifications } from "./notificationStore";
import { snapshotApero } from "./notificationEngine";

const API_BASE = "https://api.example.test";
const FAKE_SHA = "a".repeat(40);

function baseEvent(id: string): AperitifEvent {
  return {
    id,
    ceremonialName: "Le Concile du Saucisson",
    organizerName: "Organisateur",
    beaufLevel: "medium",
    status: "active",
    options: [
      {
        id: "option_1",
        date: "2026-07-10",
        time: "19:00",
        location: "Chez Dédé",
        createdByRole: "organizer",
        createdByName: "Organisateur",
      },
    ],
    participants: [],
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  };
}

async function storedFileFor(event: AperitifEvent, encryptionKey: string): Promise<StoredEncryptedAperoFile> {
  const payload = await encryptAperoData(event, encryptionKey);
  return {
    id: event.id,
    version: 1,
    writeKeyHash: "b".repeat(64),
    encryption: payload.encryption,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
}

function base64(json: unknown): string {
  // base64 des octets UTF-8, sans dépendre de Buffer (typé côté navigateur).
  const utf8 = new TextEncoder().encode(JSON.stringify(json));
  let binary = "";
  for (const byte of utf8) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

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

describe("encryptedAperoRepository (round-trip fetch stubbé)", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_APERO_API_BASE_URL", API_BASE);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("addEncryptedAperoOption chiffre le créneau ajouté et l'envoie à l'API", async () => {
    const aperoId = generateAperoId();
    const encryptionKey = generateBase64UrlRandomKey(ENCRYPTION_KEY_BYTE_LENGTH);
    const writeKey = generateBase64UrlRandomKey(24);
    const stored = await storedFileFor(baseEvent(aperoId), encryptionKey);

    const calls: Array<{ url: string; method: string; body: unknown }> = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      calls.push({ url, method, body: init?.body ? JSON.parse(init.body as string) : undefined });

      if (url.includes("api.github.com")) {
        return new Response(JSON.stringify({ content: base64(stored), sha: FAKE_SHA }), { status: 200 });
      }
      // API VPS POST.
      return new Response(
        JSON.stringify({ ok: true, created: false, updated: true, aperoId, sha: "c".repeat(40) }),
        { status: 200 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const newOption: AperitifOption = {
      id: "option_2",
      date: "2026-07-12",
      time: "20:30",
      location: "Le Bar du Coin",
      createdByRole: "participant",
      createdByName: "Jean-Mi",
    };

    const updated = await addEncryptedAperoOption(aperoId, writeKey, encryptionKey, newOption);

    // L'événement rendu contient bien les deux créneaux.
    expect(updated.options.map((option) => option.id)).toEqual(["option_1", "option_2"]);

    // Un POST a été émis vers l'API VPS avec un payload chiffré.
    const postCall = calls.find((call) => call.method === "POST" && call.url.startsWith(API_BASE));
    expect(postCall).toBeTruthy();
    const sentPayload = (postCall!.body as { encryptedPayload: { encryption: unknown }; writeKey: string });
    expect(sentPayload.writeKey).toBe(writeKey);

    // Le ciphertext envoyé se déchiffre et contient le nouveau créneau : le
    // serveur ne voit jamais que du chiffré.
    const decrypted = await decryptAperoData<AperitifEvent>(
      { version: 1, encryption: sentPayload.encryptedPayload.encryption } as never,
      encryptionKey,
    );
    expect(decrypted.options.some((option) => option.id === "option_2")).toBe(true);
  });

  it("deleteEncryptedApero passe par POST /delete avec la cle admin, sans lecture publique GitHub", async () => {
    const aperoId = generateAperoId();
    const adminKey = generateBase64UrlRandomKey(24);

    const calls: Array<{ url: string; method: string; body: unknown }> = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      calls.push({ url, method, body: init?.body ? JSON.parse(init.body as string) : undefined });

      return new Response(JSON.stringify({ ok: true, deleted: true, aperoId }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    await deleteEncryptedApero(aperoId, { adminKey });

    // Aucune lecture publique GitHub : la suppression ne doit pas dépendre de
    // l'API GitHub non authentifiée (rate limit 60 req/h, CDN), qui la faisait
    // échouer avec un « souci technique » générique.
    expect(calls.some((call) => call.url.includes("api.github.com"))).toBe(false);

    const deleteCall = calls.find((call) => call.method === "POST" && call.url.startsWith(API_BASE));
    expect(deleteCall).toBeTruthy();
    expect(deleteCall!.url).toBe(`${API_BASE}/api/aperos/${aperoId}/delete`);
    expect((deleteCall!.body as { adminKey: string }).adminKey).toBe(adminKey);
    // Pas de baseSha : le serveur relit son propre sha frais pour effacer.
    expect((deleteCall!.body as { baseSha?: string }).baseSha).toBeUndefined();
  });

  it("deleteEncryptedApero aboutit même si l'API GitHub publique est en panne (rate limit)", async () => {
    const aperoId = generateAperoId();
    const adminKey = generateBase64UrlRandomKey(24);

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      // Toute lecture publique GitHub échoue (403 rate limit non authentifié) :
      // elle ne doit surtout pas être sur le chemin critique de la suppression.
      if (url.includes("api.github.com")) {
        return new Response("rate limited", { status: 403 });
      }

      return new Response(JSON.stringify({ ok: true, deleted: true, aperoId }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    // Ne doit pas jeter : la suppression aboutit sans dépendre du 403 GitHub.
    await expect(deleteEncryptedApero(aperoId, { adminKey })).resolves.toBeUndefined();
  });

  it("createEncryptedApero memorise l'evenement cree dans le registre local", async () => {
    vi.stubGlobal("window", { localStorage: createStorageStub() });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        const aperoId = url.slice(url.lastIndexOf("/") + 1);
        return new Response(
          JSON.stringify({ ok: true, created: true, updated: false, aperoId, sha: "d".repeat(40) }),
          { status: 200 },
        );
      }),
    );

    const { id: _ignoredId, ...input } = baseEvent("apero_source1");
    const created = await createEncryptedApero(input);
    const local = findLocalApero(created.aperoId);

    expect(local?.role).toBe("creator");
    expect(local?.lastKnownEvent?.id).toBe(created.aperoId);
    expect(local?.lastKnownEvent?.ceremonialName).toBe(input.ceremonialName);
  });

  it("createEncryptedApero retente sans adminKeyHash avec l'ancienne API", async () => {
    const sentBodies: Array<Record<string, unknown>> = [];

    vi.stubGlobal("window", { localStorage: createStorageStub() });
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        sentBodies.push(JSON.parse(init?.body as string));

        if (sentBodies.length === 1) {
          return new Response(
            JSON.stringify({
              ok: false,
              error: "INVALID_PAYLOAD",
              message: "Invalid payload. Unrecognized key(s) in object: 'adminKeyHash'",
            }),
            { status: 400 },
          );
        }

        return new Response(
          JSON.stringify({ ok: true, created: true, updated: false, aperoId: "apero_legacy1", sha: "e".repeat(40) }),
          { status: 201 },
        );
      }),
    );

    const { id: _ignoredId, ...input } = baseEvent("apero_source2");
    const created = await createEncryptedApero(input);
    const local = findLocalApero(created.aperoId);

    expect(sentBodies).toHaveLength(2);
    expect(sentBodies[0].adminKeyHash).toBeTruthy();
    expect(sentBodies[1].adminKeyHash).toBeUndefined();
    expect(local?.role).toBe("creator");
    expect(local?.adminKey).toBeUndefined();
    expect(local?.lastKnownEvent?.id).toBe(created.aperoId);
  });

  it("getMyAperos affiche l'instantane local si GitHub n'a pas encore le fichier", async () => {
    const aperoId = generateAperoId();
    const cachedEvent = baseEvent(aperoId);
    const fetchMock = vi.fn(async () => new Response("{}", { status: 404 }));

    vi.stubGlobal("window", { localStorage: createStorageStub() });
    vi.stubGlobal("fetch", fetchMock);

    saveLocalApero({
      aperoId,
      encryptionKey: "cle-chiffrement",
      writeKey: "cle-ecriture",
      adminKey: "cle-admin",
      lastKnownEvent: cachedEvent,
      role: "creator",
    });

    const mine = await getMyAperos();

    expect(mine).toHaveLength(1);
    expect(mine[0].event?.id).toBe(aperoId);
    expect(mine[0].event?.ceremonialName).toBe(cachedEvent.ceremonialName);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("getMyAperos memorise le sha public apres une lecture reussie", async () => {
    const aperoId = generateAperoId();
    const encryptionKey = generateBase64UrlRandomKey(ENCRYPTION_KEY_BYTE_LENGTH);
    const stored = await storedFileFor(baseEvent(aperoId), encryptionKey);

    vi.stubGlobal("window", { localStorage: createStorageStub() });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ content: base64(stored), sha: FAKE_SHA }), { status: 200 })),
    );

    saveLocalApero({
      aperoId,
      encryptionKey,
      writeKey: "cle-ecriture",
      role: "participant",
    });

    await getMyAperos();

    expect(findLocalApero(aperoId)?.lastSeenPublicSha).toBe(FAKE_SHA);
  });

  it("getMyAperos purge un apero deja vu publiquement qui a ete supprime", async () => {
    const aperoId = generateAperoId();
    const cachedEvent = baseEvent(aperoId);

    // dispatchEvent : le store de notifications émet un événement de
    // changement à chaque écriture.
    vi.stubGlobal("window", { localStorage: createStorageStub(), dispatchEvent: () => true });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 404 })));

    // Un invité qui a déjà lu l'apéro publiquement (sha connu), avec des
    // notifications et un instantané associés.
    saveLocalApero({
      aperoId,
      encryptionKey: "cle-chiffrement",
      writeKey: "cle-ecriture",
      lastKnownEvent: cachedEvent,
      role: "participant",
      lastSeenPublicSha: FAKE_SHA,
    });
    saveSnapshot(aperoId, snapshotApero(cachedEvent));
    addNotifications([
      {
        id: "notif_1",
        aperoId,
        aperoName: cachedEvent.ceremonialName,
        type: "new-option",
        title: "Nouvelle proposition de créneau",
        body: "Quelqu'un propose un créneau.",
        dedupeKey: `${aperoId}:option:option_1`,
        createdAt: "2026-07-01T00:00:00.000Z",
        read: false,
      },
    ]);

    const mine = await getMyAperos();

    // L'apéro supprimé ne réapparaît plus via le cache local…
    expect(mine).toHaveLength(1);
    expect(mine[0].event).toBeNull();
    // …ses traces locales sont purgées (registre, instantané, anciennes
    // notifications)…
    expect(findLocalApero(aperoId)).toBeNull();
    expect(getSnapshot(aperoId).initialized).toBe(false);
    // …remplacées par une unique notification d'annulation qui explique la
    // disparition à l'invité.
    const remaining = getNotifications().filter((notification) => notification.aperoId === aperoId);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].type).toBe("apero-deleted");
    expect(remaining[0].body).toContain(cachedEvent.ceremonialName);
    expect(remaining[0].body).toContain("annulé par la personne qui l’organisait");
  });

  it("readPublicAperoFile bascule sur raw.githubusercontent quand l'API anonyme est rate-limitee (403)", async () => {
    const aperoId = "apero_test1234";
    // Contenu fixe dont le sha de blob git est précalculé avec l'implémentation
    // de référence (`git hash-object --stdin`) : vérifie que le recalcul
    // navigateur (SubtleCrypto) produit exactement le sha que GitHub attend.
    const rawBody = '{"id":"apero_test1234","version":1,"writeKeyHash":"abc"}';
    const expectedSha = "07852dc7dde39998b82ab5cc444566a7195b4590";

    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        calls.push(url);

        // Quota anonyme épuisé sur l'API Contents.
        if (url.includes("api.github.com")) {
          return new Response("rate limited", { status: 403 });
        }

        // Lecture de secours via le CDN raw.
        if (url.includes("raw.githubusercontent.com")) {
          return new Response(rawBody, { status: 200 });
        }

        throw new Error(`URL inattendue : ${url}`);
      }),
    );

    const result = await readPublicAperoFile(aperoId);

    expect(result).not.toBeNull();
    expect(result!.file.id).toBe(aperoId);
    expect(result!.sha).toBe(expectedSha);
    expect(calls.some((url) => url.includes("raw.githubusercontent.com"))).toBe(true);
  });

  it("getCachedAperoEvent rend la derniere version locale d'un apero connu", async () => {
    const aperoId = generateAperoId();
    const cachedEvent = baseEvent(aperoId);

    vi.stubGlobal("window", { localStorage: createStorageStub() });

    saveLocalApero({
      aperoId,
      encryptionKey: "cle-chiffrement",
      writeKey: "cle-ecriture",
      lastKnownEvent: cachedEvent,
      role: "creator",
    });

    expect(getCachedAperoEvent(aperoId)?.ceremonialName).toBe(cachedEvent.ceremonialName);
    expect(getCachedAperoEvent("apero_inconnu42")).toBeNull();
  });

  it("getMyAperos ne purge pas un apero jamais vu publiquement (retard de propagation)", async () => {
    const aperoId = generateAperoId();
    const cachedEvent = baseEvent(aperoId);

    vi.stubGlobal("window", { localStorage: createStorageStub() });
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 404 })));

    // Création toute fraîche : aucune lecture publique réussie encore.
    saveLocalApero({
      aperoId,
      encryptionKey: "cle-chiffrement",
      writeKey: "cle-ecriture",
      adminKey: "cle-admin",
      lastKnownEvent: cachedEvent,
      role: "creator",
    });

    const mine = await getMyAperos();

    expect(mine[0].event?.id).toBe(aperoId);
    expect(findLocalApero(aperoId)).not.toBeNull();
  });
});
