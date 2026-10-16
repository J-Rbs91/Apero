# UXER_REDESIGN_CONTRACT — « Point Jaune »

Mission `manifesto-void`. Direction : Japanese Ma × Typographic Manifesto × Data Sublime,
interprétation **A — Monumental Silence** (voir `UXER_CONCEPT_EXPLORATION.md`).
Ce contrat est **opposable à l'implémentation**. Il ne vaut pas approbation du
propriétaire : il est signé par l'agent de refonte, sur la direction imposée par la mission.

Documents liés : `UXER_DESIGN_SYSTEM.md` (valeurs), `UXER_MOTION_SYSTEM.md` (mouvement).
Ils remplacent `docs/uxer/refonte-contract.md` et `docs/uxer/design-system.md`
(Fairground Baroque), qui deviennent historiques.

---

## 1. Intention artistique

> **Un point jaune dans le silence.**
> La Confrérie se réunit pour presque rien, avec une gravité monumentale. L'interface est
> un espace noir, mesuré, presque vide, où la typographie prend la parole comme une
> architecture, où les réponses de la tablée deviennent une matière calculée, et où un
> seul point jaune, le Petit Jaune, désigne ce qui compte : ce qu'on choisit, ce qui
> l'emporte, ce qu'il faut faire.

Trois sensations, par ordre d'apparition dans un parcours : **le silence** (l'espace est
maîtrisé), **la déclaration** (le nom de l'assemblée, le verdict, sont proclamés),
**le sublime** (la tablée se matérialise en champ de signes exacts).

## 2. Principes non négociables

| # | Principe | Vérification |
|---|---|---|
| P1 | **Un seul signal jaune** par zone de lecture : action principale, élément choisi en tête, verdict, focus. Jamais en décor, jamais en fond de section | revue des usages de `--jaune` (design system §1.4) |
| P2 | **Le vide est une structure** : l'espace entre deux blocs dit leur relation (proche = même chose, loin = autre chose). Aucune carte, aucune ombre douce, aucun fond de section pour séparer | profondeur de surface ≤ 1 hors couches (menu, modale, feuille, barre d'action) |
| P3 | **Un signe = une donnée** : tout motif computationnel est calculé à partir d'une donnée réelle de l'écran, documentée ; sans donnée, pas de motif | inventaire §8 du design system |
| P4 | **La radicalité typographique est réservée aux moments d'identité** : titres d'écran, nom de l'assemblée, verdict, chiffres de rétrospective. Le texte fonctionnel reste à 16 px, chasse normale | revue des usages de `--w-manifest` |
| P5 | **La tâche d'abord** : sur tout écran portant une tâche, le titre monumental et la première action tiennent dans le premier écran mobile (390 × 844) | captures « coup d'œil » §15 |
| P6 | **Belle sans mouvement** : la composition statique (mouvement réduit) est une version complète, pas un repli appauvri | captures `reduced` |
| P7 | **Aucun texte réécrit** : la voix du comptoir est intacte ; aucune tournure du corpus gelé ne bouge | `verifier-ton.py` = 0, diff des textes |

## 3. Identité de marque

- **Nom** : « La Confrérie du Petit Jaune », court « La Confrérie » (inchangés).
- **Marque** : le **point jaune** (un disque plein, `--jaune`), seul ou suivant « La Confrérie »
  comme un point final. Il remplace le verre animé dans les en-têtes (`BrandMenu`,
  onboarding). Le verre Lottie **reste dans l'écran d'ouverture** : c'est l'unique objet
  figuratif de l'univers, et la plaisanterie de l'ouverture (« Le rouge, le jaune… la
  cohérence de la charte graphique a le cul entre deux chaises ») devient encore plus
  vraie face à un système strictement noir, ivoire et jaune. Aucun texte n'est modifié.
- **Signature d'assemblée** : chaque apéro et chaque tablée reçoit une bande binaire
  déterministe calculée à partir de son **identifiant public** (jamais des clés `k`/`w`).
  Même identifiant, même signature, sur tous les écrans.
- **Voix** : inchangée (corpus de 25 tournures, vocabulaire protégé, tutoiement, point
  médian ponctuel, aucun tiret cadratin visible).

## 4. Logique de composition

Une **grille technique** sous-jacente (4 colonnes mobile, 8 tablette, 12 bureau) que la
composition transgresse volontairement par **décalages asymétriques** (titres débordant
vers la gauche de la colonne de contenu, champs de données ancrés à droite).

Cinq archétypes, choisis par écran (table §10) :

