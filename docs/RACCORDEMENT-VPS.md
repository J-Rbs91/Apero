# Raccorder le comptoir numérique — API VPS + variable GitHub

Ce document décrit, pas à pas, tout ce qu'il faut faire pour que le site
GitHub Pages puisse « sceller les convocations », c'est-à-dire écrire via la
mini API hébergée sur le VPS.

## Symptôme traité

> « Le comptoir numérique n'est pas encore raccordé (API non configurée) :
> impossible de sceller la convocation dans ce mode. Repasse en mode classique
> ou configure VITE_APERO_API_BASE_URL. »

## Cause

Le frontend est compilé au moment du déploiement GitHub Pages. L'URL de l'API
(`VITE_APERO_API_BASE_URL`) est **figée dans le bundle au build** : elle est
lue depuis une *variable de dépôt GitHub* par le workflow
`.github/workflows/deploy.yml`. Si cette variable n'existe pas (ou a été créée
absente de l'onglet **Variables**, vide, ou crÃ©Ã©e dans un autre
dépôt), le site est déployé sans URL d'API et affiche le message ci-dessus.

C'est exactement ce qui s'est produit : les logs du workflow montraient
`VITE_APERO_API_BASE_URL:` (vide) et un simple *warning*, tandis que le
déploiement finissait « au vert ». Le workflow échoue désormais franchement
dans ce cas, pour que le problème soit visible immédiatement.

Deux chantiers sont donc nécessaires, dans cet ordre :

- **Partie A — VPS** : mettre en service la mini API (`server/`) derrière Caddy.
- **Partie B — GitHub** : créer la variable de dépôt et relancer le déploiement.

