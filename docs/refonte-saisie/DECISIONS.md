# DECISIONS.md — partis pris structurants

Ce fichier est cumulatif : chaque itération y ajoute ses décisions, elle n'en
retire ni n'en réécrit aucune sauf accord explicite du propriétaire du produit
(section 3 du prompt de routine, « Non-rediscussion »).

---

## Itération 1 — 24/08/2026

### D1. Charte de placement du ton (gelée à partir de cette itération)

Fondée sur l'audit (`AUDIT-1.md` §4) : sur les 9 tournures en zone de décision,
7 sont des messages d'erreur bloquants et 2 sont des libellés d'état de
`SwitchRow`. Le ton n'a jamais pris la place d'un signifiant d'affordance — il
occupe des messages qui apparaissent au moment précis où l'utilisateur cherche
la réponse la plus courte à un problème de saisie. La charte suivante en
découle.

**Zones où le ton ne porte jamais** (aucune tournure ne doit s'y trouver, à
aucune itération) :
- le libellé d'un champ (`Field.label`) ;
- l'intitulé du bouton d'action primaire (`.button--primary`) ;
- la phrase de statut de `ActionBar` tant qu'elle est en tonalité `blocked` ;
- le texte d'une erreur de champ individuel (`Field.error` / `error` de
  `TextField`, `LocationField`, `ChoiceGroup`) — celle-là doit rester lisible
  au premier regard, sans décodage.

**Zones autorisées, par ordre de préférence** (reprises du prompt de routine,
section 2, précisées avec les emplacements réels du code audité) :
1. `Disclosure.summary` et `Field.hint` d'un champ facultatif — déjà le cas de
   B1, B16, B11, B12, B13, B10 dans l'audit ;
2. `placeholder` d'un champ facultatif — déjà le cas de B9 ;
3. message de succès post-validation (`feedbackTone === "ok"`) — déjà le cas
   de B6, B7 ;
4. note d'un chemin secondaire non bloquant (recherche de lieu vide, refus de
   géolocalisation) — déjà le cas de B14, B15 ;
5. `description` d'une option de `ChoiceGroup`, seulement si l'option est
   optionnelle et non pré-sélectionnée par défaut — déjà le cas de B1, B16.

**Zone à statut particulier — les erreurs de formulaire génériques
(`setFeedback` en `role="alert"`, hors erreur de champ)** : A1, A2, A3, A5, A6,
A7. Elles ne peuvent pas être simplement « déplacées » comme un hint : leur
contenu factuel (créneaux passés, nom pris, échec réseau) est l'information
que l'utilisateur cherche à cet instant précis, et il n'existe pas de zone hors
saisie où afficher une erreur de saisie. La charte tranche donc pour elles un
levier différent de celui des hints : **hiérarchie typographique et densité**,
pas déplacement. Concrètement, pour l'itération où ces messages seront
retravaillés (prévu itération 2, cf. `BACKLOG.md`) :
- la chaîne reste un bloc unique, verbatim, jamais scindée en deux fragments
  distincts stylés différemment (scinder changerait la lecture du message,
  pas seulement son style) ;
- son poids visuel doit rester **inférieur ou égal** à celui d'une erreur de
  champ individuelle (`.field__error`), jamais supérieur : aujourd'hui
  `.feedback` est à 13 px, la même taille qu'un `.field__error` — il n'y a pas
  de hiérarchie entre « la donnée manque » et « zéro exploit temporel » alors
  que la première doit primer. Descendre `.feedback` d'un cran de graisse (pas
  seulement de taille, cf. `references/color-and-type-protocol.md` §2 : la
  graisse est le levier le moins coûteux en densité) est la piste retenue.

**Zone à statut particulier — l'état d'un `SwitchRow` (A8, A9)** : le texte de
`state` est lu à chaque passage, il n'est donc pas un « aparté » au sens
strict, mais son rôle fonctionnel (dire si le réglage est activé) n'a pas
besoin d'un tour de phrase pour être rempli — un simple `Oui`/`Non` le
remplirait tout aussi bien. La charte retient : le déplacement de A8/A9 vers
`SwitchRow.hint` (zone déjà prévue par le composant, actuellement vide dans
ces deux usages) est le mécanisme correct — la chaîne existante migre telle
quelle vers `hint`, et `state` reçoit un texte fonctionnel court qui n'entre
pas dans le corpus gelé (ce n'est pas une nouvelle tournure, c'est un libellé
neutre). Ce déplacement précis est réservé à l'itération 4 (« application de la
charte »), pas à celle-ci.

