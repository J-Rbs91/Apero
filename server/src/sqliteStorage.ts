// Backend SQLite : les blobs chiffres vivent dans une base locale au VPS,
// via node:sqlite (integre a Node >= 22.5, zero dependance native).
// Le serveur ne stocke toujours que du chiffre : ce fichier ne voit jamais
// une clé ni un contenu en clair, exactement comme le backend github.

import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { ApiError } from "./errors.js";
import { logger } from "./logger.js";
import {
  gitBlobSha,
  serializeStoredFile,
  type AperoStorage,
  type StorageReadResult,
  type StoredAperoFile,
} from "./storage.js";

type AperoRow = {
  content: string;
  sha: string;
};

export function createSqliteStorage(dbPath: string): AperoStorage {
  mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });

  const db = new DatabaseSync(dbPath);
  // WAL : ecritures durables sans bloquer les lectures, adapte a un service
  // systemd mono-processus.
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS aperos (
      apero_id   TEXT PRIMARY KEY,
      content    TEXT NOT NULL,
      sha        TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const selectStatement = db.prepare("SELECT content, sha FROM aperos WHERE apero_id = ?");
  const insertStatement = db.prepare(
    "INSERT INTO aperos (apero_id, content, sha, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
  );
  // Compare-and-swap : la mise a jour n'aboutit que si le sha n'a pas bouge
  // depuis la lecture du client — l'equivalent atomique du sha GitHub.
  const updateStatement = db.prepare(
    "UPDATE aperos SET content = ?, sha = ?, updated_at = ? WHERE apero_id = ? AND sha = ?",
  );
  const deleteStatement = db.prepare("DELETE FROM aperos WHERE apero_id = ? AND sha = ?");

  logger.info(`Stockage SQLite ouvert : ${path.resolve(dbPath)}`);

  return {
    backend: "sqlite",

    async get(aperoId): Promise<StorageReadResult> {
      const row = selectStatement.get(aperoId) as AperoRow | undefined;

      if (!row) {
        return null;
      }

      try {
        return { json: JSON.parse(row.content), sha: row.sha };
      } catch {
        throw new ApiError(500, "STORAGE_ERROR", "Stored apero file is not valid JSON.");
      }
    },

    async put(aperoId, content: StoredAperoFile, baseSha) {
      const text = serializeStoredFile(content);
      const sha = gitBlobSha(text);
      const now = new Date().toISOString();

      if (baseSha) {
        const changes = updateStatement.run(text, sha, now, aperoId, baseSha.toLowerCase());
        if (changes.changes === 0) {
          // Sha deplace par une ecriture concurrente, ou fichier disparu :
          // meme reponse que GitHub, le client relit puis reessaie.
          throw new ApiError(
            409,
            "CONFLICT",
            "The apero file changed since baseSha. Fetch the latest version and retry.",
          );
        }
        return { sha };
      }

      try {
        insertStatement.run(aperoId, text, sha, content.createdAt || now, now);
      } catch (error) {
        // Contrainte PRIMARY KEY : une creation concurrente est passee avant.
        const message = error instanceof Error ? error.message : String(error);
        if (/UNIQUE|PRIMARY KEY/i.test(message)) {
          throw new ApiError(
            409,
            "CONFLICT",
            "The apero file was created concurrently. Fetch the latest version and retry.",
          );
        }
        logger.warn(`SQLite insert failed for ${aperoId}: ${message}`);
        throw new ApiError(500, "STORAGE_ERROR", "Storage write failed.");
      }
      return { sha };
    },

    async delete(aperoId, sha) {
      const changes = deleteStatement.run(aperoId, sha.toLowerCase());

      if (changes.changes === 0) {
        const row = selectStatement.get(aperoId) as AperoRow | undefined;
        if (!row) {
          // Deja disparu : l'objectif est atteint (idempotence, comme le 404
          // GitHub sur un delete).
          return;
        }
        throw new ApiError(
          409,
          "CONFLICT",
          "The apero file changed since it was read. Fetch the latest version and retry.",
        );
      }
    },
  };
}
