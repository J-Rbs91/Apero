# Design system — « La Baraque du Petit Jaune »

> **Document historique (16/10/2026).** Design system « La Baraque du Petit Jaune » remplacé par la direction **Point Jaune**
> (mission UXER `manifesto-void`) : voir `docs/uxer/manifesto-void/`. Ses invariants
> **fonctionnels** restent opposables ; ses choix esthétiques (auvent, ampoules, tickets,
> didone d'affiche, thème clair) ne le sont plus.

Direction : **Fairground Baroque** (arts forains, Belle Époque) comme grammaire de façade, avec la règle de **couleur isolée** de la *Polish Poster School* comme grammaire secondaire. Le pourquoi est dans [`refonte-contract.md`](refonte-contract.md) ; ce document dit **comment** : assez précisément pour qu'un autre agent produise la même intention.

Fichier d'implémentation unique : `src/styles/global.css` (ordre : tokens → base → mise en page → composants → écrans → mouvement → thèmes). Aucun second système, aucun CSS de recouvrement. Composants React : `src/components/`.

---

> ## Addendum d'intégration — PR #48 (15/10/2026)
> Le système a été porté sur le code de `main` (kit `src/components/ui/`, navigation par couche d'historique, tablées, coffre, rétrospective, recherche de lieu…). Correspondance **réelle** avec le code, qui remplace les lignes « Navigation de premier niveau », « Puce blaze » et « Modale » du §5 :
>
> | Rôle | Composant de `main` conservé | Habillage Fairground |
> |---|---|---|
> | Navigation | `BrandMenu` (accueil), `HeaderNav` + `MobileHeader` (pages intérieures), `ConfrerieMenuPanel`, `NotificationBell` | panneau de **papier** posé sur le scrim ; bouton retour `.bk` 44 px ; cloche carrée à badge rouge |
> | Champ | `Field`, `TextField`, `TextAreaField` | libellé 800, mention `Obligatoire` (rouge foncé) / `Facultatif` en pilule, erreur à pastille « ! » sous le champ, champ en faute rosé |
> | Choix | `ChoiceGroup` (+ option facultative `icon`) | **talons** à glyphe pour les trois réponses d'un créneau ; cartes à pastille pour les listes |
> | Réglage | `SwitchRow` | bascule 52×30, verte quand « Oui » |
> | Bloc numéroté | `FormSection` | pastille d'étape (cochée en vert), titre en affiche |
> | Volet | `Disclosure` (`<details>`) | filets pointillés, titre 800, compte en pilule |
> | Action | `ActionBar` | bande de **papier** sous un filet encre épais ; bouton rouge ; le statut dit la prochaine chose à faire |
> | Saisie secondaire | `FormSheet` | feuille de papier bordée d'encre, titre en affiche |
> | Modale | `ConfirmDialog` + `useModalDialog` | papier, bordure 3 px, ampoules statiques en tête |
> | Créneau | `EventOptionMobileCard`, `SlotHead`, `SlotLeaf` | **ticket** : calendrier-feuille, heure en affiche, perforation, talons ; états incomplet (pointillé) / refusé (rosé + double trait) / répondu |
> | Verdict | `MobileResultsPanel` | bande de façade (ampoules, date, compteurs à arche) ; tamponné « Servi » quand l'apéro est passé |
> | Jauge | `TraquenardGauge`, `TraquenardSlider` | dix ampoules, trois zones ; curseur natif conservé ; état « pas encore touché » en creux |
> | Recherche de lieu | `LocationField` (overlay `.locsearch`) | panneau de papier en haut d'écran sous le scrim |
> | Ouverture | `SplashScreen` | façade plein écran sous l'auvent |
>
> Supprimés par l'intégration : `TabBar`, `BrandBar`, `Dialog`, `useDialogFocus`, `VoteSegmentedControl` (supprimé aussi par `main`). Ajoutés : `Icon`, `Bulbs`, `SlotLeaf`, `SlotHead`.
> **Contextes de jetons** : `.facade`, `.verdict` et `.splash` relisent les jetons pour le texte clair sur vert ; `.slot`, `.modal-sheet`, `.formsheet__panel`, `.actionbar`, `.brand-menu__panel`, `.locsearch__panel`, `.maplinks__panel` et `.notif-item--unread` les relisent pour le texte encre sur papier — y compris en thème sombre. Un composant n'a pas à savoir où il est posé.
> **Piège de cascade à éviter** : ne jamais déclarer une valeur *par défaut* d'un jeton sur l'élément qui le consomme (ex. `.cnt { --cnt-num: … }`) : elle écraserait la valeur du thème héritée de `:root`. Les défauts vivent sur `:root`.


## 1. Couleurs

### 1.1 Primitives
| Token | Valeur | Origine / usage |
|---|---|---|
| `--forest-900` | `#0A241B` | fond du thème sombre (existant `--green-900`) |
| `--forest-800` | `#11342A` | façade, enseigne (existant `--green-800`) |
| `--forest-700` | `#14543B` | « j'y serai », succès (existant `--green-700`) |
| `--forest-600` | `#1D704D` | hover sur façade (existant) |
| `--ivory-50` | `#FBF4E2` | papier : tickets, champs, modales |
| `--ivory-100` | `#F5EAD0` | fond de page (thème clair) |
| `--ivory-200` | `#E9DABB` | creux : zones désactivées, fond de piste |
| `--ivory-300` | `#D6C39A` | filets décoratifs ; texte secondaire sur façade |
| `--ink-900` | `#241A12` | texte principal (existant `--ink`) |
| `--ink-700` | `#4A3B2E` | texte secondaire |
| `--ink-500` | `#6B5A48` | texte tertiaire (méta) |
| `--ink-400` | `#85735E` | bordure de contrôle (≥ 3:1) |
| `--pastis-400` | `#F4C542` | **jaune pastis** (existant) — fait marquant sur façade, vote « me tâte » |
| `--pastis-300` | `#FFE39A` | sélection de texte, ampoule allumée claire |
| `--pastis-700` | `#8A5E00` | avertissement et accent **sur fond clair** (4,77:1) |
| `--red-600` | `#A3231F` | store, action principale |
| `--red-700` | `#7F1A17` | action pressée, lien, danger texte |
| `--blue-300` | `#7DB4E6` | ampoule « froide » sur fond sombre |
| `--blue-600` | `#2F6FB0` | ampoule « froide » sur fond clair (existant `--calm-blue`) |

### 1.2 Tokens sémantiques (thème clair = défaut)
| Rôle | Token | Valeur |
|---|---|---|
| Fond de page | `--bg` | `--ivory-100` |
| Creux | `--bg-sunken` | `--ivory-200` |
| Papier (tickets, champs, modales) | `--paper` | `--ivory-50` |
| Texte sur papier | `--on-paper` / `--on-paper-2` | `--ink-900` / `--ink-700` |
| Texte | `--text` / `--text-2` / `--text-3` | `--ink-900` / `--ink-700` / `--ink-500` |
| Filet décoratif | `--rule` | `--ivory-300` |
| Bordure de contrôle | `--control-border` | `--ink-400` |
| Action principale | `--accent` / `--on-accent` / `--accent-pressed` | `--red-600` / `--ivory-50` / `--red-700` |
| Lien | `--link` | `--red-700` (souligné) |
| Façade | `--facade` / `--on-facade` / `--on-facade-2` | `--forest-800` / `--ivory-100` / `--ivory-300` |
| Fait marquant (sur façade seulement) | `--pop` | `--pastis-400` |
| Vote oui / peut-être / non | `--vote-yes` / `--vote-maybe` / `--vote-no` | `--forest-700` / `--pastis-400` / `--ink-700` |
| Danger | `--danger` | `--red-600` (texte : `--red-700`) |
| Succès | `--success` | `--forest-700` |
| Avertissement | `--warning` | `--pastis-700` |
| Désactivé | `--disabled-bg` / `--disabled-text` | `--ivory-200` / `--ink-400` (texte désactivé exempté de contraste) |
| Sélection de texte | `::selection` | fond `--pastis-300`, texte `--ink-900` |
| Focus | `--focus` | `--ink-900` sur clair ; `--pastis-400` sur façade |

### 1.3 Thème sombre (`prefers-color-scheme: dark`, surchargeable par `data-theme`)
`--bg: --forest-900` · `--bg-sunken: #071A13` · `--text: --ivory-100` · `--text-2: --ivory-300` · `--text-3: #B3A27C` · `--rule: --forest-700` · `--facade: --forest-700` · `--link: --pastis-300` · `--focus: --pastis-400`.
Le **papier reste ivoire** dans les deux thèmes (`--paper`, `--on-paper*`, bordures de champ inchangés) : tickets, champs et modales sont des morceaux de papier sur une baraque de nuit. L'accent rouge reste identique (ivoire sur rouge = 6,8:1).

### 1.4 Contrastes mesurés (WCAG, calculés)
| Paire | Ratio | Cible |
|---|---|---|
| `ink-900` / `ivory-100` | 14,3 | texte ≥ 4,5 ✓ |
| `ink-700` / `ivory-100` | 9,0 | ✓ |
| `ink-500` / `ivory-100` | 5,5 | ✓ (méta ≥ 13 px bold/medium) |
| `ivory-50` / `red-600` | 6,8 | ✓ bouton |
| `ivory-100` / `forest-800` | 11,3 | ✓ |
| `pastis-400` / `forest-800` | 8,3 | ✓ grand chiffre et texte |
| `ink-900` / `pastis-400` | 10,5 | ✓ talon « me tâte » |
| `pastis-700` / `ivory-100` | 4,8 | ✓ avertissement |
| `ink-400` / `ivory-50` | 4,2 | contrôle ≥ 3 ✓ |
| `ivory-300` / `ivory-100` | 1,45 | **décoratif seulement** (jamais seul porteur de sens) |
| `pastis-400` / `ivory-100` | < 2 | **interdit** en texte sur clair |

Règle de **couleur isolée** (grammaire secondaire) : par écran, **une** couleur saturée porte la décision. Rouge = action principale (un bouton rouge visible à la fois, sauf formulaire long où le bouton final est seul) ; jaune pastis = fait marquant sur façade (date retenue, compteurs, ampoules). Tout le reste = ivoire/encre/vert.

---

## 2. Typographie

### 2.1 Familles
| Rôle | Famille | Source | Poids | Repli |
|---|---|---|---|---|
| Affiche (display) | **Abril Fatface** (didone gras, affiches lithographiques) | **Auto-hébergée** `src/assets/fonts/abril-fatface-{latin,latin-ext}.woff2`, `font-display: swap` | 400 seul | `"Bodoni 72","Didot","Bodoni MT",Georgia,serif` |
| Interface / texte | **Manrope** (existante) | **Auto-hébergée** `src/assets/fonts/manrope-*.woff2` | 500, 700, 800 | `system-ui,"Segoe UI",Arial,sans-serif` |
`font-synthesis: none` (jamais de faux gras). Pas de troisième famille.

### 2.2 Rôles de la famille d'affiche — et seulement ceux-là
Titre de page (H1), nom cérémoniel, **date retenue**, **date d'un ticket**, chiffres des compteurs, numéro de la rosette, titre de modale. **Jamais** : texte courant, libellés de champ, boutons, méta, listes.
Pas de capitales, pas d'espacement de lettres sur l'affiche. Le sur-titre en capitales espacées est **supprimé** du système.

### 2.3 Échelle (fluide, rem)
| Token | Taille | Interligne | Usage |
|---|---|---|---|
| `--t-xs` | 0,8125 (13) | 1,4 | méta, aide, compteur |
| `--t-sm` | 0,9375 (15) | 1,45 | listes, sous-titres de ligne |
| `--t-md` | 1 (16) | 1,5 | texte courant, champs |
| `--t-lg` | 1,1875 (19) | 1,4 | chapô (`.lede`) |
| `--d-sm` | `clamp(1.375rem,1.25rem + .6vw,1.625rem)` | 1,1 | date de ticket, nom en liste |
| `--d-md` | `clamp(1.875rem,1.5rem + 1.8vw,2.5rem)` | 1,05 | H1 des pages, nom cérémoniel |
| `--d-lg` | `clamp(2.75rem,2rem + 3.5vw,4.5rem)` | 0,98 | date retenue, titre d'accueil |
Libellé (`.eyebrow`, `.lbl`) : Manrope 800, 0,875 rem (14), casse de phrase, couleur `--text-2`, **aucun** tracking.
Bouton : Manrope 800, 1 rem (16, 17 pour le principal). Chiffres : `font-variant-numeric: tabular-nums` pour heures et compteurs en Manrope ; Abril en chiffres alignés par défaut.
Longueur de ligne : texte ≤ `62ch`, champs ≤ `40ch`. `text-wrap: balance` sur display, `pretty` sur chapôs. Césure manuelle uniquement. Accents et ligatures (œ) : Abril Fatface couvre le latin ; vérifier « Manœuvre » dans le rendu.

---

## 3. Mise en page

### 3.1 Grille et largeurs
- Base d'espacement **4 px** : `--s-1…8 = 4, 8, 12, 16, 24, 32, 48, 64`.
- Gouttière : 16 px (< 400), 20 px (≥ 400), 32 px (≥ 640).
- Colonne de lecture : `min(100% , 36rem)` centrée de 400 à 959 px.
- Large (≥ 960 px) : `--page-max: 72rem`, grille 12 colonnes, `column-gap: 32px`.
- Distance entre sections : 32 px (`--s-6`) ; dans une section : 16 px. Bande façade : padding vertical 24-32 px.

### 3.2 Points de rupture
`≥ 640` : gouttières 32, formulaire de créneau 3 champs en ligne. `≥ 960` : coque large (navigation en en-tête, grille deux colonnes sur l'invitation et l'accueil). Pas d'autre rupture. Aucune dépendance à la largeur de l'écran < 320.

### 3.3 Hiérarchie petit écran (invitation, ordre DOM = ordre de lecture)
1 auvent + bande d'en-tête (retour, libellé) → 2 nom de l'apéro et description → 3 **verdict** (bande façade pleine largeur) → 4 formulaire de réponse (tickets) → 5 contre-proposition → 6 registre → 7 partage → 8 suppression. Sur mobile, **un résumé du verdict** ouvre la page et la **réponse** suit immédiatement ; le bouton « Répondre » est le seul rouge.
Large : colonne principale (7/12) = en-tête, verdict, formulaire, contre-proposition ; colonne latérale (5/12, `position: sticky; top: 24px`) = registre, partage, suppression.

### 3.4 Safe areas
Barre du bas : `padding-bottom: calc(8px + env(safe-area-inset-bottom))`. Contenu : `padding-bottom` = hauteur de barre + safe area, de sorte que rien ne soit masqué. Auvent : `padding-top: env(safe-area-inset-top)` sur la bande façade.

### 3.5 Densités par usage
Enseigne/verdict : aérée (24-32 px de padding). Tickets : 16 px. Registre : lignes de 56 px (cible tactile ≥ 44). Carnet de notifications : 16 px, titre + 2 lignes. Palmarès : rosettes 56 px.

---

## 4. Surfaces

- **Pas de cartes.** Une section = un bloc sur le fond, séparé par un **filet pointillé** `1px dashed var(--rule)` et de l'espace. Exceptions nommées : ticket, façade (verdict, enseigne), modale, menu d'ouverture de cartes, champ.
- **Rayons (3 valeurs, pas plus)** : `--r-1: 4px` (tout contrôle, ticket, panneau, carte) ; `--r-arch: 999px 999px 6px 6px` (compteurs, fenêtre cintrée de l'accueil, ouverture du palmarès) ; `--r-pill: 999px` (puce blaze, badge de notification, tag « Toi », « En tête »).
- **Bordures** : champs et talons 2 px `--control-border` ; façade sans bordure ; modale 3 px `--ink-900` ; filet de section 1 px pointillé.
- **Élévation (réelle seulement)** : E0 à plat (tout). E1 « presse » : bouton principal `box-shadow: 0 3px 0 var(--red-700)`, enfoncé `0 1px 0` + `translateY(2px)`. E2 : modale et menu `box-shadow: 0 6px 0 rgb(36 26 18 / .22)` + fond de modale `rgb(10 36 27 / .78)` **sans flou**. Aucune autre ombre ; pas de `backdrop-filter`.
- **Textures** : aucune (pas de grain). Le papier est un aplat.
- **Transparence** : uniquement le voile de modale.
- **Images** : l'illustration `Le-zinc.jpg` n'apparaît que dans la **fenêtre cintrée** de l'accueil (`object-fit: cover`, `object-position: 62% 72%`, hauteur 200-260 px, bordure 3 px `--forest-800`). Texte alternatif : `alt=""` (décorative, le nom est dans le titre). Pas d'image plein cadre.
- **Auvent** (`.canopy`) : élément de 30 px, rayures `--red-600` / `--ivory-50` de 28 px, bas festonné (rayon 14 px) en `radial-gradient`, posé **sur la bande façade** (le sombre derrière fait lire les festons). Statique, `aria-hidden`, répété en haut de toute page.
- **Rangée d'ampoules** (`.bulbs`) : 12 ampoules (Ø 10 px, espacement 12 px) en `--pastis-300` avec un halo `0 0 0 2px --pastis-400` ; fond façade ; décorative (`aria-hidden`).
- **Ticket** (`.slot`) : fond `--paper`, `--r-1`, encoches circulaires (Ø 14 px) au milieu des bords gauche et droit réalisées par `mask`, filet intérieur pointillé entre calendrier et corps ; coin supérieur gauche : calendrier-feuille (jour en `--d-sm` Abril, mois en Manrope 800).

### 4.1 Iconographie
SVG en ligne, 24×24, trait 2,25, extrémités rondes, `fill: none`, `currentColor` (aucun emoji, aucun fichier de pictogramme tiers). Composant `src/components/Icon.tsx`. Jeu : `back, check, maybe, close, bell, calendar, rosette, home, pin, share, copy, chevron, plus`. Taille 20 (inline) ou 24. Bouton icône seul : cible 44×44 et `aria-label`. Les glyphes de vote : ✓ (`check`), `maybe` (point d'interrogation à bout rond), ✕ (`close`).
Marque : `WineGlassMark` (Lottie, existante) conservée ; animation lancée seulement hors `prefers-reduced-motion` (le premier cadre reste visible).

---

## 5. Composants — inventaire et correspondance avec le code

Notation d'états : **R**éel · **H**over · **F**ocus · **A**ctif · **D**ésactivé · **C**hargement · **E**rreur · **V**ide · **O**verflow.

| Composant | Fichier(s) | Rôle et variantes | États et notes |
|---|---|---|---|
| Auvent + bande d'en-tête | `MobilePage.tsx`, nouveau `PageHeader.tsx` | Auvent + façade ; variantes : *marque* (accueil/premier niveau : marque Lottie + nom court + puce blaze) et *retour* (flèche + libellé de page) | R F ; titre tronqué en 1 ligne `text-overflow: ellipsis` |
| Navigation de premier niveau | nouveau `TabBar.tsx`, remplace `BrandMenu.tsx` | 4 destinations : Comptoir (`/`), Agenda, Carnet (`/notifications`, avec badge), Palmarès. Mobile : barre fixe en bas, 4 cases ≥ 44 px, icône + libellé 13 px. ≥ 960 : horizontale dans l'en-tête. `aria-current="page"` | R H F A ; badge en `--r-pill` rouge, chiffre ivoire 700 (existant `.notif-badge`, `.notif-bell` conservés pour les tests) |
| Puce blaze | `PageHeader.tsx` | Affiche le blaze, ouvre « Changer de blaze » (`requestComptoirNameEdit`) ; `aria-label="Changer de blaze (actuellement …)"` | O : nom tronqué à 14 caractères visibles |
| Bouton | `.button` | `primary` (rouge, ombre dure), `ghost` (papier + bordure encre 2 px), `danger` (rouge foncé), `block` ; hauteur 48 px (52 pour primaire) | R H (fond +1 cran) F A D (`--disabled-*`, `cursor: wait` en C) ; libellé en C : texte « …ing… » existant |
| Lien discret | `.ghost-link` | action secondaire textuelle, soulignée, `--link` ; variante `--danger` | R H F |
| Champ | `.field`, `input`, `textarea` | papier, bordure 2 px, `--r-1`, hauteur 48, label 14/800 au-dessus ; `placeholder` `--ink-500` | F : anneau 3 px + décalage 2 px ; E : bordure `--red-700` + message ; D ; O : défilement horizontal interdit |
| Date / heure natifs | `.slot__fields` | inchangés (natifs) mais habillés comme les champs | |
| Champ lieu | `LocationField.tsx` | suggestions en liste papier E2, option 56 px, nom + adresse ; bascule « pointer sur la carte » ; adresse choisie affichée | V : aucune suggestion → rien ; liste fermée par Échap ; `role=combobox` conservé |
| Carte de pointage | `LocationPickerMap.tsx` | fenêtre papier 4 px de bordure encre | tuiles hors ligne : fond `--bg-sunken` |
| Ticket de vote | `EventOptionMobileCard.tsx` (`.slot`) | calendrier-feuille, lieu (`.slot__p`), lien carte, note, tag « En tête » (pilule jaune, texte encre), talons | R F ; « proposé par X » dans la même ligne que le lieu ; O : lieu sur 2 lignes max |
| Talons de réponse | `VoteSegmentedControl.tsx` (`.seg`) | 3 radios visuellement masqués : « J'y serai » (✓, `--vote-yes`), « J'me tâte » (maybe, `--vote-maybe`), « Sans moi » (✕, `--vote-no`). Chaque talon : glyphe + libellé, 48 px | non choisi : papier + bordure ; choisi : fond de rôle + glyphe plein + poinçon (§6) ; F : anneau sur le talon ; D : opacité .55 |
| Verdict (panneau) | `MobileResultsPanel.tsx` (`.verdict`) | bande façade pleine largeur ; ampoules ; libellé ; date en `--d-lg` `--pop` ; lieu ; message ; 3 compteurs à arche ; carte ; jauge récap. 3 états : *gagnant* (ampoules en chasse), *égalité* (ampoules fixes, libellé « Plusieurs options en lice »), *attente* (ampoules éteintes, message) | chargement : aucun (le verdict est calculé) ; O : date sur 2 lignes (jour/heure) |
| Compteur | `.cnt` | arche, chiffre Abril 32 px `--pop`, libellé 13 px `--on-facade-2` | V : chiffre `0` |
| Mini-carte | `MiniMap.tsx` | fenêtre carte 160 px, bordure 3 px `--pop`, `--r-1` ; adresse (bouton menu) + « Agrandir la carte » (ghost sur façade) ; modale carte | tuiles hors ligne : fond `--forest-700` |
| Menu d'ouverture de cartes | `OpenInMapsButton.tsx` | panneau papier E2, options 48 px, `role=menu` conservé | |
| Jauge Traquenard | `TraquenardGauge.tsx` | 10 ampoules + libellé + valeur ; version récap (lecture seule, `role=img` + `aria-label`) et interactive (`input[type=range]` natif transparent par-dessus, **conservé** : clavier, `aria-valuetext`) ; ampoule allumée selon la valeur, couleur par `traquenardColor` mais **jamais seule** : le texte « 5/10 · Ça sent le traquenard » reste | V : « Personne n'a encore répondu » (ampoules éteintes) |
| Registre | `ParticipantList.tsx` (`.people`, `.person`) | ligne : pastille d'initiales ronde (encre sur `--pastis-300`), nom (700), « apporte » (15), citation (italique). Repli « Voir qui hésite ou décline (N) » (`aria-expanded`) | V : phrases existantes |
| Partage | `MobileShareBox.tsx` | « Partager l'invitation » (primaire), lien masqué en `code` + « Copier » | feedback `role=status` |
| Notification (ligne) | `NotificationsPage.tsx` (`.notif-item`) | bouton pleine largeur sur papier, titre 700, corps, heure ; non lu : liseré rouge 4 px à gauche **+** point **+** libellé « non lue » masqué visuellement (texte SR) | H F A ; V : phrase existante |
| Breloque / rosette | `BadgeMedal.tsx` | rosette SVG (disque + 2 rubans) 56 px ; couleurs par rareté : *common* `--forest-700`, *rare* `--blue-600`, *legendary* `--pastis-400` (encre), *shame* `--red-600` ; nom 700, description 15 ; la rareté est aussi dite en texte SR | |
| Modale | `.modal-backdrop`, `.modal-sheet` | papier, bordure 3 px encre, E2, rangée d'ampoules **statiques** en tête ; titre en Abril `--d-sm` ; boutons empilés ; `role=dialog`, `aria-modal`, `aria-labelledby` | piège à focus : à ajouter (focus initial sur le premier bouton, retour au déclencheur) ; Échap ferme les modales non destructives |
| Retour d'information | `.feedback`, `.page-message` | bloc texte avec filet gauche 4 px (`--success`/`--danger`/`--warning`) + glyphe ; `role=status|alert` | |
| Chargement | `LoadingScreen.tsx` | 3 ampoules séquencées + titre + sous-titre | `role=status` |
| Enseigne d'accueil | `HomePage.tsx` | façade : titre `--d-lg`, chapô, fenêtre cintrée, CTA primaire, aide | |
| Onboarding | `components/onboarding/*` | même enseigne que l'accueil (sans nav) ; dialogue de confirmation = modale | |
| Navigation retour | `MobileHeader.tsx` | bouton icône 44 px + libellé de page | |

---

## 6. Grammaire d'animation (mécanique de foire)

**Intention** : le mouvement *signale une mécanique* (une ampoule s'allume, un ticket est poinçonné), jamais une atmosphère. Tout ce qui est du formulaire, du texte, de la carte ou des listes **ne bouge pas**.

### 6.1 Familles
| Effet | Déclencheur | Propriétés | Durée / courbe | Origine / direction | Interruption |
|---|---|---|---|---|---|
| **Poinçon** (talon de vote) | sélection d'un talon | `transform: scale` 0,94 → 1,03 → 1 ; glyphe `opacity`/`scale` | 180 ms, `--ease-snap` `cubic-bezier(.3,1.6,.5,1)` | centre du talon | une nouvelle sélection relance |
| **Ampoules du verdict** | affichage d'un verdict *gagnant* | `opacity` .35 ↔ 1, 1 ampoule sur 3 en décalage (`animation-delay` = `(i mod 3) × 400 ms`) | cycle 1,2 s, `steps(2,jump-none)`, **5 itérations puis fixe allumé** | gauche → droite | s'arrête seul ; `animation-play-state: paused` hors écran non requis (court) |
| **Jauge** | changement de valeur (curseur, ou affichage initial) | `opacity` + `transform: scale(.8→1)` par ampoule | 160 ms par ampoule, décalage 24 ms × index **uniquement à la montée** | bas → haut de l'échelle (gauche → droite) | la valeur suivante écrase |
| **Entrée de page** | montage d'une route | `opacity` 0 → 1 + `translateY(8px → 0)` sur `.page__body` | 240 ms, `--ease-out` `cubic-bezier(.2,.7,.2,1)` | bas → haut | aucune (une fois) |
| **Presse** (bouton primaire) | `:active` | `transform: translateY(2px)` + ombre 3 px → 1 px | 80 ms | vers le bas | immédiat |
| **Chargement** | `LoadingScreen` | 3 ampoules `opacity` séquencées | 900 ms, `ease-in-out`, boucle | gauche → droite | s'arrête au démontage |
| **Menu/panneau** (suggestions, menu carte) | ouverture | `opacity` 0 → 1 | 120 ms | — | — |
Budget : uniquement `transform` et `opacity` (compositeur). Aucune animation de `width/height/top/left/box-shadow`. Au plus 12 éléments animés simultanément. Aucune boucle infinie hors chargement.

### 6.2 Seuils, repli, mouvement réduit
- Mobile : pas de seuil séparé (tout est léger).
- `@media (prefers-reduced-motion: reduce)` : **tous** les effets §6.1 sont coupés ; états finaux affichés immédiatement ; ampoules du verdict **fixes allumées** ; jauge sans décalage ; le poinçon se réduit à un changement de couleur instantané ; `WineGlassMark` n'est plus lancé.
- Repli sans JavaScript : sans objet (SPA) ; sans CSS animé, l'état final est l'état de base (les `@keyframes` ne portent que le chemin).
- **Ce qui ne bouge pas** : champs, labels, listes, registre, carnet, textes, cartes Leaflet, bouton partage, auvent, barre de navigation.

---

## 7. Contrats par écran

| Écran | Tokens et variantes employés | Exceptions justifiées |
|---|---|---|
| Accueil | bande façade (auvent + marque), enseigne `--d-lg`, fenêtre cintrée, bouton primaire, barre de navigation (Comptoir actif) ; ≥ 960 : deux colonnes (texte | fenêtre) | l'illustration n'existe que là |
| Onboarding | enseigne + champ + bouton primaire + modale de confirmation ; pas de barre de navigation | pas de navigation tant que le blaze n'est pas gravé |
| Création | bande façade (retour), H1 `--d-md`, champs, ticket-de-créneau en variante *brouillon* (sans calendrier ; champs jour/heure/lieu), « + Ajouter un créneau » en ligne pointillée, bouton primaire | `slot__x` retire un créneau : bouton icône 44 px |
| Invitation | bande retour → nom → **verdict (façade)** → tickets → contre-proposition → registre → partage → suppression | le verdict est pleine largeur (casse la colonne) |
| Invitation (erreur/lecture seule) | H1 + chapô + bouton ghost ; lecture seule : tickets en lecture sans talons | pas de verdict si aucun apéro chargé |
| Agenda | bande retour/marque ; liste d'apéros en **sections** (nom `--d-md`, créneaux en lignes de ticket compactes, « En tête », « Voir l'apéro » ghost, jauge récap) ; vide : phrase + bouton primaire | barre de navigation (Agenda actif) |
| Notifications | lignes papier (variante *non lue*) ; offre d'autorisation système en section ; actions « Vider le carnet » / « Tout marquer comme lu » (ghost-link) | barre de navigation (Carnet actif, badge) |
| Palmarès | membres en sections ; rosettes ; tag « Toi » | barre de navigation (Palmarès actif) |
| Modales | papier + bordure 3 px + ampoules statiques | — |
| Chargement | 3 ampoules | — |

---

## 8. Règles d'implémentation et d'acceptation

**Migration sans second système** : les classes de l'ancien CSS sont **remplacées**, pas recouvertes ; à la fin, aucune occurrence de `backdrop-filter`, `screen-overlay`, `--app-background-image`, `rgba(255, 247, 230`, ni de `text-transform: uppercase` combiné à `letter-spacing` dans `global.css` (contrôle `grep`). Classes de repère conservées : `.notif-badge`, `.notif-bell`, `.notif-list`, `.slot`, `.vote-form`, `.field--wide`, `.share code`, `.person__name`.
**Contrôles** : (1) contraste : script Python de la §1.4 ré-exécuté sur les tokens finaux ; (2) responsive : 320 / 390 / 1280, `document.documentElement.scrollWidth <= innerWidth` sur chaque écran ; (3) mouvement réduit : captures sous `reducedMotion: 'reduce'` et vérification `getAnimations().length === 0` hors chargement ; (4) clavier : parcours Tab sur accueil, création, invitation (focus visible, ordre logique, Échap) ; (5) réseau dégradé : polices bloquées → rendu avec repli lisible, pas de saut de mise en page > 2 % (mesure CLS dans le navigateur) ; (6) thème sombre : captures de chaque écran ; (7) `npm test`, `npm run build`, `npm run test:functional`.
**Dégradation réseau** : polices `display=swap` ; l'illustration est un asset local ; aucune dépendance externe nouvelle.


---

## 9. Amendements « as-built » (après rendu)
- **Ampoules** : 24 éléments par rangée ; < 960 px les 12 premières seulement (`nth-child(n+13)`), ≥ 960 px les 24. Chasse : `animation-delay = (index mod 3) × 400 ms`, 1,2 s, `steps(2)`, 5 itérations.
- **Façade, thème sombre** : reste `--forest-800` ; fond `#071b14`, creux `#04120d` (la hiérarchie sombre/clair ne s'inverse pas).
- **`.page__body`** : animation d'entrée en `fill-mode: backwards` — jamais `both`/`forwards` : un `transform` résiduel casse tout descendant `position: fixed` (modales).
- **Composants ajoutés** : `Icon`, `Bulbs`, `SlotLeaf` (calendrier-feuille), `BrandBar`, `TabBar`, `Dialog` (+ hook `useDialogFocus`). Supprimés : `BrandMenu`, `NotificationBell`.
- **`MobilePage`** : props `header`, `hero`, `nav` ; ne rend pas `<main>` quand `children` est `null` (chargement dans l'enseigne, sans décalage de mise en page).
- **Bouton `button--facade-ghost`** : action secondaire sur la façade (bordure ivoire, pas de remplissage). **`button--on-facade`** : action principale sur la façade (pastis). Le rouge ne sert plus d'action que sur le papier.
- **Jauge** : zones d'ampoules par position (1-4 froid, 5-7 tiède, 8-10 chaud) via `--bulb-cold|warm|hot`, redéfinis par contexte (façade/papier/sombre) ; `traquenardColor` reste exporté et testé, mais n'est plus utilisé par le rendu.
- **Cibles** : un lien d'adresse dans un ticket garde son agencement mais obtient une zone de 44 px par marge négative (`margin-block: -8px`).