Si l'API tourne déjà sur le VPS, sauter directement à la
[Partie B](#partie-b--créer-la-variable-github-et-redéployer).

---

## Partie A — Mettre en service l'API sur le VPS

### Contexte VPS

- Caddy est déjà installé (reverse proxy + HTTPS automatique).
- Ports Node déjà occupés : `3001` (PANUM), `3002` (ORTABEL).
- Port réservé à l'API Apéro : **`3103`**, en écoute **locale uniquement**
  (`127.0.0.1`) — seul Caddy est exposé sur Internet.

### A.1 — Prérequis

Node.js **20 ou plus** doit être disponible :

```bash
node --version   # doit afficher v20.x ou plus
```

Sinon, installer Node 22 LTS (exemple via NodeSource sur Debian/Ubuntu) :

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### A.2 — Récupérer le code

```bash
sudo mkdir -p /opt/apero
sudo chown "$USER" /opt/apero
git clone https://github.com/J-Rbs91/Apero.git /opt/apero
```

(Si le dépôt est déjà cloné : `cd /opt/apero && git pull origin main`.)

### A.3 — Builder l'API

```bash
cd /opt/apero/server
npm ci
npm run build     # compile TypeScript vers dist/
```

### A.4 — Créer le token GitHub (fine-grained, serveur uniquement)

L'API écrit les fichiers chiffrés dans `data/aperos/` du dépôt via l'API
GitHub. Il lui faut un token **fine-grained** au périmètre minimal :

1. Sur GitHub (connecté avec le compte `J-Rbs91`) :
   `Settings` (du **compte**, pas du dépôt) → `Developer settings` →
   `Personal access tokens` → `Fine-grained tokens` → `Generate new token`.
2. **Token name** : `apero-api-vps` (par exemple).
3. **Expiration** : au choix (noter la date : il faudra le renouveler).
4. **Repository access** : `Only select repositories` → sélectionner
   uniquement `J-Rbs91/Apero`.
5. **Permissions** → `Repository permissions` → `Contents` :
   **Read and write**. Rien d'autre.
6. Générer, puis **copier immédiatement** le token (`github_pat_…`) : il ne
   sera plus jamais affiché.

> ⚠️ Ce token ne doit exister **que sur le VPS**. Jamais dans une variable
> `VITE_`, jamais dans le dépôt, jamais côté frontend.

### A.5 — Fichier d'environnement du service

Créer `/etc/apero-api.env`, lisible uniquement par root :

```bash
sudo tee /etc/apero-api.env > /dev/null <<'EOF'
GITHUB_TOKEN=<GITHUB_FINE_GRAINED_TOKEN_SERVEUR>
GITHUB_OWNER=J-Rbs91
GITHUB_REPO=Apero
GITHUB_BRANCH=main
ALLOWED_ORIGIN=https://j-rbs91.github.io
HOST=127.0.0.1
PORT=3103
TRUST_PROXY_HOPS=1
LOG_LEVEL=info
EOF
sudo chmod 600 /etc/apero-api.env
```

Puis éditer le fichier pour remplacer la valeur de `GITHUB_TOKEN` par le vrai
token de l'étape A.4 :

```bash
sudo nano /etc/apero-api.env
```

Les autres réglages (rate limit, timeouts, taille max des payloads) ont des
valeurs par défaut raisonnables — voir `server/README.md` et `.env.example`
pour la liste complète.

### A.6 — Service systemd

Créer `/etc/systemd/system/apero-api.service` :

```bash
sudo tee /etc/systemd/system/apero-api.service > /dev/null <<'EOF'
[Unit]
Description=Apero API - La Confrerie du Petit Jaune
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/apero/server
EnvironmentFile=/etc/apero-api.env
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=3

# Durcissement basique
User=www-data
Group=www-data
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadOnlyPaths=/opt/apero/server

[Install]
WantedBy=multi-user.target
EOF
```

> Vérifier le chemin de Node avec `which node` (souvent `/usr/bin/node` ;
> adapter `ExecStart` si besoin, par exemple avec nvm).

Activer et démarrer :

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now apero-api
sudo systemctl status apero-api
```

Vérifier que l'API répond en local :

```bash
curl http://127.0.0.1:3103/health
# Attendu : {"ok":true,"service":"apero-api","timestamp":"..."}
```

### A.7 — DNS + Caddy

1. **DNS** : créer un enregistrement `A` (et/ou `AAAA`) pour le sous-domaine
   choisi, par exemple `api-apero.mondomaine.fr`, pointant vers l'IP du VPS.
   Attendre la propagation (`dig +short api-apero.mondomaine.fr`).

2. **Caddy** : ajouter ce bloc au `Caddyfile`
   (généralement `/etc/caddy/Caddyfile`) :

   ```caddyfile
   api-apero.mondomaine.fr {
       reverse_proxy 127.0.0.1:3103
   }
   ```

3. Recharger Caddy (il obtiendra le certificat HTTPS tout seul) :

   ```bash
   sudo caddy validate --config /etc/caddy/Caddyfile
   sudo systemctl reload caddy
   ```

4. Vérifier depuis n'importe quelle machine :

   ```bash
   curl https://api-apero.mondomaine.fr/health
   # Attendu : {"ok":true,"service":"apero-api","timestamp":"..."}
   ```

5. Vérifier que CORS acceptera bien le site GitHub Pages :

   ```bash
   curl -s -i https://api-apero.mondomaine.fr/health \
     -H "Origin: https://j-rbs91.github.io" | grep -i access-control
   # Attendu : access-control-allow-origin: https://j-rbs91.github.io
   ```

---

## Partie B — Créer la variable GitHub et redéployer

C'est l'étape qui manquait et qui a causé le message d'erreur.

### B.1 — Créer la variable de dépôt

1. Aller sur `https://github.com/J-Rbs91/Apero`.
2. `Settings` (du **dépôt**) → `Secrets and variables` → `Actions`.
3. **Bien choisir l'onglet `Variables`** (pas `Secrets` — c'est la confusion
   classique : cette URL est publique dans le bundle, elle ne doit pas être
   rangée dans `Secrets`).
4. `New repository variable` :
   - **Name** : `VITE_APERO_API_BASE_URL`
   - **Value** : l'URL publique exposée par Caddy, **sans slash final**,
     par exemple : `https://panum.fr/_svc/a`
5. Enregistrer.

Points de vigilance :

