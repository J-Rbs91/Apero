import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EncryptedAperoPayload } from "../types/encryptedApero";
import {
  AperoApiError,
  createOrUpdateEncryptedApero,
  deleteEncryptedApero,
  joinApiUrl,
  mapStatusToErrorCode,
} from "./aperoApiClient";

const PAYLOAD: EncryptedAperoPayload = {
  version: 1,
  encryption: { algorithm: "AES-GCM", iv: "aXY", ciphertext: "Y2lwaGVy" },
};

describe("joinApiUrl", () => {
  it("évite les doubles slashes", () => {
    expect(joinApiUrl("http://127.0.0.1:3103/", "/api/aperos/x")).toBe(
      "http://127.0.0.1:3103/api/aperos/x",
    );
    expect(joinApiUrl("https://api-apero.example.com", "api/aperos/x")).toBe(
      "https://api-apero.example.com/api/aperos/x",
    );
  });
});

describe("mapStatusToErrorCode", () => {
  it("mappe les statuts HTTP du contrat serveur", () => {
    expect(mapStatusToErrorCode(400)).toBe("INVALID_REQUEST");
    expect(mapStatusToErrorCode(403)).toBe("WRITE_FORBIDDEN");
    expect(mapStatusToErrorCode(409)).toBe("CONFLICT");
    expect(mapStatusToErrorCode(413)).toBe("PAYLOAD_TOO_LARGE");
    expect(mapStatusToErrorCode(429)).toBe("RATE_LIMITED");
    expect(mapStatusToErrorCode(500)).toBe("SERVER_ERROR");
    expect(mapStatusToErrorCode(502)).toBe("GITHUB_ERROR");
  });
});

describe("createOrUpdateEncryptedApero", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_APERO_API_BASE_URL", "http://127.0.0.1:3103");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("échoue avec API_NOT_CONFIGURED sans URL de base", async () => {
    vi.stubEnv("VITE_APERO_API_BASE_URL", "");

    await expect(
      createOrUpdateEncryptedApero({
        aperoId: "apero_test1234",
        writeKey: "une-cle-d-ecriture",
        encryptedPayload: PAYLOAD,
      }),
    ).rejects.toMatchObject({ code: "API_NOT_CONFIGURED" });
  });

  it("POSTe le payload sur la bonne URL et retourne la réponse serveur", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          created: true,
          updated: false,
          aperoId: "apero_test1234",
          sha: "abc123",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await createOrUpdateEncryptedApero({
      aperoId: "apero_test1234",
      writeKey: "une-cle-d-ecriture",
      encryptedPayload: PAYLOAD,
      writeKeyHash: "a".repeat(64),
      adminKeyHash: "b".repeat(64),
    });

    expect(result.created).toBe(true);
    expect(result.sha).toBe("abc123");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://127.0.0.1:3103/api/aperos/apero_test1234");
    expect(init?.method).toBe("POST");

    const sentBody = JSON.parse(init?.body as string);
    expect(sentBody.writeKeyHash).toBe("a".repeat(64));
    expect(sentBody.adminKeyHash).toBe("b".repeat(64));
    expect(sentBody.baseSha).toBeUndefined();
    // Aucun header GitHub authentifié dans le nouveau flux.
    expect(JSON.stringify(init?.headers)).not.toContain("Authorization");
  });

  it("mappe une erreur serveur 403 sans perdre le code serveur", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ ok: false, error: "INVALID_WRITE_KEY", message: "Invalid write key." }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    try {
      await createOrUpdateEncryptedApero({
        aperoId: "apero_test1234",
        writeKey: "mauvaise-cle",
        encryptedPayload: PAYLOAD,
      });
      expect.unreachable("l'appel aurait dû échouer");
    } catch (error) {
      expect(error).toBeInstanceOf(AperoApiError);
      const apiError = error as AperoApiError;
      expect(apiError.code).toBe("WRITE_FORBIDDEN");
      expect(apiError.status).toBe(403);
      expect(apiError.serverCode).toBe("INVALID_WRITE_KEY");
      // Jamais de secret dans le message d'erreur.
      expect(apiError.message).not.toContain("mauvaise-cle");
    }
  });

  it("mappe une panne réseau en NETWORK_ERROR", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(
      createOrUpdateEncryptedApero({
        aperoId: "apero_test1234",
        writeKey: "une-cle-d-ecriture",
        encryptedPayload: PAYLOAD,
      }),
    ).rejects.toMatchObject({ code: "NETWORK_ERROR" });
  });
});

describe("deleteEncryptedApero", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_APERO_API_BASE_URL", "http://127.0.0.1:3103");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("supprime via POST /delete quand le serveur récent répond", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, deleted: true, aperoId: "apero_test1234" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await deleteEncryptedApero({
      aperoId: "apero_test1234",
      adminKey: "une-cle-admin",
    });

    expect(result.deleted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://127.0.0.1:3103/api/aperos/apero_test1234/delete");
    expect(init?.method).toBe("POST");
  });

  it("signale clairement un endpoint /delete absent (404) sans tenter de repli DELETE", async () => {
    // Un serveur VPS pas encore à jour n'a pas la route POST /delete → 404.
    // Ce n'est jamais « apéro introuvable » (qui renverrait 200 deleted:false),
    // donc on remonte un serverCode dédié et on ne déclenche aucune requête
    // DELETE (bloquée en CORS par les proxys GET,POST).
    const fetchMock = vi.fn().mockResolvedValue(new Response("Cannot POST /...", { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);

    try {
      await deleteEncryptedApero({ aperoId: "apero_test1234", legacyWriteKey: "la-write-key-partagee" });
      expect.unreachable("l'appel aurait dû échouer");
    } catch (error) {
      expect(error).toBeInstanceOf(AperoApiError);
      const apiError = error as AperoApiError;
      expect(apiError.code).toBe("NOT_FOUND");
      expect(apiError.serverCode).toBe("DELETE_ENDPOINT_MISSING");
    }

    // Un seul appel : POST /delete. Aucune tentative de DELETE en repli.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://127.0.0.1:3103/api/aperos/apero_test1234/delete");
    expect(init?.method).toBe("POST");
  });
});
