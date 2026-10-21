# UXER_MOTION_SYSTEM — « Point Jaune »

Le mouvement évoque la **précision, la gravité, la retenue**. Il révèle, il ne décore pas.
Règle de fréquence : plus un écran est vu souvent, moins il bouge. Aucune action
utilisateur n'attend la fin d'une animation identitaire.

## 1. Jetons

| Jeton | Valeur | Usage |
|---|---|---|
| `--d-instant` | 120 ms | retour d'une action (choix, survol) |
| `--d-fast` | 200 ms | couches (menu, volet), transitions fonctionnelles |
| `--d-base` | 320 ms | entrée de page |
| `--d-slow` | 640 ms | révélation typographique |
| `--d-ritual` | 1 400 ms | convergence de données, émergence (une fois) |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | sorties exponentielles : tout ce qui arrive |
| `--ease-std` | `cubic-bezier(0.2, 0, 0, 1)` | couleurs, états |
| `--ease-in` | `cubic-bezier(0.7, 0, 0.84, 0)` | ce qui disparaît (seulement) |

Pas de rebond, pas d'élastique : aucune courbe ne dépasse 1. Vérification : inverser une
courbe à durée constante doit produire un démarrage retardé visible pour `--ease-in`, et
aucun pour `--ease-out` ; c'est ce qui justifie de réserver `--ease-in` aux sorties.

## 2. Familles

| Famille | Où | Chorégraphie | Propriétés | Fallback (mouvement réduit) |
|---|---|---|---|---|
| **Typographic Reveal** | `.h1`, `.h1--sm` à l'entrée d'un écran ; nom de l'ouverture | le titre se démasque de bas en haut (`clip-path: inset(100% 0 0 0)` → `inset(0)`) avec une translation de 0,12 em ; `--d-slow`, `--ease-out` ; **dominant** : rien d'autre ne bouge pendant les 160 premières ms | `clip-path`, `transform` | titre affiché |
| **Signal Emergence** | écran d'ouverture | 0 ms : noir ; 0-900 ms : la trame de points apparaît en onde depuis l'intersection d'or ; 0-720 ms : le verre se dessine en points, du pied vers le col ; 540-1 530 ms : le Petit Jaune monte dans le verre, sa surface ondule puis se pose ; 700 ms : le nom se révèle ; verre plein + 600 ms : sortie en fondu | canvas, `opacity`, `clip-path` | trame et verre plein dessinés d'emblée, sortie après 600 ms |
| **Data Convergence** | champ des votes du verdict | à l'entrée dans le champ visible : chaque signe part d'une position dispersée (graine = identifiant) et rejoint sa cellule ; délai `rangée × 60 ms` ; `--d-ritual` ; le rang en tête s'allume en jaune **après** convergence (+ 120 ms) | canvas | état final dessiné directement |
| **Density Shift** | chargement ; bande de signal | trois points en déphasage (opacité 0,25 ↔ 1, 900 ms, infini **seulement pendant un chargement**) ; impulsion unique sur la bande du verdict | `opacity` | points fixes |
| **Spatial Transition** | entrée de `.page__body` ; menu ; feuilles | page : `translateY(12px)` + opacité, `--d-base`, après le titre (délai 80 ms) ; menu : glisse de 16 px depuis la droite, `--d-fast` ; feuille : monte de 24 px, `--d-fast` | `transform`, `opacity` | apparition directe |
| **Quiet Feedback** | choix de vote, verre levé, interrupteur, copie | la marque du choix se remplit depuis son centre (`scale(0.4)` → 1), `--d-instant` ; aucune secousse sauf refus (secousse existante `useShakeInvalid`, 560 ms, horizontale) | `transform`, `background-color` | changement d'état instantané |

## 3. Priorités et arrêts

1. Les **interactions** priment : un clic pendant une révélation l'interrompt (les
   animations CSS n'interceptent pas les événements ; l'ouverture se saute d'un tap).
2. **Un seul** canvas animé à la fois par écran ; il s'arrête hors champ
   (`IntersectionObserver`) et onglet masqué (`visibilitychange`), et reprend où il était.
3. Les animations du champ des votes et de la constellation **se terminent** : ce sont des
   révélations, pas des fonds animés. Seule l'ouverture contient une boucle, et elle se
   retire d'elle-même.
4. Remplissage `backwards` uniquement sur les éléments qui contiennent des descendants en
   `position: fixed` (rappel d'un défaut déjà rencontré : un `transform` résiduel enferme
   les modales dans la page).

5. **Verrerie** (contrat §17) : aucun mouvement propre. Elle apparaît avec l'écran,
   défile avec la page, ne se révèle pas et ne réagit à rien. Sur les écrans
   `.has-verrerie`, aucune animation ne porte sur un ancêtre de l'encre inversée : elle
   l'isolerait et ferait disparaître le titre sur la silhouette pendant l'animation
   (design system §10.3). Sur l'accueil, le titre est donc posé, pas révélé : c'est
   l'écran le plus vu, la règle de fréquence va dans le même sens.
   Sur les autres écrans à Verrerie, le contenu entre en glissant sans fondu
   (`pj-rise-plein`) : un contenu à moitié transparent laisserait voir la silhouette en
   gris pendant l'entrée.

## 4. Coûts mesurés (budget)

| Matière | Coût par image | Durée | Hors écran |
|---|---|---|---|
| Champ des votes | ≤ créneaux × convives signes (≈ 15 à 300 rectangles) | 1,4 s puis arrêt | suspendu |
| Constellation | ≤ nombre d'apéros locaux + trame (≈ 200 points) | 1,2 s puis arrêt | suspendu |
| Champ d'émergence | trame ≈ 600 points | ≤ 4 s (vie de l'écran d'ouverture) | — |
| CSS | `transform`, `opacity`, `clip-path` uniquement | — | — |

## 5. Mouvement réduit

`@media (prefers-reduced-motion: reduce)` coupe toutes les animations et transitions CSS ;
chaque canvas lit `matchMedia("(prefers-reduced-motion: reduce)")` et dessine son état
final sans boucle ; `useShakeInvalid` le respectait déjà ; le verre de l'ouverture (`GlassField`) se dessine plein d'emblée. Aucune
information n'est portée par le mouvement : tout état final est visible sans lui.

Checkpoint : partie du **DESIGN_SYSTEM_READY** ; implémentation : **MOTION_IMPLEMENTED**.