- l'URL doit être en **HTTPS** (GitHub Pages est en HTTPS : un appel HTTP
  serait bloqué en contenu mixte) ;
- pas de slash final, pas d'espace, pas de guillemets ;
- c'est bien l'URL **de l'API** (celle du bloc Caddy), pas celle du site.

### B.2 — Relancer le déploiement

1. Onglet `Actions` du dépôt → workflow `Deploy Vite app to GitHub Pages`.
2. `Run workflow` → branche `main` → `Run workflow`.
   (Un simple push sur `main` fonctionne aussi.)
3. Attendre la fin du run. Le step
   `Verifier la configuration de l'API apero` doit afficher
   « API apero raccordee » — s'il échoue avec
   `VITE_APERO_API_BASE_URL absente`, la variable n'est pas au bon endroit
   (revoir B.1).

### B.3 — Vérification finale côté site

1. Ouvrir `https://j-rbs91.github.io/Apero/` et **forcer le rechargement**
   (Ctrl+Shift+R, ou vider le cache : l'ancien bundle sans URL d'API peut
   rester en cache).
2. Créer une convocation de test et la sceller.
3. Vérifier qu'un fichier `data/aperos/apero_….json` apparaît dans le dépôt
   (commit signé du token serveur) et que le lien d'invitation fonctionne.

---

## Dépannage

| Symptôme | Cause probable | Correctif |
| --- | --- | --- |
| Toujours « comptoir non raccordé » après redéploiement | Variable créée dans `Secrets`/mauvais dépôt, ou cache navigateur | Revoir B.1 (onglet `Variables` du dépôt `Apero`), relancer le workflow, recharger sans cache |
| Le workflow échoue sur `VITE_APERO_API_BASE_URL absente` | La variable n'existe pas ou est vide | Créer/corriger la variable (B.1) puis relancer |
| « Impossible de joindre le comptoir numérique » (`NETWORK_ERROR`) | API arrêtée, DNS/Caddy mal configuré, ou CORS | `systemctl status apero-api`, `curl https://…/health`, vérifier `ALLOWED_ORIGIN` |
| Erreur CORS dans la console navigateur | `ALLOWED_ORIGIN` ne contient pas `https://j-rbs91.github.io` | Corriger `/etc/apero-api.env` puis `sudo systemctl restart apero-api` |
| `500 SERVER_MISCONFIGURED` à l'écriture | `GITHUB_TOKEN` absent/vide côté serveur | Renseigner le token dans `/etc/apero-api.env` (A.4–A.5), redémarrer le service |
| `502 GITHUB_ERROR` | Token expiré, révoqué ou permissions insuffisantes | Regénérer un token fine-grained `Contents: Read and write` sur `J-Rbs91/Apero` |
| `429 RATE_LIMITED` | Trop de requêtes/minute depuis une IP | Attendre, ou ajuster `API_RATE_LIMIT_*` dans `/etc/apero-api.env` |

### Commandes utiles sur le VPS

```bash
sudo systemctl status apero-api          # état du service
sudo journalctl -u apero-api -f          # logs en direct
sudo systemctl restart apero-api         # redémarrage (après édition du .env)
curl http://127.0.0.1:3103/health        # santé locale (sans Caddy)
curl https://api-apero.mondomaine.fr/health   # santé publique (via Caddy)
```

### Mise à jour de l'API après un changement de code

```bash
cd /opt/apero
git pull origin main
cd server
npm ci
npm run build
sudo systemctl restart apero-api
```

### Note Caddy sous-chemin `/_svc/a`

Si l'API est exposée derrière `https://panum.fr/_svc/a`, utiliser `handle_path`
pour retirer ce préfixe avant Express :

```caddyfile
handle_path /_svc/a/* {
    reverse_proxy 127.0.0.1:3103 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
    }
}
```

Dans ce cas, la variable publique frontend doit être exactement :

```env
VITE_APERO_API_BASE_URL=https://panum.fr/_svc/a
```

Le frontend appelle alors `https://panum.fr/_svc/a/api/aperos/...`, et Express
reçoit `/api/aperos/...`.