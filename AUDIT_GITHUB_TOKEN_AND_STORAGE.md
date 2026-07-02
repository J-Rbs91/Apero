# Audit GitHub Token & Storage - App Apero

Date de l'audit : 2026-07-02  
Branche observee : `main`  
Objectif : diagnostic preparatoire avant migration des ecritures GitHub vers une mini API VPS.

## 1. Resume executif

L'application est un frontend Vite / React heberge sur GitHub Pages. Le stockage actuel des aperos repose sur des fichiers JSON publics dans le repo GitHub, principalement sous `data/events/`, avec un registre de recompenses sous `data/rewards/ledger.json`.

Le frontend lit et ecrit directement dans l'API GitHub via `src/services/githubStorage.ts`. Le token GitHub est lu depuis `import.meta.env.VITE_GITHUB_TOKEN`, puis ajoute aux requetes sous forme `Authorization: Bearer ...`.

Diagnostic central : tout secret prefixe `VITE_` est public dans un build Vite. Le token injecte sous `VITE_GITHUB_TOKEN` est donc expose dans le bundle navigateur et/ou observable via les requetes reseau du navigateur. Le fichier `src/config/githubConfig.ts` contient deja un commentaire signalant explicitement cette exposition.

Aucune suppression de token, aucune migration et aucun changement fonctionnel ne sont faits dans cette etape. Le seul changement recommande dans ce commit est documentaire : clarifier `.env.example` et fournir ce rapport.

## 2. Architecture actuelle constatee

Zones fonctionnelles observees :

- Configuration Vite : `vite.config.ts`, `index.html`, `src/main.tsx`.
- Configuration GitHub frontend : `src/config/githubConfig.ts`.
- Abstraction stockage : `src/services/EventStorage.ts`.
- Implementation active du stockage : `src/services/githubStorage.ts`.
- Selection de l'implementation : `src/services/index.ts`, qui exporte directement `githubEventStorage`.
- Routes React : `src/routes/AppRouter.tsx`.
- Creation d'apero : `src/pages/CreateEventPage.tsx`.
- Page d'invitation / evenement : `src/pages/EventPage.tsx`.
- Formulaire de reponse : `src/components/VoteForm.tsx`.
- Contre-proposition : `src/components/AlternativeOptionForm.tsx`.
- Partage d'invitation : `src/components/MobileShareBox.tsx`.
- Page de liste des aperos : `src/pages/AgendaPage.tsx`.
- Page palmares / recompenses : `src/pages/PalmaresPage.tsx`.
- Nom local utilisateur : `src/hooks/useComptoirName.ts`, stocke en `localStorage`.
- Donnees aperos : `data/events/*.json`.
- Donnees recompenses : `data/rewards/ledger.json`.
- Purge locale/CI : `scripts/purge-expired-events.mjs` et `.github/workflows/purge-expired-events.yml`.
- Deploiement GitHub Pages : `.github/workflows/deploy.yml`.

Schema actuel simplifie :

```txt
Page ou composant React
↓
eventStorage
↓
src/services/index.ts
↓
githubEventStorage
↓
src/services/githubStorage.ts
↓
fetch GitHub Contents API
↓
data/events/*.json et data/rewards/ledger.json dans le repo public
```

## 3. Variables d'environnement utilisees

Variables actuellement lues par le frontend dans `src/config/githubConfig.ts` :

- `VITE_GITHUB_OWNER`, fallback `"J-Rbs91"`.
- `VITE_GITHUB_REPO`, fallback `"Apero"`.
- `VITE_GITHUB_BRANCH`, fallback `"main"`.
- `VITE_GITHUB_DATA_PATH`, fallback `"data/events"`.
- `VITE_GITHUB_TOKEN`, fallback `""`.

Variables injectees par le workflow `.github/workflows/deploy.yml` :

- `VITE_GITHUB_OWNER: j-rbs91`.
- `VITE_GITHUB_REPO: Apero`.
- `VITE_GITHUB_BRANCH: main`.
- `VITE_GITHUB_DATA_PATH: data/events`.
- `VITE_GITHUB_TOKEN: ${{ secrets.APERO_GITHUB_TOKEN }}`.

