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

## Itération 3 — 30/08/2026

**Périmètre audité :** relecture ciblée des cinq états de saisie (vide, en
cours, erreur, succès, brouillon repris) sur `CreateEventPage.tsx`,
`VoteForm.tsx`, `AlternativeOptionForm.tsx`, `LocationField.tsx`,
`CompanionsField.tsx`, et des cibles tactiles de `src/styles/global.css`
(section « Cibles tactiles » et environs). Preuve `code` pour l'analyse,
preuve `exécution` pour la validation : les 80 vérifications de
`npm run test:functional` (dont 9 nouvelles, scénario 10, ajouté cette
itération) et les 23 de `npm run test:nav` exercent réellement Chromium.
Détail dans `AUDIT-3.md`.

**Constats retenus :** sur les cinq états ciblés par la trajectoire de D3,
trois étaient déjà correctement couverts (chargement, vide, succès — rien à
corriger) et deux avaient un résidu réel : l'absence de `useShakeInvalid`
dans `AlternativeOptionForm` (déjà nommée en `AUDIT-1.md` §3.3, backlog item
4), et l'absence totale de persistance du formulaire de `CreateEventPage` —
un rechargement ou une mise en arrière-plan par le système mobile efface un
formulaire de plusieurs créneaux sans aucun moyen de le retrouver. Ce second
point n'était pas encore nommé dans le backlog : il rejoint directement
l'objectif invariant de la routine (section 1 du prompt : « reprise après
interruption »), et la trajectoire de `DECISIONS.md` D3 le prévoyait pour
cette itération sous l'intitulé « brouillon repris ». Par ailleurs, la revue
des cibles tactiles a trouvé trois boutons du parcours de saisie
(`.stepper__btn`, `.locsearch__back`, `.locsearch__clear`) sous le plancher
de 44×44 px que `global.css` applique déjà à d'autres boutons de l'app — pas
un nouvel arbitrage, l'application d'une règle déjà décidée à trois cibles
qui l'avaient manquée.

**Modifications effectuées :**
- `src/components/AlternativeOptionForm.tsx` — ajout de `useShakeInvalid` :
  un `registerNode` sur le bloc des trois champs du créneau et un second sur
  « Proposé par », `shake(id)` appelé au refus de validation, classe
  `is-shaking` posée conditionnellement. Comportement identique à
  `CreateEventPage` et `VoteForm`. Aucun texte modifié.
- `src/hooks/useCreateEventDraft.ts` (nouveau) — persistance du formulaire de
  création dans `localStorage` (clé `apero_create_draft_v1`), sur le modèle
  déjà en place de `useComptoirName.ts` : lecture paresseuse au montage,
  écriture à chaque changement d'un des cinq champs, jamais d'écriture pour
  un formulaire vide, priorité au pré-remplissage explicite (« Remettre ça »)
  sur un vieux brouillon.
