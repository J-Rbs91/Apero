# AUDIT-5.md — revue QA finale du parcours de saisie

Itération 5/5. Mandat fixé par `DECISIONS.md` D3 et par le point de reprise de
l'itération 4 : **revue QA finale** selon les treize axes de
[`skills/ui-review-qa/`](../../../UXER/skills/ui-review-qa/SKILL.md) de UXER,
accessibilité et responsive comme plancher, cohérence, purge des restes de
l'ancien parcours — puis la double mesure de la section 9 du prompt de routine.

Cet audit ne rouvre aucune décision. D1 (charte de placement), D2 (périmètre
affordance, clos par D11), D4 (overlay de recherche conservé), D12 (bandeau de
brouillon en vocabulaire fonctionnel) sont appliquées, pas rediscutées.

## 0. Nature des preuves

| Preuve | Portée |
|---|---|
| `code` | Lecture de `SwitchRow.tsx`, `Field.tsx`, `ChoiceGroup.tsx`, `CompanionsField.tsx`, `AlternativeOptionForm.tsx`, `VoteForm.tsx`, `LocationField.tsx`, `TraquenardGauge.tsx`, `global.css`, `docs/DESIGN-SYSTEM.md` ; recensement automatisé des sélecteurs CSS confrontés à `src/**/*.ts(x)` |
| `exécution` | Sonde Playwright dédiée sur le banc d'essai du dépôt (Chromium headless, vraie API `server/`, vrai `vite dev`, faux GitHub in-memory, Photon intercepté). Deux viewports : 420 × 900 et 320 × 640. Un apéro réel créé, puis vote et contre-proposition réellement exercés |
| `visuelle` | Contrastes calculés sur **pixels réellement décodés** (décodeur PNG minimal dans la sonde), pas sur les valeurs CSS |

Ce qui n'a pas été exercé est dit en §9, pas passé sous silence.

## 1. Non-régression — ce que les itérations 2 à 4 ont posé tient

Vérifié **avant** toute modification de cette itération.

| Acquis | Itération | Vérification | Résultat |
|---|---|---|---|
| `MIN_QUERY_LENGTH` à 2 lettres | 2 (D4) | `LocationField.tsx:17` | tient — `const MIN_QUERY_LENGTH = 2` |
| Entrée sélectionne la première suggestion | 2 (D4) | `LocationField.tsx:174-179` | tient — `handleOverlayKeyDown`, gardé par `!isSearching && suggestions.length > 0` |
| `.feedback` en graisse 600, un cran sous `.field__error` (700) | 2 (D5) | `global.css:726-737` (`.field__hint`), bloc `.field__error` | tient |
| A8/A9 hors du bouton, dans `aside` | 4 (D10) | sonde, trois mesures | tient — `asideDansBouton: false` sur les trois points d'appel mesurés |
| Loupe du champ lieu | 4 (D11) | `LocationField.tsx:305-330`, `global.css:1801-1816` | tient — `.locfield__glyph`, `pointer-events: none`, 17 px |
| Exception des trois champs de créneau documentée | 4 (D11) | `docs/DESIGN-SYSTEM.md` | tient |
| Suite de tests | 3 et 4 | `npm test`, `npm run test:nav` | 236 tests / 29 fichiers, 23 contrôles de navigation — tous passés, même compte qu'en itération 4 |

**Aucune régression des itérations précédentes.** Les constats corrigés en 2, 3
et 4 ont réellement disparu.

## 2. Les points d'appel de `SwitchRow` — et celui qui n'existe pas

Le point de reprise de l'itération 4 demandait de vérifier que les trois points
d'appel rendent bien `aside` « sur le parcours de vote et de contre-proposition »,
A9 n'ayant jamais été mesurée séparément.

**Mesuré, viewport 420 × 900 :**