Variables documentees historiquement dans `README.md` :

- `VITE_GITHUB_OWNER`.
- `VITE_GITHUB_REPO`.
- `VITE_GITHUB_BRANCH`.
- `VITE_GITHUB_DATA_PATH`.
- `VITE_GITHUB_TOKEN`.

Variables a prevoir plus tard cote serveur VPS :

- `GITHUB_TOKEN`.
- `GITHUB_OWNER`.
- `GITHUB_REPO`.
- `GITHUB_BRANCH`.
- `GITHUB_DATA_PATH`.
- `GITHUB_REWARDS_LEDGER_PATH`.
- `ALLOWED_ORIGIN`.
- `PORT`.
- `JSON_BODY_LIMIT`.
- `LOG_LEVEL`.

Variables a prevoir plus tard cote frontend :

- `VITE_APP_BASE_URL`.
- `VITE_APERO_API_BASE_URL`.
- Eventuellement les variables publiques non sensibles utiles a l'affichage.
- Plus aucun token durable.

## 4. Exposition actuelle du token

Declaration documentaire :

- `.env.example:5` contenait `VITE_GITHUB_TOKEN=TOKEN_GITHUB_A_METTRE_ICI_EN_MODE_KAMIKAZE` avant cet audit.
- `README.md:103` documente aussi `VITE_GITHUB_TOKEN=TOKEN_GITHUB_A_METTRE_ICI_EN_MODE_KAMIKAZE`.

Injection reelle au build :

- `.github/workflows/deploy.yml:23` injecte `VITE_GITHUB_TOKEN: ${{ secrets.APERO_GITHUB_TOKEN }}` dans le job `build`.

Lecture cote frontend :

- `src/config/githubConfig.ts:11` lit `import.meta.env.VITE_GITHUB_TOKEN`.

Utilisation cote navigateur :

- `src/services/githubStorage.ts:93` ajoute `headers.Authorization = \`Bearer ${githubConfig.token}\``.
- Les requetes GitHub partent depuis le navigateur car `githubStorage.ts` est importe par le frontend via `src/services/index.ts`.

Niveau de risque : eleve.

Raison : dans Vite, toute variable prefixee `VITE_` est remplacee au build et incluse dans le JavaScript public. Un visiteur peut donc recuperer le token depuis le bundle ou l'observer dans l'onglet reseau lors des appels GitHub API. Ce risque existe independamment du fait que le repo soit public.

## 5. Flux actuel de lecture GitHub

Lecture d'un apero par lien :

```txt
Route #/event/:eventId
↓
src/pages/EventPage.tsx
↓
eventStorage.getEvent(eventId)
↓
githubStorage.readEventFile(eventId)
↓
GET https://api.github.com/repos/{owner}/{repo}/contents/{dataPath}/{eventId}.json?ref={branch}
↓
decode base64 + JSON.parse
↓
normalizeEvent(...)
↓
etat React de EventPage
```

Lecture de la liste des aperos actifs :

```txt
src/pages/AgendaPage.tsx ou CreateEventPage.tsx ou PalmaresPage.tsx
↓
eventStorage.listActiveEvents()
↓
githubStorage.listEventFiles()
↓
GET https://api.github.com/repos/{owner}/{repo}/contents/{dataPath}?ref={branch}
↓
filtre *.json
↓
lecture individuelle de chaque fichier evenement
↓
filtre event.status === "active"
```

Lecture du palmares :

```txt
src/pages/PalmaresPage.tsx
↓
eventStorage.readRewardsLedger()
↓
readRewardsLedgerFile()
↓
GET data/rewards/ledger.json via GitHub Contents API
↓
normalizeRewardsLedger(...)
```

Remarque : les lectures utilisent `createHeaders(false)`. Si `githubConfig.token` existe, le header `Authorization` est quand meme ajoute par `createHeaders`, meme quand `requireToken` vaut `false`. Les lectures publiques peuvent donc aussi transporter le token dans le navigateur.

## 6. Flux actuel d'ecriture GitHub

Creation d'un apero :

