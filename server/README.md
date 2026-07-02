# Apéro API — mini API serveur VPS

Mini API Node.js / TypeScript / Express de La Confrérie du Petit Jaune.

## Rôle

Le frontend GitHub Pages ne doit plus jamais détenir de token GitHub. Cette API
sert d'intermédiaire d'écriture :

```txt
Frontend GitHub Pages
↓
Mini API serveur sur VPS (ce dossier)
↓
GitHub API (Contents API)
↓
Repo GitHub public — data/aperos/*.json
```

Le token GitHub (`GITHUB_TOKEN`) vit uniquement dans l'environnement du VPS.
L'API écrit exclusivement des fichiers apéro chiffrés sous `data/aperos/`
(chemin verrouillé dans le code, non configurable). Elle ne déchiffre jamais
les payloads et ne stocke jamais `writeKey` ni `encryptionKey`.

> ⚠️ **Ne jamais exposer `GITHUB_TOKEN` côté frontend.** Toute variable `VITE_`
> finit dans le bundle public Vite. Le token doit exister uniquement côté
> serveur.

## Endpoints

| Méthode | Route                    | Rôle                                              |
| ------- | ------------------------ | ------------------------------------------------- |
| GET     | `/health`                | Vérification de vie du service                    |
| POST    | `/api/aperos/:aperoId`   | Création ou mise à jour d'un fichier apéro chiffré |

## Variables d'environnement

Voir aussi le `.env.example` à la racine du repo (section SERVER).

| Variable          | Rôle                                            | Défaut                        |
| ----------------- | ----------------------------------------------- | ----------------------------- |
| `GITHUB_TOKEN`    | Token GitHub fine-grained, **serveur uniquement** | — (écritures refusées si absent) |
| `GITHUB_OWNER`    | Propriétaire du repo                            | `J-Rbs91`                     |
| `GITHUB_REPO`     | Nom du repo                                     | `Apero`                       |
| `GITHUB_BRANCH`   | Branche cible des écritures                     | `main`                        |
| `ALLOWED_ORIGIN`  | Origine(s) CORS, séparées par des virgules      | `https://j-rbs91.github.io`   |
| `HOST`            | Adresse d'écoute (derrière Caddy : locale)      | `127.0.0.1`                   |
| `PORT`            | Port d'écoute local (3103 réservé Apéro sur le VPS) | `3103`                    |
| `JSON_BODY_LIMIT` | Taille max des payloads JSON                    | `100kb`                       |
| `LOG_LEVEL`       | `error` \| `warn` \| `info` \| `debug`          | `info`                        |

Pour tester le frontend local (Vite) contre l'API locale, ajouter l'origine du
dev server : `ALLOWED_ORIGIN=https://j-rbs91.github.io,http://localhost:5173`.

Le vrai `.env` ne doit **jamais** être commité (déjà couvert par le
`.gitignore` racine). En local, placer un `.env` dans `server/` ; sur le VPS,
préférer les variables d'environnement du service (systemd, etc.).

## Installation et lancement local

```bash
cd server
npm install
npm run dev
```

Autres scripts :

```bash
npm run typecheck   # vérification TypeScript sans émission
npm run build       # compile vers dist/
npm start           # lance dist/index.js (après build)
```

Sans `GITHUB_TOKEN`, le serveur démarre quand même (pratique pour tester la
validation) : les routes d'écriture répondent alors `500 SERVER_MISCONFIGURED`.

## Tester `/health`

```bash
curl http://127.0.0.1:3103/health
```

Réponse attendue :

```json
{ "ok": true, "service": "apero-api", "timestamp": "2026-07-02T00:00:00.000Z" }
```

## Tester `POST /api/aperos/:aperoId`

`writeKeyHash` doit être le SHA-256 hexadécimal du `writeKey`. Pour le calculer :

```bash
node -e "console.log(require('crypto').createHash('sha256').update('test-write-key','utf8').digest('hex'))"
# → 04c0218b3c6929c6638fa052827cc353c3e1eb3a432020f686e083aae900d6c4
```

Exemple de création (les valeurs ci-dessous sont cohérentes entre elles) :