| Point d'appel | Écran atteint | `aside` rendu | Hors du bouton | Typo mesurée | Bouton |
|---|---|---|---|---|---|
| `CompanionsField.tsx:46` (A9, « Non ») | Répondre (vote) | « Peinard, en solo » | oui (`false`) | 12.5 px / 500 / `rgba(255,247,230,0.72)` · 324 px de large · `top 545`, bouton fini à 540 | 60 px, `aria-checked=false` |
| `CompanionsField.tsx:46` (A9, « Oui ») | Répondre (vote) | « En escadron » | oui (`false`) | idem · `top 531`, bouton fini à 526 | 60 px, `aria-checked=true` |
| `CreateEventPage.tsx:545` (A8) | Créer un apéro, volet réglages | « Ce soir c’est sans les mômes » | oui (`false`) | idem · 324 px · `top 810`, bouton fini à 805 | 60 px |

**Contraste de A9 sur le parcours de vote, sur pixels décodés : 9.31 : 1**
(texte `[190,189,174]`, fond `[16,27,21]`, sur 5 832 px échantillonnés). Plancher
AA : 4.5 : 1. La valeur est *supérieure* aux 7.94 : 1 mesurés sur A8 en
itération 4 — même règle CSS, fond de page différent. A9 est donc désormais
mesurée pour elle-même, et non plus déduite de A8 « par construction ».

### 2.1 Constat neuf — `TON.md` attribue A9, B11, B12 et B13 à un écran où elles ne s'affichent pas

Preuve `code`, corroborée à l'exécution.

`CompanionsField` n'est monté **qu'à un seul endroit** : `VoteForm.tsx:427`.
`AlternativeOptionForm.tsx` ne l'importe pas (`ActionBar, FormSheet, TextField`
seulement, ligne 8) et ne contient aucune occurrence de `companion`.
`git log -S "CompanionsField" -- src/components/AlternativeOptionForm.tsx` ne
retourne **aucun** commit : ce composant n'y a jamais été.

Or `TON.md` §3 porte, pour A9, B11, B12 et B13, la colonne
« Répondre (vote), Proposer un créneau ».

Vérifié à l'exécution : la feuille « Proposer un autre créneau » réellement
ouverte contient **0 `SwitchRow` et 0 bloc renforts**.

C'est une **inexactitude d'inventaire portée depuis l'itération 1**, de la même
nature que celle que l'itération 4 avait trouvée dans la prémisse de D1
(`AUDIT-4.md` §3). Elle ne touche ni un texte du corpus, ni le compteur : les
quatre tournures existent, au `fichier:ligne` déclaré. Seule la colonne
« Écran » est fausse. **N reste 25.**

Corriger une localisation fausse n'est pas modifier le corpus : `TON.md` est
« gelé sur le contenu, vivant sur le placement », et une position mal décrite
est précisément ce que la routine doit tenir à jour. La correction est portée
en §2.1 de l'entrée de journal, et le fichier est mis à jour.

### 2.2 Le troisième point d'appel n'a pas été atteint