```txt
src/pages/CreateEventPage.tsx
↓
handleSubmit()
↓
eventStorage.listActiveEvents() pour choisir un ceremonialName unique
↓
eventStorage.createEvent(event)
↓
githubStorage.writeEventFile(event, message)
↓
writeJsonFile(...)
↓
PUT GitHub Contents API avec Authorization: Bearer {VITE_GITHUB_TOKEN}
↓
data/events/{eventId}.json
```

Reponse d'un invite :

```txt
src/components/VoteForm.tsx
↓
onSubmit(response)
↓
src/pages/EventPage.tsx handleVoteSubmit()
↓
eventStorage.saveParticipantResponse(eventId, response)
↓
readEventFile(eventId)
↓
upsertParticipant(...)
↓
writeEventFile(updatedEvent, message, sha)
↓
PUT GitHub Contents API avec Authorization: Bearer {VITE_GITHUB_TOKEN}
```

Ajout d'une contre-proposition :

```txt
src/components/AlternativeOptionForm.tsx
↓
onSubmit(option)
↓
src/pages/EventPage.tsx handleOptionSubmit()
↓
eventStorage.addEventOption(eventId, option)
↓
readEventFile(eventId)
↓
appendEventOption(...)
↓
writeEventFile(updatedEvent, message, sha)
↓
PUT GitHub Contents API avec Authorization: Bearer {VITE_GITHUB_TOKEN}
```

Suppression d'un evenement par organisateur :

```txt
src/pages/EventPage.tsx
↓
handleDelete()
↓
eventStorage.deleteEvent(eventId)
↓
readEventFile(eventId)
↓
DELETE GitHub Contents API avec Authorization: Bearer {VITE_GITHUB_TOKEN}
```

Purge depuis le frontend :

```txt
src/pages/HomePage.tsx
↓
eventStorage.purgeExpiredEvents()
↓
githubStorage.listEventFiles()
↓
pour chaque evenement expire :
  ecriture du ledger de recompenses
  suppression du fichier evenement
↓
PUT/DELETE GitHub Contents API avec Authorization: Bearer {VITE_GITHUB_TOKEN}
```

Purge depuis GitHub Actions :

```txt
.github/workflows/purge-expired-events.yml
↓
npm run purge:expired
↓
scripts/purge-expired-events.mjs
↓
modifie les fichiers localement dans le checkout
↓
git add data/events data/rewards
↓
git commit + git push avec GITHUB_TOKEN implicite de GitHub Actions
```

## 7. Fichiers concernes

### Fichiers directement concernes par le token et GitHub API

- `src/config/githubConfig.ts` : lit les variables `VITE_GITHUB_*`, dont le token.
- `src/services/githubStorage.ts` : construit les URLs `api.github.com/repos/.../contents/...`, ajoute `Authorization: Bearer`, lit, ecrit et supprime les fichiers JSON.
- `src/services/index.ts` : force actuellement l'application a utiliser `githubEventStorage`.
- `.github/workflows/deploy.yml` : injecte le secret GitHub Actions `APERO_GITHUB_TOKEN` sous forme `VITE_GITHUB_TOKEN` dans le build public.
- `.env.example` : documente les variables actuelles et futures.
- `README.md` : documente encore l'ancienne configuration `VITE_GITHUB_TOKEN`.

### Fichiers qui declenchent les lectures/ecritures via `eventStorage`

- `src/pages/HomePage.tsx` : declenche `purgeExpiredEvents()` au chargement de l'accueil.
- `src/pages/CreateEventPage.tsx` : liste les evenements actifs puis cree un nouvel evenement.
- `src/pages/EventPage.tsx` : lit un evenement, enregistre une reponse, ajoute une contre-proposition, supprime un evenement, verifie une purge.
- `src/pages/AgendaPage.tsx` : liste les evenements actifs.
- `src/pages/PalmaresPage.tsx` : lit le ledger des recompenses et liste les evenements actifs.
- `src/components/VoteForm.tsx` : prepare une `ParticipantResponse` puis appelle le callback fourni par `EventPage`.
- `src/components/AlternativeOptionForm.tsx` : prepare une `AperitifOption` puis appelle le callback fourni par `EventPage`.

### Fichiers de structure de donnees

