import { chromium } from "playwright-core";

const APP = "https://j-rbs91.github.io/Apero";
const API = "https://panum.fr/_svc/a";
const GH_FILE_BASE = "https://api.github.com/repos/J-Rbs91/Apero/contents/data/aperos";
const EVENT_NAME = "E2E LIVE 27-08-2026 19h";
const EVENT_DESCRIPTION = "Test E2E production réel - création, vote, conflit et annulation";
const EVENT_DATE = "2026-08-27";
const EVENT_TIME = "19:00";
const EVENT_LOCATION = "Test E2E production";
const ORGANIZER = "E2E Organisateur";
const GUEST = "E2E Convive";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function check(label, condition, details = "") {
  if (!condition) throw new Error(`${label}${details ? ` — ${details}` : ""}`);
  console.log(`PASS ${label}`);
}

async function fetchStored(aperoId) {
  const response = await fetch(`${GH_FILE_BASE}/${aperoId}.json?ref=main`, {
    headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub Contents API HTTP ${response.status}`);
  const body = await response.json();
  const jsonText = Buffer.from(body.content.replace(/\n/g, ""), "base64").toString("utf8");
  return { sha: body.sha, jsonText, json: JSON.parse(jsonText) };
}

async function waitStored(aperoId, predicate, label, timeout = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const latest = await fetchStored(aperoId);
    if (predicate(latest)) return latest;
    await sleep(1000);
  }
  throw new Error(`${label} non observé dans GitHub après ${timeout}ms`);
}

function parseInvite(url) {
  const match = url.match(/#\/invite\/([^?]+)\?(.*)$/);
  if (!match) throw new Error("URL invitation inattendue");
  const params = new URLSearchParams(match[2]);
  const aperoId = match[1];
  const encryptionKey = params.get("k") ?? "";
  const writeKey = params.get("w") ?? "";
  check("Lien invitation contient id + clés", Boolean(aperoId && encryptionKey && writeKey));
  return { aperoId, encryptionKey, writeKey, fullUrl: url };
}

async function newPersona(browser, blaze) {
  const context = await browser.newContext({ viewport: { width: 420, height: 900 }, locale: "fr-FR" });
  await context.addInitScript(({ name }) => {
    localStorage.setItem("apero_gentleman_name", name);
    localStorage.setItem("apero_notif_onboarding_seen_v1", "1");
  }, { name: blaze });
  await context.route("https://photon.komoot.io/**", (route) => route.fulfill({ status: 200, json: { features: [] } }));
  return context;
}

let browser;
let aperoId = "";
let writeKey = "";
let initialSha = "";
let voteSha = "";
let syncReload = false;
let uiDeleteSucceeded = false;

try {
  browser = await chromium.launch({ headless: true });
  const organizerContext = await newPersona(browser, ORGANIZER);
  const guestContext = await newPersona(browser, GUEST);
  const organizer = await organizerContext.newPage();
  const guest = await guestContext.newPage();

  console.log("STEP create through deployed GitHub Pages frontend");
  await organizer.goto(`${APP}/#/create`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await organizer.getByPlaceholder("La Grande Tablée des Olives").fill(EVENT_NAME);
  await organizer.getByPlaceholder("Apéro fin de chantier").fill(EVENT_DESCRIPTION);
  const slot = organizer.locator("form .slot").first();
  await slot.locator('input[type="date"]').fill(EVENT_DATE);
  await slot.locator('input[type="time"]').fill(EVENT_TIME);
  await slot.locator(".field--wide input").fill(EVENT_LOCATION);
  const closeLocationSearch = organizer.getByRole("button", { name: "Fermer la recherche" });
  if (await closeLocationSearch.isVisible().catch(() => false)) await closeLocationSearch.click();
  await organizer.getByRole("button", { name: "Créer l’apéro" }).click();
  await organizer.waitForURL(/#\/invite\/apero_/, { timeout: 30000 });

  const invite = parseInvite(organizer.url());
  aperoId = invite.aperoId;
  writeKey = invite.writeKey;
  console.log(`APERO_ID=${aperoId}`);
  await organizer.getByRole("heading", { name: EVENT_NAME }).waitFor({ state: "visible", timeout: 20000 });
  check("Création visible dans le frontend", true);

  const stored = await waitStored(aperoId, Boolean, "création du fichier");
  initialSha = stored.sha;
  check("Fichier JSON créé sur GitHub main", /^[0-9a-f]{40}$/.test(initialSha));
  check("Stockage AES-GCM", stored.json?.encryption?.algorithm === "AES-GCM");
  check("Zéro connaissance: nom non présent en clair", !stored.jsonText.includes(EVENT_NAME));
  check("Zéro connaissance: lieu non présent en clair", !stored.jsonText.includes(EVENT_LOCATION));
  check("Zéro connaissance: blaze organisateur non présent en clair", !stored.jsonText.includes(ORGANIZER));
  check("Clé admin hachée stockée", typeof stored.json?.adminKeyHash === "string");

  console.log("STEP verify deployed legacy read contract");
  const apiRead = await fetch(`${API}/api/aperos/${aperoId}`);
  const apiReadBody = await apiRead.json();
  console.log(`API_GET_STATUS=${apiRead.status} API_GET_ERROR=${apiReadBody.error ?? "none"}`);
  check("API VPS déployée conserve le contrat GET legacy", apiRead.status === 404 && apiReadBody.error === "NOT_FOUND");

  console.log("STEP guest vote through real invitation");
  await guest.goto(invite.fullUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
  const nameInput = guest.getByPlaceholder("Jojo, Nadine, Éminence Chips…");
  await nameInput.waitFor({ state: "visible", timeout: 20000 });
  await nameInput.fill(GUEST);
  await guest.locator(".vote-form .slot").first().locator('input[value="yes"]').check();
  await guest.getByRole("button", { name: "Envoyer ma réponse" }).click();
  await guest.getByText("C’est émargé. Le registre te remercie.").waitFor({ state: "visible", timeout: 20000 });
  check("Vote invité accepté par l’application", true);

  const afterVote = await waitStored(aperoId, (value) => Boolean(value && value.sha !== initialSha), "mise à jour après vote");
  voteSha = afterVote.sha;
  check("Vote provoque un nouveau SHA GitHub", voteSha !== initialSha);
  check("Blaze invité reste chiffré dans GitHub", !afterVote.jsonText.includes(GUEST));
  console.log(`EXPECTED_VOTE_SHA=${voteSha}`);

  console.log("STEP trace organizer reload read path");
  organizer.on("response", async (response) => {
    const url = response.url();
    if (!aperoId || !url.includes(aperoId)) return;
    let suffix = "";
    if (url.includes("api.github.com")) {
      try {
        const body = await response.json();
        suffix = ` sha=${body?.sha ?? "none"} message=${body?.message ?? "none"}`;
      } catch {}
    }
    console.log(`ORG_NET status=${response.status()} url=${url.split("?")[0]}${suffix}`);
  });

  await organizer.reload({ waitUntil: "domcontentloaded" });
  const participantsDisclosure = organizer.locator("details.disclose").filter({ hasText: "Qui vient ?" }).first();
  await participantsDisclosure.waitFor({ state: "visible", timeout: 20000 });
  if (!(await participantsDisclosure.getAttribute("open"))) await participantsDisclosure.locator("summary").click();

  try {
    await participantsDisclosure.getByText(GUEST, { exact: true }).waitFor({ state: "visible", timeout: 8000 });
    syncReload = true;
    console.log("PASS Organisateur voit le vote après reload");
  } catch {
    console.log("WARN Organisateur ne voit pas le vote après reload immédiat");

    const browserProbe = await organizer.evaluate(async ({ ghUrl, expectedSha }) => {
      const response = await fetch(ghUrl, {
        headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
        cache: "no-cache",
      });
      let sha = null;
      let message = null;
      try {
        const body = await response.json();
        sha = body?.sha ?? null;
        message = body?.message ?? null;
      } catch {}
      return {
        status: response.status,
        sha,
        message,
        expectedSha,
        rateRemaining: response.headers.get("x-ratelimit-remaining"),
        cacheControl: response.headers.get("cache-control"),
      };
    }, {
      ghUrl: `${GH_FILE_BASE}/${aperoId}.json?ref=main`,
      expectedSha: voteSha,
    });
    console.log(`BROWSER_GITHUB_PROBE=${JSON.stringify(browserProbe)}`);

    const rawProbe = await organizer.evaluate(async ({ rawUrl }) => {
      const response = await fetch(`${rawUrl}?cb=${Date.now()}`, { cache: "no-cache" });
      return { status: response.status, length: (await response.text()).length, cacheControl: response.headers.get("cache-control") };
    }, { rawUrl: `https://raw.githubusercontent.com/J-Rbs91/Apero/main/data/aperos/${aperoId}.json` });
    console.log(`BROWSER_RAW_BUST_PROBE=${JSON.stringify(rawProbe)}`);
  }

  console.log("STEP stale baseSha conflict probe");
  const conflict = await fetch(`${API}/api/aperos/${aperoId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://j-rbs91.github.io" },
    body: JSON.stringify({
      writeKey,
      baseSha: "0000000000000000000000000000000000000000",
      encryptedPayload: { version: 1, encryption: { algorithm: "AES-GCM", iv: "AAAAAAAAAAAAAAAA", ciphertext: "AAAA" } },
    }),
  });
  const conflictBody = await conflict.json();
  console.log(`CONFLICT_STATUS=${conflict.status} CONFLICT_ERROR=${conflictBody.error ?? "none"}`);
  check("Conflit de version est refusé sans mutation", conflict.status === 409 && ["SHA_CONFLICT", "CONFLICT"].includes(conflictBody.error));
  const afterConflict = await fetchStored(aperoId);
  check("Le probe 409 n'a pas modifié le fichier", afterConflict?.sha === voteSha);

  console.log("STEP organizer cancellation through UI");
  const deleteButton = organizer.getByRole("button", { name: "Annuler l’apéro" });
  await deleteButton.waitFor({ state: "visible", timeout: 15000 });
  await deleteButton.click();
  await organizer.getByText("On raye tout, vraiment ?").waitFor({ state: "visible", timeout: 10000 });
  await organizer.getByRole("button", { name: "Oui, tout rayer" }).click();
  try {
    await organizer.waitForURL(/#\/agenda/, { timeout: 15000 });
    uiDeleteSucceeded = true;
    console.log("PASS Annulation UI réussie");
  } catch {
    const bodyText = await organizer.locator("body").innerText();
    const relevant = bodyText.split("\n").filter((line) => /annul|legacy|suppression|serveur|autor|impossible|erreur|conflit/i.test(line)).slice(-12).join(" | ");
    console.log(`DELETE_UI_RESULT=failed DETAILS=${relevant.slice(0, 1200)}`);
  }

  const finalStored = await fetchStored(aperoId);
  if (uiDeleteSucceeded) check("Fichier supprimé de GitHub après annulation UI", finalStored === null);
  else check("Échec d'annulation UI n'a pas corrompu le fichier", Boolean(finalStored && finalStored.sha === voteSha));

  console.log(`RESULT core=PASS aperoId=${aperoId} syncReload=${syncReload ? "PASS" : "FAIL"} deleteUi=${uiDeleteSucceeded ? "PASS" : "FAIL"}`);
} catch (error) {
  console.error(`RESULT core=FAIL aperoId=${aperoId || "none"} error=${error?.message ?? error}`);
  throw error;
} finally {
  if (browser) await browser.close();
}
