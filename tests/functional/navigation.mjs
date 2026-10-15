// Contrat de navigation arrière — vérifié dans un vrai navigateur.
//
// Le geste retour ne se lit pas dans du code : il se constate, et il se compte.
// Les tests unitaires de src/routes/navigationTree.test.ts protègent la
// structure — profondeur déclarée en un seul endroit, navigation par un seul
// point — mais aucun ne dit ce que fait réellement un appui sur retour.
//
// Ce banc-là le dit. `history.back()` déclenché dans la page est la même
// primitive que celle qu'actionne le bouton du téléphone : la page ne le voit
// pas venir, et c'est ce qui distingue ce contrôle d'un test qui appellerait la
// fonction de fermeture.
//
// Les six vérifications du contrat (docs/NAVIGATION.md) :
//   1. compter les appuis — ils valent la profondeur, pas le nombre d'écrans vus
//   2. faire des pas de côté — ils ne changent rien au compte
//   3. fermer une couche puis appuyer sur retour — elle ne revient pas
//   4. terminer un parcours puis appuyer sur retour — il ne se rouvre pas
//   5. comparer les deux retours — même écran depuis le même point
//   6. arriver directement en profondeur — on remonte l'arbre, on ne sort pas
//
// Ce qu'il ne peut pas attester : le ressenti du glissement latéral d'iOS, qui
// est un geste continu et réversible. Celui-là se voit sur un appareil.
//
// Lancement : npm run test:nav (le site est servi depuis dist/, donc
// `npm run build` d'abord — le script s'en charge).

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const PORT = Number(process.env.APERO_NAV_PORT ?? 5211);
const BASE = `http://127.0.0.1:${PORT}/Apero`;

const chromiumCandidates = [
  process.env.APERO_TEST_CHROMIUM,
  "/opt/pw-browsers/chromium",
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
].filter(Boolean);

const executablePath = chromiumCandidates.find((candidat) => existsSync(candidat));

if (!executablePath) {
  console.error("Chromium introuvable. Renseigner APERO_TEST_CHROMIUM.");
  process.exit(1);
}

let echecs = 0;
let passes = 0;

function verifier(nom, condition, detail) {
  if (condition) {
    passes += 1;
    console.log("  OK    " + nom);
    return;
  }

  echecs += 1;
  console.log("  ECHEC " + nom + (detail ? " → " + detail : ""));
}

const attendre = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Le site est servi depuis dist/ : la navigation ne dépend pas du serveur de
// développement, et le contrôle porte sur ce qui sera publié.
const build = spawn("npm", ["run", "build"], { cwd: repoRoot, stdio: "inherit" });
await new Promise((resolve, reject) => {
  build.on("exit", (code) => (code === 0 ? resolve() : reject(new Error("build en échec"))));
});

const serveur = spawn(
  "npx",
  ["vite", "preview", "--port", String(PORT), "--strictPort"],
  { cwd: repoRoot, stdio: "ignore" },
);

async function attendreLeServeur() {
  for (let essai = 0; essai < 60; essai += 1) {
    try {
      const reponse = await fetch(`${BASE}/`);
      if (reponse.ok) {
        return;
      }
    } catch {
      /* pas encore prêt */
    }
    await attendre(250);
  }
  throw new Error("le serveur d'aperçu ne répond pas");
}

await attendreLeServeur();

const browser = await chromium.launch({ executablePath });
const contexte = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  reducedMotion: "reduce",
});

// Blaze gravé et notifications réglées : on contrôle la navigation, pas
// l'accueil d'un primo-arrivant.
await contexte.addInitScript(() => {
  localStorage.setItem("apero_gentleman_name", "Testeur");
  localStorage.setItem("apero_notif_onboarding_seen_v1", "1");
});

const page = await contexte.newPage();
page.on("pageerror", (erreur) => {
  echecs += 1;
  console.log("  ECHEC erreur de page → " + erreur.message);
});

const route = () => page.evaluate(() => window.location.hash);
const index = () => page.evaluate(() => window.history.state?.idx ?? 0);
const menuOuvert = async () => (await page.locator(".brand-menu__panel").count()) > 0;

// Un vrai parcours d'historique, celui que déclenche le bouton du téléphone.
async function retour() {
  await page.evaluate(() => window.history.back());
  await attendre(500);
}

