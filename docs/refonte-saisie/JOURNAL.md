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