- `src/types/apero.ts` : definit `AperitifEvent`, `AperitifOption`, `ParticipantResponse`, `VoteStatus`, `EventResults`.
- `src/types/rewards.ts` : definit le ledger de recompenses.
- `src/utils/eventNormalization.ts` : normalise les formats historiques et actuels.
- `src/services/eventPurge.ts` : logique partagee de purge et mise a jour des recompenses.
- `data/events/*.json` : stockage clair des aperos actifs.
- `data/rewards/ledger.json` : stockage clair des recompenses et evenements purges.

### Fichiers hors GitHub API mais avec appels reseau

- `src/utils/photonGeocoding.ts` : appelle l'API publique Photon (`https://photon.komoot.io/api/` et `/reverse`) sans secret.

## 8. Risques identifies

1. Token GitHub expose publiquement : `VITE_GITHUB_TOKEN` est integre dans le bundle Vite.
2. Ecritures GitHub depuis navigateur : toute logique d'ecriture repose sur un secret cote client.
3. Lectures avec token meme si les donnees sont publiques : `createHeaders(false)` ajoute quand meme `Authorization` si `githubConfig.token` existe.
4. Donnees personnelles ou semi-personnelles en clair : noms, disponibilites, contributions, commentaires, lieux, adresses et coordonnees GPS sont stockes en JSON public.
5. Listing public des aperos actifs : `listActiveEvents()` liste les fichiers de `data/events`.
6. Purge declenchee depuis l'accueil : `HomePage.tsx` peut declencher des ecritures/suppressions GitHub depuis le navigateur.
7. Risque de conflits d'ecriture : `githubStorage.ts` gere certains `409`, mais le stockage fichier GitHub reste fragile si plusieurs utilisateurs ecrivent en meme temps.
8. Couplage fort frontend/GitHub : les pages React dependent indirectement du format GitHub Contents API via `githubEventStorage`.

## 9. Modifications recommandees pour la prochaine etape

### A modifier cote frontend

- `src/config/githubConfig.ts` : retirer le token frontend et remplacer la config GitHub par une config API publique (`VITE_APERO_API_BASE_URL`).
- `src/services/githubStorage.ts` : ne plus l'utiliser cote navigateur ; le remplacer ou l'isoler cote serveur.
- `src/services/index.ts` : pointer vers un futur client API, par exemple `apiEventStorage`.
- `src/services/EventStorage.ts` : conserver l'interface si possible pour limiter les changements.
- `src/pages/HomePage.tsx` : retirer ou deplacer la purge cote serveur.
- `src/pages/CreateEventPage.tsx` : envoyer la creation vers l'API VPS.
- `src/pages/EventPage.tsx` : envoyer lecture, reponse, contre-proposition, suppression vers l'API VPS.
- `src/pages/AgendaPage.tsx` : recuperer la liste via l'API VPS.
- `src/pages/PalmaresPage.tsx` : recuperer le ledger via l'API VPS.
- `src/components/VoteForm.tsx` et `src/components/AlternativeOptionForm.tsx` : probablement peu de changements si `EventStorage` reste stable.
- `src/hooks/useComptoirName.ts` : a conserver, mais a verifier si un futur registre local d'aperos doit etre ajoute.

### A modifier cote CI/CD

- `.github/workflows/deploy.yml` : supprimer l'injection `VITE_GITHUB_TOKEN` quand l'API VPS est operationnelle.
- GitHub Pages : garder le deploiement statique, mais ne plus y injecter de secret.
- GitHub Secrets : remplacer l'usage frontend de `APERO_GITHUB_TOKEN` par un secret serveur sur le VPS.

### A creer plus tard

- Client API frontend, par exemple `src/services/apiEventStorage.ts`.
- Configuration API frontend, par exemple `src/config/apiConfig.ts`.
- Mini API VPS serveur.
- Repository serveur GitHub, par exemple `githubAperoRepository.ts`.
- Validation des payloads serveur.
- Gestion CORS stricte via `ALLOWED_ORIGIN`.
- Eventuellement `localAperoRegistry.ts` si "Mes aperos" doit devenir une liste personnelle locale.
- Eventuellement `cryptoService.ts` et stockage chiffre dans une etape ulterieure, mais pas dans cette mission.