```bash
curl -X POST http://127.0.0.1:3103/api/aperos/apero_TEST123 \
  -H "Content-Type: application/json" \
  -d '{
    "writeKey": "test-write-key",
    "writeKeyHash": "04c0218b3c6929c6638fa052827cc353c3e1eb3a432020f686e083aae900d6c4",
    "encryptedPayload": {
      "version": 1,
      "encryption": {
        "algorithm": "AES-GCM",
        "iv": "base64url_iv",
        "ciphertext": "base64url_ciphertext"
      }
    }
  }'
```

Règles du contrat :

- `aperoId` doit matcher `^apero_[A-Za-z0-9_-]{5,64}$`, sinon `400` ;
- `writeKey` : 8 à 256 caractères, obligatoire à chaque écriture ;
- `writeKeyHash` : requis **uniquement** à la création initiale ; pour une mise
  à jour, le serveur relit le hash déjà stocké dans le fichier GitHub ;
- `baseSha` (optionnel) : sha GitHub attendu du fichier actuel ; s'il diffère
  du sha réel, le serveur répond `409` pour éviter un écrasement silencieux ;
- le serveur conserve le `createdAt` existant et met à jour `updatedAt`.

Réponses de succès :

```json
{ "ok": true, "created": true,  "updated": false, "aperoId": "apero_TEST123", "sha": "..." }
{ "ok": true, "created": false, "updated": true,  "aperoId": "apero_TEST123", "sha": "..." }
```

(HTTP `201` pour une création, `200` pour une mise à jour.)

## Codes d'erreur

| HTTP | `error`                                          | Situation                                    |
| ---- | ------------------------------------------------ | -------------------------------------------- |
| 400  | `INVALID_APERO_ID`                               | Identifiant hors format ou suspect           |
| 400  | `INVALID_PAYLOAD` / `INVALID_JSON`               | Corps de requête invalide                    |
| 400  | `MISSING_WRITE_KEY_HASH` / `WRITE_KEY_HASH_MISMATCH` | Création sans hash valide                |
| 403  | `INVALID_WRITE_KEY` / `WRITE_NOT_ALLOWED`        | Clé d'écriture refusée                       |
| 409  | `CONFLICT` / `SHA_CONFLICT`                      | Conflit de version ou de sha                 |
| 413  | `PAYLOAD_TOO_LARGE`                              | Corps au-delà de `JSON_BODY_LIMIT`           |
| 429  | `RATE_LIMITED`                                   | Trop de requêtes sur `/api`                  |
| 500  | `INTERNAL_ERROR` / `SERVER_MISCONFIGURED`        | Erreur serveur ou token absent               |
| 502  | `GITHUB_ERROR`                                   | GitHub API en échec                          |

Format d'erreur :

```json
{ "ok": false, "error": "INVALID_APERO_ID", "message": "Invalid apero id." }
```

Aucune réponse d'erreur ni aucun log ne contient de secret.

## Sécurité embarquée

- CORS restreint à `ALLOWED_ORIGIN` ;
- `helmet()` ;
- rate limit sur `/api` (30 requêtes/minute/IP) ;
- limite de taille JSON (`JSON_BODY_LIMIT`) ;
- validation stricte des entrées avec zod ;
- comparaison des hashes en temps constant ;
- chemin d'écriture GitHub verrouillé sur `data/aperos/` ;
- écoute locale par défaut (`HOST=127.0.0.1`), exposition uniquement via le
  reverse proxy ;
- logs d'accès minimaux (méthode, chemin, statut, durée — jamais de body).

## Déploiement (étape suivante, hors périmètre ici)

Le VPS est déjà équipé de **Caddy** (reverse proxy + HTTPS automatique) :
l'API Apéro y écoutera sur `127.0.0.1:3103` (3001 et 3002 sont pris par PANUM
et ORTABEL) et sera exposée via un bloc du type `api-apero.example.com {
reverse_proxy 127.0.0.1:3103 }`. `trust proxy` est déjà activé pour que le
rate limit voie la vraie IP cliente derrière le proxy. La configuration Caddy
et le service systemd font partie de l'étape de déploiement, pas de celle-ci.