| Archétype | Rôle | Règle |
|---|---|---|
| **Silent Frame** | Une information principale, beaucoup de vide | ≤ 3 éléments dans le premier écran ; respiration monumentale au-dessus du titre |
| **Manifesto Frame** | Un titre monumental domine des informations secondaires | titre `--t-manifest`, métadonnées en monospace 12 px collées dessous |
| **Data Field** | Une structure computationnelle occupe une zone précise | une seule par écran, ancrée sur la grille, avec sa légende textuelle |
| **Editorial Split** | Expression à gauche, fonction à droite (bureau) | colonnes 1-5 / 7-12, la gouttière vide de 1 colonne est le *ma* |
| **Dense Information** | Tâche rapide (vote, création, listes) | rangées séparées par filets, rythme serré interne, large entre unités |

## 5. Hiérarchie typographique

Une famille grotesque à **axe de chasse** (Archivo, 62 % à 125 %) pour tout le texte, une
monospace (Fragment Mono) pour les données. La chasse est l'outil d'expression :
**étroite = déclaration**, **normale = lecture**. Rôles, tailles et valeurs : design
system §2. Aucun texte < 12 px. Aucune capitale systématique : les surtitres deviennent
des **légendes monospace en casse de phrase**.

## 6. Système colorimétrique

Sombre par défaut (`color-scheme: dark`), monochrome noir / gris / ivoire, avec **une**
couleur identitaire (`--jaune #D7AB42`) et trois couleurs d'état distinctes du jaune
(succès, erreur, avertissement). L'**inversion ivoire** (`--paper`) est réservée aux
moments rituels (dialogues de confirmation) et au document long (registre légal).
Le thème clair séparé est supprimé : l'inversion ivoire en tient lieu là où elle a un sens.
Valeurs et contrastes mesurés : design system §1.

## 7. Règles d'espacement

Échelle de 4 à 224 px en trois registres : **micro** (4-12, à l'intérieur d'un composant),
**fonctionnel** (16-32, entre éléments d'une même unité), **ma** (48-224, entre unités et
avant les déclarations). Règle de regroupement : l'écart entre deux unités vaut **au moins
le double** de l'écart interne d'une unité (créneaux, personnes, notifications).

## 8. Composants

Tous les composants existants sont conservés avec leur sémantique, leurs props et leurs
classes. Ils sont redessinés selon le design system §5 : angles vifs (rayon 0) sauf le
point et les pastilles circulaires ; traits de 1 px ; contrôles ≥ 44 px ; états
(normal, survol, focus, actif, désactivé, chargement, erreur) explicites.

Composants **nouveaux** (présentation pure, `aria-hidden`, sans logique métier) :

| Composant | Rôle | Données |
|---|---|---|
| `PointMark` | Marque : le point jaune | aucune |
| `Signature` | Bande binaire d'une assemblée | hachage FNV-1a de l'identifiant public |
| `VoteField` | Champ de données du verdict (canvas 2D) | matrice créneaux × convives × réponse, créneau en tête |
| `ComptoirField` | Constellation de l'accueil (canvas 2D) | apéros connus de l'appareil : date, nombre de réponses, prochain |
| `SignalField` | Champ d'émergence de l'écran d'ouverture (canvas 2D) | aucune donnée : motif de rituel, statique en mouvement réduit |

Composants **remplacés visuellement** : `Bulbs` (ampoules → bande de signal),
`TraquenardGauge` (ampoules → barres de niveau croissantes), `BadgeMedal` (rosette →
glyphe géométrique), `LoadingScreen` (ampoules → trois points en déphasage).
L'auvent (`.canopy`) et la fenêtre illustrée de l'accueil sont **retirés**.

## 9. Navigation

**Inchangée** dans son comportement (contrat `docs/NAVIGATION.md`, 23 tests) : couche de
menu dans l'historique, cloche, bouton retour sur toute page intérieure, arbre unique.
Redessinée : en-tête sans fond, légende monospace de l'écran, boutons carrés de 44 px au
trait ; panneau de menu en colonne noire pleine hauteur sur mobile, ancré à droite sur
bureau ; entrées en grotesque large (chasse 100 %, 20 px).

## 10. Écrans (archétype, moment identitaire)

| Écran | Archétype | Moment |
|---|---|---|
| Écran d'ouverture | Silent Frame → Manifesto | **M1 — Signal Emergence** : un champ de points, un point jaune émerge, le nom se déclare |
| Onboarding blaze | Silent Frame | **M2 — Rituel** : la confirmation « grave ça dans le zinc » en inversion ivoire, le blaze en monumental |
| Onboarding notifications | Silent Frame | — |
| Accueil | Manifesto Frame + Data Field | **M3 — Constellation** : les apéros de l'appareil, le prochain en jaune ; un seul point jaune si aucun (le récipient vide) |
| Apéro `/invite` | Manifesto (en-tête) → Data Field (verdict) → Dense (vote) | **M4 — Verdict** : la matrice réelle converge, le créneau retenu s'allume en jaune, la date se proclame |
| Organiser | Dense ; Editorial Split sur bureau | — |
| Au programme | Dense (rangées à chiffre de jour monumental) | signatures d'assemblée |
| Notifications | Dense | — |
| Rétrospective | Manifesto (chiffres monumentaux) | — |
| Palmarès | Dense | — |
| Tablées, tablée | Manifesto + Dense | signature de tablée |
| Sauvegarde | Silent Frame | — |
| Registre légal | Document en inversion ivoire | — |
| Erreurs, lien cassé, chargement | Silent Frame | — |

