# Crédits et licences des actifs tiers

Le code source de La Confrérie du Petit Jaune est sous licence MIT (voir `LICENSE`).

Ce fichier recense les actifs **non couverts par cette licence MIT** : ils appartiennent
à des tiers, restent soumis à leur propre licence, et sont listés ici pour satisfaire
les obligations d'attribution correspondantes.

---

## Police de caractères

### Manrope

- **Fichiers** : `src/assets/fonts/manrope-latin.woff2`, `src/assets/fonts/manrope-latin-ext.woff2`
- **Auteurs** : Copyright 2018 The Manrope Project Authors — <https://github.com/sharanda/manrope>
- **Licence** : SIL Open Font License 1.1 — texte intégral dans `src/assets/fonts/OFL.txt`
- **Modifications** : aucune. Les fichiers sont les sous-ensembles `latin` et `latin-ext`
  distribués par Google Fonts, repris tels quels.

La police est **auto-hébergée** et non chargée depuis le CDN Google. Ce choix est
délibéré : servir une police depuis `fonts.googleapis.com` transmet l'adresse IP de
chaque visiteur à Google aux États-Unis sans base légale ni consentement, ce qu'un
tribunal allemand a jugé contraire au RGPD (LG München I, 20 janvier 2022, 3 O 17493/20).
Ne pas rétablir le chargement CDN.

---

## Animation

### Verre de vin (écran d'ouverture)

- **Fichier** : `src/assets/wine-glass.json`
- **Source** : Noto Animated Emoji — emoji « wine glass » (U+1F377), projet Google Fonts
  <https://googlefonts.github.io/noto-emoji-animation/>
- **Licence** : Creative Commons Attribution 4.0 International (CC BY 4.0)
  <https://creativecommons.org/licenses/by/4.0/>
- **Modifications** : **oui**. Deux calques de l'animation originale ont été retirés
  (`wine droplet` et `wine surfce 3`) pour alléger le mouvement à l'ouverture.
  Le reste de l'animation est inchangé.

La licence CC BY 4.0 impose de créditer l'auteur **et** de signaler les modifications :
les deux mentions ci-dessus sont la condition de conformité. Ne pas les supprimer.

---

## Images d'ambiance

### `src/assets/art/Le-zinc.jpg` et `src/assets/art/mur-vert.jpg`

- **Origine** : images générées par l'IA générative de Google (Gemini).
  L'original PNG portait des métadonnées de provenance C2PA signées par Google
  (`digitalSourceType: trainedAlgorithmicMedia`, « Created by Google Generative AI »)
  ainsi qu'un filigrane SynthID imperceptible. Le filigrane ✦ visible reste présent
  en bas à droite de `Le-zinc.jpg`.
- **`mur-vert.jpg`** est un recadrage du mur vert de la même image source.
- **Droits d'usage** : Google ne revendique aucune propriété sur les contenus générés
  et en autorise l'usage, y compris commercial, dans le respect de ses règles de contenu.
- **Statut juridique** : une image générée par IA sans apport créatif humain caractérisé
  n'est en principe **pas protégeable par le droit d'auteur** (droit de l'Union et droit
  américain en l'état). Ces fichiers ne sont donc **pas couverts par la licence MIT** du
  dépôt : ils ne sont pas « concédés » par le titulaire du dépôt, qui ne peut pas en
  revendiquer de droits exclusifs.

---

## Données cartographiques

L'application affiche des données issues d'OpenStreetMap, sous
[Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/), via trois services :

| Service | Usage dans l'app | Point d'attention |
| --- | --- | --- |
| [Tuiles OSM](https://operations.osmfoundation.org/policies/tiles/) | Fonds de carte (`MiniMap`, `LocationPickerMap`) | Attribution affichée sur chaque carte. Pas de pré-chargement ni d'usage hors ligne : la [Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/) l'interdit. |
| [Photon](https://photon.komoot.io/) (komoot) | Recherche et géocodage inverse d'adresse | Service public de démonstration : « please be fair — extensive usage will be throttled », sans garantie de disponibilité et explicitement non prévu pour un usage professionnel. En cas de montée en charge, héberger sa propre instance. |
| [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) | « Autour de moi » (bars, cafés, restaurants) | Service communautaire mutualisé, usage raisonnable attendu : rayon borné à 800 m et 25 résultats maximum. |

L'ODbL impose de créditer la source partout où ces données sont **restituées** — pas
seulement sur les fonds de carte. L'attribution « © les contributeurs OpenStreetMap »
accompagne donc aussi les résultats de recherche d'adresse et la liste des lieux proches.

---

## Dépendances logicielles

Les dépendances npm (front et serveur) sont toutes sous licences permissives —
MIT, ISC, BSD-2-Clause, BSD-3-Clause, Apache-2.0. Aucune dépendance sous licence
copyleft (GPL, AGPL, LGPL) n'est embarquée, et aucune n'impose d'obligation de
divulgation sur le code de ce dépôt.

Seule exception notable : `caniuse-lite` est distribué sous CC BY 4.0. C'est une
dépendance **de build** (via Browserslist) : ses données ne sont pas incluses dans le
bundle livré au navigateur, et l'obligation d'attribution ne s'étend donc pas à
l'application déployée.

---

## Règle pour les contributions futures

Tout actif ajouté à ce dépôt doit être libre de redistribution **avec ses fichiers
sources**, puisque le dépôt est public.

Cela exclut notamment les banques d'actifs dont la licence interdit la redistribution
des fichiers sources — **IconScout** en fait partie : sa licence proscrit la
redistribution des éléments « with source files », même modifiés et même gratuits.
Committer de tels fichiers ici constituerait une violation.

Pour les icônes, préférer des jeux sous licence permissive :
[Lucide](https://lucide.dev/) (ISC), [Phosphor](https://phosphoricons.com/) (MIT) ou
[Tabler Icons](https://tabler.io/icons) (MIT).
