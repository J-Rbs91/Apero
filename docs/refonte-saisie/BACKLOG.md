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
| 5 | Déplacer A8/A9 (« Marmaille admise » / « Ce soir c'est sans les mômes » ; « En escadron » / « Peinard, en solo ») de `SwitchRow.state` vers `SwitchRow.hint`, avec un `state` fonctionnel neuf | `DECISIONS.md` D1 | Moyen — libère la zone de décision de ces deux réglages | à faire |
| 6 | Documenter dans `docs/DESIGN-SYSTEM.md` l'exception des trois champs de créneau sans pastille `Obligatoire`/`Facultatif` | `AUDIT-1.md` §3.2 | Faible — cohérence documentaire | à faire |
| 7 | Ajouter un signifiant visuel (icône) à `LocationField` pour annoncer le comportement enrichi (recherche, carte, géolocalisation) avant le premier tap | `AUDIT-1.md` §3.4 | Faible — amélioration de découvrabilité, pas bloquant | à faire |
| 13 | Décider si une tournure du corpus prend place dans le bandeau de reprise de brouillon (zone hors saisie neuve, ouverte par D8) | `DECISIONS.md` D8 | Moyen — c'est du placement de ton, mandat de l'itération 4 | à faire — it. 4 |
| 14 | Étendre la persistance de brouillon à `VoteForm` et `AlternativeOptionForm` | `AUDIT-3.md` §4, écarté it. 3 | Faible — formulaires courts, dans une page déjà chargée | à faire |
| 15 | Cible tactile de `.stepper__btn` (compteur de renforts) portée à 44×44 px, alignée sur le plancher déjà documenté dans `global.css` | `AUDIT-3.md` §1 (complément) | Faible à moyen — cohérence d'un plancher déjà en vigueur ailleurs | fait — it. 3, voir `DECISIONS.md` D9 |
| 16 | `.cheer-btn` (40 px, action « Trinquer ») sous le plancher de 44 px | `AUDIT-3.md` §1 (complément) | Faible — action secondaire, hors saisie de formulaire | à faire — hors périmètre tant qu'aucun audit ne démontre un blocage de la saisie |
| 8 | Revue QA finale, accessibilité, responsive, cohérence, purge des restes | Trajectoire itération 5 | — | à faire |
| 9 | Double mesure finale (vitesse de saisie, présence du ton) vs itération 1 | Trajectoire itération 5 | — | à faire |

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