`AperoSettingsForm.tsx:136` (A8, écran « Retoucher l'apéro ») n'a pas pu être
atteint par la sonde : le bouton d'entrée n'est pas exposé sur la page
d'invitation dans l'état où la sonde la laisse. **Mesure non faite**, consignée
comme telle en §9 — pas déduite de A8 sur la création, ce qui serait exactement
l'erreur que l'itération 4 s'est refusée à commettre pour A9.

## 3. Constat neuf, axe 8 (accessibilité) et axe 5 (cohérence) — `SwitchRow` n'annonce ni son `aside` ni son `hint`

**Gravité : important.**

`Field` fabrique les identifiants de son `hint` et de son `error`, et les relie
au contrôle par `aria-describedby` (`Field.tsx:49-51` et `:70`). `ChoiceGroup`
fait de même (`ChoiceGroup.tsx:68`). Le commentaire de `Field.tsx:3-8` en fait
même une promesse de composant : « impossible d'oublier le lien
libellé/aide/erreur ».

`SwitchRow` ne le fait pas. Il rend `aside` et `hint` comme deux `<p>` nus,
sans `id`, et le bouton ne porte aucun `aria-describedby`
(`SwitchRow.tsx:57-58`).

**Mesuré sur les trois rendus, aux deux viewports :**

```
aria-describedby   : (ABSENT)
nom accessible     : "Tu débarques accompagné·e ?Non"
description access.: null
id de l'aside      : (aucun)
```

Deux conséquences, de poids inégal.

1. **Fonctionnelle.** `AperoSettingsForm.tsx:138-142` passe un `hint`
   conditionnel à `SwitchRow` depuis le commit `9738a47`, antérieur à
   l'itération 1 (fait établi par `AUDIT-4.md` §3). Cette précision
   fonctionnelle n'est annoncée à aucun utilisateur de lecteur d'écran qui
   atteint le réglage par navigation de contrôle en contrôle. C'est un défaut
   **antérieur** à la routine.
2. **Sur le registre.** L'itération 4 a sorti A8/A9 du nom accessible du
   bouton — à raison : « Les mioches sont-ils conviés ?Ce soir c'est sans les
   mômes » était un nom accessible bavard, et `TON.md` consigne honnêtement
   « Dans le nom accessible du bouton : oui → non ». Mais aucune description
   n'a pris le relais. **Sur le chemin assistif, le résultat net est que la
   tournure a disparu du contrôle** : elle n'est ni dans le nom, ni dans une
   description. Elle reste dans le flux du document, donc lisible en lecture
   linéaire — mais pas pour qui navigue de contrôle en contrôle, ce qui est le
   mode normal de remplissage d'un formulaire.

Ce n'est pas un reproche à l'itération 4 : sortir la tournure du nom était le
bon geste, et le compte visuel n'a pas bougé. C'est le geste complémentaire qui
manquait, et le contrôle de ton de la routine ne pouvait pas le voir — il
`grep` le code, où la chaîne est bien présente.

Le correctif est **le seul de cette itération qui touche au registre, et il
l'augmente** : relier `aside` par `aria-describedby` remet la tournure sur le
chemin assistif sans écrire un caractère, sans la déplacer, sans changer son
échelle. C'est du placement, au sens exact de la charte D1.

## 4. Constat neuf, axe 5 (cohérence) et axe 2 (compréhension) — l'anneau de focus du champ de recherche du lieu

**Gravité : important. Ce n'est pas une violation normative** — le point est
tranché sur mesure, pas sur principe.

`global.css:1770-1776` porte une règle unique qui donne à quinze sélecteurs —
dont `input:focus-visible` — un anneau `outline: 3px solid var(--pastis)` avec
`outline-offset: 2px`. C'est la convention réellement implémentée du produit.

`global.css:1952-1954` y fait **la seule exception du parcours de saisie** :

```css
.locsearch__input:focus {
  outline: none;
  border-color: rgba(255, 247, 230, 0.5);
}
```

Reproduit en isolation, hors de l'app, pour écarter tout artefact : un `input`
ordinaire reçoit `3px solid rgb(244, 197, 66)` ; `.locsearch__input` reçoit
`AUCUN`, et sa bordure passe de `rgba(255,247,230,0.24)` à `0.5`.

**Mesuré sur pixels décodés**, indicateur focalisé :

| Mesure | Valeur | Plancher |
|---|---|---|
| Contraste du trait contre le dehors | **3.74 : 1** | WCAG 1.4.11 : 3 : 1 |
| Contraste du trait contre le dedans | **3.61 : 1** | idem |
| Épaisseur | 1 px | — |
| Anneau des autres contrôles | 3 px, `rgb(244,197,66)` | — |

**Le plancher est donc tenu** : un indicateur existe (2.4.7) et il passe le
seuil non-textuel (1.4.11). Ce constat n'est **pas** classé bloquant, et il ne
se plaide pas sur le goût. Ce qui se défend sur des faits, c'est autre chose :

- l'indicateur est **trois fois plus fin** et à 3.6 : 1 là où le reste du
  parcours est à un anneau de 3 px ;
- il est la **seule exception** parmi les contrôles du parcours ;
- et il tombe sur le contrôle que **D4 a promu en chemin clavier rapide**. D4
  a explicitement fait de ce champ un « taper puis valider » — Entrée
  sélectionne la première suggestion. Le contrôle qui porte le gain de vitesse
  au clavier de l'itération 2 est celui dont le repère de focus est le plus
  faible du parcours.

C'est ce dernier point qui rattache le constat à l'objectif de la routine, et
non à une préférence : un chemin clavier qu'on a rendu rapide se remarque
d'autant plus s'il faut chercher où on est.

**Rien ici ne rouvre D4.** L'overlay est conservé, sa justification
fonctionnelle intacte : le constat porte sur le repère de focus de son input,
pas sur son existence.

## 5. Purge des restes de l'ancien parcours — 19 classes CSS orphelines

**Gravité : amélioration.** Axes 11 (maintenabilité) et 9 (poids).

Recensement automatisé : 326 sélecteurs de classe de `global.css` confrontés à
l'intégralité de `src/**/*.ts(x)`. 40 sans correspondance littérale, dont 21
sont des **faux positifs** — des modificateurs construits par gabarit, vérifiés
un par un :

```
actionbar__status--${tone}   field__req--${requirement}   choices--${layout}
badge-medal--${badge.rarity} recap__answer--${vote}       choice--${option.tone}
slot__state--${…}
```

plus `woff2`, `w3`, `claude`, `txt`, qui viennent d'URL et de commentaires.

**Restent 19 classes réellement mortes**, confirmées sans aucune occurrence
dans tout le dépôt hors `global.css` (`node_modules`, `.git` et `dist` exclus) :

| Classe(s) | Lignes | Origine |
|---|---|---|
| `vote-chip`, `__check`, `__body`, `__name`, `__vote`, `__votes`, `__row`, `__slot`, `__answer`, `--yes`, `--maybe`, `--no` (12) | 2715-2788 | Le JSX correspondant a été retiré par le commit **`cb8e9c2` « Refonte de l'interface : dire quoi remplir, et où appuyer »** — le CSS a survécu au balisage |
| `locfield__list` | 1825 | La liste de suggestions **ancrée sous le champ**, remplacée par l'overlay plein écran. C'est le vestige exact de l'approche que D4 documente comme abandonnée |
| `share-box` | 1269 | — |
| `home-links` | 1590 | — |
| `button--large`, `button--secondary` | 596, 568-580 | Variantes de bouton jamais appelées |
| `accent--wide` | 320 | — |
| `notif-badge--inline` | 2478 | — |

`vote-chip` et `locfield__list` sont littéralement « des restes de l'ancien
parcours » au sens du mandat de l'itération 5 : le premier date de la refonte
d'interface que `DESIGN-SYSTEM.md` documente, le second de l'architecture de
recherche que D4 a tranchée.

Poids de départ : `src/styles/global.css` 72 119 octets, `dist` 61 420 octets.

## 6. Responsive et cibles tactiles — le plancher, mesuré

### 6.1 Débordement horizontal à 320 px — aucun

`scrollWidth` contre `clientWidth`, sur trois états réels :

| Écran | Mesure | Verdict |
|---|---|---|
| Créer un apéro | 320 vs 320 | ok |
| Créer un apéro, volet réglages ouvert | 320 vs 320 | ok |
| Répondre (vote) | 320 vs 320 | ok |

Aucun élément hors cadre détecté (balayage de tous les descendants de `body`).
**Élément validé**, pas seulement absence de plainte.

À 320 px, A8 reste correcte : le titre du réglage passe sur deux lignes, le
bouton grandit de 60 à 78 px, l'`aside` dispose de 224 px et ne déborde pas.
Le déplacement de l'itération 4 tient au plancher de largeur.

### 6.2 Cibles sous 44 px

| Élément | Taille | Écran | Verdict |
|---|---|---|---|
| `a.notif-bell` | 42 × 42 | tous | 2 px sous le plancher. **Hors parcours de saisie** (en-tête de navigation). Amélioration, non traitée ici |
| `button.cheer-btn` × 2 | 161 × 40 | vote | Connu — `BACKLOG.md` item 16, hors périmètre tant qu'aucun audit ne démontre un blocage de la saisie. Cet audit ne le démontre pas : l'action « Trinquer » n'est pas une étape du remplissage. **Reste hors périmètre** |
| `input.traq__input` | 324 × 34 | vote | **Écarté après inspection** : `type="range"` en `opacity: 0` posé en `inset: 0` sur toute la jauge (`TraquenardGauge.tsx:92-99`, `global.css:2247-2255`). Le 34 px est la hauteur de la jauge, pas une cible ponctuelle ; la zone saisissable fait 324 px de large. Le critère des 44 px ne s'y applique pas de la même façon. Pas un défaut |

### 6.3 Focus au clavier — treize arrêts relevés

Dix des treize premiers arrêts de tabulation sur l'écran de création portent
l'anneau attendu, `3px solid rgb(244, 197, 66)`. Les trois autres :

- `.locsearch__input` — traité en §4 ;
- deux `input` relevés « sans contour » aux arrêts 7 et 11 : **artefact de
  mesure, pas un défaut**. `LocationField.tsx:333` ouvre l'overlay sur
  `onFocus` ; l'élément mesuré est en cours de démontage au moment de la
  lecture, et `autoFocus` a déjà déplacé le focus vers l'input de l'overlay.
  Vérifié en mesurant les contrôles un par un plutôt que par tabulation ;
- `a.notif-bell` porte l'anneau **par défaut du navigateur** (`1px auto`) et
  non celui du produit. Chromium rend `outline: auto` comme un anneau
  bitonal visible : ce n'est **pas** un constat de focus invisible, et il
  n'est pas classé comme défaut. Signalé comme incohérence de surface
  appartenant au navigateur, hors parcours de saisie.

### 6.4 Vérifié puis écarté — l'`aside` sous la barre d'action

Question légitime posée par le déplacement de l'itération 4 : l'`aside` étant
désormais *sous* le bouton, tombe-t-il derrière la barre d'action fixe ?

Première mesure, alarmante : à une position de défilement intermédiaire,
`document.elementFromPoint` au centre de l'`aside` renvoie `button.button` — la
barre d'action est **par-dessus** la tournure (`aside` à 810-828, barre à
773-872, viewport 900).

