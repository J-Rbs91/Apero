# BACKLOG.md — ordonné par impact sur la vitesse de saisie

Statuts : `à faire` / `en cours` / `fait` / `abandonné + motif`.

| # | Item | Source | Impact | Statut |
|---|---|---|---|---|
| 1 | Réduire le coût du champ lieu (`LocationField`) | `AUDIT-1.md` §3.5 | Élevé — champ le plus coûteux des trois formulaires de saisie de créneau | fait — it. 2, voir `DECISIONS.md` D4 (approche différente du libellé d'origine, voir « Écarté cette itération ») |
| 2 | Ajouter `requirement="required"` (ou équivalent) sur le champ « Proposé par » de `AlternativeOptionForm.tsx:167-178` | `AUDIT-1.md` §3.1 | Moyen — un aller-retour évitable sur un formulaire secondaire | fait — it. 2 |
| 3 | Alléger la hiérarchie typographique de `.feedback` (erreurs génériques) pour qu'elle ne dépasse jamais le poids d'une `.field__error`, sans toucher au texte | `DECISIONS.md` D1 | Moyen — condition pour reloger A1, A2, A3, A5, A6, A7 sans perdre l'info utile | fait — it. 2, voir `DECISIONS.md` D5 |
| 4 | Ajouter `useShakeInvalid` à `AlternativeOptionForm.tsx` pour rejoindre le comportement de `CreateEventPage` et `VoteForm` | `AUDIT-1.md` §3.3 | Faible à moyen — cohérence, formulaire court | fait — it. 3 |
| 10 | Ramener le message d'erreur générique dans le champ de vision au moment du refus (les trois formulaires) | `AUDIT-3.md` §2 | **Élevé** — le refus était invisible sur tout formulaire plus long que l'écran, et quatre tournures du corpus avec lui | fait — it. 3, voir `DECISIONS.md` D6 |
| 11 | La barre d'action cesse d'annoncer « prêt » pendant qu'un refus est affiché | `AUDIT-3.md` §3 | Moyen à élevé — le seul élément visible au moment du refus disait le contraire | fait — it. 3, voir `DECISIONS.md` D7 |
| 12 | Brouillon local du formulaire de création : la saisie survit à un rechargement | `AUDIT-3.md` §4 | Élevé par occurrence — jusqu'à trois recherches de lieu perdues d'un coup | fait — it. 3, voir `DECISIONS.md` D8 |
| 5 | Déplacer A8/A9 (« Marmaille admise » / « Ce soir c'est sans les mômes » ; « En escadron » / « Peinard, en solo ») de `SwitchRow.state` vers une légende sous la ligne, avec un `state` fonctionnel neuf | `DECISIONS.md` D1 | Moyen — libère la zone de décision de ces deux réglages | fait — it. 4, voir `DECISIONS.md` D10 (support `aside` et non `hint` : voir `AUDIT-4.md` §3) |
| 6 | Documenter dans `docs/DESIGN-SYSTEM.md` l'exception des trois champs de créneau sans pastille `Obligatoire`/`Facultatif` | `AUDIT-1.md` §3.2 | Faible — cohérence documentaire | fait — it. 4, voir `DECISIONS.md` D11 |
| 7 | Ajouter un signifiant visuel (icône) à `LocationField` pour annoncer le comportement enrichi (recherche, carte, géolocalisation) avant le premier tap | `AUDIT-1.md` §3.4 | Faible — amélioration de découvrabilité, pas bloquant | fait — it. 4, voir `DECISIONS.md` D11 |
| 13 | Décider si une tournure du corpus prend place dans le bandeau de reprise de brouillon (zone hors saisie neuve, ouverte par D8) | `DECISIONS.md` D8 | Moyen — c'est du placement de ton, mandat de l'itération 4 | fait — it. 4 : **tranché, aucune tournure n'y est déplacée** (`DECISIONS.md` D12). Une proposition d'extension du corpus est adressée au propriétaire du produit ; elle ne se décide pas en itération |
| 14 | Étendre la persistance de brouillon à `VoteForm` et `AlternativeOptionForm` | `AUDIT-3.md` §4, écarté it. 3 | Faible — formulaires courts, dans une page déjà chargée | à faire |
| 15 | Cible tactile de `.stepper__btn` (compteur de renforts) portée à 44×44 px, alignée sur le plancher déjà documenté dans `global.css` | `AUDIT-3.md` §1 (complément) | Faible à moyen — cohérence d'un plancher déjà en vigueur ailleurs | fait — it. 3, voir `DECISIONS.md` D9 |
| 16 | `.cheer-btn` (40 px, action « Trinquer ») sous le plancher de 44 px | `AUDIT-3.md` §1 (complément) | Faible — action secondaire, hors saisie de formulaire | à faire — hors périmètre tant qu'aucun audit ne démontre un blocage de la saisie |
| 8 | Revue QA finale, accessibilité, responsive, cohérence, purge des restes | Trajectoire itération 5 | — | fait — it. 5, voir `AUDIT-5.md` et `DECISIONS.md` D13 à D16 |
| 9 | Double mesure finale (vitesse de saisie, présence du ton) vs itération 1 | Trajectoire itération 5 | — | fait — it. 5, voir `JOURNAL.md` |
| 17 | `SwitchRow` relie `aside` et `hint` au bouton par `aria-describedby` | `AUDIT-5.md` §3 | Élevé sur le chemin assistif — le registre y avait disparu de la ligne de réglage | fait — it. 5, voir `DECISIONS.md` D13 |
| 18 | Rendre son anneau de focus au champ de recherche du lieu | `AUDIT-5.md` §4 | Moyen — chemin clavier rapide du champ le plus coûteux | fait — it. 5, voir `DECISIONS.md` D14 |
| 19 | Purger les 19 classes CSS orphelines de l'ancien parcours | `AUDIT-5.md` §5 | Faible — maintenabilité et poids | fait — it. 5, voir `DECISIONS.md` D15 |
| 20 | Corriger dans `TON.md` l'écran attribué à A9, B11, B12, B13 | `AUDIT-5.md` §2.1 | Moyen — exactitude du suivi, N inchangé | fait — it. 5, voir `DECISIONS.md` D16 |
| 21 | Mesurer A8 sur « Retoucher l'apéro » (`AperoSettingsForm.tsx:136`) | `AUDIT-5.md` §2.2 et §9 | Faible — seul point d'appel jamais mesuré à l'exécution | à faire — non atteint par la sonde, jamais déduit |
| 22 | Traversée clavier du champ lieu : `onFocus` ouvre l'overlay plein écran (`LocationField.tsx:333`) | `AUDIT-5.md` §6.5 | Élevé pour un utilisateur au clavier — trois éjections sur un formulaire à trois créneaux | à faire — **bloqué par D4** : demande une preuve d'exécution sur rendu mobile réel, clavier virtuel ouvert. Décision du propriétaire du produit |
| 23 | `a.notif-bell` à 42 × 42 px, et anneau de focus par défaut du navigateur | `AUDIT-5.md` §6.2, §6.3 | Faible — en-tête de navigation, hors parcours de saisie | à faire — hors périmètre de la routine |

## Écarté cette itération

**Itération 1 :** aucun item écarté — c'est un audit, rien n'a encore été
proposé puis refusé.

**Itération 2 :** la suppression de l'overlay plein écran pour la recherche
texte du lieu (formulation d'origine de l'item 1, « repenser le passage
systématique par l'overlay »). Le code documente une raison fonctionnelle
réelle à cet overlay (`LocationField.tsx`, commentaire sur `isSearchOpen`) :
sans lui, les suggestions ancrées sous le champ tombent derrière le clavier
virtuel mobile. Vérifier qu'un remplacement échappe à ce problème demande une
preuve d'exécution sur un rendu mobile réel, clavier ouvert — non tentée
cette itération (voir `JOURNAL.md`, `AUDIT-1.md` §7, et `DECISIONS.md` D4
pour la piste retenue à la place). **Reprise possible** dans une itération
ultérieure, mais seulement sur cette preuve, jamais par défaut.

**Itération 3 :** deux choses écartées, pour des raisons différentes.

1. **Écrire le bandeau de reprise de brouillon en registre « Confrérie ».** Le
   corpus est gelé : y ajouter une tournure neuve gonflerait N₀ et reviendrait
   à décider seul d'étendre le corpus, ce qui appartient au propriétaire du
   produit. Et y déplacer une tournure existante est explicitement le mandat
   de l'itération 4. L'emplacement est donc préparé et laissé libre — c'est
   l'item 13 ci-dessus, pas un renoncement.
2. **La persistance de brouillon pour `VoteForm` et `AlternativeOptionForm`**
   (item 14). Ces deux formulaires sont courts et vivent dans une page déjà
   chargée ; le coût d'une reprise perdue y est sans commune mesure avec celui
   du formulaire de création. Reportée par priorité, pas par difficulté.

**Itération 4 :** deux choses écartées.

1. **Écrire une tournure neuve pour le bandeau de reprise de brouillon.** La
   question de l'item 13 est tranchée : aucune tournure existante ne peut y
   être déplacée sans vider le chemin d'où elle viendrait (`DECISIONS.md` D12,
   raisonnement entrée par entrée dans `AUDIT-4.md` §4). Donner au bandeau une
   couleur de registre demanderait d'en **écrire** une, ce qui fait monter N₀ ;
   c'est une décision du propriétaire du produit, jamais d'une itération. La
   proposition lui est adressée dans D12, avec le cahier des charges de
   l'emplacement.
2. **Rejouer les mesures de A9 sur le parcours de vote.** A9 partage le
   composant `SwitchRow` avec A8 et reçoit exactement le même traitement ; ses
   valeurs de rendu sont celles mesurées sur A8, par construction. Une mesure
   propre demanderait de créer un apéro réel dans la sonde. Les 71
   vérifications de `npm run test:functional` exercent bien ce parcours et ne
   régressent pas — mais elles ne mesurent pas la typographie. Consigné comme
   une mesure non faite, pas comme une mesure implicite.

**Itération 5 :** trois choses écartées, et la routine s'arrête.

1. **La traversée clavier du champ lieu** (item 22). L'audit l'établit à
   l'exécution : `LocationField.tsx:333` ouvre l'overlay plein écran sur
   `onFocus`, donc un utilisateur au clavier est éjecté une fois par créneau.
   C'est le constat le plus lourd que l'itération 5 ait trouvé et qu'elle ne
   corrige pas — parce que le corriger, c'est toucher à l'ouverture de
   l'overlay, ce que D4 et l'« Écarté » de l'itération 2 réservent à une preuve
   d'exécution sur rendu mobile réel, clavier virtuel ouvert. Chromium headless
   n'en ouvre pas, aux itérations 2, 3, 4 comme à celle-ci. **Consigné pour le
   propriétaire du produit, pas traité en douce.**
2. **Les items 14 et 16** (brouillon de `VoteForm` / `AlternativeOptionForm` ;
   `.cheer-btn` à 40 px). Inchangés. L'audit de cette itération confirme que
   `.cheer-btn` reste hors périmètre : « Trinquer » n'est pas une étape du
   remplissage, et rien ne démontre qu'elle bloque la saisie.
3. **L'item 21** (A8 sur « Retoucher l'apéro »). Non atteint par la sonde, donc
   **non mesuré** — et surtout pas déduit de A8 sur la création, ce qui serait
   l'erreur que l'itération 4 s'était refusé à commettre pour A9.

Une inspection a par ailleurs été menée puis **classée sans suite** :
l'`aside` passant derrière la barre d'action fixe. Le balayage de cinq
positions de défilement montre qu'il existe des positions — dont la fin de
course — où il est entièrement dégagé et au premier plan. Le masquage n'est que
le transitoire qu'une barre fixe impose à tout contenu qui défile derrière
elle. Ce n'est pas un défaut (`AUDIT-5.md` §6.4).
