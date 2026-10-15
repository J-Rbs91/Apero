// Banc fonctionnel du stockage VPS (STORAGE_BACKEND=sqlite).
//
// Contrairement à run.mjs (backend github + faux GitHub), ce banc ne démarre
// AUCUN simulacre de GitHub : l'API stocke et sert les blobs chiffrés depuis
// une base SQLite temporaire. Toute requête du navigateur vers github.com est
// interceptée et fait échouer le banc — c'est la preuve que le flux complet
// (création, vote, lecture, suppression) vit sans GitHub.
//
//   npm run test:functional:sqlite

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { chromium } from "playwright-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const API_PORT = Number(process.env.APERO_TEST_API_PORT ?? 3813);
const VITE_PORT = Number(process.env.APERO_TEST_VITE_PORT ?? 5813);
const APP_URL = `http://127.0.0.1:${VITE_PORT}`;
const API_URL = `http://127.0.0.1:${API_PORT}`;
const CHROMIUM_PATH = process.env.APERO_TEST_CHROMIUM ?? "/opt/pw-browsers/chromium";

const workDir = mkdtempSync(path.join(tmpdir(), "apero-sqlite-"));
const dbPath = path.join(workDir, "aperos.db");

const children = [];
let checksPassed = 0;
let checksFailed = 0;

