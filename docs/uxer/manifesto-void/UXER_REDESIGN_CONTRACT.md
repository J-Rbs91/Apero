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
  onboarding).
- **Le verre de l'ouverture** (révision du 16/10/2026, à la demande du propriétaire) :
  l'emoji animé de Google est remplacé par un verre **dessiné en trame de points**
  (`GlassField`), dans la même grammaire que le champ des votes ; il se remplit du
  Petit Jaune. `lottie-web` et l'animation Noto sont retirés du dépôt.
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
(référence `main` : 73,96 ko). `lottie-web` reste dans un premier temps (écran d'ouverture uniquement, chunk
paresseux inchangé). Illustrations `Le-zinc.jpg` et `mur-vert.jpg` **conservées dans le
dépôt** (actifs du propriétaire) mais plus importées : absentes du site publié ;
`CREDITS.md` le signale.

**Seul texte d'interface modifié** : la liste des crédits du registre légal, pour rester
exacte (polices Archivo et Fragment Mono à la place de Manrope ; ligne des images
d'ambiance retirée puisqu'elles ne sont plus affichées). C'est une correction
d'exactitude juridique, pas une réécriture de voix.

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

---

## 17. Avenant du 18/10/2026 — « La Verrerie » et l'encre inversée

Mission `verrerie` (`.uxer/runs/verrerie/`). Deux demandes du propriétaire, avec un
croquis : une bouteille de vin, géante et inclinée, qui traverse le manifeste et le
bouton de l'accueil.

1. Garnir le fond de **silhouettes de verrerie** (bouteille de vin, verre à pied, flûte,
   pinte nonic) et garder le texte lisible par **inversion de couleur** du texte
   (*difference blending*, *inverted typography*, *adaptive contrast typography*).
2. Supprimer l'**écart de taille perçu** entre un texte sur fond foncé et le même texte
   sur fond clair.

Cet avenant est opposable comme le reste du contrat. Il est signé par l'agent sur la
demande du propriétaire. Statut de preuve : `RENDER_INSPECTED` sur spécimen
(`specimens/verrerie.html`, captures `evidence/verrerie-*.jpg`),
`VISUAL_UNVERIFIED` dans l'application, qui n'est pas encore modifiée.
Valeurs implémentables : design system §10 et §2.4.

### 17.1 Intention

> **Le comptoir projette ses verres dans le silence. Là où une silhouette passe, la
> déclaration s'inverse.**

La Verrerie n'ajoute ni couleur, ni matière, ni texture. Elle étend à l'échelle de
l'écran une opération que Point Jaune possède déjà : **l'inversion ivoire** (la
sélection, les rituels). Deux valeurs seulement, `--void` et `--ivory`. Un texte qui
traverse une silhouette passe d'ivoire sur noir à noir sur ivoire, au pixel près
(mesuré : `#F3F1EA` sur `#090B0D` → `#090B0D` sur `#F3F1EA`, 17,4 : 1 des deux côtés).

**Place dans le budget d'expression.** L'écart principal reste typographique (la chasse).
La Verrerie est une composante expressive **subordonnée** : sa seule relation avec le
reste du système est l'inversion du titre monumental qu'elle traverse. Régime éditorial
sur les écrans d'identité, régime contenu partout ailleurs (§17.4). Épreuve de
soustraction : sans Verrerie, Point Jaune reste entier ; avec, le manifeste gagne un
second plan. Elle ne porte donc rien d'indispensable, et c'est voulu.

**Meilleur argument contre.** Le figuratif contredit le *ma* et P3, et glisse vers le
bar à thème. Réponse tenue par les règles : silhouettes plates et géométriques, sans
détail (§17.6), monumentales et rognées par l'écran, donc lues comme des formes
d'architecture avant d'être lues comme des objets ; absentes des écrans de tâche.

**Alternatives écartées.**

| Option | Motif du rejet |
|---|---|
| Photographies ou illustrations détaillées | Luminance continue : le texte inversé passe par tous les gris, contraste non garanti (décision UXER 20) |
| Silhouettes au trait, comme le croquis | Chaque trait coupe les mots deux fois, pour peu de surface inversée. Le croquis est lu comme un contour à remplir. Réversible si le propriétaire tient au trait (épaisseur ≥ 24 px alors) |
| Silhouettes jaunes | L'inversion d'un texte ivoire sur jaune donne du bleu `#1C46A8` : interdit (P1, §16) |
| Un calque `difference` posé **au-dessus** de tout | Inverse aussi le jaune (→ bleu) et les états (erreur → bleu-vert). Vu sur spécimen |
| Silhouette semi-transparente | Fond gris moyen : le texte inversé tombe aussi au gris moyen, contraste < 3 : 1 |
| Verrerie fixe au défilement | Relation titre / silhouette incontrôlée, recomposition à chaque image de défilement |