**Ce qui ne change jamais, quelle que soit l'itération** : aucune fusion de
deux champs séparés par une tournure (« Densité et espacement » du prompt de
routine) — vérifié : aucun cas de ce type n'existe dans le code audité.

### D2. Doctrine d'affordance (adoptée, fondée sur l'audit)

Le constat de départ n°1 (« affordance insuffisante ») est **en grande partie
infirmé** par `AUDIT-1.md` §1 : une refonte d'affordance documentée dans
`docs/DESIGN-SYSTEM.md` est déjà en place et tient sur le code. La doctrine
pour la suite de la routine n'est donc pas « ajouter de l'affordance partout »
mais :

1. **Ne pas rouvrir ce qui fonctionne.** `Field`, `ChoiceGroup`, `SwitchRow`,
   `ActionBar`, `FormSection`, `FormSheet`, `Disclosure` ne sont pas à
   refondre : ils sont la fondation correcte sur laquelle le reste du travail
   s'appuie.
2. **Corriger les résidus nommés, pas en chercher de nouveaux par principe.**
   Les quatre résidus de `AUDIT-1.md` §3 (mention manquante sur « Proposé
   par », absence de shake dans `AlternativeOptionForm`, incohérence
   documentaire sur les trois champs de créneau, signifiant absent sur
   `LocationField`) sont le périmètre affordance de la routine, pas un audit
   général de l'application.
3. **Le coût de saisie prime sur l'esthétique du champ.** Le champ lieu
   (`AUDIT-1.md` §3.5) est 2 à 4 fois plus coûteux que jour ou heure — c'est la
   priorité réelle, conforme à la trajectoire indicative du prompt de routine
   (itération 2 : « le champ le plus coûteux »).
4. **Conformité = plancher.** Toute correction d'affordance garde le
   registre « Confrérie » intact dans son texte ; elle ne le neutralise
   jamais au prétexte qu'une version plus neutre serait plus simple à valider
   (`references/CLAUDE.md` UXER, règle 9).

### D3. Architecture de saisie — plan sur papier (aucun code touché cette itération)

Pas de refonte de l'ordre des champs pour `CreateEventPage` et `VoteForm` : sur
preuve `code` (`AUDIT-1.md` §1), l'ordre actuel est déjà correctement
hiérarchisé — l'obligatoire d'abord (créneaux / réponse par créneau), le
facultatif ensuite et replié (carte de visite, réglages / détails). Aucun
constat de l'audit ne justifie de le changer. La priorité d'architecture pour
les itérations suivantes porte donc sur la **mécanique interne** d'un champ
existant plutôt que sur l'ordonnancement de l'écran :

- **Itération 2 (plan)** : réduire le coût du champ lieu. Piste à instruire,
  pas encore décidée : proposer les résultats de recherche sans passer par
  l'overlay plein écran pour une liste courte (moins de 300 ms après la
  troisième lettre), garder l'overlay uniquement pour la carte et « autour de
  moi ». Corriger 3.1 (mention manquante) dans le même lot, ainsi que la
  hiérarchie typographique de D1 sur les erreurs génériques.
- **Itération 3 (plan)** : états et progression — vide, en cours, erreur,
  succès, brouillon repris. Corriger 3.3 (shake absent dans
  `AlternativeOptionForm`) dans ce lot, puisqu'il s'agit précisément d'un état
  d'erreur.
- **Itération 4 (plan)** : déplacements de ton D1 (erreurs génériques et
  `SwitchRow`), corriger 3.2 et 3.4.
- **Itération 5 (plan)** : revue QA finale, double mesure.

Cette trajectoire reste indicative, comme le prévoit le prompt de routine : la
Phase 1 de chaque itération peut la faire bouger si un nouvel audit ciblé le
justifie, mais elle ne se rouvre pas sans preuve nouvelle.

---

## Itération 2 — 29/08/2026

### D4. Réduction du coût du champ lieu — piste tranchée (D3 « à instruire »)