async function ouvrirLeMenu() {
  await page.click('[aria-label="Menu de la Confrérie"]');
  await attendre(350);
}

try {
  await page.goto(`${BASE}/#/`, { waitUntil: "domcontentloaded" });
  await attendre(1500);

  const racine = await index();
  verifier("démarrage au comptoir", (await route()) === "#/", await route());

  // 3. Une couche se ferme au geste retour, et ne revient pas.
  await ouvrirLeMenu();
  verifier("le menu s'ouvre", await menuOuvert(), "panneau absent");
  verifier("l'ouverture empile une entrée", (await index()) === racine + 1, String(await index()));

  await retour();
  verifier("le geste retour referme le menu", !(await menuOuvert()), "menu resté ouvert");
  verifier("on est toujours au comptoir", (await route()) === "#/", await route());
  verifier("la couche a rendu son entrée", (await index()) === racine, String(await index()));

  // 1. Descendre coûte une entrée, et une seule.
  await ouvrirLeMenu();
  await page.click("text=Au programme");
  await attendre(700);
  verifier("le programme est atteint", (await route()) === "#/agenda", await route());
  verifier(
    "l'entrée du menu a été remplacée, pas empilée",
    (await index()) === racine + 1,
    String(await index()),
  );

  // 2. Les pas de côté ne consomment aucune profondeur.
  for (const [libelle, attendu] of [
    ["Tablées", "#/tablees"],
    ["Palmarès", "#/palmares"],
    ["Rétrospective", "#/comptes"],
    ["Au programme", "#/agenda"],
  ]) {
    await ouvrirLeMenu();
    await page.click(`text=${libelle}`);
    await attendre(700);
    verifier(`pas de côté vers ${libelle}`, (await route()) === attendu, await route());
  }

  verifier(
    "quatre pas de côté n'ont rien empilé",
    (await index()) === racine + 1,
    String(await index()),
  );

  await retour();
  verifier("un seul appui ramène au comptoir", (await route()) === "#/", await route());

  // 5. Les deux retours aboutissent au même écran.
  await ouvrirLeMenu();
  await page.click("text=Tablées");
  await attendre(700);
  await page.click('.bk[aria-label="Retour"]');
  await attendre(700);
  const parInterface = await route();

  await ouvrirLeMenu();
  await page.click("text=Tablées");
  await attendre(700);
  await retour();
  const parSysteme = await route();

  verifier(
    "le bouton de l'interface et celui du système mènent au même écran",
    parInterface === parSysteme,
    `interface ${parInterface} / système ${parSysteme}`,
  );
  verifier("et au bon : le comptoir", parInterface === "#/", parInterface);

  // 4. Un tunnel descend, et le retour ramène d'où l'on venait.
  await ouvrirLeMenu();
  await page.click("text=Au programme");
  await attendre(700);
  const avantTunnel = await index();

  await page.click('a[href="#/create"]');
  await attendre(700);
  verifier("le formulaire de création est atteint", (await route()) === "#/create", await route());
  verifier(
    "la création est une descente",
    (await index()) === avantTunnel + 1,
    `${avantTunnel} → ${await index()}`,
  );

  await retour();
  verifier("retour → le programme, pas le comptoir", (await route()) === "#/agenda", await route());

  // 6. Arrivée directe en profondeur : on remonte l'arbre, on ne sort pas.
  await page.goto(`${BASE}/#/tablee/tab_inexistante?k=x&w=y`, { waitUntil: "domcontentloaded" });
  await attendre(1500);
  verifier("le lien profond s'ouvre", (await route()).startsWith("#/tablee/"), await route());
  verifier("la trace est vide", (await index()) === 0, String(await index()));

  await page.click('.bk[aria-label="Retour"]');
  await attendre(700);
  verifier(
    "le retour remonte aux Tablées malgré la trace vide",
    (await route()) === "#/tablees",
    await route(),
  );
  verifier("et la pile n'a pas grandi", (await index()) === 0, String(await index()));
} finally {
  await browser.close();
  serveur.kill();
}

console.log(`\n${passes} contrôle(s) passé(s).`);

if (echecs > 0) {
  console.error(`${echecs} échec(s).`);
  process.exit(1);
}
