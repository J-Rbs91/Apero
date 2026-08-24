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
