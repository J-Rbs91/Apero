// Couche de stockage des fichiers apero chiffres, derriere une interface
// unique. Deux backends :
// - "github" (historique) : delegue a githubClient, chaque apero est un
//   fichier commite dans le repo.
// - "sqlite" : base locale au VPS (node:sqlite), voir sqliteStorage.ts.
//
// Invariant de contrat : quel que soit le backend, `sha` est le sha git
// (sha1 "blob <taille>\0<contenu>", 40 hex) du fichier serialise. C'est ce
// que renvoie l'API GitHub, ce que recalcule le frontend sur les lectures
// CDN, et ce que valide gitShaSchema — le basculement de backend est donc
// invisible pour les clients, baseSha compris.

import { createHash } from "node:crypto";
import { config } from "./config.js";
import {
  createOrUpdateAperoFile,
  deleteAperoFile,
  getAperoFile,
  type StoredAperoFile,
} from "./githubClient.js";
import { createSqliteStorage } from "./sqliteStorage.js";

export type { StoredAperoFile } from "./githubClient.js";

export type StorageReadResult = { json: unknown; sha: string } | null;

export interface AperoStorage {
  /** Nom du backend, expose par /health pour le diagnostic. */
  readonly backend: "github" | "sqlite";
  get(aperoId: string): Promise<StorageReadResult>;
  /**
   * Cree (sans baseSha) ou remplace (avec baseSha) le fichier d'un apero.
   * Leve ApiError 409 CONFLICT si le fichier a change depuis baseSha, ou si
   * une creation percute un fichier apparu entre-temps.
   */
  put(aperoId: string, content: StoredAperoFile, baseSha?: string): Promise<{ sha: string }>;
  /** Supprime le fichier. Idempotent si le fichier a deja disparu. */
  delete(aperoId: string, sha: string): Promise<void>;
}

/**
 * Serialisation canonique d'un fichier apero — octet pour octet celle que le
 * backend github commite. Le sha en depend : ne jamais la modifier.
 */
export function serializeStoredFile(content: StoredAperoFile): string {
  return `${JSON.stringify(content, null, 2)}\n`;
}

/** Sha git d'un blob : sha1("blob <taille>\0<contenu>"). */
export function gitBlobSha(text: string): string {
  const bytes = Buffer.from(text, "utf8");
  return createHash("sha1")
    .update(`blob ${bytes.byteLength}\0`)
    .update(bytes)
    .digest("hex");
}

const githubStorage: AperoStorage = {
  backend: "github",
  get: (aperoId) => getAperoFile(aperoId),
  put: (aperoId, content, baseSha) => createOrUpdateAperoFile(aperoId, content, baseSha),
  delete: (aperoId, sha) => deleteAperoFile(aperoId, sha),
};

let storage: AperoStorage | null = null;

export function getStorage(): AperoStorage {
  if (!storage) {
    storage =
      config.storageBackend === "sqlite"
        ? createSqliteStorage(config.sqliteDbPath)
        : githubStorage;
  }
  return storage;
}
