# Apero PMU

Apero PMU est un mini Doodle de comptoir : une personne cree un apero, propose plusieurs combinaisons date + heure + lieu, puis partage un lien unique. Les invites votent uniquement sur cet apero.

Chaque apero est independant :

- `Apero A` a son lien, ses options, ses participants et son fichier JSON.
- `Apero B` a un autre lien, d'autres options, d'autres participants et un autre fichier JSON.
- Il n'y a jamais de fichier global qui melange tout le comptoir.

## Mention de securite obligatoire

“Cette application utilise volontairement GitHub comme pseudo-base de données. Le token GitHub est exposé côté frontend. C’est une mauvaise pratique assumée pour un projet humoristique et non sensible. Ne jamais utiliser cette architecture pour un vrai produit ou pour des données sensibles.”

En clair : ce projet est volontairement sale techniquement. Le token peut etre lu par n'importe qui dans le navigateur, les donnees sont publiques si le repo est public, quelqu'un peut modifier ou casser les fichiers, et GitHub peut revoquer le token si celui-ci est detecte comme secret expose.

## Stockage

Les donnees sont stockees via l'API GitHub Contents :

```txt
data/
  events/
    apero_k8f3x9p2.json
    apero_7mqp4zda.json
```

Un fichier JSON = un apero complet.

Exemple de structure :

```json
{
  "id": "apero_k8f3x9p2",
  "title": "Apero fin de semaine",
  "organizerName": "Jojo",
  "description": "On enterre cette semaine comme elle le merite.",
  "beaufLevel": "medium",
  "options": [
    {
      "id": "option_1",
      "date": "2026-07-03",
      "time": "19:00",
      "location": "Bar des Sports"
    }
  ],
  "participants": [],
  "createdAt": "2026-06-30T18:00:00.000Z",
  "updatedAt": "2026-06-30T18:00:00.000Z"
}
```

## Installation

```bash
npm install
```

## Configuration GitHub

Copier `.env.example` en `.env.local`, puis renseigner :

```bash
VITE_GITHUB_OWNER=J-Rbs91
VITE_GITHUB_REPO=Apero
VITE_GITHUB_BRANCH=main
VITE_GITHUB_DATA_PATH=data/events
VITE_GITHUB_TOKEN=TOKEN_GITHUB_A_METTRE_ICI_EN_MODE_KAMIKAZE
```

Permissions minimales recommandees pour un fine-grained personal access token :

- Repository access : uniquement `J-Rbs91/Apero`.
- Contents : read and write.
- Pas de permission inutile.

Le token ne doit pas etre committe. Il est quand meme expose dans le bundle frontend une fois l'app deployee, ce qui est le principe volontairement kamikaze de ce MVP.

## Lancement local

```bash
npm run dev
```

## Tests

```bash
npm test
```

## Build

```bash
npm run build
```

## Deploiement GitHub Pages

1. Builder l'app avec `npm run build`.
2. Publier le dossier `dist`.
3. Utiliser le routeur hash `#/event/<eventId>`, compatible GitHub Pages sans configuration serveur.
4. Configurer les variables `VITE_GITHUB_*` dans l'environnement de build.

## Fonctionnalites

- Page d'accueil PMU / bar-tabac / ticket de caisse.
- Creation d'un apero avec plusieurs options date + heure + lieu.
- Un fichier JSON par apero dans `data/events/<eventId>.json`.
- Page publique d'un apero via lien unique.
- Vote par pseudo : oui, peut-etre, non.
- Modification du vote si le meme pseudo revient.
- Contributions : chips, saucisson, soft, etc.
- Calcul du meilleur choix : priorite aux `yes`, departage aux `maybe`, egalites conservees.
- Gestion simple des conflits GitHub : relecture, fusion, deuxieme tentative.

## Limites

- Ce n'est pas une vraie base de donnees.
- Les commits peuvent devenir nombreux.
- Les ecritures simultanees restent fragiles.
- Les donnees d'un repo public sont publiques.
- N'importe qui avec le token peut casser les fichiers.
- Le bon futur serait un petit backend ou un Worker qui garde le token cote serveur.

## Evolutions possibles

- Cloudflare Worker pour ne plus exposer le token.
- QR code de partage.
- Export image du verdict.
- Mode "qui ramene quoi" plus avance.
- PWA installable.
- Nettoyage automatique des vieux aperos.
