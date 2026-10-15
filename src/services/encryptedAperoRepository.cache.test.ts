import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StoredEncryptedAperoFile } from "../types/encryptedApero";
import { readPublicAperoFile } from "./encryptedAperoRepository";

const API_BASE = "https://api.example.test";
const APERO_ID = "apero_test1234";
const FAKE_SHA = "b".repeat(40);

function storedFile(): StoredEncryptedAperoFile {
  return {
    id: APERO_ID,
    version: 1,
    writeKeyHash: "a".repeat(64),
    encryption: {
      algorithm: "AES-GCM",
      iv: "AAAAAAAAAAAAAAAA",
      ciphertext: "BBBBBBBBBBBBBBBBBBBBBBBB",
    },
    createdAt: "2026-08-26T00:00:00.000Z",
    updatedAt: "2026-08-26T00:00:00.000Z",
  };
}

function encodeContents(file: StoredEncryptedAperoFile): string {
  return btoa(JSON.stringify(file));
}

function legacyApi404(): Response {
  return new Response(
    JSON.stringify({ ok: false, error: "NOT_FOUND", message: "Route not found." }),
    { status: 404 },
  );
}

describe("encryptedAperoRepository cache freshness", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_APERO_API_BASE_URL", API_BASE);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("garde l'URL GitHub standard pour une lecture legacy normale", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        calls.push(url);

        if (url.startsWith(API_BASE)) {
          return legacyApi404();
        }

        if (url.includes("api.github.com")) {
          return new Response(JSON.stringify({ content: encodeContents(storedFile()), sha: FAKE_SHA }), {
            status: 200,
          });
        }

        throw new Error(`URL inattendue : ${url}`);
      }),
    );

    await expect(readPublicAperoFile(APERO_ID)).resolves.toMatchObject({ sha: FAKE_SHA });

    const githubUrl = calls.find((url) => url.includes("api.github.com"));
    expect(githubUrl).toBeTruthy();
    expect(githubUrl).toContain("?ref=main");
    expect(githubUrl).not.toContain("&cb=");
  });

  it("ajoute un cache-buster à la Contents API pour une lecture fraîche", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_777_777_777_000);
    const calls: string[] = [];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        calls.push(url);

        if (url.startsWith(API_BASE)) {
          return legacyApi404();
        }

        if (url.includes("api.github.com")) {
          return new Response(JSON.stringify({ content: encodeContents(storedFile()), sha: FAKE_SHA }), {
            status: 200,
          });
        }

        throw new Error(`URL inattendue : ${url}`);
      }),
    );

    await expect(
      readPublicAperoFile(APERO_ID, { bustCdnCache: true }),
    ).resolves.toMatchObject({ sha: FAKE_SHA });

    const githubUrl = calls.find((url) => url.includes("api.github.com"));
    expect(githubUrl).toContain("?ref=main&cb=1777777777000");
  });

  it("propage la lecture fraîche au fallback raw", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_888_888_888_000);
    const calls: string[] = [];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        calls.push(url);

        if (url.startsWith(API_BASE)) {
          return legacyApi404();
        }

        if (url.includes("api.github.com")) {
          return new Response("rate limited", { status: 403 });
        }

        if (url.includes("raw.githubusercontent.com")) {
          return new Response(JSON.stringify(storedFile()), { status: 200 });
        }

        throw new Error(`URL inattendue : ${url}`);
      }),
    );

    await expect(
      readPublicAperoFile(APERO_ID, { bustCdnCache: true }),
    ).resolves.toMatchObject({ file: { id: APERO_ID } });

    const rawUrl = calls.find((url) => url.includes("raw.githubusercontent.com"));
    expect(rawUrl).toContain("?cb=1888888888000");
  });

  it("reste API-first quand le GET VPS moderne répond", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (!url.startsWith(API_BASE)) {
        throw new Error(`GitHub ne devait pas être appelé : ${url}`);
      }

      return new Response(
        JSON.stringify({ ok: true, aperoId: APERO_ID, sha: FAKE_SHA, file: storedFile() }),
        { status: 200 },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      readPublicAperoFile(APERO_ID, { bustCdnCache: true }),
    ).resolves.toMatchObject({ sha: FAKE_SHA });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("ne bascule jamais vers GitHub sur un 5xx de l'API VPS moderne", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        calls.push(url);

        if (url.startsWith(API_BASE)) {
          return new Response(
            JSON.stringify({ ok: false, error: "UPSTREAM_ERROR", message: "temporary failure" }),
            { status: 503 },
          );
        }

        throw new Error(`GitHub ne devait pas être appelé : ${url}`);
      }),
    );

    await expect(
      readPublicAperoFile(APERO_ID, { bustCdnCache: true }),
    ).rejects.toMatchObject({ code: "UNREADABLE_FILE" });
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain(API_BASE);
  });
});
