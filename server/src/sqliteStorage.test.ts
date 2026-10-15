import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "./errors.js";
import { createSqliteStorage } from "./sqliteStorage.js";
import { gitBlobSha, serializeStoredFile, type StoredAperoFile } from "./storage.js";

function sampleFile(overrides: Partial<StoredAperoFile> = {}): StoredAperoFile {
  return {
    id: "apero_test123",
    version: 1,
    writeKeyHash: "a".repeat(64),
    adminKeyHash: "b".repeat(64),
    encryption: { algorithm: "AES-GCM", iv: "c".repeat(16), ciphertext: "payload" },
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

test("gitBlobSha reproduit le sha git d'un blob connu", () => {
  // `echo 'hello' | git hash-object --stdin` — valeur de reference publique.
  assert.equal(gitBlobSha("hello\n"), "ce013625030ba8dba906f756967f9e9ca394464a");
});

test("creation puis lecture : contenu et sha coherents", async () => {
  const storage = createSqliteStorage(":memory:");
  const file = sampleFile();

  const { sha } = await storage.put("apero_test123", file);
  assert.match(sha, /^[0-9a-f]{40}$/);
  assert.equal(sha, gitBlobSha(serializeStoredFile(file)));

  const read = await storage.get("apero_test123");
  assert.ok(read);
  assert.equal(read.sha, sha);
  assert.deepEqual(read.json, file);
});

test("lecture d'un apero inconnu : null", async () => {
  const storage = createSqliteStorage(":memory:");
  assert.equal(await storage.get("apero_inconnu1"), null);
});

test("creation en double : conflit 409", async () => {
  const storage = createSqliteStorage(":memory:");
  await storage.put("apero_test123", sampleFile());

  await assert.rejects(
    () => storage.put("apero_test123", sampleFile()),
    (error: unknown) => error instanceof ApiError && error.status === 409,
  );
});

test("mise a jour avec bon baseSha : nouveau sha, contenu remplace", async () => {
  const storage = createSqliteStorage(":memory:");
  const { sha: initialSha } = await storage.put("apero_test123", sampleFile());

  const updated = sampleFile({ updatedAt: "2026-07-02T00:00:00.000Z" });
  const { sha: nextSha } = await storage.put("apero_test123", updated, initialSha);

  assert.notEqual(nextSha, initialSha);
  const read = await storage.get("apero_test123");
  assert.ok(read);
  assert.equal(read.sha, nextSha);
  assert.deepEqual(read.json, updated);
});

test("mise a jour avec baseSha perime : conflit 409, contenu intact", async () => {
  const storage = createSqliteStorage(":memory:");
  const file = sampleFile();
  const { sha } = await storage.put("apero_test123", file);

  await assert.rejects(
    () => storage.put("apero_test123", sampleFile(), "f".repeat(40)),
    (error: unknown) => error instanceof ApiError && error.status === 409,
  );

  const read = await storage.get("apero_test123");
  assert.ok(read);
  assert.equal(read.sha, sha);
});

test("suppression : effective avec le bon sha, 409 avec un sha perime, idempotente ensuite", async () => {
  const storage = createSqliteStorage(":memory:");
  const { sha } = await storage.put("apero_test123", sampleFile());

  await assert.rejects(
    () => storage.delete("apero_test123", "f".repeat(40)),
    (error: unknown) => error instanceof ApiError && error.status === 409,
  );

  await storage.delete("apero_test123", sha);
  assert.equal(await storage.get("apero_test123"), null);

  // Deja disparu : l'objectif est atteint, pas d'erreur.
  await storage.delete("apero_test123", sha);
});

test("le sha accepte le baseSha en majuscules (normalisation)", async () => {
  const storage = createSqliteStorage(":memory:");
  const { sha } = await storage.put("apero_test123", sampleFile());

  const updated = sampleFile({ updatedAt: "2026-07-03T00:00:00.000Z" });
  await storage.put("apero_test123", updated, sha.toUpperCase());

  const read = await storage.get("apero_test123");
  assert.ok(read);
  assert.deepEqual(read.json, updated);
});
