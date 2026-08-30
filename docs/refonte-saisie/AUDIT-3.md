# AUDIT-3 — itération 3/5

Périmètre exercé : `src/pages/CreateEventPage.tsx`, `src/components/VoteForm.tsx`,
`src/components/AlternativeOptionForm.tsx`, `src/components/CompanionsField.tsx`,
`src/components/LocationField.tsx`, `src/hooks/useShakeInvalid.ts`,
`src/styles/global.css` (section « Cibles tactiles » et zones voisines).

Nature des preuves : lecture de code pour l'analyse, complétée par une **preuve
`exécution`** pour la validation des changements comportementaux : les 80
vérifications de `npm run test:functional` (dont les 9 nouvelles du scénario 10,
introduit cette itération) et les 23 de `npm run test:nav` exercent réellement
Chromium. Pas de preuve `visuelle` (aucune capture inspectée au sens du
protocole) ; le contrôle des tailles de cible tactile s'appuie sur les
dimensions CSS elles-mêmes, comparées à la règle 44 px déjà en vigueur ailleurs
dans le même fichier — c'est une preuve `code`, pas une mesure d'écran réelle.

---

## 0. Non-régression (Phase 0)

Recompte des 25 tournures de `TON.md` avant toute modification : les 25
retrouvées telles quelles (25 par correspondance exacte en une ligne, 2 par
sous-chaîne pour B3 et B15, comme documenté depuis l'itération 2). N = 25 /
N₀ = 25, aucune régression avant de commencer.

Les correctifs de l'itération 2 (`MIN_QUERY_LENGTH` à 2, sélection au clavier
sur la première suggestion, `.feedback` à `font-weight: 600`, mention
`requirement="required"` sur « Proposé par ») sont toujours en place à la
lecture du code — rien à restaurer.

## 1. États et progression — ce qui existait déjà

Avant de proposer des changements, vérification de ce que `DECISIONS.md` D3
prévoyait d'auditer (« vide, en cours, erreur, succès, brouillon repris ») :

- **Chargement (« en cours »)** : déjà couvert dans les trois formulaires —
  `CreateEventPage` (« Création de l'apéro… »), `VoteForm` (« On émarge… »),
  `AlternativeOptionForm` (« Envoi… »), et dans `LocationField` (squelette de
  la liste pendant la recherche Photon, états `locating`/`searching` du bloc
  « autour de moi »). **Rien à corriger ici.**
- **Vide** : `CreateEventPage` distingue déjà « À compléter » de « Complet »
  par créneau (`slot__state`), et `LocationField` distingue « moins de deux
  lettres » de « recherche en cours » de « aucun résultat ». **Rien à
  corriger ici.**
- **Erreur** : `CreateEventPage` et `VoteForm` remontent le regard sur le bloc
  fautif via `useShakeInvalid` (défilement, secousse, focus) — mais
  `AlternativeOptionForm` ne le faisait pas (résidu déjà nommé en
  `AUDIT-1.md` §3.3, backlog item 4). **Corrigé cette itération, voir §2.**
- **Succès** : couvert (`feedback--ok`, redirection pour la création).
  **Rien à corriger ici.**
- **Brouillon repris** : **absent.** `CreateEventPage` ne persiste rien —
  un rechargement, ou l'appli déchargée en arrière-plan par le système
  mobile pendant qu'on cherche l'adresse exacte d'un troquet, efface tout un
  formulaire de plusieurs créneaux (chacun jour + heure + lieu). C'est le seul
  des trois formulaires de saisie où ce coût est réel : `VoteForm` et
  `AlternativeOptionForm` sont plus courts, et `VoteForm` réconcilie déjà son
  état avec les mises à jour de l'`event` reçu en props (protection contre un
  autre type de perte, pas contre un rechargement). **Corrigé cette
  itération, voir §3.** Ce point est nommé explicitement à la fois par
  l'objectif invariant de la routine (section 1 du prompt : « reprise après
  interruption ») et par la trajectoire indicative de `DECISIONS.md` D3 pour
  cette itération.

## 2. Correctif — `useShakeInvalid` dans `AlternativeOptionForm` (backlog item 4)

Ajouté à l'identique du mécanisme déjà utilisé dans `CreateEventPage` et
`VoteForm` : un `registerNode` par bloc (les trois champs du créneau
ensemble, puis « Proposé par » seul), un appel à `shake(id)` au refus de
validation, la classe `is-shaking` posée conditionnellement. Comportement
observable : à l'échec, le regard est renvoyé sur le bloc fautif au lieu de
ne compter que sur le message `feedback` en pied de feuille — cohérent avec
les deux autres formulaires de saisie de créneau. Aucun texte modifié.

## 3. Correctif — brouillon persistant pour `CreateEventPage` (« brouillon repris »)

Nouveau hook `src/hooks/useCreateEventDraft.ts`, sur le même principe que
`useComptoirName.ts` déjà présent dans le code (localStorage, clé dédiée,
lecture paresseuse au montage) :

- à chaque changement d'un des cinq champs du formulaire (nom cérémoniel,
  prétexte, politique mioches, cadence, liste des créneaux), le brouillon est
  réécrit dans `localStorage` (clé `apero_create_draft_v1`) ;
