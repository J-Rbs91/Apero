import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AperitifEvent, AperitifOption } from "../types/apero";
import type { StoredEncryptedAperoFile } from "../types/encryptedApero";
import { generateAperoId, generateBase64UrlRandomKey } from "./aperoCryptoKeys";
import { decryptAperoData, encryptAperoData, ENCRYPTION_KEY_BYTE_LENGTH } from "./aperoEncryption";
import { addEncryptedAperoOption, deleteEncryptedApero } from "./encryptedAperoRepository";

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

  it("deleteEncryptedApero passe par POST /delete avec la cle admin et baseSha", async () => {
    const aperoId = generateAperoId();
    const encryptionKey = generateBase64UrlRandomKey(ENCRYPTION_KEY_BYTE_LENGTH);
    const adminKey = generateBase64UrlRandomKey(24);
    const stored = await storedFileFor(baseEvent(aperoId), encryptionKey);

    const calls: Array<{ url: string; method: string; body: unknown }> = [];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      calls.push({ url, method, body: init?.body ? JSON.parse(init.body as string) : undefined });

      if (url.includes("api.github.com")) {
        return new Response(JSON.stringify({ content: base64(stored), sha: FAKE_SHA }), { status: 200 });
      }

      return new Response(JSON.stringify({ ok: true, deleted: true, aperoId }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    await deleteEncryptedApero(aperoId, { adminKey });

    const deleteCall = calls.find((call) => call.method === "POST" && call.url.startsWith(API_BASE));
    expect(deleteCall).toBeTruthy();
    expect(deleteCall!.url).toBe(`${API_BASE}/api/aperos/${aperoId}/delete`);
    expect((deleteCall!.body as { adminKey: string; baseSha: string }).adminKey).toBe(adminKey);
    expect((deleteCall!.body as { adminKey: string; baseSha: string }).baseSha).toBe(FAKE_SHA);
  });
});