D3 laissait la piste ouverte : « proposer les résultats de recherche sans
passer par l'overlay plein écran ». Avant d'implémenter, relecture du code de
`LocationField.tsx` : l'overlay plein écran porte une justification
fonctionnelle documentée dans le composant (commentaire ligne 61-63,
`isSearchOpen`) — sans lui, les suggestions ancrées sous le champ tombent
derrière le clavier virtuel mobile. Retirer l'overlay sans vérifier sur un
rendu mobile réel qu'un remplacement ne recrée pas ce problème serait
rediscuter un choix déjà motivé sans preuve nouvelle qui le justifie
(section 3 du prompt de routine, principe de non-rediscussion appliqué par
analogie à un choix d'architecture documenté).

Décision : **garder l'overlay**, et réduire le coût par deux leviers
vérifiables sans dépendre d'un rendu de clavier virtuel :

1. `MIN_QUERY_LENGTH` : 3 → 2 lettres avant le premier retour visuel
   (`LocationField.tsx`). Un caractère de moins avant la première suggestion,
   sans perte de pertinence Photon documentée.
2. **Sélection au clavier** : Entrée sur le champ de recherche sélectionne la
   première suggestion quand la liste n'est pas vide. Le lieu redevient un
   champ « taper puis valider », au même rythme que jour/heure, pour le cas
   où le premier résultat est le bon — le tap sur une suggestion reste
   disponible pour les autres cas.

Le retrait de l'overlay reste une piste possible pour une itération
ultérieure, mais seulement sur preuve d'exécution réelle (viewport mobile,
clavier virtuel ouvert) qui montre qu'un remplacement ne recrée pas le
problème que l'overlay résout aujourd'hui. Voir `BACKLOG.md`, « Écarté cette
itération ».

### D5. `.feedback` : hiérarchie appliquée (D1)

La piste retenue par D1 pour les erreurs génériques du palier A (A1, A2, A3,
A5, A6, A7) est appliquée : `.feedback` passe de `font-weight: 700` à `600`
dans `src/styles/global.css`, un cran sous `.field__error` (`700`, inchangé).
Aucun texte modifié, aucune tournure déplacée — c'est le levier « hiérarchie
typographique », pas « emplacement » (D1 les traite déjà comme deux leviers
distincts pour cette zone). Les 6 chaînes concernées restent `en place` au
sens de `TON.md`.

---

## Itération 3 — 30/08/2026

### D6. Brouillon persistant — texte de statut neuf, hors corpus gelé

L'avis « Brouillon retrouvé : la saisie reprend là où tu l'avais laissée. »
(`CreateEventPage.tsx`) est un texte fonctionnel neuf, pas une tournure au
sens de `TON.md` §0 : il énonce un fait (un brouillon a été restauré), sans
trait d'esprit au-delà de ce que l'information exige. Il n'entre donc pas
dans le compte `N`, et la charte de placement du ton (D1) ne s'y applique
pas — il suit à la place le placement déjà établi pour les annonces non
bloquantes de ce type : la classe `.feedback.feedback--info`, précédent
posé par B5 dans `VoteForm` (« Le registre se souvient de toi. »). Décision :
toute future annonce fonctionnelle de ce genre (état, reprise, statut) suit
le même principe — texte neutre, zone et style déjà établis pour l'« info »
— plutôt que d'inventer soit un nouveau registre visuel, soit une nouvelle
tournure du corpus « Confrérie » pour un message qui n'a pas besoin d'humour
pour remplir son rôle.

### D7. Cibles tactiles : le plancher de 44 px, déjà choisi ailleurs dans `global.css`, s'applique aux trois cibles manquantes du parcours

`AUDIT-3.md` §4 constate que `global.css` porte déjà une section dédiée aux
cibles tactiles à 44×44 px minimum, appliquée à plusieurs boutons hors du
parcours de saisie de créneau, mais pas à trois cibles qui en font partie
(`.stepper__btn`, `.locsearch__back`, `.locsearch__clear`). Il ne s'agit pas
d'un nouvel arbitrage : la routine applique une règle que le projet a déjà
tranchée pour lui-même, à des éléments qu'elle avait manqués. Corrigé par
padding/dimensions seuls, aucun changement de dessin ni de texte.
`.locfield__option` reste `non vérifié dans cette exécution` (preuve `code`
insuffisante pour trancher s'il est réellement sous le plancher) — à
mesurer sur un rendu réel avant toute correction, pour ne pas resserrer une
cible qui n'en a pas besoin.