L'ordre des blocs de chaque écran est **inchangé**.

## 11. Motion design

Grammaire en six familles (Typographic Reveal, Signal Emergence, Data Convergence, Density
Shift, Spatial Transition, Quiet Feedback), courbes et durées tokenisées, aucune animation
bloquante, coupure complète en mouvement réduit. Détails : `UXER_MOTION_SYSTEM.md`.

## 12. Règles responsive

Deux compositions **distinctes**, pas un empilement : mobile en colonne rythmée avec
titres occupant jusqu'à 40 % du premier écran sur les écrans sans tâche urgente ; bureau en
Editorial Split asymétrique. Formats vérifiés : 320, 360, 390, 768, 1024, 1440, 1920.
Aucun débordement horizontal ; noms longs coupés proprement (`overflow-wrap`, césure
française) sans masquer d'information ; cibles ≥ 44 × 44 px.

## 13. Accessibilité (WCAG 2.2 AA sur le périmètre modifié)

Texte ≥ 4,5 : 1, grands textes et composants ≥ 3 : 1 (mesurés, design system §1.3) ; focus
3 px jaune sur noir, noir sur ivoire ; aucun état porté par la couleur seule (glyphes :
plein / hachuré / vide, textes d'état) ; tous les motifs computationnels `aria-hidden` avec
leur information déjà présente en texte ; aucun clignotement > 3 Hz ; `prefers-reduced-motion`
respecté en CSS **et** dans chaque canvas ; zoom 200 % sans perte.

## 14. Performances

Aucune dépendance npm ajoutée. Polices auto-hébergées (Archivo variable latin + latin-ext,
Fragment Mono latin + latin-ext) ; Manrope et Abril Fatface retirées. Canvas : un seul
animé à la fois par écran, `requestAnimationFrame` suspendu hors champ
(`IntersectionObserver`) et onglet masqué, animation finie (pas de boucle infinie hors
écran d'ouverture), rendu `devicePixelRatio` plafonné à 2. CSS livré : objectif ≤ 74 ko
(référence `main` : 73,96 ko). `lottie-web` reste (écran d'ouverture uniquement, chunk
paresseux inchangé). Illustrations `Le-zinc.jpg` et `mur-vert.jpg` supprimées du dépôt
(plus aucune référence) ; leurs crédits retirés de `CREDITS.md`.

## 15. Critères de validation

| # | Critère | Méthode |
|---|---|---|
| V1 | Tous les tests passent sans assertion retirée | `npm test`, `npm run test:functional`, `npm run test:nav`, `git diff tests/` |
| V2 | Aucun texte modifié | `git diff` des littéraux JSX ; `verifier-ton.py` = 0 ; texte décoratif nouveau uniquement en `aria-hidden` |
| V3 | Coup d'œil des parcours P1 à P6 (390 × 844) | captures du premier écran inspectées |
| V4 | Un seul bouton plein par écran (écarts préexistants non aggravés) | comptage automatique des `.button--primary` visibles |
| V5 | Aucun débordement horizontal, 320 → 1920 | `scrollWidth - clientWidth = 0` sur tous les écrans capturés |
| V6 | Cibles ≥ 44 px | mesure automatique |
| V7 | Contrastes | calcul sur les jetons + vérification sur captures |
| V8 | Mouvement réduit | captures sous émulation + `document.getAnimations()` vide hors ouverture |
| V9 | Identité tenue (test de substitution) | trois écrans ordinaires (`/agenda`, `/create`, `/registre-legal`) identifiables comme le même produit sans leur nom |
| V10 | Pas de nouvelle dépendance, poids maîtrisé | `git diff package.json` vide ; taille CSS et polices mesurées |

## 16. Interdictions stylistiques (motifs de rejet)

Dégradés (sauf la rampe de hachure fonctionnelle), verre dépoli, ombres floues, halos,
néons, grilles bento, cartes arrondies, pastilles colorées décoratives, emoji, icônes de
remplissage, faux terminal (chemins `a/b/c`, curseur clignotant, pluie de chiffres),
HUD, violet/bleu par réflexe, particules sur plusieurs écrans, texte immense partout,
capitales systématiques, titres coupés arbitrairement, hero centré titre + sous-titre +
deux boutons, jaune en aplat de section, plus d'un motif computationnel animé par écran.

Checkpoint : **CONTRACT_LOCKED**.