Balayage de cinq positions de défilement du conteneur réel
(`div.mobile-page__inner`, amplitude 785 px) :

| `scrollTop` | `aside` | Dégagé | Élément au-dessus |
|---|---|---|---|
| 0 | 1220-1238 | non (hors écran, sous le pli) | — |
| 196 | 1024-1042 | non (hors écran) | — |
| 393 | 827-845 | **non — masqué** | `button.button` |
| 589 | 631-649 | **oui** | `p.switchrow__aside` |
| 785 (fin) | 435-453 | **oui** | `p.switchrow__aside` |

**Ce n'est pas un défaut.** Il existe des positions — dont la fin de course, où
la tournure remonte à 435 px, loin au-dessus de la barre — où l'`aside` est
entièrement dégagé et où il est lui-même l'élément au premier plan. Le masquage
n'est que le transitoire que toute barre fixe impose au contenu qui passe
derrière elle en défilant, et il touchait tout autant le bouton lui-même avant
l'itération 4. Le constat est consigné parce que la question méritait d'être
tranchée sur mesure, pas parce qu'il reste quelque chose à corriger.

### 6.5 Observation à ne pas corriger ici — la tabulation traverse l'overlay

Fait établi : `LocationField.tsx:333` ouvre l'overlay plein écran sur `onFocus`.
Conséquence pour un utilisateur au clavier : traverser un formulaire à trois
créneaux ne peut pas se faire sans être projeté trois fois dans l'overlay, dont
il faut sortir explicitement à chaque fois.