### 17.2 Principes ajoutés

| # | Principe | Vérification |
|---|---|---|
| P8 | **Deux valeurs.** Une silhouette est un aplat `--ivory` opaque. Aucun dégradé, contour, texture, ombre, transparence, flou ni filtre | échantillonnage des pixels sous silhouette : une seule couleur hors bord anticrénelé |
| P9 | **L'encre s'inverse, jamais la couleur.** Seuls les éléments neutres (textes `--text`, `--text-2`, `--text-3`, contours au trait, filets) portent l'encre inversée. Un élément chromatique (jaune, états) n'est jamais inversé : il est opaque (bouton plein) ou porte une **réserve** `--void` (point, focus) | aucune teinte hors palette sur les captures ; recherche de bleu et de violet = 0 |
| P10 | **Contraste invariant.** Hors silhouette, le rendu est identique au pixel au rendu sans Verrerie. Sous silhouette, chaque paire texte / fond est l'inverse exacte | capture avec et sans Verrerie : différence nulle hors silhouettes ; ratios §10.4 du design system |
| P11 | **La tâche n'en reçoit pas.** Aucune silhouette sous un champ, une liste dense, le vote, un Data Field, une couche (menu, modale, feuille, barre d'action), ni dans le registre légal | revue des écrans §17.4 |
| P12 | **Toujours reconnaissable.** Une silhouette montre sa partie caractéristique : col et goulot de la bouteille, pied du verre, fût de la flûte, renflement de la nonic. Un fragment non identifiable est une tache : interdit | lecture des captures à 390 et 1440 px |

Principes existants amendés :

- **P2.** La Verrerie n'est pas un fond de section : c'est une forme posée dans le vide,
  qui ne sépare rien.
- **P3.** Exception nommée : la Verrerie est figurative et ne représente aucune donnée.
  Sur un apéro ou une tablée, sa composition est **tirée de l'identifiant public**
  (même hachage que `Signature`) : elle est propre à l'assemblée sans prétendre être une
  mesure. `aria-hidden`, aucune information portée.
- **P7.** Inchangé : aucun texte d'interface n'est ajouté ni modifié.

### 17.3 Mécanisme retenu : l'encre inversée par élément

Le texte neutre porte `mix-blend-mode: difference` ; la silhouette reste en mode normal,
**sous** le texte. Deux conditions sont nécessaires, et chacune casse en silence :

1. **Couleur source compensée.** Avec `difference`, un texte ivoire sur `--void` rendrait
   `|ivoire − void|`, légèrement plus sombre que l'ivoire. La source vaut donc
   **jeton + void** (`--inv-text: #FCFCF7` pour `--ivory`), si bien que
   `|source − void|` redonne le jeton exact, et `|source − ivoire|` donne `--void` exact.
2. **Même contexte d'empilement.** Un élément ne se mélange qu'avec ce qui est peint sous
   lui **dans son contexte d'empilement**. Tout ancêtre isolant (`z-index` positionné,
   `transform`, `opacity` < 1, `filter`, `will-change`, `isolation`, `contain: paint`)
   placé entre le texte et la Verrerie annule l'inversion : le texte ivoire disparaît
   sur la silhouette ivoire. Dans le code actuel, trois points l'enfreignent :
   `.facade { z-index: 30 }` isole l'en-tête et le titre de l'accueil, l'entrée `pj-rise`
   isole `.page__body` pendant 320 ms, et la révélation `pj-reveal` isole le contenu de
   `.h1` pendant 640 ms. L'implémentation les lève (design system §10.3).

Le **focus** fait sortir de l'inversion : l'élément focalisé repasse en mode normal sur
une réserve `--void`, si bien que l'anneau jaune reste à 9,2 : 1 partout.

### 17.4 Où la Verrerie apparaît

