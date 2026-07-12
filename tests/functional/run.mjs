// Tests fonctionnels de bout en bout de La Confrérie du Petit Jaune.
//
// Architecture du banc d'essai — tout est hermétique, aucun réseau externe :
//
//   Chromium (Playwright)                    ← vrai frontend Vite (npm run dev)
//     ├─ lectures api.github.com            ← interceptées, servies par le faux GitHub
//     └─ écritures API VPS                  → vraie API server/ (Express + tsx)
//                                              └─ fetch api.github.com redirigé
//                                                 vers le faux GitHub (in-memory)
//
// Scénarios couverts :
//   1. Création d'un apéro (onboarding complet, mono-créneau)
//   2. Création d'un apéro multi-créneaux
//   3. Vote d'un invité + modification de son vote
//   4. Contre-proposition d'un nouveau créneau par un invité
//   5. Vote d'un second invité sur tous les créneaux (dont le nouveau)
//   6. Notifications (badge + carnet du créateur, silence côté invité)
//   7. Isolation (agenda vide, lien sans clé, mauvaise clé, lecture seule,
//      écritures refusées côté API, cloisonnement entre organisateurs)
//   8. Suppression définitive par l'organisateur
//   9. Contrat de la mini API (validation, conflits, santé)
//
// Lancement : npm run test:functional

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { createFakeGitHub } from "./fake-github.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const API_PORT = Number(process.env.APERO_TEST_API_PORT ?? 3113);
const VITE_PORT = Number(process.env.APERO_TEST_VITE_PORT ?? 5199);
const APP_URL = `http://127.0.0.1:${VITE_PORT}`;
const API_URL = `http://127.0.0.1:${API_PORT}`;
const CHROMIUM_PATH = process.env.APERO_TEST_CHROMIUM ?? "/opt/pw-browsers/chromium";
const SHOTS_DIR = process.env.APERO_TEST_SHOTS_DIR ?? path.join(__dirname, "output");

mkdirSync(SHOTS_DIR, { recursive: true });

// ---------------------------------------------------------------------------
// Mini harnais d'assertions
// ---------------------------------------------------------------------------

const results = [];
let currentScenario = "";

class CheckFailure extends Error {}

function check(label, condition, details = "") {
  const ok = Boolean(condition);
  results.push({ scenario: currentScenario, label, ok, details: ok ? "" : String(details) });
  console.log(`  ${ok ? "✅" : "❌"} ${label}${ok || !details ? "" : ` — ${details}`}`);
  if (!ok) {
    throw new CheckFailure(label);
  }
}

async function scenario(name, fn) {
  currentScenario = name;
  console.log(`\n▶ ${name}`);
  try {
    await fn();
  } catch (error) {
    if (!(error instanceof CheckFailure)) {
      results.push({ scenario: name, label: "(erreur inattendue)", ok: false, details: String(error) });
      console.log(`  ❌ erreur inattendue — ${error?.stack ?? error}`);
    }
  }
}

async function waitVisible(page, locator, label, timeout = 15_000) {
  try {
    await locator.first().waitFor({ state: "visible", timeout });
    check(label, true);
  } catch (error) {
    if (error instanceof CheckFailure) {
      throw error;
    }
    await snap(page, label);
    check(label, false, `introuvable/invisible après ${timeout}ms`);
  }
}

let shotCounter = 0;
async function snap(page, label) {
  shotCounter += 1;
  const file = path.join(
    SHOTS_DIR,
    `${String(shotCounter).padStart(2, "0")}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60)}.png`,
  );
  try {
    await page.screenshot({ path: file, fullPage: true });
  } catch {
    // Une capture ratée ne doit pas faire échouer un test.
  }
  return file;
}

function futureDate(daysAhead) {
  return new Date(Date.now() + daysAhead * 86_400_000).toISOString().slice(0, 10);
}

function sha256Hex(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

async function waitForHttp(url, label, timeout = 60_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Pas encore prêt.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`${label} n'a pas démarré (${url})`);
}

// ---------------------------------------------------------------------------
// Démarrage du banc d'essai
// ---------------------------------------------------------------------------

const children = [];

function spawnChild(label, command, args, options) {
  const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"], ...options });
  const logs = [];
  const keep = (chunk) => {
    logs.push(chunk.toString());
    if (logs.length > 200) {
      logs.shift();
    }
  };
  child.stdout.on("data", keep);
  child.stderr.on("data", keep);
  child.on("exit", (code) => {
    if (code !== null && code !== 0 && !shuttingDown) {
      console.error(`[${label}] terminé avec le code ${code}\n${logs.join("")}`);
    }
  });
  children.push({ label, child, logs });
  return child;
}

let shuttingDown = false;
async function shutdown() {
  shuttingDown = true;
  for (const { child } of children) {
    try {
      child.kill("SIGTERM");
    } catch {
      // Déjà mort.
    }
  }
}

