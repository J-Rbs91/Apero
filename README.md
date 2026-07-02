# La Confrérie du Petit Jaune

**App en ligne : [https://j-rbs91.github.io/Apero/](https://j-rbs91.github.io/Apero/)**

La Confrérie du Petit Jaune est un mini Doodle de comptoir : une personne convoque une assemblée, propose plusieurs combinaisons date + heure + lieu, puis partage un lien unique. La tablée invitée vote uniquement sur cette assemblée.

Le contraste est volontaire : un nom pompeux, presque chevaleresque, pour une mission absolument essentielle et moyennement distinguée : se mettre d’accord pour boire un coup. Chaque convive vient avec son carburant — pastaga, pinard, soft, Perrier ou cacahuètes — mais tout le monde passe par le registre.

Ligne éditoriale : *une app d’apéro de comptoir, absurde, alcool-compatible et pleine de gouaille, ouverte à toute la tablée — pas seulement aux gentlemen du pastaga.*

## Principe multi-aperos

Chaque apero reste independant :

- un apero = un fichier chiffre dans `data/aperos/<aperoId>.json` ;
- un lien = une assemblee precise, avec les cles dans le fragment d'URL ;
- les participants d'une assemblee ne polluent jamais une autre ;
- les votes sont fusionnes via l'API VPS, jamais via un token GitHub dans le navigateur.

Le frontend lit les fichiers chiffres publiquement, mais il ne sait pas ecrire dans GitHub. Les ecritures passent par `server/`, ou le token GitHub reste cote serveur.

## Noms ceremoniels

À la création, la personne qui organise peut saisir elle-même le `ceremonialName` de l’assemblée. Si elle laisse le champ vide, un nom lisible est tiré au sort parmi 30 noms prédéfinis, par exemple :

- `La Grande Tablée des Olives`
- `Le Concile du Saucisson`
- `Le Sommet des Glaçons`

Ce nom ne remplace pas l’identifiant technique :

- `id` : utilisé pour l’URL et le stockage GitHub ;
- `ceremonialName` : utilisé comme nom principal visible dans l’interface ;
- `title` : objet libre et optionnel saisi par la personne qui organise.

## Règle d’unicité

En mode `api-vps` (le mode par défaut, seul flux d’écriture actif — voir plus haut), les assemblées sont chiffrées : l’app ne peut plus lister tout le repo pour garantir l’unicité globale du nom cérémoniel. Un nom saisi manuellement est donc utilisé tel quel, sans vérification d’unicité ; en l’absence de saisie, le nom est simplement tiré au sort parmi les 30 prédéfinis. L’accès à chaque apéro se fait par son lien d’invitation, pas par son nom.

Le mode `legacy-github` (écriture directe depuis le navigateur) est désactivé côté frontend. Le code d’unicité stricte qui lui était associé (vérification qu’aucune assemblée active ne partage déjà le même `ceremonialName`, tirage parmi les noms disponibles) reste dans `src/utils/generateCeremonialName.ts` mais n’est plus exercé en pratique.

## Structure JSON

```json
{
  "id": "apero_abc123",
  "version": 1,
  "writeKeyHash": "sha256_hex_du_write_key",
  "encryption": {
    "algorithm": "AES-GCM",
    "iv": "base64url_iv",
    "ciphertext": "base64url_payload_chiffre"
  },
  "createdAt": "2026-06-30T18:00:00.000Z",
  "updatedAt": "2026-06-30T18:00:00.000Z"
}
```

## Installation

```bash
npm install
```

## Configuration

Copier `.env.example` en `.env.local`, puis renseigner les variables publiques du frontend :

```bash
VITE_APP_BASE_URL=https://j-rbs91.github.io/Apero
VITE_APERO_STORAGE_MODE=api-vps
VITE_APERO_API_BASE_URL=https://ton-api-apero.example.com
VITE_GITHUB_OWNER=J-Rbs91
VITE_GITHUB_REPO=Apero
VITE_GITHUB_BRANCH=main
```

Le token GitHub ne doit jamais etre dans une variable `VITE_`. Il vit uniquement dans l'environnement du serveur `server/` :

```bash
GITHUB_TOKEN=token_serveur_uniquement
```

## Avertissement securite

Toute variable prefixee `VITE_` est publique dans le bundle navigateur. Ne jamais y placer de secret. Le frontend ne fait aucune requete GitHub authentifiee ; les ecritures GitHub passent par la mini API VPS.

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

## Déploiement GitHub Pages

L’app est déployée automatiquement sur GitHub Pages à chaque push sur `main` (workflow `.github/workflows/deploy.yml`) :

**[https://j-rbs91.github.io/Apero/](https://j-rbs91.github.io/Apero/)**

1. Builder l’app avec `npm run build`.
2. Publier le dossier `dist`.
3. Utiliser les routes hash `#/event/<eventId>`, compatibles GitHub Pages sans configuration serveur.
4. Configurer les variables `VITE_GITHUB_*` dans l’environnement de build.

## Fonctionnalités

- Accueil au nom officiel `La Confrérie du Petit Jaune`.
- Création d’une assemblée avec nom cérémoniel unique.
- Propositions complètes : jour, heure, établissement de réception, note.
- Page publique par lien unique basé sur l’`id` technique.
- Vote par pseudo : j’y serai, j’me tâte, sans moi.
- Modification du vote si le même pseudo revient.
- Contributions au banquet et déclarations au comptoir.
- Registre du comptoir groupé : les présences en tête, les désertions et les culs entre deux chaises dans un menu dépliant.
- Lieu avec autocomplétion OpenStreetMap (API publique Photon, sans clé) : nom de l’établissement → adresse + coordonnées, saisie libre conservée pour « chez Dédé ».
- Mini-carte Leaflet sous le verdict quand le créneau en tête a des coordonnées, avec lien vers OpenStreetMap.
- Calcul du verdict : priorité aux « j’y serai », départage aux « j’me tâte », égalités conservées.
- Gestion simple des conflits GitHub : relecture, fusion, deuxième tentative.

## Évolutions possibles

- Clôturer ou archiver une assemblée depuis l’interface.
- Libérer explicitement les noms cérémoniels des assemblées terminées.
- QR code de convocation.
- Export image du verdict du zinc.
- PWA installable.

## Direction iconographique

L’interface n’utilise aucun emoji. Les pictogrammes doivent être des SVG monochromes de style glyph afin de conserver une direction artistique cohérente.

Les icônes locales vivent dans `src/assets/icons/`. Les fichiers actuels sont des placeholders SVG simples, monochromes et recolorables via `currentColor`. Les SVG définitifs doivent être téléchargés depuis IconScout en style glyph avant une mise en production visuelle.

Les badges utilisent `iconName` plutôt qu’un champ `icon` en emoji. Le composant `Icon` applique les SVG locaux sous forme de masque CSS, ce qui permet de contrôler la couleur depuis les styles.
