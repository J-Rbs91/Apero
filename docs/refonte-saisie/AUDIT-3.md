# AUDIT-3 — itération 3/5

Périmètre exercé : le parcours de saisie réel, angle « états et progression » —
`src/pages/CreateEventPage.tsx`, `src/components/AperoSettingsForm.tsx`,
`src/components/VoteForm.tsx`, `src/components/AlternativeOptionForm.tsx`,
`src/components/CompanionsField.tsx`, `src/components/EventOptionMobileCard.tsx`
(nouvellement lu cette itération : porte le contrôle de vote, donc la cible
tactile la plus sollicitée du parcours), `src/components/ui/*`,
`src/hooks/useShakeInvalid.ts`, `src/styles/global.css`.

Nature des preuves : **preuve `code`** pour l'ensemble des constats ci-dessous.
**Preuve `exécution`** pour la validation (voir « Vérifications » du
`JOURNAL.md`) : `npm run test:functional` (71/71) exerce réellement la
contre-proposition de créneau dans Chromium — donc le chemin corrigé de
`AlternativeOptionForm` — et `npm run test:nav` (23/23) confirme l'absence de
régression de navigation. Aucune capture visuelle inspectée cette itération :
pas de preuve `visuelle`.

---

## 0. Non-régression sur les itérations précédentes

Avant de creuser une zone neuve, relecture des correctifs des itérations 1 et 2 :

- **Item 2 (it. 2)** — `requirement="required"` sur « Proposé par » : toujours
  présent, désormais `AlternativeOptionForm.tsx:182` (déplacé par cette
  itération en raison de l'ajout du wrapper de secousse, texte et prop
  inchangés).
- **Item 3 / D5 (it. 2)** — `.feedback` à `font-weight: 600` : toujours en
  place, `src/styles/global.css`, inchangé cette itération.
- **`MIN_QUERY_LENGTH` et sélection au clavier (it. 2, D4)** — toujours en
  place dans `LocationField.tsx`, non touché cette itération (hors périmètre
  du lot « états et progression »).

Aucune régression trouvée. Le corpus de `TON.md` est recompté en Phase 4 (voir
`JOURNAL.md`) : 25/25, inchangé.

## 1. Ce que l'audit du constat de départ n°1 avait laissé ouvert

`DECISIONS.md` D2 fixait la doctrine : corriger les résidus nommés en
`AUDIT-1.md` §3, pas en chercher de nouveaux par principe. L'item 4 de ce
même audit (§3.3, absence de `useShakeInvalid` dans
`AlternativeOptionForm.tsx`) est le résidu que la trajectoire de `DECISIONS.md`
D3 réserve explicitement à cette itération, parce qu'il s'agit d'un **état
d'erreur** — le sujet propre de la Phase 1 d'une itération « états et
progression ».

### 1.1 — Confirmé : `AlternativeOptionForm` était le seul des trois formulaires de saisie sans secousse de rappel

Avant correctif, la contre-proposition affichait ses erreurs de deux façons
différentes de `CreateEventPage` et `VoteForm` :

- une erreur de champ individuel (`Field.error`, sous chaque `TextField`) —
  déjà cohérente avec les deux autres formulaires ;
- un message générique en pied de feuille (`.feedback`, A6/A7 du corpus) —
  cohérent aussi ;
- **mais aucun défilement, aucune secousse, aucun focus posé sur le premier
  champ en faute.** Dans `CreateEventPage.tsx` et `VoteForm.tsx`, un envoi
  refusé ramène physiquement le regard (et le focus clavier) sur le bloc
  fautif via `useShakeInvalid` (`registerNode`/`shake`/`shakingId`). Dans
  `AlternativeOptionForm.tsx`, l'utilisateur devait remarquer lui-même, dans
  une feuille plein écran, quel champ portait la bordure rouge — un coût de
  saisie supplémentaire net sur un formulaire dont le seul but est d'aller
  vite (le prompt de routine le nomme lui-même formulaire « satellite »).

Le formulaire est court (quatre champs), donc l'écart de coût est plus faible
que dans `CreateEventPage` (plusieurs créneaux, défilement réel possible) —
mais il existe : sans focus programmatique, un clavier virtuel resté ouvert
sur le mauvais champ ne montre pas toujours l'erreur au premier écran visible
d'un petit mobile.

**Corrigé cette itération** (voir `JOURNAL.md`) : `shake("slot")` sur l'échec
jour/heure/lieu, `shake("name")` sur l'échec du blaze, mêmes mécanismes que
les deux autres formulaires.

## 2. Cibles tactiles — audit du parcours de vote et du compteur de renforts

Le parcours de vote (`VoteForm` → `EventOptionMobileCard` → `ChoiceGroup`) est
le geste le plus répété de l'app (« le geste central », commentaire de
`VoteForm.tsx:62-66`) : sa cible tactile prime sur celle de n'importe quel
autre contrôle.

- **`.choice` (les trois pastilles de vote)** : `min-height: 52px`
  (`global.css:2823`) — au-dessus du plancher de 44 px déjà posé ailleurs dans
  le fichier (commentaire `global.css:2608-2610`, « Cibles tactiles »). Rien à
  corriger ici.
- **`.switchrow__button`** : `min-height: 58px` (`global.css:1079`) — au-dessus
  du plancher.
