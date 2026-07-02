# Audit securite, DDoS et rate limit

Date: 2026-07-02

## Synthese

Le risque initial le plus critique etait l'exposition possible du token GitHub dans le frontend. Le depot contient deja une bonne evolution: le frontend passe par une mini API serveur et les donnees apéro sont chiffrees cote navigateur. Le durcissement ajoute ici vise surtout la disponibilite et la resistance aux abus: rate limits separes, timeouts, validation plus stricte et garde-fous de deploiement.

## Protections en place

- Token GitHub conserve cote serveur uniquement (`GITHUB_TOKEN`, jamais `VITE_`).
- CORS limite aux origines declarees dans `ALLOWED_ORIGIN`.
- `helmet()` actif et suppression de `x-powered-by`.
- JSON limite par `JSON_BODY_LIMIT`.
- Refus des requetes d'ecriture sans `Content-Type: application/json`.
- Validation stricte des `aperoId`, `writeKey`, `writeKeyHash`, `baseSha`, `iv` et `ciphertext`.
- Limite configurable de `ciphertext` via `MAX_CIPHERTEXT_LENGTH`.
- Rate limit general sur `/api` via `API_RATE_LIMIT_*`.
- Rate limit plus strict sur `POST /api/aperos/:aperoId` via `WRITE_RATE_LIMIT_*`.
- Timeouts serveur (`SERVER_REQUEST_TIMEOUT_MS`) et GitHub API (`GITHUB_REQUEST_TIMEOUT_MS`).
- Chemin d'ecriture GitHub verrouille sur `data/aperos/`.
- Comparaison de hash en temps constant pour la cle d'ecriture.

## Limites importantes

Aucune application Node.js ne peut absorber seule une vraie attaque DDoS volumetrique. Les protections applicatives reduisent les abus et l'epuisement de ressources, mais le trafic massif doit etre filtre avant le VPS: firewall hebergeur, CDN/WAF, protection anti-DDoS du fournisseur, ou reverse proxy managé.

## Reglages recommandes en production

Variables serveur conseillees pour commencer:

```env
HOST=127.0.0.1
PORT=3103
TRUST_PROXY_HOPS=1
JSON_BODY_LIMIT=100kb
API_RATE_LIMIT_WINDOW_MS=60000
API_RATE_LIMIT_MAX=60
WRITE_RATE_LIMIT_WINDOW_MS=60000
WRITE_RATE_LIMIT_MAX=10
MAX_CIPHERTEXT_LENGTH=80000
GITHUB_REQUEST_TIMEOUT_MS=8000
SERVER_REQUEST_TIMEOUT_MS=15000
LOG_LEVEL=info
```

Pour une periode d'attaque ou d'abus, baisser temporairement:

```env
API_RATE_LIMIT_MAX=20
WRITE_RATE_LIMIT_MAX=3
GITHUB_REQUEST_TIMEOUT_MS=5000
```

## Checklist VPS / reverse proxy

- Exposer publiquement uniquement Caddy/Nginx en HTTPS.
- Garder Node sur `127.0.0.1:3103`, jamais sur `0.0.0.0` sauf besoin explicite.
- Activer le pare-feu: ports publics 80/443 uniquement, SSH restreint.
- Configurer une limite de taille de body au proxy avant Node si possible.
- Garder `TRUST_PROXY_HOPS=1` si un seul proxy local est devant Express.
- Surveiller les 429, 413, 502 et les temps de reponse.
- Activer la protection anti-DDoS du fournisseur ou placer l'API derriere un CDN/WAF si elle devient publique et partagee.

## Rotation du token GitHub

Si un token a deja ete expose dans un ancien build frontend ou dans l'historique:

1. Revoquer immediatement le token GitHub concerne.
2. Creer un fine-grained token limite au repo `J-Rbs91/Apero`.
3. Accorder uniquement `Contents: read and write`.
4. Installer ce token uniquement dans l'environnement serveur du VPS.
5. Rebuilder le frontend sans aucune variable `VITE_GITHUB_TOKEN`.

## Tests manuels utiles

```bash
curl -i http://127.0.0.1:3103/health
curl -i -X POST http://127.0.0.1:3103/api/aperos/apero_TEST123
curl -i -X POST http://127.0.0.1:3103/api/aperos/bad-id -H "Content-Type: application/json" -d '{}'
```

Resultats attendus:

- `/health` repond 200.
- POST sans JSON valide repond 400/415 selon le cas.
- Trop de requetes repond 429 `RATE_LIMITED`.
- Payload trop gros repond 413 `PAYLOAD_TOO_LARGE`.