**Cette itération ne le corrige pas, et c'est délibéré.** Toucher à l'ouverture
de l'overlay est exactement ce que `BACKLOG.md` « Écarté — itération 2 » et D4
interdisent sans **preuve d'exécution sur un rendu mobile réel, clavier virtuel
ouvert** : sans l'overlay, les suggestions ancrées tombent derrière le clavier.
Chromium headless n'ouvre pas de clavier virtuel — la condition n'est pas
remplie, aux itérations 2, 3, 4 comme à celle-ci. Le constat est **consigné
pour le propriétaire du produit**, pas traité en douce.

## 7. Manifestations du registre, mesurées écran par écran

Comptées sur le texte réellement rendu (`document.body.innerText`, apostrophes
et espaces normalisées), pas déduites du code.

| Parcours, état réel | Manifestations | Lesquelles |
|---|---|---|
| Vote, volet « Ajouter des détails » **replié** (état par défaut) | **0** | — |
| Vote, volet ouvert, réglage « accompagné » | **3** | « En escadron » · « C’est sans les mioches ce coup-ci… » · « Le nombre de bouches en plus… » |
| Créer un apéro, volet réglages ouvert | **3** | « Ce soir c’est sans les mômes » · « On verra bien après. » · « Le rituel hebdomadaire. » |
| Vote + feuille de contre-proposition ouverte (**total de page**) | **4** | les 3 ci-dessus, derrière la feuille, + « Pour que la tablée sache qui a bousculé le programme. » apportée par la feuille |

