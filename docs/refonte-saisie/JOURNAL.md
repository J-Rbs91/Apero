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