- `src/pages/CreateEventPage.tsx` — branchement du hook : les cinq champs
  s'initialisent depuis le brouillon restauré (à défaut de `prefill`), un
  avis (« Brouillon retrouvé : la saisie reprend là où tu l'avais laissée. »)
  s'affiche en tête de formulaire quand un brouillon non vide a été restauré,
  et le brouillon est purgé après une création réussie (les deux chemins de
  stockage, `api-vps` et registre local).
- `src/styles/global.css` — `.stepper__btn` (42×42 → 44×44 px),
  `.locsearch__back` (38×40 → 44×44 px), `.locsearch__clear` (34×40 →
  44×44 px). Padding/dimensions seuls, aucun changement de dessin.
- `tests/functional/run.mjs` — nouveau scénario 10 : remplissage partiel du
  formulaire de création, vrai rechargement de page (`page.reload()`),
  vérification que l'avis de brouillon et les cinq champs sont restaurés,
  que la création aboutit normalement, et que le brouillon est purgé après
  coup.

**Justification :** le brouillon persistant répond directement à l'objectif
invariant de la routine (« reprise après interruption », section 1 du
prompt) sur le seul des trois formulaires de saisie où l'interruption coûte
réellement une reprise complète — les deux autres sont plus courts, et l'un
d'eux (`VoteForm`) protège déjà son état contre un autre type de perte
(remplacement de l'`event` en props). Références UXER mobilisées :
`reference-packs/mobile-field-agent/` (coût d'une interruption sur un
parcours de saisie mobile) et `references/affordance-and-signifiers.md`
(un état restauré silencieusement ne se distingue pas d'un état pré-rempli
par erreur — d'où l'avis explicite, plutôt qu'une restauration muette). Le
choix de ne pas ajouter de tournure pour cet avis, mais de réutiliser le
placement déjà établi pour l'« info » non bloquante (précédent B5 dans
`VoteForm`), suit la doctrine D2 : le registre est un actif à replacer, pas
un réflexe à appliquer à tout nouveau texte. Pour les cibles tactiles,
`reference-packs/mobile-field-agent/` a de nouveau servi de référence (la
règle des 44 px n'est pas une invention de cette itération : c'est celle déjà
choisie ailleurs dans `global.css`, appliquée ici aux cibles qui l'avaient
manquée).

**Ton — déplacements :** aucun cette itération (voir `TON.md` §4). Le texte
neuf de l'avis de brouillon n'est pas une tournure au sens de `TON.md` §0 —
voir `DECISIONS.md` D6. Le prochain déplacement prévu reste celui
d'itération 4 (A8/A9, `SwitchRow.state` → `SwitchRow.hint`).

**Ton — compteur :** N = 25 / N₀ = 25 · manifestations sur le parcours par
défaut sans erreur ni interruption : 2 (création, volet réglages ouvert) → 2
(inchangé) ; 1 (vote, message de succès) → 1 (inchangé). Sur un parcours
interrompu puis repris (cas nouveau, hors du repère d'itération 1), l'avis
de brouillon retrouvé s'ajoute — il n'est pas compté ici puisqu'il n'est pas
une tournure.

**Vérifications :**
- `npm install` à la racine et dans `server/` (dépendances absentes au
  démarrage du conteneur, comme aux itérations précédentes) — installées
  sans erreur.
- `npm run build` — succès, `tsc -b && vite build` sans erreur.
- `npm test` (`vitest run`) — 227 tests, 28 fichiers, tous passés (inchangé
  depuis l'itération 2 : aucun test unitaire nouveau, la persistance de
  formulaire n'a pas de test au niveau composant dans ce dépôt — voir
  « Écarté cette fois »).
- `npm run test:functional` — 80/80 vérifications réussies (71 en itération
  2 + 9 nouvelles du scénario 10), dont la restauration réelle d'un
  formulaire de création après un vrai rechargement de page dans Chromium,
  et la purge du brouillon après création.
- `npm run test:nav` — 23/23 contrôles passés, aucune régression de
  navigation.
- Contrôle grep du corpus (Phase 0 avant modification, Phase 4 après) : les
  25 chaînes de `TON.md` recherchées une à une (23 par correspondance
  exacte, B3 et B15 par sous-chaîne) — les 25 retrouvées telles quelles dans
  les deux passes. Détail dans `TON.md` §5 (note it. 3).

**Écarté cette fois :** un test unitaire au niveau composant pour
`useCreateEventDraft` — ce dépôt ne porte aucun test de composant React
(seuls les utils, services et hooks sans DOM sont couverts par `vitest`,
voir la liste des fichiers `*.test.ts`) ; la validation est donc passée
entièrement par la preuve `exécution` du scénario fonctionnel 10, cohérent
avec la pratique déjà établie du projet pour ce type de changement.
`.locfield__option` (item 12 du backlog) : mesuré sur preuve `code`
seulement, pas assez pour trancher s'il est réellement sous le plancher de
44 px — laissé `à faire`, à mesurer sur un rendu réel. Items 6 et 7 du
backlog : toujours laissés `à faire`, le temps de cette itération est allé
au brouillon persistant. Item 5 (déplacement A8/A9) : toujours réservé à
l'itération 4, conformément à `DECISIONS.md` D1 et D3.

**Reste à faire / point de reprise exact pour l'itération 4 :** commencer
par la Phase 0 (relire ce journal, `BACKLOG.md`, `DECISIONS.md`, `TON.md`,
recompter N contre N₀ = 25). Puis, selon la trajectoire de `DECISIONS.md`
D3 : appliquer les déplacements de ton prévus par D1 — migrer A8/A9
(« Marmaille admise » / « Ce soir c'est sans les mômes » ; « En escadron » /
« Peinard, en solo ») de `SwitchRow.state` vers `SwitchRow.hint`, avec un
`state` fonctionnel neuf (backlog item 5). Dans le même lot, ou en correctif
bas risque si le temps le permet : items 6 et 7 (documentation de
l'exception des trois champs sans pastille, signifiant visuel sur
`LocationField`) et item 12 (mesure réelle de `.locfield__option`). Ne pas
rouvrir la charte de placement du ton (D1) ni le choix de garder l'overlay
de recherche du lieu (D4) sans preuve nouvelle qui les justifie.