- **`.stepper__btn` (compteur de renforts, `CompanionsField.tsx`)** :
  `width: 42px; height: 42px` (`global.css:1169-1171`, avant correctif) — **en
  dessous du plancher de 44 px que le fichier lui-même documente et applique
  déjà à sept autres contrôles** (`.bk`, `.slot__x`, `.cheer-btn` — qui reste
  lui aussi sous le plancher à 40 px mais est hors périmètre de cette routine,
  action secondaire de trinquer, pas un champ de saisie —, `.share .cp`,
  `.ghost-link`, `.minimap__expand`). C'est une incohérence interne au
  fichier, pas un jugement esthétique : le plancher existe déjà et un seul
  contrôle du parcours de saisie y échappait.

**Corrigé cette itération** : `.stepper__btn` passe à 44×44 px. Le
changement ne grossit pas visiblement le bouton (2 px), conformément au
principe déjà en vigueur dans cette section du fichier (« le rendu reste
inchangé à l'œil »).

**Laissé de côté, hors périmètre** : `.cheer-btn` (40 px, bouton « Trinquer à
ce créneau ») n'est pas un contrôle de saisie de formulaire — c'est une
micro-approbation optionnelle en dehors du geste de vote lui-même
(`VoteForm.tsx` ne le rend que si `onToggleCheer` est fourni). Le corriger
sortirait du périmètre que la routine fixe (section 8 du prompt : « elle ne
refond pas… sauf si l'audit démontre qu'elles bloquent la saisie ») ; rien ici
ne le démontre. Consigné dans `BACKLOG.md` pour une itération qui traiterait
spécifiquement les actions secondaires, si le produit le demande un jour.

## 3. États et progression — ce qui existe déjà, et ce qui manque réellement

Revue des cinq états nommés par le prompt de routine (vide, en cours, erreur,
succès, brouillon repris) sur les trois formulaires :

| État | `CreateEventPage` | `VoteForm` | `AlternativeOptionForm` |
|---|---|---|---|
| Vide | pastille `À compléter` par créneau (`slot__state`) | carte `À voter` par créneau | pas de pastille (formulaire à 4 champs, jugé inutile en it. 1, `DECISIONS.md` D2) |
| En cours | bouton désactivé + libellé `Création de l'apéro…` | bouton désactivé + libellé `On émarge…` | bouton désactivé + libellé `Envoi…` |
| Erreur | `.feedback` + secousse (déjà présent) | `.feedback` + secousse (déjà présent) | `.feedback` seul avant cette itération → **secousse ajoutée (section 1.1)** |
| Succès | redirection immédiate vers l'apéro créé | récapitulatif replié (`existingParticipant && !isEditing`), message `feedback--ok` | feuille refermée, liste mise à jour |
| Brouillon repris | **absent** → **ajouté cette itération** | pré-remplissage du blaze via `useComptoirName` (déjà un brouillon partiel, hors périmètre de cet audit) | pré-remplissage du blaze uniquement |

Le seul manque réel, structurant, est le **brouillon repris de
`CreateEventPage`** : c'est le formulaire le plus long des trois (un ou
plusieurs créneaux, carte de visite, réglages), celui où une interruption
(appel, notification, fermeture accidentelle de l'onglet, rechargement après
un crash du navigateur) coûte le plus cher à retaper — exactement le
problème que la section 1 du prompt de routine nomme comme dimension propre
de la refonte (« reprise après interruption »). Avant cette itération, rien
ne persistait au-delà du blaze de l'organisateur (`useComptoirName`, portée
transverse à l'app, pas spécifique à ce formulaire) : fermer l'onglet en
plein remplissage d'un créneau multiple faisait tout reperdre.

**Corrigé cette itération** : sauvegarde automatique du formulaire vierge
(hors « Remettre ça », qui a sa propre source de pré-remplissage et ne doit
pas entrer en conflit avec un brouillon plus ancien) dans
`localStorage` (`apero_create_draft_v1`), restauration au montage, purge à la
création réussie (les deux chemins de stockage, classique et chiffré via API
VPS). Une note neutre (« Brouillon retrouvé : reprends où tu t'étais
arrêté. ») signale la restauration, en zone hors décision (juste sous le
`lede` d'ouverture, avant le premier champ) — ce n'est pas une tournure du
corpus gelé, voir `TON.md` §0 : c'est l'information fonctionnelle strictement
nécessaire, sans effet de style au-delà.

## 4. Classement par impact

1. **Brouillon repris de `CreateEventPage`** — impact le plus élevé : évite de
   retaper entièrement le formulaire le plus long après une interruption,
   scénario nommé explicitement par la routine.
2. **Secousse de rappel dans `AlternativeOptionForm`** — impact moyen :
   cohérence de comportement avec les deux autres formulaires, coût réel mais
   plus faible (formulaire court, feuille plein écran déjà focalisée).
3. **Cible tactile de `.stepper__btn`** — impact faible à moyen : plancher
   d'accessibilité déjà établi ailleurs dans le fichier, un seul contrôle du
   parcours y échappait.

## 5. Écarté cette itération

- **`.cheer-btn`** (section 2) — hors périmètre, action secondaire.
- **`AperoSettingsForm.tsx`** — formulaire de retouche (édition d'un événement
  existant, pas création) : un brouillon perdu y coûte beaucoup moins cher
  (les valeurs de départ restent celles de l'événement, rien n'est reparti de
  zéro) ; pas de preuve d'un coût de saisie qui justifierait d'y répliquer le
  même mécanisme cette itération.
- **Items 6 et 7 du backlog** (documentation de l'exception de pastille sur
  les trois champs de créneau, signifiant visuel sur `LocationField`) —
  laissés `à faire`, le lot de cette itération étant déjà cohérent sans eux
  (voir `DECISIONS.md`).
