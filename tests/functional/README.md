# Tests fonctionnels de bout en bout

```bash
npm run test:functional
```

Le banc d'essai est **hermétique** : aucun réseau externe, aucun token GitHub,
aucune donnée écrite dans le vrai repo.

```txt
Chromium (Playwright)                     ← vrai frontend (Vite dev server)
  ├─ lectures https://api.github.com      ← interceptées, servies par le faux GitHub
  └─ écritures API VPS                    → vraie API server/ (Express, via tsx)
                                             └─ fetch api.github.com redirigé vers
                                                le faux GitHub in-memory
```

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `run.mjs` | Orchestrateur + scénarios : démarre le faux GitHub, la vraie API `server/`, Vite, puis pilote Chromium |
| `fake-github.mjs` | Faux GitHub Contents API in-memory (GET/PUT/DELETE, gestion des sha et des conflits 409/422) |
| `server-fetch-patch.mjs` | Préchargé devant l'API (`node --import`) : redirige ses fetch `api.github.com` vers le faux GitHub |

## Scénarios couverts

1. **Création d'un apéro** — onboarding complet (blaze + notifications), création
   mono-créneau, lien d'invitation avec clés en fragment, lien affiché masqué,
   fichier chiffré AES-GCM côté stockage, zéro donnée en clair, `writeKeyHash`
   et `adminKeyHash` corrects.
2. **Création multi-créneaux** — 3 créneaux proposés et affichés.
3. **Vote d'un invité** — vote sur chaque créneau, contribution, commentaire,
   inscription au registre, puis **modification du vote** via le même blaze
   sans doublon.
4. **Contre-proposition** — un invité ajoute un nouveau créneau, attribué à
   son auteur.
5. **Vote sur le nouveau créneau** — un second invité vote sur les 4 créneaux.
6. **Notifications** — badge rouge du créateur (2 réponses + 1 proposition = 3),
   contenu du carnet, pas d'auto-notification, badge soldé après lecture,
   silence complet côté invité.
7. **Isolation** — agenda d'un inconnu vide, lien sans clé illisible, mauvaise
   clé rejetée, lien lecture seule (k sans w) consultable mais sans vote,
   écriture/suppression refusées côté API avec de mauvaises clés,
   cloisonnement entre deux organisateurs.
8. **Suppression** — bouton réservé à l'organisateur, confirmation, fichier
   effacé du stockage, agenda nettoyé, lien mort pour les invités.
9. **Contrat API** — `/health`, id invalide, création sans hashes, conflit de
   `baseSha`, Content-Type non JSON, suppression idempotente.

## Personas

Chaque persona vit dans un contexte navigateur isolé (localStorage séparé,
comme des appareils distincts) : Jojo l'Organisateur, Bob Ricard et
Chantal Suze (invités), Denis le Curieux (inconnu sans lien), Édith Cognac
(second organisateur).

## Prérequis

- Chromium Playwright disponible (par défaut `/opt/pw-browsers/chromium`,
  surchargeable via `APERO_TEST_CHROMIUM`).
- `npm install` à la racine **et** dans `server/`.
- Ports locaux 3113 (API) et 5199 (Vite), surchargeables via
  `APERO_TEST_API_PORT` / `APERO_TEST_VITE_PORT`.

Les captures d'écran des étapes clés sont déposées dans
`tests/functional/output/` (ignoré par git).