const fakeGitHub = createFakeGitHub();
const fakeGitHubPort = await fakeGitHub.listen();
const FAKE_GITHUB_URL = `http://127.0.0.1:${fakeGitHubPort}`;
console.log(`Faux GitHub Contents API : ${FAKE_GITHUB_URL}`);

spawnChild(
  "api",
  process.execPath,
  ["--import", "tsx", "--import", path.join(__dirname, "server-fetch-patch.mjs"), "src/index.ts"],
  {
    cwd: path.join(repoRoot, "server"),
    env: {
      ...process.env,
      FAKE_GITHUB_BASE_URL: FAKE_GITHUB_URL,
      GITHUB_TOKEN: "functional-test-token",
      HOST: "127.0.0.1",
      PORT: String(API_PORT),
      ALLOWED_ORIGIN: `${APP_URL},http://localhost:${VITE_PORT}`,
      API_RATE_LIMIT_MAX: "10000",
      WRITE_RATE_LIMIT_MAX: "1000",
      LOG_LEVEL: "warn",
    },
  },
);

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

await waitForHttp(`${API_URL}/health`, "API apéro");
await waitForHttp(APP_URL, "Frontend Vite");
console.log(`API : ${API_URL} — Frontend : ${APP_URL}`);

const browser = await chromium.launch({ executablePath: CHROMIUM_PATH, headless: true });

// ---------------------------------------------------------------------------
// Contextes navigateur (un par persona, localStorage isolé)
// ---------------------------------------------------------------------------

async function newPersonaContext({ blaze, throughOnboarding = false } = {}) {
  const context = await browser.newContext({
    viewport: { width: 420, height: 900 },
    locale: "fr-FR",
  });

  // Lectures publiques GitHub du frontend → faux GitHub in-memory.
  await context.route("https://api.github.com/**", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const match = url.pathname.match(/^\/repos\/[^/]+\/[^/]+\/contents\/(.+)$/);
    const filePath = match ? decodeURIComponent(match[1]) : null;

    if (request.method() !== "GET" || !filePath) {
      return route.fulfill({ status: 405, json: { message: "Method Not Allowed" } });
    }

    const file = fakeGitHub.files.get(filePath);
    if (!file) {
      return route.fulfill({ status: 404, json: { message: "Not Found" } });
    }
    return route.fulfill({ status: 200, json: { content: file.contentBase64, sha: file.sha } });
  });

  // Autocomplétion OpenStreetMap : réponse vide pour rester hermétique.
  await context.route("https://photon.komoot.io/**", (route) =>
    route.fulfill({ status: 200, json: { features: [] } }),
  );

  if (!throughOnboarding && blaze) {
    await context.addInitScript(
      ({ name, nameKey, notifKey }) => {
        window.localStorage.setItem(nameKey, name);
        window.localStorage.setItem(notifKey, "1");
      },
      {
        name: blaze,
        nameKey: "apero_gentleman_name",
        notifKey: "apero_notif_onboarding_seen_v1",
      },
    );
  }

  return context;
}

async function passOnboarding(page, blaze) {
  await page.getByPlaceholder("Jean-Michel Pastaga, Gisèle Perrier…").fill(blaze);
  await page.getByRole("button", { name: "Valider mon blaze" }).click();
  await page.getByRole("button", { name: "Oui, grave ça dans le zinc" }).click();
  // L'écran d'autorisation des notifications suit immédiatement (Chromium
  // supporte l'API Notification) : on choisit le badge interne seul.
  const skipButton = page.getByRole("button", { name: "Plus tard — garder juste le badge" });
  await skipButton.waitFor({ state: "visible", timeout: 10_000 });
  await skipButton.click();
}