function check(label, condition, detail = "") {
  if (condition) {
    checksPassed += 1;
    console.log(`  ✅ ${label}`);
  } else {
    checksFailed += 1;
    console.error(`  ❌ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function spawnChild(label, command, args, options) {
  const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], ...options });
  child.stdout.on("data", (chunk) => process.env.DEBUG_CHILD && console.log(`[${label}]`, chunk.toString()));
  child.stderr.on("data", (chunk) => process.env.DEBUG_CHILD && console.error(`[${label}]`, chunk.toString()));
  children.push(child);
  return child;
}

async function waitForHttp(url, label, timeout = 60_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // pas encore prêt
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`${label} n'a pas démarré (${url})`);
}

function futureDate(days) {
  return new Date(Date.now() + days * 24 * 3600 * 1000).toISOString().slice(0, 10);
}

async function shutdown(code) {
  for (const child of children) child.kill("SIGTERM");
  rmSync(workDir, { recursive: true, force: true });
  process.exit(code);
}

// ---- Démarrage : API (sqlite) + Vite, rien d'autre -------------------------

spawnChild("api", process.execPath, ["--import", "tsx", "src/index.ts"], {
  cwd: path.join(repoRoot, "server"),
  env: {
    ...process.env,
    STORAGE_BACKEND: "sqlite",
    SQLITE_DB_PATH: dbPath,
    HOST: "127.0.0.1",
    PORT: String(API_PORT),
    ALLOWED_ORIGIN: `${APP_URL},http://localhost:${VITE_PORT}`,
    API_RATE_LIMIT_MAX: "10000",
    WRITE_RATE_LIMIT_MAX: "1000",
    LOG_LEVEL: "warn",
    // Volontairement AUCUN GITHUB_TOKEN : le backend sqlite n'en a pas besoin.
    GITHUB_TOKEN: undefined,
  },
});

spawnChild(
  "vite",
  process.execPath,
  [path.join(repoRoot, "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", String(VITE_PORT), "--strictPort"],
  {
    cwd: repoRoot,
    env: {
      ...process.env,
      VITE_APERO_STORAGE_MODE: "api-vps",
      VITE_APERO_API_BASE_URL: API_URL,
      VITE_APP_BASE_URL: APP_URL,
      VITE_GITHUB_OWNER: "J-Rbs91",
      VITE_GITHUB_REPO: "Apero",
      VITE_GITHUB_BRANCH: "main",
    },
  },
);

await waitForHttp(`${API_URL}/health`, "API sqlite");
await waitForHttp(`${APP_URL}/Apero/`, "Vite");

const health = await (await fetch(`${API_URL}/health`)).json();

console.log("\n▶ 1. Santé et contrat de l'API en mode sqlite");
check("Le /health annonce le stockage sqlite", health.storage === "sqlite", JSON.stringify(health));

// ---- Navigateur : parcours complet sans GitHub -----------------------------

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH });
const githubCalls = [];

async function newPersona(name) {
  const context = await browser.newContext({ viewport: { width: 420, height: 900 } });
  await context.addInitScript((blaze) => {
    window.localStorage.setItem("apero_gentleman_name", blaze);
    window.localStorage.setItem("apero_notif_onboarding_seen_v1", "1");
  }, name);
  // Aucun octet ne doit partir vers GitHub : c'est toute la promesse du
  // stockage VPS. On trace au lieu de bloquer, pour un diagnostic lisible.
  await context.route(/github(usercontent)?\.com/, (route) => {
    githubCalls.push(route.request().url());
    route.abort();
  });
  return context;
}

console.log("\n▶ 2. Création d'un apéro (organisateur)");
const organizerContext = await newPersona("Jojo l'Organisateur");
const organizerPage = await organizerContext.newPage();
await organizerPage.goto(`${APP_URL}/Apero/#/create`);
await organizerPage.getByPlaceholder("La Grande Tablée des Olives").fill("Le Conseil du Zinc Local");
const slot = organizerPage.locator("form .slot").first();
await slot.locator('input[type="date"]').fill(futureDate(4));
await slot.locator('input[type="time"]').fill("19:00");
await slot.locator(".field--wide input").fill("Chez Dédé");
await organizerPage.getByRole("button", { name: "Créer l’apéro" }).click();
await organizerPage.waitForURL(/#\/invite\/apero_/, { timeout: 20_000 });
const inviteUrl = organizerPage.url();
const aperoId = inviteUrl.match(/#\/invite\/(apero_[\w-]+)/)?.[1];
check("L'apéro est créé et l'organisateur atterrit sur l'invitation", Boolean(aperoId), inviteUrl);

const dbRead = new DatabaseSync(dbPath);
const row = dbRead.prepare("SELECT content, sha FROM aperos WHERE apero_id = ?").get(aperoId);
check("Le blob est dans la base SQLite", Boolean(row));
const storedFile = row ? JSON.parse(row.content) : null;
check(
  "Le blob stocké est chiffré AES-GCM, sans donnée en clair",
  storedFile?.encryption?.algorithm === "AES-GCM" &&
    !row.content.includes("Chez Dédé") &&
    !row.content.includes("Jojo"),
);
check("Le sha stocké est un sha git de 40 hex", /^[0-9a-f]{40}$/.test(row?.sha ?? ""));

console.log("\n▶ 3. Contrat GET de l'API");
const getResponse = await fetch(`${API_URL}/api/aperos/${aperoId}`);
const getBody = await getResponse.json();
check("GET /api/aperos/:id sert le fichier chiffré et son sha", getResponse.ok && getBody.ok === true && getBody.sha === row?.sha && getBody.file?.encryption?.algorithm === "AES-GCM");
const missingResponse = await fetch(`${API_URL}/api/aperos/apero_inconnu42`);
const missingBody = await missingResponse.json();
check("GET d'un apéro inconnu répond 404 APERO_NOT_FOUND", missingResponse.status === 404 && missingBody.error === "APERO_NOT_FOUND");

console.log("\n▶ 4. Vote d'un invité, persistance et relecture");
const guestContext = await newPersona("Bob Ricard");
const guestPage = await guestContext.newPage();
await guestPage.goto(inviteUrl);
const nameInput = guestPage.getByPlaceholder("Jojo, Nadine, Éminence Chips…");
await nameInput.waitFor({ state: "visible", timeout: 20_000 });
await guestPage.locator(".vote-form .slot").first().getByText("J’y serai", { exact: true }).click();
await guestPage.getByRole("button", { name: "Répondre à l’invitation" }).click();
await guestPage.getByText("C’est émargé. Le registre te remercie.").waitFor({ timeout: 15_000 });
check("L'invité vote et le registre confirme", true);

await guestPage.reload();
await guestPage.getByRole("button", { name: "Modifier ma réponse" }).waitFor({ timeout: 20_000 });
check("Après rechargement, la réponse relue vient bien du stockage VPS", true);

const updatedRow = dbRead.prepare("SELECT sha FROM aperos WHERE apero_id = ?").get(aperoId);
check("Le sha a changé après le vote (écriture réellement passée)", updatedRow?.sha !== row?.sha);

console.log("\n▶ 5. Conflits de version (baseSha)");
const conflictResponse = await fetch(`${API_URL}/api/aperos/${aperoId}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    writeKey: "une-cle-fausse-mais-longue",
    encryptedPayload: { version: 1, encryption: { algorithm: "AES-GCM", iv: "A".repeat(16), ciphertext: "AAAA" } },
    baseSha: "f".repeat(40),
  }),
});
check("Une écriture avec mauvaise clé est refusée (403)", conflictResponse.status === 403);

console.log("\n▶ 6. Suppression par l'organisateur");
await organizerPage.reload();
await organizerPage.getByRole("button", { name: "Annuler l’apéro" }).click();
await organizerPage.getByRole("button", { name: "Oui, tout rayer" }).click();
await organizerPage.waitForURL(/#\/agenda/, { timeout: 20_000 });
const afterDelete = await fetch(`${API_URL}/api/aperos/${aperoId}`);
const afterDeleteBody = await afterDelete.json();
check("Après suppression, le GET répond 404 APERO_NOT_FOUND", afterDelete.status === 404 && afterDeleteBody.error === "APERO_NOT_FOUND");
const deletedRow = dbRead.prepare("SELECT sha FROM aperos WHERE apero_id = ?").get(aperoId);
check("La ligne a disparu de la base SQLite", !deletedRow);

await guestPage.reload();
await guestPage
  .getByText(/annulé|introuvable|coince/i)
  .first()
  .waitFor({ timeout: 20_000 });
check("Le lien de l'invité aboutit sur l'écran d'annulation", true);

console.log("\n▶ 7. Étanchéité GitHub");
check("Aucune requête n'est partie vers GitHub pendant tout le parcours", githubCalls.length === 0, githubCalls.slice(0, 3).join(", "));

await browser.close();

console.log("\n========================================================================");
console.log(`Bilan sqlite : ${checksPassed}/${checksPassed + checksFailed} vérifications réussies`);
await shutdown(checksFailed === 0 ? 0 : 1);
