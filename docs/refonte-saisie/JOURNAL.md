# JOURNAL.md — routine « Refonte de la saisie de formulaire »

## Itération 1 — 24/08/2026

**Périmètre audité :** parcours de saisie réel — `src/pages/CreateEventPage.tsx`,
`src/components/AperoSettingsForm.tsx`, `src/components/VoteForm.tsx`,
`src/components/AlternativeOptionForm.tsx`, `src/components/CompanionsField.tsx`,
`src/components/LocationField.tsx`, `src/components/ui/*`,
`src/styles/global.css`, `docs/DESIGN-SYSTEM.md`. Preuve `code` uniquement,
aucun navigateur exercé cette itération.

**Constats retenus :**
- Le constat de départ n°1 (« affordance insuffisante ») est **en grande
  partie infirmé** : une refonte d'affordance documentée existe déjà et tient
  sur le code (`AUDIT-1.md` §1). Quatre résidus ponctuels subsistent :
  mention `Obligatoire` manquante sur « Proposé par »
  (`AlternativeOptionForm.tsx:167-178`), absence de `useShakeInvalid` dans ce
  même formulaire, incohérence documentaire sur les trois champs de créneau
  sans pastille, signifiant visuel absent sur `LocationField`.
- Le constat de départ n°2 (« le ton est mal placé ») est **confirmé** : 7 des
  9 tournures en zone de décision sont des messages d'erreur bloquants, 2 sont
  des libellés d'état de `SwitchRow` lus à chaque passage. Aucune tournure ne
  remplace un libellé de champ ou un intitulé de bouton primaire.
- Le champ le plus coûteux du parcours est le lieu (`LocationField`,
  `AUDIT-1.md` §3.5) : 2 à 4 fois plus de gestes que jour ou heure.

**Modifications effectuées :** aucune modification de code cette itération.
Conformément à la trajectoire indicative du prompt de routine, l'itération 1
est un audit complet, le gel du corpus, l'écriture de la charte de placement
et de la doctrine d'affordance, et un plan d'architecture sur papier — pas une
phase d'implémentation. Fichiers créés : `docs/refonte-saisie/AUDIT-1.md`,
`TON.md`, `DECISIONS.md`, `BACKLOG.md`, `JOURNAL.md` (ce fichier).

**Justification :** appliquer directement des correctifs de ton avant d'avoir
gelé le corpus et écrit la charte de placement risquait de rejouer le
rabotage que la routine existe pour empêcher (section 3 du prompt). Les
références UXER mobilisées : `references/affordance-and-signifiers.md`
(vocabulaire réel/perçu, protocole d'audit, table de gravité — utilisés pour
qualifier chaque résidu §3 de l'audit) et `references/distinctive-direction.md`
§2 (signature secondaire vs écart — utilisé pour trancher que le registre
« Confrérie » est une signature secondaire à replacer, pas un écart à
rediscuter) et `references/color-and-type-protocol.md` §2 (la graisse comme
levier de hiérarchie le moins coûteux en densité — retenu dans D1 pour la
piste de hiérarchisation de `.feedback`).

**Ton — déplacements :** aucun cette itération. Le corpus est gelé
(`TON.md`), la charte de placement est écrite (`DECISIONS.md` D1) ; les
déplacements concrets commencent en itération 2 (hiérarchie de `.feedback`) et
se poursuivent en itération 4 (migration `SwitchRow.state` → `SwitchRow.hint`
pour A8/A9), selon le plan de `DECISIONS.md` D3.

**Ton — compteur :** N = 25 / N₀ = 25 · manifestations sur le parcours par
défaut sans erreur : 2 (création, volet réglages ouvert) → 2 (rien n'a changé
cette itération) ; 1 (vote, message de succès) → 1.

**Vérifications :**
- `npm install` (dépendances absentes au démarrage du conteneur) — installées
  sans erreur.
- `npm run build` — succès, `tsc -b && vite build` sans erreur, build produit
  dans `dist/`.
- `npm test` (`vitest run`) — 222 tests, 27 fichiers, tous passés.
- Contrôle grep du corpus : les 25 chaînes de `TON.md` recherchées une à une
  dans `src/pages` et `src/components` — les 25 sont retrouvées telles quelles
  (voir liste des correspondances ci-dessus ; aucune absente).
- Aucun test fonctionnel (`npm run test:functional`, `npm run test:nav`) requis
  cette itération : aucun changement de comportement n'a été introduit.

**Écarté cette fois :** l'exécution réelle dans un navigateur (Playwright ou
équivalent) — non tentée cette itération, faute de nécessité (aucun rendu
n'a changé) ; à réserver aux itérations où un rendu change réellement, pour
que la preuve `exécution`/`visuelle` corresponde à un changement observable.

**Reste à faire / point de reprise exact pour l'itération 2 :** commencer par
la Phase 0 (relire ce journal, `BACKLOG.md`, `DECISIONS.md`, `TON.md`,
recompter N contre N₀ = 25), puis attaquer l'item 1 du backlog (coût du champ
lieu) et l'item 3 (hiérarchie typographique de `.feedback`) dans le même lot,
en gardant l'item 2 (mention `requirement` sur « Proposé par ») comme correctif
bas risque à inclure si le temps le permet. Ne pas toucher à l'ordre des
champs ni à l'architecture générale des trois formulaires : l'audit ne l'a pas
justifié (`DECISIONS.md` D3).

