// Migration unique : importe les fichiers data/aperos/*.json du clone du repo
// (backend github historique) vers la base SQLite du VPS.
//
// Usage, depuis server/ :
//   SQLITE_DB_PATH=/var/lib/apero-api/aperos.db \
//     node dist/scripts/migrateFromRepo.js /opt/apero/data/aperos
//
// Idempotent : un apero deja present dans la base est laisse tel quel
// (la base est consideree plus fraiche que le clone). Relancable sans risque.
//
// Le sha est recalcule sur les octets exacts du fichier : c'est le meme sha
// git blob que GitHub renvoyait — les `lastSeenPublicSha` memorises par les
// appareils des convives restent donc valides apres la bascule.

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { config } from "../config.js";
import { gitBlobSha } from "../storage.js";

const sourceDir = process.argv[2];

if (!sourceDir) {
  console.error("Usage: node dist/scripts/migrateFromRepo.js <chemin vers data/aperos>");
  process.exit(1);
}

const resolvedSource = path.resolve(sourceDir);
const resolvedDb = path.resolve(config.sqliteDbPath);

console.log(`Source  : ${resolvedSource}`);
console.log(`Base    : ${resolvedDb}`);

const db = new DatabaseSync(resolvedDb);
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

const insertStatement = db.prepare(
  "INSERT OR IGNORE INTO aperos (apero_id, content, sha, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
);

const files = readdirSync(resolvedSource).filter((name) => /^apero_[\w-]+\.json$/.test(name));

let imported = 0;
let skipped = 0;
let invalid = 0;

for (const fileName of files) {
  const aperoId = fileName.replace(/\.json$/, "");
  const text = readFileSync(path.join(resolvedSource, fileName), "utf8");

  let parsed: { createdAt?: string; updatedAt?: string };
  try {
    parsed = JSON.parse(text) as { createdAt?: string; updatedAt?: string };
  } catch {
    console.warn(`  IGNORE ${fileName} : JSON invalide`);
    invalid += 1;
    continue;
  }

  const now = new Date().toISOString();
  const changes = insertStatement.run(
    aperoId,
    text,
    gitBlobSha(text),
    parsed.createdAt ?? now,
    parsed.updatedAt ?? now,
  );

  if (changes.changes === 1) {
    imported += 1;
    console.log(`  IMPORTE ${aperoId}`);
  } else {
    skipped += 1;
    console.log(`  DEJA LA ${aperoId} (laisse tel quel)`);
  }
}

console.log(
  `\nBilan : ${imported} importe(s), ${skipped} deja present(s), ${invalid} invalide(s), sur ${files.length} fichier(s).`,
);