| Écran | Verrerie | Composition |
|---|---|---|
| Accueil | oui | **La bouteille du croquis**, seule, fixe : inclinée, elle traverse le manifeste et passe sous le bouton plein |
| Onboarding (blaze, notifications) | oui, une silhouette | verre à pied |
| Apéro `/invite`, `/event` | **en-tête seulement** (nom de l'assemblée), arrêtée avant le verdict et le vote | tirée de `aperoId` |
| Tablée | en-tête seulement | tirée de `tableeId` |
| Rétrospective | oui | traverse un chiffre monumental |
| Erreurs, lien cassé | oui, une silhouette | bouteille couchée (seule exception d'angle, ±80°), posée sous le texte : elle n'en traverse aucun |
| Organiser, vote, au programme, notifications, palmarès, tablées, sauvegarde | non sur mobile ; sur bureau, colonne d'expression de l'Editorial Split uniquement | fixe par écran |
| Écran d'ouverture | non : `GlassField` y est déjà le verre | — |
| Registre légal, modales, menu, feuilles, barre d'action | non | — |

### 17.5 Bornes de composition

- **Nombre** : **une seule silhouette par écran**, jamais deux (décision du propriétaire, 19/10/2026).
  Un seul objet garde le vide dominant et donne une seule lecture : un écran, un verre.
- **Surface** : 12 % à 35 % du premier écran mobile (390 × 844). En dessous, l'effet ne
  se voit pas ; au-dessus, le vide cesse de dominer.
- **Échelle** : la silhouette mesure au moins 80 % de la hauteur du premier écran
  (bouteille, verre à pied, flûte) et au moins 55 % pour la nonic, trapue, qui dépasserait
  sinon la borne de surface. Elle sort d'au moins un bord. Monumentale, jamais vignette.
- **Angle** : de −35° à +35° (exception : bouteille couchée des erreurs). Un bord qui
  traverse une ligne de texte fait au moins 15° avec la ligne de base : un bord presque
  horizontal couperait chaque lettre en deux moitiés.
- **Croisements** : une ligne de texte est traversée par au plus deux bords.
- **Tirage** (apéro, tablée) : FNV-1a de l'identifiant public → objet, angle (pas de 5°),
  ancre parmi trois. Même identifiant, même verrerie, sur tous les appareils.

### 17.6 Interdictions propres à la Verrerie

Liquide, mousse, bulles, reflets, ombre portée, étiquette, logo ou forme reconnaissable
d'une marque de boisson, verres qui trinquent, verre brisé, emoji, silhouette animée,
silhouette sous un contrôle de saisie, plus d'une silhouette sur un écran,
silhouette jaune ou colorée, image bitmap.

### 17.7 Compensation optique entre fond foncé et fond clair

**Cause.** Un texte clair sur fond foncé paraît plus gros et plus gras que le même texte
foncé sur fond clair. Deux effets s'additionnent : l'**irradiation** (la lumière des
lettres claires déborde dans l'œil et sur l'écran) et le **rendu** lui-même. Mesuré sur
Chromium : à réglage identique, le texte foncé sur clair porte 2 à 6 % d'encre en moins
(jusqu'à 8,6 % en monospace 12 px sur écran de densité 1).

**Conséquence dans Point Jaune.** Le même mot change de taille apparente quand il passe du
noir à l'ivoire : bouton plein, choix sélectionné, modales, registre légal, et désormais
encre inversée sous une silhouette.

**Règle.** La référence est le texte clair sur fond foncé (le défaut du produit). Les
contextes clairs **compensent par la graisse**, jamais par la taille : la taille,
la chasse et l'interlignage ne bougent pas, aucune mise en page ne se décale. Valeurs :
design system §2.4. Un glyphe à cheval sur un bord de silhouette ne peut pas porter deux
graisses : il garde la graisse de référence, et ce résidu est accepté (il est le plus
faible sur les titres monumentaux, seuls traversés par composition).

**Preuve attendue.** La mesure de pixels ne capte que la part « rendu ». La part
« irradiation » se vérifie par un **test à choix forcé** : cinq personnes, six paires
(même mot, fond foncé / fond clair, côte à côte), question « lequel paraît plus gros ? ».
Objectif : aucun côté choisi plus de 4 fois sur 6 en moyenne. Sans ce test, la
compensation reste `VISUAL_UNVERIFIED`.

### 17.8 Critères de validation ajoutés

| # | Critère | Méthode |
|---|---|---|
| V11 | Contraste invariant (P10) | capture avec / sans Verrerie : diff hors silhouettes = 0 ; sous silhouette, pixels pleins des glyphes = `--void` |
| V12 | Aucune teinte inversée (P9) | recherche de pixels hors palette (bleu, violet, bleu-vert) sur toutes les captures = 0 |
| V13 | Focus intact sur silhouette | navigation clavier sur l'accueil : anneau jaune sur réserve noire à chaque arrêt |
| V14 | Une silhouette par écran, reconnaissance (P12) et bornes (§17.5) | captures 320, 390, 768, 1440 inspectées ; surface couverte mesurée |
| V15 | Compensation optique | mesure d'encre (écart ≤ ±3 % à densité 3, ≤ ±5 % à densité 1) puis test à choix forcé §17.7 |
| V16 | Coût | Verrerie en SVG inline ≤ 2 ko par écran ; aucune recomposition au défilement mesurée (`Performance` : pas de *paint* répété sur les calques inversés) |

Checkpoint : **CONTRACT_AMENDED — VERRERIE**.