## Itération 2 — 29/08/2026

**Périmètre audité :** relecture ciblée de `LocationField.tsx` (mécanique de
l'overlay de recherche, `MIN_QUERY_LENGTH`, priming géolocalisation),
`AlternativeOptionForm.tsx` (champ « Proposé par »), `src/styles/global.css`
(`.feedback` vs `.field__error`), et `docs/DESIGN-SYSTEM.md` pour la
cohérence documentaire de l'exemple du champ lieu. Preuve `code` pour
l'analyse, preuve `exécution` pour la validation (voir Vérifications) : les
71 vérifications de `npm run test:functional` exercent réellement
`LocationField` dans Chromium (viewport 420×900, recherche Photon
interceptée), et les 23 de `npm run test:nav` confirment qu'aucune régression
de navigation n'a été introduite. Aucune capture visuelle inspectée
(`references/browser-evidence-protocol.md`) : preuve `exécution`
comportementale uniquement, pas de preuve `visuelle`.

**Constats retenus :** avant d'implémenter la piste D3 (« repenser le passage
par l'overlay plein écran »), relecture du code a montré que cet overlay
porte une justification fonctionnelle documentée dans le composant lui-même
(suggestions ancrées qui tomberaient derrière le clavier virtuel mobile sans
lui). Le retirer sans preuve d'exécution sur un rendu mobile réel aurait
rouvert un choix déjà motivé sans élément nouveau qui le justifie — la Phase 0
recompte N contre N₀ et ne trouve aucune régression du corpus, donc rien
n'indique que ce choix ait cessé d'être valable. Décision : garder l'overlay,
réduire le coût par deux leviers vérifiables sans dépendre du rendu du
clavier virtuel (`DECISIONS.md` D4).

**Modifications effectuées :**
- `src/components/LocationField.tsx` — `MIN_QUERY_LENGTH` 3 → 2 (première
  suggestion une lettre de frappe plus tôt) ; ajout de la sélection au
  clavier (Entrée sélectionne la première suggestion quand la liste n'est
  pas vide), pour retrouver le rythme « taper puis valider » de jour/heure
  quand le premier résultat est le bon.
- `src/pages/CreateEventPage.tsx`, `src/components/AlternativeOptionForm.tsx`,
  `docs/DESIGN-SYSTEM.md` — le hint fonctionnel « Tape trois lettres… » →
  « Tape deux lettres… », pour rester exact après le changement ci-dessus
  (ce texte est du vocabulaire fonctionnel, hors corpus gelé — voir `TON.md`
  §0).
- `src/components/AlternativeOptionForm.tsx` — ajout de
  `requirement="required"` sur le champ « Proposé par » (`AUDIT-1.md` §3.1,
  backlog item 2) : le champ est réellement obligatoire (`isReady`,
  `AlternativeOptionForm.tsx`) mais ne le disait pas avant l'échec.
- `src/styles/global.css` — `.feedback` : `font-weight: 700` → `600`, un cran
  sous `.field__error` (`700`, inchangé), conformément à la piste retenue par
  `DECISIONS.md` D1 pour les 6 erreurs génériques du palier A (A1, A2, A3,
  A5, A6, A7). Aucun texte modifié.

**Justification :** le coût de saisie du champ lieu est structurellement plus
élevé que jour/heure parce qu'il exige une recherche en texte libre plutôt
qu'une sélection native (`AUDIT-1.md` §3.5) — cet écart ne disparaît pas sans
changer cette nature, mais les deux gestes ajoutés par-dessus (attendre trois
lettres, puis obligatoirement taper une suggestion du doigt) pouvaient l'être.
Références UXER mobilisées : `reference-packs/mobile-field-agent/` (densité
et saisie au pouce — a confirmé que raccourcir le geste de confirmation prime
sur raccourcir le debounce réseau, qui ne change rien au ressenti) et
`references/color-and-type-protocol.md` §2, déjà cité en itération 1 pour la
piste de graisse, maintenant appliqué.

**Ton — déplacements :** aucun déplacement cette itération (aucune tournure
n'a changé d'écran, de zone ou de moment d'apparition). Le levier utilisé
pour A1, A2, A3, A5, A6, A7 est la **hiérarchie typographique**, pas
l'emplacement — voir `DECISIONS.md` D5 et `TON.md` §4. Prochain déplacement
prévu : itération 4 (A8/A9, `SwitchRow.state` → `SwitchRow.hint`,
`DECISIONS.md` D1).

**Ton — compteur :** N = 25 / N₀ = 25 · manifestations sur le parcours par
défaut sans erreur : 2 (création, volet réglages ouvert) → 2 (inchangé,
aucune tournure du chemin heureux touchée cette itération) ; 1 (vote, message
de succès) → 1 (inchangé).

**Vérifications :**
- `npm install` à la racine et dans `server/` (dépendances absentes au
  démarrage du conteneur, comme en itération 1) — installées sans erreur.
- `npm run build` — succès, `tsc -b && vite build` sans erreur.
- `npm test` (`vitest run`) — 227 tests, 28 fichiers, tous passés (222/27 en
  itération 1 ; l'écart vient de tests ajoutés au dépôt entre-temps, hors
  périmètre de cette routine).
- `npm run test:functional` — 71/71 vérifications réussies, y compris la
  création d'un apéro avec `LocationField` réellement rempli dans Chromium
  (Photon interceptée et neutralisée, conformément au banc d'essai existant).
  C'est la première itération de cette routine où un rendu change réellement
  et où la preuve `exécution` s'applique (voir itération 1, « Écarté cette
  fois »).
- `npm run test:nav` — 23/23 contrôles passés, aucune régression de
  navigation.
- Contrôle grep du corpus (Phase 0 avant modification, Phase 4 après) : les
  25 chaînes de `TON.md` recherchées une à une (par sous-chaîne pour B3 et
  B15, qui s'étendent sur plusieurs lignes JSX) — les 25 retrouvées telles
  quelles dans les deux passes. Détail dans `TON.md` §5.

**Écarté cette fois :** la suppression de l'overlay plein écran pour la
recherche texte (formulation d'origine de l'item 1 du backlog) — voir
« Constats retenus » ci-dessus et `BACKLOG.md`, section « Écarté cette
itération ». Item 4 (`useShakeInvalid` dans `AlternativeOptionForm`), item 6
(documenter l'exception des trois champs de créneau) et item 7 (signifiant
visuel sur `LocationField`) — laissés à `à faire`, hors du lot retenu pour
cette itération (`DECISIONS.md` D3, trajectoire itération 3).

**Reste à faire / point de reprise exact pour l'itération 3 :** commencer par
la Phase 0 (relire ce journal, `BACKLOG.md`, `DECISIONS.md`, `TON.md`,
recompter N contre N₀ = 25). Puis, selon la trajectoire indicative de D3 :
états et progression (vide, en cours, erreur, succès, brouillon repris),
saisie au pouce et cibles tactiles — et dans ce lot, l'item 4 du backlog
(`useShakeInvalid` absent de `AlternativeOptionForm`, puisqu'il s'agit
précisément d'un état d'erreur). Les items 6 et 7 restent disponibles comme
correctifs bas risque à inclure si le temps le permet, comme l'a été l'item 2
cette itération.

## Itération 3 — 31/08/2026

**Périmètre audité :** le parcours de saisie réel sous l'angle « états et
progression », conformément à la trajectoire indicative de `DECISIONS.md` D3 —
`CreateEventPage.tsx`, `AperoSettingsForm.tsx`, `VoteForm.tsx`,
`AlternativeOptionForm.tsx`, `CompanionsField.tsx`,
`EventOptionMobileCard.tsx` (nouvellement lu, porte le contrôle de vote),
`useShakeInvalid.ts`, `src/styles/global.css`. Preuve `code` pour l'analyse,
preuve `exécution` pour la validation (`npm run test:functional`,
`npm run test:nav`, détail en Vérifications). Aucune capture visuelle
inspectée.

**Constats retenus (`AUDIT-3.md`) :**
- Non-régression vérifiée sur les correctifs des itérations 1 et 2 (mention
  `requirement` sur « Proposé par », `.feedback` à `font-weight: 600`,
  `MIN_QUERY_LENGTH` et sélection au clavier de `LocationField`) — rien n'a
  bougé.
- `AlternativeOptionForm.tsx` était le seul des trois formulaires de saisie
  sans `useShakeInvalid` : à l'échec de validation, aucun défilement, aucune
  secousse, aucun focus programmatique sur le champ fautif, contrairement à
  `CreateEventPage` et `VoteForm` (`AUDIT-3.md` §1.1).
- `.stepper__btn` (compteur de renforts, `CompanionsField.tsx`) était sous le
  plancher de cible tactile de 44 px que `global.css` documente et applique
  déjà à sept autres contrôles (`global.css:2608-2610`) — une incohérence
  interne au fichier, pas un nouveau principe (`AUDIT-3.md` §2).
- Sur les cinq états nommés par le prompt de routine (vide, en cours, erreur,
  succès, brouillon repris), seul le dernier manquait réellement, et
  seulement sur `CreateEventPage` : aucune persistance au-delà du blaze de
  l'organisateur (transverse, via `useComptoirName`), alors que c'est le
  formulaire le plus long des trois et celui où une interruption coûte le
  plus cher à retaper (`AUDIT-3.md` §3).

**Modifications effectuées :**
- `src/components/AlternativeOptionForm.tsx` — ajout de `useShakeInvalid` :
  `shake("slot")` sur l'échec jour/heure/lieu, `shake("name")` sur l'échec du
  blaze, wrapper `registerNode`/`is-shaking` sur les deux blocs concernés.
  Aucun texte, aucune structure de champ modifiés.
- `src/pages/CreateEventPage.tsx` — brouillon repris : lecture d'un éventuel
  brouillon (`apero_create_draft_v1` dans `localStorage`) au montage, via un
  état paresseux qui ne s'exécute qu'une fois ; les quatre champs et le
  tableau de créneaux s'initialisent depuis ce brouillon quand `prefill`
  (« Remettre ça ») est absent ; sauvegarde à chaque changement pertinent ;
  purge à la création réussie (chemin classique et chemin chiffré API VPS) ;
  note neutre de restauration sous le `lede` d'ouverture, hors zone de
  décision.
- `src/styles/global.css` — `.stepper__btn` : 42×42 px → 44×44 px (cible
  tactile). Ajout de `.field__hint--draft` (marge haute de 8 px, la note de
  brouillon n'étant pas rattachée à un `.field` et n'héritant donc pas du
  tassement négatif prévu pour suivre un libellé).

**Justification :** les trois correctifs répondent chacun à un écart nommé
par l'audit entre ce que le code fait réellement et ce que la doctrine
d'affordance (`DECISIONS.md` D2) ou le plancher de cible tactile déjà écrit
dans `global.css` exigent — aucun n'est une préférence esthétique nouvelle.
Références UXER mobilisées : `references/affordance-and-signifiers.md` (le
retour de focus programmatique après un refus d'envoi comme signifiant de
correction, appliqué à `AlternativeOptionForm`) et
`reference-packs/mobile-field-agent/` (le plancher de cible tactile en
contexte « verre en main », déjà cité dans le commentaire de `global.css`
lui-même, appliqué ici à `.stepper__btn`).

**Ton — déplacements :** aucun déplacement, aucune tournure touchée. Le lot
de cette itération porte sur des états et des comportements, pas sur le
placement du ton (réservé à l'itération 4 par `DECISIONS.md` D3). Une phrase
neuve apparaît (note de restauration de brouillon) : elle est fonctionnelle,
pas une tournure, et n'entre donc pas dans le corpus — voir `TON.md` §0 et
son addendum d'itération 3.

**Ton — compteur :** N = 25 / N₀ = 25 · manifestations sur le parcours par
défaut sans erreur : 2 (création, volet réglages ouvert) → 2 (inchangé) ; 1
(vote, message de succès) → 1 (inchangé).

**Vérifications :**
- `npm install` à la racine et dans `server/` (dépendances absentes au
  démarrage du conteneur) — installées sans erreur.
- `npm run build` — succès, `tsc -b && vite build` sans erreur.
- `npm test` (`vitest run`) — 227 tests, 28 fichiers, tous passés (inchangé
  depuis l'itération 2 : aucun test unitaire ne couvre directement
  `CreateEventPage` ou `AlternativeOptionForm`, la logique modifiée est de
  l'état de composant et de la persistance, exercée par les tests
  fonctionnels ci-dessous).
- `npm run test:functional` — 71/71 vérifications réussies, y compris la
  création d'un apéro (section 1-2) et la contre-proposition de créneau
  (section 4, qui exerce directement le chemin corrigé de
  `AlternativeOptionForm`).
- `npm run test:nav` — 23/23 contrôles passés, aucune régression de
  navigation.
- Contrôle grep du corpus (Phase 0 avant modification, Phase 4 après) : les
  25 chaînes de `TON.md` recherchées une à une (script Python, substring
  match pour B3 et B15 qui s'étendent sur plusieurs lignes JSX) — les 25
  retrouvées telles quelles dans les deux passes.

**Écarté cette fois :** `.cheer-btn` (bouton « Trinquer », 40 px) — sous le
même plancher de cible tactile que `.stepper__btn`, mais c'est une action
secondaire hors saisie de formulaire ; rien dans l'audit ne démontre qu'elle
bloque la saisie (`AUDIT-3.md` §2, `BACKLOG.md` item 12). Persistance de
brouillon pour `AperoSettingsForm` et `AlternativeOptionForm` — écartée avec
justification en `DECISIONS.md` D6 (coût d'interruption bien plus faible pour
l'un, formulaire déjà court et rouvert à la demande pour l'autre). Items 6 et
7 du backlog — laissés `à faire`, le lot retenu étant déjà cohérent sans eux.

**Reste à faire / point de reprise exact pour l'itération 4 :** commencer par
la Phase 0 (relire ce journal, `BACKLOG.md`, `DECISIONS.md`, `TON.md`,
recompter N contre N₀ = 25). Puis, selon la trajectoire de `DECISIONS.md` D3 :
appliquer la charte de placement du ton (D1) — migrer A8/A9
(`SwitchRow.state` → `SwitchRow.hint`, avec un `state` fonctionnel neuf qui
n'entre pas dans le corpus) — et, si le temps le permet, les items 6 et 7 du
backlog (documentation de l'exception de pastille sur les trois champs de
créneau, signifiant visuel sur `LocationField`). Aucun texte de tournure ne
doit changer : seul le déplacement et l'échelle typographique sont en jeu.
