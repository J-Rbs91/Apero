# UXER_DESIGN_SYSTEM — « Point Jaune »

Spécification implémentable. Le code fait foi pour les valeurs : jetons dans
`src/styles/point-jaune/tokens.css`, consommés par les autres feuilles du même dossier
(importées dans l'ordre par `src/styles/global.css`). Ce document dit **pourquoi** chaque
valeur existe ; une valeur changée dans le code se change ici.

---

## 1. Couleurs

### 1.1 Primitives

| Jeton | Valeur | Rôle |
|---|---|---|
| `--void` | `#090B0D` | Fond primaire : le silence |
| `--void-2` | `#151719` | Couches posées (menu, feuille, barre d'action, champ) |
| `--void-3` | `#232629` | Survol, surface alternative rare |
| `--ivory` | `#F3F1EA` | Texte principal, sélection inversée |
| `--ash` | `#AAA9A4` | Texte secondaire |
| `--ash-2` | `#8E8D88` | Texte tertiaire (méta, légendes monospace) |
| `--rule` | `#3A3D40` | Filet structurel **décoratif seulement** (jamais seul porteur d'une limite de contrôle) |
| `--control` | `#7A7D81` | Contour des contrôles |
| `--paper` | `#EAE6DC` | Inversion ivoire (rituels, document) |
| `--ink-2` / `--ink-3` | `#4A4843` / `#5E5B55` | Textes secondaires sur ivoire |
| `--jaune` | `#D7AB42` | **Le Petit Jaune** : signal unique |
| `--jaune-ink` | `#8A6510` | Jaune lisible sur ivoire (graphisme, grands textes) |
| `--ok` | `#7FCB9C` | Succès (« c'est passé ») |
| `--err` | `#FF7A6B` | Erreur (« ça coince ») |
| `--warn` | `#F0955A` | Avertissement, distinct du jaune (orangé) |

### 1.2 Rôles sémantiques

`--bg`, `--text`, `--text-2`, `--text-3`, `--line`, `--control-border`, `--focus`,
`--accent`, `--on-accent`, `--select-bg`, `--select-ink`, `--success`, `--danger`,
`--warning`. Le contexte ivoire (`.modal-sheet`, `.legal-page`) les **redéfinit** : un
composant n'a jamais à savoir sur quel fond il est posé.

**Le jaune signifie, dans cet ordre de priorité** : l'action principale (un bouton plein
par écran), ce qui l'emporte (créneau en tête, verdict), l'élément actif du focus clavier,
la marque. Rien d'autre.

**La sélection est une inversion** : un choix retenu passe en ivoire plein, texte noir.
C'est l'opération la plus contrastée du système, elle se voit à un mètre.

### 1.3 Contrastes mesurés (WCAG, calcul sur les jetons)

| Paire | Ratio | Usage autorisé |
|---|---|---|
| ivory / void | 17,4 | tout texte |
| ash / void · void-2 | 8,4 · 7,6 | texte secondaire |
| ash-2 / void · void-2 · void-3 | 5,9 · 5,4 · 4,6 | méta 12 px |
| jaune / void · void-2 | 9,2 · 8,4 | texte, focus, graphisme |
| void / jaune | 9,2 | texte du bouton plein |
| control / void · void-2 · void-3 | 4,8 · 4,4 · 3,7 | contours de champs et de choix (≥ 3 : 1) |
| rule / void | 1,8 | **décor uniquement** |
| ok / void · err / void · warn / void | 10,3 · 7,7 · 8,6 | états |
| void / paper · ink-2 / paper · ink-3 / paper | 15,8 · 7,3 · 5,4 | texte sur ivoire |
| jaune-ink / paper | 4,3 | grands textes et graphisme sur ivoire uniquement |
| jaune / paper | 1,7 | **interdit** |

### 1.4 Couleurs codées hors CSS (alignées)

`index.html` et `manifest.webmanifest` (`theme-color` / `background_color` = `--void`),
`src/utils/leaflet.ts` (marqueur jaune sur noir), `src/utils/verdictImage.ts` et
`recapImage.ts` (images exportées), `public/favicon.svg` et icônes PNG (point jaune sur
noir), `src/utils/traquenardScale.ts` (échelle exportée, non affichée).

## 2. Typographie

### 2.1 Familles (licence SIL OFL 1.1, auto-hébergées, jamais par CDN)

| Famille | Fichiers | Rôle |
|---|---|---|
| **Archivo** (Omnibus-Type), variable `wght` 100-900 × `wdth` 62-125 | `archivo-latin.woff2` (88 ko), `archivo-latin-ext.woff2` (84 ko) | manifeste, lecture, interface : **une seule voix**, la chasse change le registre |
| **Fragment Mono** (Wei Huang) | `fragment-mono-latin.woff2` (25 ko), `fragment-mono-latin-ext.woff2` (14 ko) | données : heures, compteurs, légendes, signatures |

Pourquoi Archivo : grotesque d'archives de presse, dessinée pour la lecture *et* le titrage,
dont l'axe de chasse permet de passer du condensé monumental (affiche, Swiss / New Wave) au
texte courant sans changer de famille. Pourquoi Fragment Mono : une monospace dérivée d'une
grotesque néo-suisse, sobre, qui place les données dans la même famille de dessin au lieu
d'évoquer un terminal.

### 2.2 Rôles

| Rôle | Classe(s) | Chasse | Graisse | Taille | Interlignage | Approche |
|---|---|---|---|---|---|---|
| **Manifeste** (accueil, ouverture) | `.h1` | 62 % | 800 | `clamp(3.5rem, 15vw, 11.5rem)` (56 → 184 px) | 0,86 | −0,03 em |
| **Titre d'écran** | `.h1--sm` | 66 % | 780 | `clamp(2.75rem, 11vw, 7.5rem)` (44 → 120 px) | 0,9 | −0,025 em |
| **Chiffres monumentaux** | `.verdict__date`, `.cnt b` (rétrospective), `.leaf__day` | 62 % | 800 | jusqu'à `clamp(4rem, 19vw, 13rem)` | 0,82 | −0,03 em |
| **Titre de section** | `.h2`, `.formsec__title`, `.formsheet__title` | 82 % | 700 | `clamp(1.5rem, 1.2rem + 1.4vw, 2.25rem)` | 1,02 | −0,015 em |
| **Sous-titre** | `.h3`, `.disclose__title` | 100 % | 650 | 1.125 rem | 1,25 | 0 |
| **Chapô** | `.lede` | 100 % | 400 | `clamp(1.0625rem, 1rem + .3vw, 1.25rem)` | 1,5 | 0 |
| **Lecture** | corps | 100 % | 420 | 1 rem (16 px) | 1,55 | 0 |
| **Interface** | boutons, champs | 100 % | 600 | 1 rem | 1,2 | 0 |
| **Légende de données** | `.eyebrow`, `.meta`, `.lbl`, états, compteurs | mono | 400 | 0.75 rem (12 px) | 1,45 | 0,01 em |

Plancher : **12 px**, partout. Largeur de lecture : `62ch`. Césure : `hyphens: manual` sur
les titres (un nom d'assemblée ne se coupe pas au milieu d'un mot), `overflow-wrap:
anywhere` en dernier recours ; `hyphens: auto` (`lang="fr"`) sur les paragraphes longs du
registre légal seulement. Alignement : fer à gauche, drapeau à droite ; jamais justifié ;
centré interdit hors chiffres de compteur.

### 2.3 Rapports d'échelle

Le contraste d'échelle est l'outil principal : un titre manifeste de 120 px côtoie une
légende monospace de 12 px collée dessous (rapport 10 : 1). Entre ces deux pôles, le texte
de lecture reste à 16 px. Les tailles intermédiaires (24-36 px) sont rares, réservées aux
titres de section.

### 2.4 Compensation optique (contrat §17.7)

Un texte clair sur fond foncé paraît plus gros que le même texte foncé sur fond clair.
La référence est le texte clair sur `--void` ; les **contextes clairs** compensent par la
graisse, jamais par la taille, la chasse ou l'interlignage.

| Jeton | Valeur | Appliqué à |
|---|---|---|
| `--fw-comp` | `0` sur fond foncé ; `30` en contexte clair | Archivo ≤ 24 px : `font-weight: calc(<graisse du rôle> + var(--fw-comp))` |
| `--fw-comp-display` | `0` ; `15` en contexte clair | Archivo > 24 px (titres, chiffres) |
| `--stroke-comp` | `0` ; `0.05px` en contexte clair | Fragment Mono (graisse unique) : `-webkit-text-stroke: var(--stroke-comp) currentColor` ; et toute **bascule d'état** |

**Implémentation (19/10/2026)** : le contour `--stroke-comp` (0,05 px) est appliqué à
**tous** les contextes clairs, Archivo compris (`base.css`). Mesuré, il produit le même
écart que la graisse +30 (tableau ci-dessous) et ne change aucune métrique ; une seule
règle remplace la réécriture des cinquante déclarations de graisse. `--fw-comp` reste
la voie de repli si le test à choix forcé demande davantage.

Contextes clairs : `.button--primary` (700 → 730), `.modal-sheet` et `.legal-page`
(lecture 420 → 450, interface 600 → 630, titres +15), `.choice--on` et toute sélection
inversée. Une bascule d'état (`.choice--on`) compense par `--stroke-comp` et non par la
graisse : la graisse élargit l'avance des lettres (+0,5 % à 420 → 450, +1 % à 600 → 630)
et pourrait renvoyer un libellé à la ligne au moment du clic ; le contour ne change
aucune métrique. Lissage : `-webkit-font-smoothing: antialiased` sur fond foncé (déjà en
place), `auto` en contexte clair (macOS seulement, sans effet ailleurs). L'encre inversée
de la Verrerie ne compense pas (§10.5).

Mesures (Chromium, rendu d'encre normalisé, texte foncé sur clair comparé à clair sur
foncé ; spécimen `specimens/verrerie.html`) :

| Texte | Sans compensation (densité 1 · 3) | Graisse +30 (1 · 3) | Contour 0,05 px (1 · 3) |
|---|---|---|---|
| Archivo 16 px / 420 | −6,3 % · −2,3 % | −1,9 % · +2,1 % | −1,9 % · +1,4 % |
| Archivo 16 px / 600 | −5,0 % · −1,8 % | −1,5 % · +1,4 % | −1,0 % · +1,4 % |
| Fragment Mono 12 px | −8,6 % · −3,4 % | — | −4,4 % · +2,5 % |

Ces mesures couvrent la part « rendu ». La part « irradiation » (perceptive) se valide par
le test à choix forcé du contrat §17.7 ; les valeurs ci-dessus sont des valeurs de départ
jusqu'à ce test.

## 3. Grille et composition

| Plage | Colonnes | Marge | Gouttière | Mesure de contenu |
|---|---|---|---|---|
| < 400 px | 4 | 16 px | 12 px | 100 % |
| 400-767 px | 4 | 20 px | 16 px | 100 % |
| 768-1023 px | 8 | 40 px | 24 px | 6 colonnes |
| ≥ 1024 px | 12 | `clamp(40px, 5vw, 96px)` | 24 px | `max-width: 1600px` |

Mise en œuvre : `.facade__inner`, `.facade__hero` et `.page__body` partagent la même
marge (`--margin`) et la même largeur maximale (`--page-max`), donc les bords tombent
juste. Sur bureau, `.page__body` devient une grille de 12 colonnes ; les écrans y placent
leurs zones par archétype (Editorial Split : 1-6 / 8-12 ; contenu de lecture : 1-7).

**Transgressions autorisées** : un titre manifeste peut s'étendre au-delà de la colonne de
contenu (jusqu'à 11 colonnes) ; un champ de données peut s'ancrer contre la marge droite.
**Interdites** : déborder la marge, masquer un contenu, couper un mot.

## 4. Espacements

| Jeton | px | Registre |
|---|---|---|
| `--s-1` … `--s-3` | 4, 8, 12 | micro : intérieur d'un composant |
| `--s-4` … `--s-6` | 16, 24, 32 | fonctionnel : éléments d'une même unité |
| `--s-7` | 48 | entre unités (créneaux, sections d'une page) |
| `--s-8` | 64 | entre groupes |
| `--ma-1` | `clamp(64px, 9vh, 112px)` | respiration avant une déclaration |
| `--ma-2` | `clamp(96px, 16vh, 176px)` | respiration monumentale (Silent Frame) |
| `--ma-3` | `clamp(128px, 24vh, 224px)` | vide d'ouverture (bureau) |

Densité : **Dense Information** = `--s-3` interne / `--s-7` entre unités ; **Silent
Frame** = rien dans le premier `--ma-2` sauf la navigation.

## 5. Composants

Règles communes : rayon **0** (angles vifs, architecture) ; trait **1 px** (`--control-border`
pour un contrôle, `--line` pour une structure) ; hauteur ≥ 44 px ; transitions de couleur
`--d-instant` ; focus `outline: 3px solid var(--focus); outline-offset: 3px`.

| Composant | Normal | Survol | Focus | Actif / choisi | Désactivé | Chargement | Erreur |
|---|---|---|---|---|---|---|---|
| `.button--primary` | aplat jaune, texte noir, 52 px, graisse 700 | jaune éclairci 6 % | anneau jaune décalé | translation 1 px | `--void-3` + texte `--ash-2` | libellé du composant (« On émarge… ») | — |
| `.button--ghost` | trait ivoire 1 px | fond `--void-3` | anneau | fond `--void-2` | trait `--rule`, texte `--ash-2` | idem | — |
| `.button--quiet`, `.ghost-link` | texte souligné 1 px | soulignement épaissi | anneau | — | `--ash-2` | — | `--danger` (`.ghost-link--danger`) |
| `.button--danger` | trait et texte `--err` | fond `--err` 12 % | anneau | — | — | — | — |
| Champ (`input`, `textarea`) | fond `--void-2`, trait `--control`, 48 px | trait ivoire | anneau jaune | — | fond `--void`, texte `--ash-2` | — | trait `--err` 2 px + message `!` |
| `.choice` | trait `--control`, marque carrée vide | fond `--void-3` | anneau sur le libellé | **inversion ivoire** + marque pleine / hachurée / barrée | — | — | trait `--err` |
| `.switch` | rail au trait, bouton ivoire | — | anneau | rail jaune, bouton noir | — | — | — |
| `.disclose` | filet bas, titre 18 px, chevron fin | titre ivoire | anneau | chevron retourné | — | — | — |
| `.slot` (créneau) | rangée sous filet, chiffre du jour monumental à gauche | — | — | `En tête` : légende jaune + point | — | — | filet `--err` + état « À voter » encadré |
| `.actionbar` | couche `--void-2`, filet haut ivoire | — | — | statut `ready` : point jaune | — | — | statut `blocked` : `--err` |
| `.modal-sheet` | **inversion ivoire**, bord noir 1 px | — | anneau noir | — | — | — | — |
| `.formsheet__panel` | couche `--void-2` plein écran mobile | — | — | — | — | — | — |
| `.notif-item` | rangée sous filet | fond `--void-2` | anneau | non lu : point jaune + titre ivoire 700 | — | — | — |
| `.tag` | légende monospace entre crochets fins (trait 1 px) | — | — | — | — | — | — |

**Marques de choix** (jamais la couleur seule) : `J'y serai` = carré plein ;
`J'me tâte` = carré hachuré (densité moitié) ; `Sans moi` = carré vide barré. Ce même code
de densité est celui du champ de données du verdict : **le formulaire et le verdict
parlent la même langue**.

### 5.1 Iconographie

13 glyphes SVG existants (`Icon.tsx`) conservés, redessinés au trait de 1,5 px, extrémités
carrées, sur grille de 24. Aucun pictogramme de remplissage. Le point jaune n'est pas une
icône : c'est la marque.

## 6. Archétypes de composition (détail)

- **Silent Frame** : `.facade__hero` précédé de `--ma-2` ; un seul titre ; une ligne
  monospace ; l'action.
- **Manifesto Frame** : `.h1` ou `.h1--sm` en chasse étroite ; légende monospace collée
  (`--s-3`) ; méta factuelle en monospace ; signature d'assemblée sous le titre.
- **Data Field** : canvas à ratio fixe réservé en CSS (aucun décalage de mise en page) ;
  légende textuelle adjacente ; `aria-hidden`.
- **Editorial Split** : bureau, `grid-column` 1-5 (expression, collante) / 7-12 (fonction).
- **Dense Information** : rangées, filet `--line` au-dessus, `--s-3` interne, `--s-7` entre.

## 7. Responsive

Mobile : titres à fort pourcentage de l'écran, une colonne, action épinglée sous le pouce.
Tablette : marges de 40 px, titres plus grands, toujours une colonne de contenu.
Bureau : Editorial Split, marges monumentales, champs de données ancrés à droite, barre
d'action en bloc dans la colonne de fonction. Le titre ne grossit pas indéfiniment : borne
haute à 184 px (manifeste) et 120 px (écran).

## 8. Matières computationnelles (inventaire exhaustif)

| Matière | Écran | Donnée source | Principe | Si la donnée manque |
|---|---|---|---|---|
| Signature | `/invite`, `/agenda`, `/tablee`, `/tablees`, accueil | identifiant public (`aperoId`, `tableeId`) | FNV-1a 32 bits → générateur xorshift → 48 barres de 1 à 4 unités, présentes avec p ≈ 0,55 | pas de bande |
| Champ des votes | verdict (`/invite`, `/event`) | `participants[].votes` par créneau, créneau en tête | une ligne par créneau (ordre de l'apéro), une colonne par convive (ordre d'émargement) ; plein = oui, hachuré = peut-être, point = non ; rang en tête en jaune ; trame de points vides en fond = convives encore possibles | « Le comptoir délibère » : la trame seule, sans signe |
| Constellation | accueil | apéros connus de l'appareil : premier créneau (ms), nombre de réponses, statut | abscisse = temps (du plus ancien au plus lointain), ordonnée = hachage de l'identifiant, rayon = √réponses ; trait vertical = maintenant ; prochain en jaune ; passés en `--ash-2` | **un seul point jaune** au centre optique : le récipient vide (Hara) |
| Champ d'émergence | écran d'ouverture | aucune (rituel) | trame régulière de points dont la densité suit une onde ; un point jaune apparaît à l'intersection d'or | trame statique |
| Barres Traquenard | verdict, vote | moyenne / valeur 0-10 | 10 barres de hauteur croissante (signal), allumées jusqu'à la valeur | barres éteintes + texte |
| Bande de signal | verdict | créneau gagnant décidé | 24 traits (12 sur mobile) ; une impulsion les parcourt une fois | traits éteints |

Aucune de ces matières n'affiche de chiffre inventé ; toutes sont `aria-hidden` et
doublées par le texte existant. La Verrerie n'est pas une matière computationnelle : elle
est figurative et ne représente aucune donnée (§10).

## 9. Règles d'implémentation

1. Un jeton plutôt qu'une valeur : pas de couleur, de rayon ni de durée en dur hors
   `tokens.css` (exceptions : canvas, qui lisent les jetons via `getComputedStyle`).
2. Une classe de repère de test ne disparaît jamais du DOM.
3. Aucun texte modifié ; tout texte décoratif nouveau est `aria-hidden`.
4. Un composant de présentation ne contient pas de logique métier : il reçoit des données
   déjà calculées.

## 10. Verrerie et encre inversée (contrat §17)

### 10.1 Jetons

| Jeton | Valeur | Rôle |
|---|---|---|
| `--silhouette` | `var(--ivory)` | Aplat unique de toute silhouette |
| `--inv-text` | `#FCFCF7` | Source de l'encre inversée pour `--ivory` (`--ivory` + `--void`) |
| `--inv-text-2` | `#B3B4B1` | Source pour `--ash` |
| `--inv-text-3` | `#979895` | Source pour `--ash-2` |
| `--inv-control` | `#83888E` | Source pour `--control` (contours au trait) |
| `--inv-line` | `#43484D` | Source pour `--rule` (décor) |
| `--inv-hover` | `#2C3136` | Source pour `--void-3` (survol d'un bouton au trait) |

Règle de calcul, à refaire pour tout nouveau jeton : **source = jeton + `--void`**, canal
par canal. Ainsi `|source − void|` redonne le jeton et `|source − ivoire|` en donne
l'inverse. Un jeton chromatique (`--jaune`, `--ok`, `--err`, `--warn`) n'a **pas** de
source inversée : il ne s'inverse jamais.

### 10.2 Composant `Verrerie`

Présentation pure, `aria-hidden`, sans logique métier. Props : `composition`
(`"accueil" | "onboarding" | "erreur" | "retro" | "bureau-<écran>"`) ou `seed`
(identifiant public d'un apéro ou d'une tablée). Rendu : un `<svg>` inline par silhouette,
`fill: var(--silhouette)`, aucun contour, `shape-rendering: geometricPrecision`.

| Silhouette | Dessin (géométrique : segments et arcs, sans détail) | Dimensions réelles (h × l) | Hauteur à l'échelle | Partie caractéristique (P12) |
|---|---|---|---|---|
| Bouteille de vin 75 cl | corps droit, épaule en arc, col étroit, bague | 300 × 75 mm | 100 % | col et goulot |
| Verre à pied | coupe en arc, jambe fine, pied plat | 210 × 85 mm (pied 75) | 70 % | jambe et pied |
| Flûte | coupe haute et étroite, jambe, pied | 230 × 60 mm (pied 70) | 77 % | coupe étroite |
| Pinte nonic | fût conique, renflement sous le buvant | 155 × 90 mm | 52 % | renflement |

**Échelle unique.** Les tracés sont dessinés en millimètres réels (`viewBox` en mm) et
rendus avec un seul facteur : `--verrerie-mm: calc(100svh / 300)` (bouteille = hauteur du
premier écran) ; la hauteur d'une silhouette vaut `calc(<hauteur en mm> * var(--verrerie-mm))`.
Sur bureau, la même formule s'applique à la hauteur de la fenêtre. Aucune silhouette ne
porte de taille propre : le tirage choisit l'objet, l'angle et l'ancre, jamais la taille.

Dessins originaux, tracés dans `specimens/verrerie.html` (≈ 150 octets de tracé chacun).

Tirage (`seed`) : FNV-1a 32 bits de l'identifiant public, comme `Signature` → objet
(4), angle de −35° à +35° par pas de 5°, ancre (gauche, droite, centre bas). Le composant
rend **une seule silhouette** : sa prop est un objet, pas une liste. Bornes du contrat §17.5 appliquées
après tirage : un tirage hors bornes est ramené à la borne, jamais rejoué.

### 10.3 Structure et empilement

**Implémenté sur l'accueil (19/10/2026)** : le contexte d'empilement est le bloc
traversé, pas l'écran. `.sign__text.verrerie-scope` (`position: relative ; isolation:
isolate ; background: var(--bg)`) contient la silhouette (`z-index: -1`), le titre et le
bouton. `.facade` garde son `z-index` : la silhouette et le texte inversé sont tous deux
à l'intérieur. `.has-verrerie { overflow: clip }` sur l'écran rogne la bouteille sans
créer de défilement. Le titre de l'accueil n'est pas révélé (pas d'animation sur un
ancêtre de l'encre). Schéma général, pour les écrans suivants :

```
.screen.has-verrerie            position: relative ; isolation: isolate
├── .verrerie                   position: absolute ; inset: 0 ; z-index: -1 ;
│                               pointer-events: none ; overflow: hidden
├── header.facade               SANS z-index sur ces écrans
│   └── … éléments à encre inversée
└── main.page > .page__body     SANS animation d'entrée sur ces écrans
```

- La Verrerie est peinte après le fond de `.screen` et avant tout son contenu.
- **Aucun ancêtre isolant** entre un élément inversé et `.screen` : ni `z-index`
  positionné, ni `transform`, `opacity` < 1, `filter`, `will-change`, `isolation`,
  `contain: paint`, même pendant une animation. Trois points du code actuel l'enfreignent
  et sont levés sur les écrans `.has-verrerie` : `.facade { z-index: 30 }` (le menu et la
  cloche restent au-dessus par leur propre positionnement fixe ; `npm run test:nav` le
  vérifie), l'entrée `pj-rise` de `.page__body`, et la révélation `pj-reveal` posée sur
  `.h1` (déplacée sur ses enfants, §10.4).
- La couche est rognée par `.screen` : aucun débordement horizontal (V5).

### 10.4 Ce qui s'inverse, ce qui ne s'inverse pas

| Classe d'élément | Exemples | Traitement sur `.has-verrerie` |
|---|---|---|
| **Neutre transparent** | `.h1__ink`, `.h1--sm`, `.h2`, `.h3`, `.lede`, `.eyebrow`, `.meta`, `.lbl`, `.factline`, `.verdict__date`, `.cnt b`, `.leaf__day`, `.button--ghost`, `.ghost-link`, boutons carrés au trait de l'en-tête, filets | `mix-blend-mode: difference` + couleur `--inv-*` correspondante |
| **Opaque** | `.button--primary`, champs, `.actionbar`, menus, feuilles, modales, carte Leaflet | aucun mélange ; il masque la silhouette |
| **Chromatique transparent** | point du manifeste, `PointMark`, légende « en tête », états colorés | jamais inversé ; **réserve** `--void` : anneau plein de 0,07 em (point) ou 4 px (`PointMark`), sans flou |
| **Data Field** | `VoteField`, `ComptoirField`, `Signature` | la composition l'évite ; à défaut, fond `--bg` opaque |

Un élément inversé ne contient **aucun** descendant chromatique : un groupe en
`difference` inverse tout ce qu'il contient (vu sur spécimen : le point jaune du manifeste
devenu bleu). D'où la seule modification de structure, sans changement de texte :

```
<h1 class="h1">
  <span class="h1__ink">La Confrérie du Petit Jaune</span><span class="h1__point" aria-hidden="true"></span>
</h1>
```

`.h1__ink` porte l'encre inversée **et** la révélation typographique ; `.h1__point` porte
la même révélation et sa réserve. `.h1__pop` disparaît au profit de `.h1__point`.

**Focus** : `.has-verrerie :focus-visible` repasse en `mix-blend-mode: normal`, couleur du
jeton ordinaire, fond `--void`. L'anneau jaune reste à 9,2 : 1 sur toute silhouette.

### 10.5 Contrastes de l'encre inversée (calcul sur les jetons, vérifié au pixel)

| Jeton rendu | Sur `--void` | Sur silhouette | Usage |
|---|---|---|---|
| `--ivory` | 17,4 | 17,4 (`--void` sur ivoire) | tout texte |
| `--ash` | 8,4 | 9,6 | texte secondaire |
| `--ash-2` | 5,9 | 6,2 | méta 12 px |
| `--control` | 4,8 | 4,8 | contours |
| `--rule` | 1,8 | 2,1 | décor seulement |

Pixels mesurés sur spécimen : glyphes pleins `#F3F1EA` hors silhouette, `#090B0D` sous
silhouette, aucune autre valeur hors bords anticrénelés. Sans compensation de la source
(jeton brut en `difference`), `--ash-2` tomberait à 5,1 et l'ivoire à 15,8 : la règle de
calcul §10.1 n'est pas cosmétique.

### 10.6 Coût

SVG inline, ≤ 2 ko par écran, aucune requête, aucune dépendance. La Verrerie ne bouge pas
et défile avec la page : les calques inversés ne sont repeints qu'au défilement de la page
elle-même, comme sans Verrerie. Aucune image bitmap.

Checkpoint : **DESIGN_SYSTEM_READY** ; avenant Verrerie : **DESIGN_SYSTEM_AMENDED**.