function parseInviteUrl(url) {
  const match = url.match(/#\/invite\/([^?]+)\?(.*)$/);
  if (!match) {
    return null;
  }
  const params = new URLSearchParams(match[2]);
  return {
    aperoId: match[1],
    encryptionKey: params.get("k") ?? "",
    writeKey: params.get("w") ?? "",
    fullUrl: url,
  };
}

async function fillCreateSlot(page, index, { date, time, location }) {
  const slot = page.locator("form .slot").nth(index);
  await slot.locator('input[type="date"]').fill(date);
  await slot.locator('input[type="time"]').fill(time);
  await slot.locator(".field--wide input").fill(location);
}

async function createApero(page, { name, description, slots }) {
  await page.goto(`${APP_URL}/#/create`);
  await page.getByPlaceholder("La Grande Tablée des Olives").fill(name);
  if (description) {
    await page.getByPlaceholder("Apéro fin de chantier").fill(description);
  }
  for (let index = 0; index < slots.length; index += 1) {
    if (index > 0) {
      await page.getByRole("button", { name: "+ Ajouter un créneau" }).click();
    }
    await fillCreateSlot(page, index, slots[index]);
  }
  await page.getByRole("button", { name: "Créer l’apéro" }).click();
  await page.waitForURL(/#\/invite\/apero_/, { timeout: 20_000 });
  return parseInviteUrl(page.url());
}

/** Attend que l'instantané de notifications de cet apéro soit initialisé. */
async function waitForSnapshot(page, aperoId) {
  await page.waitForFunction(
    (id) => {
      const raw = window.localStorage.getItem("apero_notif_snapshots_v1");
      return Boolean(raw && raw.includes(id));
    },
    aperoId,
    { timeout: 15_000 },
  );
}

async function reopenVoteFormIfCollapsed(page, timeout = 15_000) {
  const editButton = page.getByRole("button", { name: "Modifier ma réponse" });
  const nameInput = page.getByPlaceholder("Jojo, Nadine, Éminence Chips…");
  await Promise.race([
    editButton.waitFor({ state: "visible", timeout }).catch(() => {}),
    nameInput.waitFor({ state: "visible", timeout }).catch(() => {}),
  ]);
  if (await editButton.isVisible().catch(() => false)) {
    await editButton.click();
  }
}

async function voteOnInvite(page, inviteUrl, { blaze, votes, comment }) {
  await page.goto(inviteUrl);
  // Réponse déjà au registre : le formulaire est replié en chip récapitulative,
  // « Modifier ma réponse » le rouvre.
  await reopenVoteFormIfCollapsed(page);
  const nameInput = page.getByPlaceholder("Jojo, Nadine, Éminence Chips…");
  await nameInput.waitFor({ state: "visible", timeout: 15_000 });
  if (blaze) {
    await nameInput.fill(blaze);
  }
  const cards = page.locator(".vote-form .slot");
  for (let index = 0; index < votes.length; index += 1) {
    await cards.nth(index).getByText(votes[index], { exact: true }).click();
  }
  if (comment) {
    await page
      .getByPlaceholder("Je viendrai si le monde ne s’est pas arrêté de tourner d’ici là.")
      .fill(comment);
  }
  await page.getByRole("button", { name: "Répondre à l’invitation" }).click();
}

const VOTE_YES = "J’y serai";
const VOTE_MAYBE = "J’me tâte";
const VOTE_NO = "Sans moi";

// ---------------------------------------------------------------------------
// Personas
// ---------------------------------------------------------------------------

const ORGANIZER = "Jojo l'Organisateur";
const GUEST_BOB = "Bob Ricard";
const GUEST_CHANTAL = "Chantal Suze";
const STRANGER = "Denis le Curieux";
const ORGANIZER_2 = "Édith Cognac";

const ctxOrganizer = await newPersonaContext({ throughOnboarding: true });
const ctxBob = await newPersonaContext({ blaze: GUEST_BOB });
const ctxChantal = await newPersonaContext({ blaze: GUEST_CHANTAL });
const ctxStranger = await newPersonaContext({ blaze: STRANGER });
const ctxOrganizer2 = await newPersonaContext({ blaze: ORGANIZER_2 });

const pageOrganizer = await ctxOrganizer.newPage();
const pageBob = await ctxBob.newPage();
const pageChantal = await ctxChantal.newPage();
const pageStranger = await ctxStranger.newPage();
const pageOrganizer2 = await ctxOrganizer2.newPage();

// Références partagées entre scénarios.
let invite1 = null; // apéro mono-créneau (servira à la suppression)
let invite2 = null; // apéro multi-créneaux (votes, contre-proposition, notifs)

const APERO_1_NAME = "Le Conclave du Houblon Test";
const APERO_2_NAME = "La Grande Manœuvre des Glaçons";

// ---------------------------------------------------------------------------
// Scénarios
// ---------------------------------------------------------------------------

await scenario("1. Création d'un apéro (onboarding complet, mono-créneau)", async () => {
  const page = pageOrganizer;
  await page.goto(`${APP_URL}/`);
  await passOnboarding(page, ORGANIZER);
  await waitVisible(
    page,
    page.getByRole("heading", { name: "La Confrérie du Petit Jaune" }),
    "L'accueil s'affiche après l'onboarding (blaze + notifications)",
  );

  await page.getByRole("link", { name: "Organiser un apéro" }).click();
  invite1 = await createApero(page, {
    name: APERO_1_NAME,
    description: "Apéro test fonctionnel",
    slots: [{ date: futureDate(2), time: "19:00", location: "Chez Dédé" }],
  });

  check("La création redirige vers un lien d'invitation avec clés", Boolean(invite1?.encryptionKey && invite1?.writeKey));
  await waitVisible(page, page.getByRole("heading", { name: APERO_1_NAME }), "Le nom cérémoniel saisi est affiché");
  await waitVisible(page, page.getByText("Ton assemblée"), "L'organisateur est identifié sur la page");
  await waitVisible(
    page,
    page.locator(".person__name", { hasText: ORGANIZER }),
    "L'organisateur est compté présent d'office au registre",
  );
  await waitVisible(page, page.locator(".share code"), "Le lien de partage est proposé");
  const displayedLink = (await page.locator(".share code").innerText()).trim();
  check("Le lien affiché masque les clés (coupé au « ?… »)", displayedLink.endsWith("?…"), displayedLink);

  // Vérifications côté stockage : le fichier existe, il est chiffré, et le
  // serveur n'a jamais vu la moindre donnée en clair.
  const storedPath = `data/aperos/${invite1.aperoId}.json`;
  const storedFile = fakeGitHub.readJson(storedPath);
  check("Le fichier apéro est bien écrit dans GitHub (via l'API VPS)", Boolean(storedFile));
  check("Le fichier stocké est chiffré en AES-GCM", storedFile?.encryption?.algorithm === "AES-GCM");
  check(
    "Le writeKeyHash stocké correspond au SHA-256 de la clé d'écriture du lien",
    storedFile?.writeKeyHash === sha256Hex(invite1.writeKey),
  );
  check("Une clé admin (adminKeyHash) protège la suppression", typeof storedFile?.adminKeyHash === "string");
  const rawStored = JSON.stringify(storedFile);
  check(
    "Zéro connaissance : aucune donnée en clair dans le fichier stocké",
    !rawStored.includes("Dédé") && !rawStored.includes("Jojo") && !rawStored.includes("Houblon"),
  );

  await waitForSnapshot(page, invite1.aperoId);
  await snap(page, "apero-cree");
});

await scenario("2. Création d'un apéro multi-créneaux", async () => {
  const page = pageOrganizer;
  invite2 = await createApero(page, {
    name: APERO_2_NAME,
    description: "Trois créneaux, que le zinc tranche",
    slots: [
      { date: futureDate(3), time: "19:00", location: "Le Bar des Sports" },
      { date: futureDate(4), time: "20:30", location: "Chez Momo" },
      { date: futureDate(5), time: "18:00", location: "Le PMU du Port" },
    ],
  });

  check("La création multi-créneaux aboutit sur le lien d'invitation", Boolean(invite2?.aperoId));
  await waitVisible(page, page.getByRole("heading", { name: APERO_2_NAME }), "Le nom de l'apéro multi-créneaux est affiché");
  // L'organisateur a une réponse d'office : sa chip se rouvre pour inspecter
  // le formulaire complet.
  await reopenVoteFormIfCollapsed(page);
  const slotCount = await page.locator(".vote-form .slot").count();
  check("Les 3 créneaux proposés sont affichés dans le formulaire de vote", slotCount === 3, `trouvé : ${slotCount}`);
  await waitForSnapshot(page, invite2.aperoId);
  await snap(page, "apero-multi-creneaux");
});

await scenario("3. Vote d'un invité, puis modification de son vote", async () => {
  const page = pageBob;
  await voteOnInvite(page, invite2.fullUrl, {
    votes: [VOTE_YES, VOTE_NO, VOTE_MAYBE],
    comment: "Je ramène ma bonne humeur",
  });
  await waitVisible(
    page,
    page.getByText("C’est émargé. Le registre te remercie."),
    "La première réponse de l'invité est enregistrée",
  );
  await waitVisible(
    page,
    page.locator(".person__name", { hasText: GUEST_BOB }),
    "L'invité apparaît au registre des présents",
  );

  // Retour de l'invité : sa réponse est au registre, repliée en chip — on la
  // rouvre pour la modifier.
  await page.reload();
  await waitVisible(
    page,
    page.getByText("Ta réponse est au registre"),
    "Au retour, la réponse existante est retrouvée via le blaze",
  );
  await reopenVoteFormIfCollapsed(page);
  await page.locator(".vote-form .slot").nth(1).getByText(VOTE_YES, { exact: true }).click();
  await page.getByRole("button", { name: "Répondre à l’invitation" }).click();
  await waitVisible(page, page.getByText("Le registre est corrigé. On ne dira rien."), "La modification du vote est enregistrée");

  const bobRows = await page.locator(".person__name", { hasText: GUEST_BOB }).count();
  check("Le même blaze ne crée pas de doublon au registre", bobRows === 1, `trouvé : ${bobRows}`);
  await snap(page, "vote-invite");
});

await scenario("4. Contre-proposition : un invité ajoute un créneau", async () => {
  const page = pageBob;
  await page.getByRole("button", { name: "Proposer un autre créneau" }).click();
  const form = page.locator("section", { hasText: "Proposer une autre date" });
  await form.locator('input[type="date"]').fill(futureDate(6));
  await form.locator('input[type="time"]').fill("21:00");
  await form.locator(".field--wide input").fill("La Buvette Clandestine");
  await page.getByRole("button", { name: "Proposer cette date" }).click();

  // Le formulaire se referme sans message depuis que le bouton déclencheur vit
  // dans la barre d'action : la preuve d'acceptation, c'est le créneau qui
  // apparaît dans la liste de vote.
  await reopenVoteFormIfCollapsed(page);
  await waitVisible(
    page,
    page.locator(".vote-form .slot", { hasText: "La Buvette Clandestine" }),
    "La contre-proposition est acceptée",
  );
  const slotCount = await page.locator(".vote-form .slot").count();
  check("Le nouveau créneau s'ajoute aux 3 existants", slotCount === 4, `trouvé : ${slotCount}`);
  await waitVisible(
    page,
    page.getByText(`proposé par ${GUEST_BOB}`),
    "Le créneau affiche le nom de son auteur",
  );
  await snap(page, "contre-proposition");
});

await scenario("5. Vote d'un second invité sur tous les créneaux (dont le nouveau)", async () => {
  const page = pageChantal;
  await voteOnInvite(page, invite2.fullUrl, {
    votes: [VOTE_YES, VOTE_YES, VOTE_NO, VOTE_YES],
  });
  await waitVisible(
    page,
    page.getByText("C’est émargé. Le registre te remercie."),
    "Le second invité vote, y compris sur le créneau contre-proposé",
  );
  await waitVisible(
    page,
    page.locator(".person__name", { hasText: GUEST_CHANTAL }),
    "Le second invité apparaît au registre",
  );
});

await scenario("6. Notifications : badge et carnet du créateur, silence côté invité", async () => {
  // Le créateur repasse à l'accueil : la synchronisation diffe les apéros
  // connus localement et alimente le badge.
  const page = pageOrganizer;
  await page.goto(`${APP_URL}/`);
  await waitVisible(page, page.locator(".notif-badge"), "Le badge rouge de notifications apparaît pour le créateur");
  const badgeText = (await page.locator(".notif-badge").innerText()).trim();
  check(
    "Le badge compte 3 non-lues (2 réponses + 1 contre-proposition)",
    badgeText === "3",
    `badge : ${badgeText}`,
  );

  await page.locator(".notif-bell").first().click();
  await waitVisible(page, page.getByRole("heading", { name: "Ce que le zinc a noté" }), "Le carnet de notifications s'ouvre");
  const pageText = await page.locator(".notif-list").innerText();
  check("Le créateur est notifié de la réponse de Bob", pageText.includes(GUEST_BOB));
  check("Le créateur est notifié de la réponse de Chantal", pageText.includes(GUEST_CHANTAL));
  check(
    "Le créateur est notifié de la contre-proposition de créneau",
    pageText.includes("Nouvelle proposition de créneau"),
  );
  check(
    "Le créateur n'est jamais notifié de ses propres actions",
    !pageText.includes(ORGANIZER),
    pageText,
  );
  await snap(page, "carnet-notifications-createur");

  // Ouvrir le carnet solde le compteur.
  await page.goto(`${APP_URL}/`);
  await page.waitForTimeout(1_000);
  const badgeAfter = await page.locator(".notif-badge").count();
  check("Après lecture du carnet, le badge disparaît", badgeAfter === 0, `badges visibles : ${badgeAfter}`);

  // Côté invité : rien à signaler (il ne doit pas être notifié de ses propres
  // actions, ni des réponses des autres invités).
  await pageBob.goto(`${APP_URL}/`);
  await pageBob.waitForTimeout(1_500);
  const bobBadges = await pageBob.locator(".notif-badge").count();
  check("L'invité n'a aucune notification (pas d'auto-notification)", bobBadges === 0, `badges : ${bobBadges}`);
});

await scenario("7. Isolation : seuls l'organisateur et les invités voient l'apéro", async () => {
  const page = pageStranger;

  // 7a. Un inconnu n'a rien dans son agenda.
  await page.goto(`${APP_URL}/#/agenda`);
  await waitVisible(
    page,
    page.getByText("L’ardoise est vide", { exact: false }),
    "L'agenda d'un inconnu est vide (registre local uniquement)",
  );

  // 7b. Le lien sans clé ne montre rien.
  await page.goto(`${APP_URL}/#/invite/${invite2.aperoId}`);
  await waitVisible(
    page,
    page.getByText("Ce lien d’invitation est incomplet", { exact: false }),
    "Sans clé de lecture, l'apéro reste illisible",
  );

  // 7c. Une mauvaise clé ne déchiffre pas.
  const wrongKey = invite2.encryptionKey.replace(/[A-Za-z]/g, (c) => (c === "A" ? "B" : "A"));
  await page.goto(`${APP_URL}/#/invite/${invite2.aperoId}?k=${wrongKey}`);
  await waitVisible(
    page,
    page.getByText("Cette clé n’ouvre pas cet apéro", { exact: false }),
    "Une clé erronée est rejetée (AES-GCM authentifié)",
  );

  // 7d. Clé de lecture seule (k sans w) : consultation sans vote.
  await page.goto(`${APP_URL}/#/invite/${invite2.aperoId}?k=${invite2.encryptionKey}`);
  await waitVisible(
    page,
    page.getByText("Ce lien permet de consulter l’apéro, mais pas d’y répondre", { exact: false }),
    "La clé de lecture seule permet de consulter sans répondre",
  );
  const voteFormCount = await page.getByRole("button", { name: "Répondre à l’invitation" }).count();
  check("Sans clé d'écriture, pas de formulaire de vote", voteFormCount === 0);

  // 7e. Côté API : une écriture avec une mauvaise write key est refusée.
  const forgedWrite = await fetch(`${API_URL}/api/aperos/${invite2.aperoId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      writeKey: "pas-la-bonne-cle-du-tout",
      encryptedPayload: {
        version: 1,
        encryption: { algorithm: "AES-GCM", iv: "AAAAAAAAAAAAAAAA", ciphertext: "AAAA" },
      },
    }),
  });
  const forgedWriteBody = await forgedWrite.json();
  check(
    "L'API refuse une écriture avec une mauvaise write key (403 INVALID_WRITE_KEY)",
    forgedWrite.status === 403 && forgedWriteBody.error === "INVALID_WRITE_KEY",
    `HTTP ${forgedWrite.status} ${forgedWriteBody.error}`,
  );

  // 7f. La write key partagée ne suffit pas à supprimer (clé admin requise).
  const forgedDelete = await fetch(`${API_URL}/api/aperos/${invite2.aperoId}/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminKey: invite2.writeKey }),
  });
  const forgedDeleteBody = await forgedDelete.json();
  check(
    "L'API refuse une suppression sans la vraie clé admin (403)",
    forgedDelete.status === 403 && forgedDeleteBody.error === "INVALID_ADMIN_KEY",
    `HTTP ${forgedDelete.status} ${forgedDeleteBody.error}`,
  );

  // 7g. Cloisonnement entre organisateurs : Édith crée son apéro, chacun ne
  // voit que les siens dans l'agenda.
  const inviteEdith = await createApero(pageOrganizer2, {
    name: "Le Cabinet des Limonades",
    slots: [{ date: futureDate(2), time: "18:30", location: "Café de la Gare" }],
  });
  check("Édith crée son propre apéro", Boolean(inviteEdith?.aperoId));

  await pageOrganizer2.goto(`${APP_URL}/#/agenda`);
  await waitVisible(
    pageOrganizer2,
    pageOrganizer2.getByRole("heading", { name: "Le Cabinet des Limonades" }),
    "Édith voit son apéro dans son agenda",
  );
  const edithSeesJojo =
    (await pageOrganizer2.getByRole("heading", { name: APERO_2_NAME }).count()) +
    (await pageOrganizer2.getByRole("heading", { name: APERO_1_NAME }).count());
  check("Édith ne voit aucun apéro de Jojo", edithSeesJojo === 0, `apéros de Jojo visibles : ${edithSeesJojo}`);

  await pageOrganizer.goto(`${APP_URL}/#/agenda`);
  await waitVisible(
    pageOrganizer,
    pageOrganizer.getByRole("heading", { name: APERO_2_NAME }),
    "Jojo voit ses apéros dans son agenda",
  );
  const jojoSeesEdith = await pageOrganizer.getByRole("heading", { name: "Le Cabinet des Limonades" }).count();
  check("Jojo ne voit pas l'apéro d'Édith", jojoSeesEdith === 0, `visibles : ${jojoSeesEdith}`);

  // L'invité Bob, lui, voit l'apéro auquel il a répondu.
  await pageBob.goto(`${APP_URL}/#/agenda`);
  await waitVisible(
    pageBob,
    pageBob.getByRole("heading", { name: APERO_2_NAME }),
    "L'invité qui a répondu retrouve l'apéro dans son agenda",
  );
  await snap(pageStranger, "isolation-inconnu");
});