- un brouillon vide (aucun champ renseigné) n'est jamais écrit — pas de
  bruit dans `localStorage` pour un formulaire jamais commencé ;
- au montage, si un pré-remplissage explicite (« Remettre ça », prop
  `prefill`) est présent, il prime sur tout brouillon existant : une action
  volontaire de l'utilisateur ne doit pas se faire écraser par une saisie
  abandonnée plus tôt ;
- à défaut de pré-remplissage, un brouillon non vide restaure les cinq
  champs, et un avis (`Brouillon retrouvé : la saisie reprend là où tu
  l'avais laissée.`) l'annonce en tête de formulaire, avant que la saisie ne
  masque pourquoi les champs sont déjà remplis ;
- le brouillon est purgé après une création réussie, sur les deux chemins de
  stockage (`api-vps` et registre local).

Ce texte de statut est **neuf, pas une tournure** au sens de `TON.md` §0 : il
ne porte aucun trait d'esprit, il annonce un fait fonctionnel (comme les
noms de concept hors corpus) — il n'entre donc pas dans le compte `N` et ne
requiert pas la charte de placement du ton. Il réutilise la classe
`.feedback.feedback--info` déjà établie pour ce type d'annonce non bloquante
(précédent : B5 dans `VoteForm`), plutôt que d'inventer un nouveau bloc visuel.

**Validé par une preuve `exécution` neuve** (scénario 10 de
`tests/functional/run.mjs`) : un formulaire rempli partiellement, un vrai
rechargement de page (`page.reload()`, pas une navigation interne), puis
vérification que l'avis apparaît, que les cinq champs pertinents sont
restaurés à l'identique, que la création aboutit normalement depuis l'état
restauré, et que le brouillon est purgé après coup (un nouveau passage sur
`/#/create` n'affiche plus l'avis).

## 4. Cibles tactiles — trois cibles sous le plancher déjà fixé ailleurs

Le fichier `global.css` porte déjà, depuis une itération antérieure à cette
routine, une section dédiée (« Cibles tactiles : app de comptoir, on vise le
pouce, verre en main ») qui relève plusieurs boutons à 44×44 px minimum
(`.bk`, `.slot__x`, `.ghost-link`, `.minimap__expand`…). Trois cibles du
parcours de saisie de créneau étaient restées sous ce plancher déjà choisi
pour le reste de l'app — ce n'est pas une préférence nouvelle, c'est
l'application d'une règle déjà décidée que ces trois boutons n'avaient pas
reçue :

- `.stepper__btn` (`CompanionsField`, +/- du nombre de renforts) : 42×42 px.
- `.locsearch__back` (`LocationField`, bouton retour de l'overlay de
  recherche) : 38×40 px.
- `.locsearch__clear` (`LocationField`, effacer la recherche en cours) :
  34×40 px.

Les trois sont sur le chemin direct du parcours de saisie : le premier dans
`VoteForm` et `AlternativeOptionForm` (renforts), les deux autres dans
`LocationField`, monté dans les trois formulaires. Corrigés à 44×44 px,
sans changement de dessin (padding/dimensions seulement, même motif que la
section existante) ni de texte.

`.locfield__option` (lignes de suggestion et de résultat « autour de moi »)
a été mesuré mais pas corrigé : deux lignes de texte (13 px + 11,5 px) plus
16 px de padding vertical donnent une hauteur de contenu déjà proche ou
au-dessus de 44 px selon le rendu de police — sur preuve `code` seule, la
zone de tap ne peut pas être établie avec certitude comme sous le plancher.
`non vérifié dans cette exécution` : à mesurer sur un rendu réel avant de
corriger, pour ne pas resserrer un bouton qui n'en a pas besoin.

## 5. Ce qui n'a pas été touché, et pourquoi

- **L'overlay plein écran de `LocationField`** : toujours écarté, comme en
  itération 2 (`DECISIONS.md` D4) — aucune preuve d'exécution nouvelle sur
  rendu mobile réel n'est apparue qui justifierait de rouvrir ce choix.
- **Items 6 et 7 du backlog** (documentation de l'exception des trois champs
  sans pastille, signifiant visuel sur `LocationField`) : laissés `à faire`,
  hors du lot retenu — le temps de cette itération est allé au brouillon
  persistant, plus structurant pour l'objectif de la routine.
- **Item 5 du backlog** (déplacement de A8/A9 vers `SwitchRow.hint`) :
  toujours réservé à l'itération 4, conformément à `DECISIONS.md` D1 et D3 —
  cette itération n'a touché aucune tournure du corpus.

## 6. Compte de manifestations du registre (comparaison au repère d'itération 1)

Chemin heureux de création, brouillon non restauré (cas normal, sans
interruption) : toujours **2 manifestations** (B1, B16, volet réglages
ouvert) — inchangé, cette itération n'a ajouté ni retiré de tournure sur ce
chemin. L'avis de brouillon retrouvé n'est visible que sur un parcours
interrompu puis repris, un cas qui n'existait pas au moment du repère
d'itération 1 ; il n'est pas une tournure et ne s'ajoute donc pas à ce
compte.