Deux précisions de méthode, pour que l'itération suivante n'ait pas à les
redécouvrir — et parce qu'elles corrigent une lecture trop favorable :

1. **Le compte se fait par page, pas par panneau.** La feuille de
   contre-proposition étant un `role="dialog"` posé au-dessus de la page de
   vote, le total de 4 inclut ce qui est derrière elle. La feuille elle-même
   n'apporte qu'une tournure : B10.
2. **Sur le parcours de vote par défaut, le registre est à 0**, parce que A9 et
   les hints du bloc renforts vivent derrière un volet replié
   (`VoteForm.tsx:423-444`). L'itération 4 notait « vote / contre-proposition,
   bloc renforts : 1 (+1 conditionnel) » — c'est exact **volet ouvert**, et
   l'itération 4 mesurait bien cet état. Le chiffre n'est pas contredit ; sa
   condition est simplement rendue explicite. Ce n'est ni une régression, ni un
   recul du registre : rien n'a été déplacé ni replié par une itération de la
   routine, le volet est antérieur.

## 8. Classement par impact sur l'objectif de la routine

Impact sur la vitesse et la complétude de saisie, pas facilité de correction.

| # | Constat | Axe | Gravité | Retenu ce lot |
|---|---|---|---|---|
| 1 | `SwitchRow` n'annonce ni `aside` ni `hint` (§3) | 8, 5 | Important | **oui** |
| 2 | Anneau de focus du champ de recherche du lieu (§4) | 5, 2 | Important | **oui** |
| 3 | 19 classes CSS mortes, restes de l'ancien parcours (§5) | 11, 9 | Amélioration | **oui** |
| 4 | `TON.md` attribue 4 tournures à un écran où elles ne s'affichent pas (§2.1) | 5 | Important (exactitude du suivi) | **oui** |
| 5 | La tabulation traverse l'overlay du lieu (§6.5) | 2, 8 | Important | non — bloqué par D4, preuve manquante |
| 6 | `a.notif-bell` à 42 × 42 et anneau du navigateur (§6.2, §6.3) | 8, 5 | Amélioration | non — hors parcours de saisie |
| 7 | `.cheer-btn` à 40 px (§6.2) | 8 | Amélioration | non — `BACKLOG.md` item 16, hors périmètre confirmé |
| 8 | Brouillon de `VoteForm` / `AlternativeOptionForm` | 6 | Amélioration | non — `BACKLOG.md` item 14 |

Les quatre constats retenus forment **un lot cohérent** : le plancher qui reste
à tenir, et le ménage de fin de routine. Aucun ne touche un caractère du
corpus ; l'un d'eux (§3) remet une tournure sur un chemin où elle avait
silencieusement disparu.

## 9. Ce qui n'a pas été vérifié

- **A8 sur « Retoucher l'apéro »** (`AperoSettingsForm.tsx:136`) — troisième
  point d'appel non atteint par la sonde (§2.2). Non déduit de la création.
- **Le clavier virtuel mobile réel** — Chromium headless n'en ouvre pas. La
  question de l'overlay reste fermée, à la même condition qu'aux itérations 2,
  3 et 4.
- **Le zoom à 200 %** — l'axe 7 de la grille UXER le demande ; non exercé.
- **Un appareil tactile réel** — les cibles sont mesurées en pixels CSS, pas
  éprouvées au pouce.
- **Les axes 9 (performance mesurée : LCP, INP, CLS au 75e centile) et 3
  (navigation générale)** — hors périmètre de la routine, qui porte sur la
  saisie. Le poids CSS est donné en §5 comme un chiffre, pas comme une mesure
  de Core Web Vitals.
- **Lecteur d'écran réel** — le constat §3 porte sur les attributs et sur les
  noms et descriptions accessibles calculés depuis eux, non sur une écoute avec
  NVDA, VoiceOver ou Orca.