await scenario("8. Suppression définitive par l'organisateur", async () => {
  // Bob et Chantal rejoignent d'abord l'apéro 1 : on vérifiera qu'il
  // disparaît aussi chez eux, avec un message d'annulation.
  await voteOnInvite(pageBob, invite1.fullUrl, { votes: [VOTE_YES] });
  await pageBob.getByText("C’est émargé. Le registre te remercie.").waitFor({ state: "visible" });
  await voteOnInvite(pageChantal, invite1.fullUrl, { votes: [VOTE_YES] });
  await pageChantal.getByText("C’est émargé. Le registre te remercie.").waitFor({ state: "visible" });
  await pageBob.goto(`${APP_URL}/#/agenda`);
  await waitVisible(
    pageBob,
    pageBob.getByRole("heading", { name: APERO_1_NAME }),
    "Avant suppression, l'invité voit l'apéro dans son agenda",
  );

  const page = pageOrganizer;
  await page.goto(invite1.fullUrl);
  const deleteButton = page.getByRole("button", { name: "Annuler l’apéro" });
  await waitVisible(page, deleteButton, "Le bouton de suppression n'apparaît que chez l'organisateur");

  // Contre-épreuve : l'invité Bob ne voit pas ce bouton sur l'apéro 2.
  // Bob a déjà émargé : sa réponse est repliée en chip récapitulative,
  // le helper attend la page prête quel que soit l'état du formulaire.
  await pageBob.goto(invite2.fullUrl);
  await reopenVoteFormIfCollapsed(pageBob);
  const bobDeleteCount = await pageBob.getByRole("button", { name: "Annuler l’apéro" }).count();
  check("Un invité ne voit pas le bouton de suppression", bobDeleteCount === 0, `trouvé : ${bobDeleteCount}`);

  await deleteButton.click();
  await waitVisible(page, page.getByText("Es-tu sûr de vouloir supprimer cet évènement ?"), "La confirmation est demandée");
  await page.getByRole("button", { name: "Oui, tout rayer" }).click();
  await page.waitForURL(/#\/agenda/, { timeout: 15_000 });
  check("Après suppression, retour à l'agenda", true);

  check(
    "Le fichier chiffré est supprimé de GitHub",
    !fakeGitHub.files.has(`data/aperos/${invite1.aperoId}.json`),
  );

  // Attendre que l'agenda ait fini de charger (l'apéro restant s'affiche)
  // avant de vérifier l'absence de l'apéro supprimé.
  await waitVisible(
    page,
    page.getByRole("heading", { name: APERO_2_NAME }),
    "Les autres apéros de l'organisateur restent en place",
  );
  const agendaHasApero1 = await page.getByRole("heading", { name: APERO_1_NAME }).count();
  check("L'apéro supprimé disparaît de l'agenda de l'organisateur", agendaHasApero1 === 0);

  // Le lien d'invitation (même complet) ne mène plus nulle part.
  await pageStranger.goto(invite1.fullUrl);
  await waitVisible(
    pageStranger,
    pageStranger.getByText("Cet apéro reste introuvable", { exact: false }),
    "Le lien d'un apéro supprimé aboutit sur « introuvable »",
  );

  // Chez l'invité aussi, l'apéro supprimé disparaît : l'agenda le purge du
  // registre local au premier rechargement (404 définitif sur un fichier
  // déjà vu publiquement). Bob étant déjà sur l'agenda, on force un vrai
  // rechargement plutôt qu'une navigation à hash identique (sans effet).
  await pageBob.goto(`${APP_URL}/#/agenda`);
  await pageBob.reload();
  await waitVisible(
    pageBob,
    pageBob.getByRole("heading", { name: APERO_2_NAME }),
    "L'agenda de l'invité continue d'afficher ses autres apéros",
  );
  const bobStillSeesDeleted = await pageBob.getByRole("heading", { name: APERO_1_NAME }).count();
  check("L'apéro supprimé disparaît aussi de l'agenda de l'invité", bobStillSeesDeleted === 0);
  const bobRegistryPurged = await pageBob.evaluate(
    (id) => !(window.localStorage.getItem("apero_local_registry_v1") ?? "").includes(id),
    invite1.aperoId,
  );
  check("Le registre local de l'invité est purgé de l'apéro supprimé", bobRegistryPurged);

  // La purge s'accompagne d'un message : badge + notification « Apéro annulé »
  // dans le carnet de l'invité.
  await pageBob.goto(`${APP_URL}/`);
  await waitVisible(pageBob, pageBob.locator(".notif-badge"), "L'invité reçoit un badge après l'annulation");
  await pageBob.locator(".notif-bell").first().click();
  await pageBob.locator(".notif-list").waitFor({ state: "visible" });
  const bobNotifText = await pageBob.locator(".notif-list").innerText();
  check(
    "Le carnet de l'invité explique que l'organisateur a annulé l'apéro",
    bobNotifText.includes("Apéro annulé") &&
      bobNotifText.includes(APERO_1_NAME) &&
      // Apostrophe typographique : c'est celle du texte réel de l'app.
      bobNotifText.includes("L’organisateur a rangé le zinc"),
    bobNotifText,
  );
  await snap(pageBob, "notification-apero-annule");

  // Chantal, elle, ouvre directement le lien de l'apéro disparu : la page
  // d'invitation explique l'annulation et purge ses traces locales. Elle est
  // déjà sur ce même lien (vote du début de scénario) : on force un vrai
  // rechargement, une navigation à hash identique serait sans effet.
  await pageChantal.goto(invite1.fullUrl);
  await pageChantal.reload();
  await waitVisible(
    pageChantal,
    pageChantal.getByRole("heading", { name: "Apéro annulé" }),
    "La page d'invitation d'un apéro supprimé annonce l'annulation à l'invité",
  );
  await waitVisible(
    pageChantal,
    pageChantal.getByText("annulé par la personne qui l’organisait", { exact: false }),
    "Le message précise que c'est l'organisateur qui a annulé",
  );
  const chantalRegistryPurged = await pageChantal.evaluate(
    (id) => !(window.localStorage.getItem("apero_local_registry_v1") ?? "").includes(id),
    invite1.aperoId,
  );
  check("Le registre local de Chantal est purgé à l'ouverture du lien mort", chantalRegistryPurged);
  await snap(pageChantal, "invitation-apero-annule");
  await snap(page, "apres-suppression");
});

await scenario("9. Contrat de la mini API (validation, conflits, santé)", async () => {
  const health = await fetch(`${API_URL}/health`);
  const healthBody = await health.json();
  check("GET /health répond ok", health.status === 200 && healthBody.ok === true);

  const badId = await fetch(`${API_URL}/api/aperos/pas-un-id-valide`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ writeKey: "12345678" }),
  });
  const badIdBody = await badId.json();
  check(
    "Un aperoId hors format est rejeté (400 INVALID_APERO_ID)",
    badId.status === 400 && badIdBody.error === "INVALID_APERO_ID",
    `HTTP ${badId.status} ${badIdBody.error}`,
  );

  const payload = {
    version: 1,
    encryption: { algorithm: "AES-GCM", iv: "AAAAAAAAAAAAAAAA", ciphertext: "AAAA" },
  };

  const noHash = await fetch(`${API_URL}/api/aperos/apero_CONTRACT1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ writeKey: "cle-ecriture-test", encryptedPayload: payload }),
  });
  const noHashBody = await noHash.json();
  check(
    "Créer sans writeKeyHash est refusé (400 MISSING_WRITE_KEY_HASH)",
    noHash.status === 400 && noHashBody.error === "MISSING_WRITE_KEY_HASH",
    `HTTP ${noHash.status} ${noHashBody.error}`,
  );

  const noAdmin = await fetch(`${API_URL}/api/aperos/apero_CONTRACT1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      writeKey: "cle-ecriture-test",
      writeKeyHash: sha256Hex("cle-ecriture-test"),
      encryptedPayload: payload,
    }),
  });
  const noAdminBody = await noAdmin.json();
  check(
    "Créer sans adminKeyHash est refusé (400 MISSING_ADMIN_KEY_HASH)",
    noAdmin.status === 400 && noAdminBody.error === "MISSING_ADMIN_KEY_HASH",
    `HTTP ${noAdmin.status} ${noAdminBody.error}`,
  );

  const staleSha = await fetch(`${API_URL}/api/aperos/${invite2.aperoId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      writeKey: invite2.writeKey,
      encryptedPayload: payload,
      baseSha: "0".repeat(40),
    }),
  });
  const staleShaBody = await staleSha.json();
  check(
    "Un baseSha périmé déclenche un conflit (409 SHA_CONFLICT)",
    staleSha.status === 409 && staleShaBody.error === "SHA_CONFLICT",
    `HTTP ${staleSha.status} ${staleShaBody.error}`,
  );

  const wrongContentType = await fetch(`${API_URL}/api/aperos/${invite2.aperoId}`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: "bonjour",
  });
  check(
    "Un Content-Type non JSON est refusé (415)",
    wrongContentType.status === 415,
    `HTTP ${wrongContentType.status}`,
  );

  const unknownDelete = await fetch(`${API_URL}/api/aperos/apero_INCONNU42/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adminKey: "peu-importe-vraiment" }),
  });
  const unknownDeleteBody = await unknownDelete.json();
  check(
    "Supprimer un apéro inexistant est idempotent (200, deleted:false)",
    unknownDelete.status === 200 && unknownDeleteBody.deleted === false,
    `HTTP ${unknownDelete.status} ${JSON.stringify(unknownDeleteBody)}`,
  );
});

// ---------------------------------------------------------------------------
// Bilan
// ---------------------------------------------------------------------------

await browser.close();
await shutdown();
await fakeGitHub.close();

const failed = results.filter((result) => !result.ok);
const passed = results.length - failed.length;

console.log(`\n${"=".repeat(72)}`);
console.log(`Bilan : ${passed}/${results.length} vérifications réussies`);
if (failed.length > 0) {
  console.log("\nÉchecs :");
  for (const failure of failed) {
    console.log(`  ❌ [${failure.scenario}] ${failure.label}${failure.details ? ` — ${failure.details}` : ""}`);
  }
}
console.log(`Captures d'écran : ${SHOTS_DIR}`);

process.exit(failed.length > 0 ? 1 : 0);
