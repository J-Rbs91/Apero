# La Confrérie du Petit Jaune

La Confrérie du Petit Jaune est un mini Doodle de comptoir : une personne convoque une assemblée, propose plusieurs combinaisons date + heure + lieu, puis partage un lien unique. Les membres invités votent uniquement sur cette assemblée.

Le contraste est volontaire : un nom pompeux, presque chevaleresque, pour une mission absolument essentielle et moyennement distinguée : se mettre d’accord pour boire un coup.

## Principe multi-apéros

Chaque apéro reste indépendant :

- un apéro = un fichier JSON dans `data/events/<eventId>.json` ;
- un lien = une assemblée précise ;
- les participants d’une assemblée ne polluent jamais une autre ;
- les votes sont fusionnés uniquement dans le fichier JSON de l’événement concerné.

Exemple :

```txt
data/
  events/
    apero_k8f3x9p2.json
    apero_7mqp4zda.json
```

## Noms cérémoniels

Chaque assemblée reçoit automatiquement un `ceremonialName` lisible, choisi parmi 30 noms prédéfinis, par exemple :

- `La Grande Tablée des Olives`
- `Le Concile du Saucisson`
- `Le Sommet des Glaçons`

Ce nom ne remplace pas l’identifiant technique :

- `id` : utilisé pour l’URL et le stockage GitHub ;
- `ceremonialName` : utilisé comme nom principal visible dans l’interface ;
- `title` : objet libre et optionnel saisi par l’organisateur.

## Règle d’unicité

Deux assemblées actives ne peuvent jamais avoir le même `ceremonialName`.

À la création :

1. l’app liste les fichiers dans `data/events/` ;
2. elle charge les événements actifs ;
3. elle extrait les noms cérémoniels déjà utilisés ;
4. elle choisit un nom disponible parmi les 30 ;
5. si les 30 noms sont pris, la création est bloquée.

Un apéro `closed` ou `archived` peut libérer son nom. Tant que la logique de clôture n’est pas utilisée, la limite pratique est donc de 30 apéros actifs simultanés.

Message en cas de saturation :

```txt
La Confrérie est complète. Trop d’apéros sont déjà en cours de magouille. Clôture une assemblée avant d’en convoquer une nouvelle.
```

## Structure JSON

```json
{
  "id": "apero_k8f3x9p2",
  "ceremonialName": "La Grande Tablée des Olives",
  "title": "Apéro fin de chantier",
  "organizerName": "Jojo",
  "description": "On enterre cette semaine comme elle le mérite.",
  "beaufLevel": "medium",
  "status": "active",
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

Permissions minimales recommandées pour un fine-grained personal access token :

- Repository access : uniquement `J-Rbs91/Apero` ;
- Contents : read and write ;
- aucune permission inutile.

## Avertissement sécurité

Cette application utilise volontairement GitHub comme pseudo-base de données. Le token GitHub est exposé côté frontend. C’est une mauvaise pratique assumée pour un projet humoristique et non sensible. Ne jamais utiliser cette architecture pour un vrai produit ou pour des données sensibles.

Conséquences :

- n’importe qui peut lire le token dans le navigateur ;
- n’importe qui avec le token peut modifier ou casser les données ;
- les données d’un repo public sont publiques ;
- GitHub peut révoquer le token si celui-ci est détecté comme secret exposé ;
- les commits peuvent devenir nombreux.

La version sérieuse utiliserait un petit backend ou un Cloudflare Worker pour garder le token côté serveur.

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

1. Builder l’app avec `npm run build`.
2. Publier le dossier `dist`.
3. Utiliser les routes hash `#/event/<eventId>`, compatibles GitHub Pages sans configuration serveur.
4. Configurer les variables `VITE_GITHUB_*` dans l’environnement de build.

## Fonctionnalités

- Accueil au nom officiel `La Confrérie du Petit Jaune`.
- Création d’une assemblée avec nom cérémoniel unique.
- Propositions complètes : jour, heure, établissement de réception, note.
- Page publique par lien unique basé sur l’`id` technique.
- Vote par pseudo : présent, réserve, absent.
- Modification du vote si le même pseudo revient.
- Contributions au banquet et déclarations au comptoir.
- Calcul du verdict : priorité aux présents, départage aux réserves, égalités conservées.
- Gestion simple des conflits GitHub : relecture, fusion, deuxième tentative.

## Évolutions possibles

- Clôturer ou archiver une assemblée depuis l’interface.
- Libérer explicitement les noms cérémoniels des assemblées terminées.
- Cloudflare Worker pour ne plus exposer le token.
- QR code de convocation.
- Export image du verdict du zinc.
- PWA installable.

## Direction iconographique

L’interface n’utilise aucun emoji. Les pictogrammes doivent être des SVG monochromes de style glyph afin de conserver une direction artistique cohérente.

Les icônes locales vivent dans `src/assets/icons/`. Les fichiers actuels sont des placeholders SVG simples, monochromes et recolorables via `currentColor`. Les SVG définitifs doivent être téléchargés depuis IconScout en style glyph avant une mise en production visuelle.

Les badges utilisent `iconName` plutôt qu’un champ `icon` en emoji. Le composant `Icon` applique les SVG locaux sous forme de masque CSS, ce qui permet de contrôler la couleur depuis les styles.