## 10. Points a ne pas casser pendant la migration

- Les routes hash actuelles doivent rester compatibles GitHub Pages :
  - `#/`
  - `#/create`
  - `#/event/:eventId`
  - `#/agenda`
  - `#/palmares`
- Les liens d'invitation generes par `MobileShareBox` et `EventPage` doivent rester valides.
- La structure `AperitifEvent` doit rester compatible avec les fichiers existants.
- La normalisation de `src/utils/eventNormalization.ts` doit continuer a lire les formats historiques (`responses`, `slots`, `createdBy`).
- La logique de nom ceremoniel unique depend actuellement de `listActiveEvents()`.
- La page `/agenda` liste les aperos actifs a partir de tous les fichiers `data/events/*.json`.
- Le palmares depend a la fois du ledger purge et, en bonus, des evenements actifs.
- Le nom utilisateur local dans `localStorage` (`apero_gentleman_name`) ne doit pas etre perdu.
- La purge doit rester transactionnelle : ne pas supprimer un evenement avant d'avoir inscrit/verifie sa trace dans le ledger.

## 11. Plan de migration propose

1. Rotation preventive du token existant juste avant ou juste apres bascule, selon fenetre de risque choisie.
2. Creer une mini API VPS avec endpoints equivalents a `EventStorage` :
   - `GET /events/:id`
   - `GET /events`
   - `POST /events`
   - `PUT /events/:id/responses`
   - `POST /events/:id/options`
   - `DELETE /events/:id`
   - `GET /rewards/ledger`
   - `POST /maintenance/purge-expired` ou tache cron serveur
3. Deplacer le token GitHub dans l'environnement serveur uniquement (`GITHUB_TOKEN`).
4. Creer un client frontend `apiEventStorage` qui implemente l'interface `EventStorage`.
5. Basculer `src/services/index.ts` de `githubEventStorage` vers `apiEventStorage`.
6. Tester creation, invitation, reponse, contre-proposition, agenda, palmares, purge.
7. Supprimer `VITE_GITHUB_TOKEN` de `.github/workflows/deploy.yml`, `.env.example`, README et du code frontend.
8. Revoquer l'ancien token expose.
9. Optionnel ensuite : durcir la confidentialite des donnees via chiffrement ou autre strategie de stockage.

## Occurrences pertinentes recherchees

Recherche effectuee sur :

- `VITE_GITHUB_TOKEN`
- `GITHUB_TOKEN`
- `APERO_GITHUB_TOKEN`
- `import.meta.env`
- `Authorization`
- `Bearer`
- `github.com`
- `api.github.com`
- `contents`
- `repos/`
- `octokit`
- `fetch(`

Occurrences applicatives pertinentes :

- `.env.example:5` : placeholder historique de token frontend avant cet audit.
- `README.md:99-103` : documentation historique des variables `VITE_GITHUB_*`.
- `src/config/githubConfig.ts:7-11` : lecture des variables Vite.
- `src/services/githubStorage.ts:65` : construction de l'URL GitHub Contents API.
- `src/services/githubStorage.ts:93` : ajout du header `Authorization: Bearer`.
- `src/services/githubStorage.ts:118` : lecture d'un fichier JSON via `fetch`.
- `src/services/githubStorage.ts:156` : listing du dossier `data/events`.
- `src/services/githubStorage.ts:182` : ecriture `PUT` d'un fichier JSON.
- `src/services/githubStorage.ts:221` : suppression `DELETE` d'un fichier JSON.
- `src/utils/photonGeocoding.ts:72` et `106` : appels a Photon, sans token GitHub.
- `.github/workflows/deploy.yml:23` : injection du secret `APERO_GITHUB_TOKEN` sous le nom public `VITE_GITHUB_TOKEN`.

## Note sur "Mes aperos"

Je n'ai pas observe de route ou composant nomme explicitement "Mes aperos". La page fonctionnellement la plus proche est `src/pages/AgendaPage.tsx`, exposee sur `#/agenda`, libellee "L'agenda du comptoir" / "Les aperos a venir". Elle recupere ses donnees via `eventStorage.listActiveEvents()`, donc en listant les fichiers JSON de `data/events`.
