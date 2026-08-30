# BACKLOG.md — ordonné par impact sur la vitesse de saisie

Statuts : `à faire` / `en cours` / `fait` / `abandonné + motif`.

| # | Item | Source | Impact | Statut |
|---|---|---|---|---|
| 1 | Réduire le coût du champ lieu (`LocationField`) | `AUDIT-1.md` §3.5 | Élevé — champ le plus coûteux des trois formulaires de saisie de créneau | fait — it. 2, voir `DECISIONS.md` D4 (approche différente du libellé d'origine, voir « Écarté cette itération ») |
| 2 | Ajouter `requirement="required"` (ou équivalent) sur le champ « Proposé par » de `AlternativeOptionForm.tsx:167-178` | `AUDIT-1.md` §3.1 | Moyen — un aller-retour évitable sur un formulaire secondaire | fait — it. 2 |
| 3 | Alléger la hiérarchie typographique de `.feedback` (erreurs génériques) pour qu'elle ne dépasse jamais le poids d'une `.field__error`, sans toucher au texte | `DECISIONS.md` D1 | Moyen — condition pour reloger A1, A2, A3, A5, A6, A7 sans perdre l'info utile | fait — it. 2, voir `DECISIONS.md` D5 |
| 4 | Ajouter `useShakeInvalid` à `AlternativeOptionForm.tsx` pour rejoindre le comportement de `CreateEventPage` et `VoteForm` | `AUDIT-1.md` §3.3 | Faible à moyen — cohérence, formulaire court | fait — it. 3 |
| 5 | Déplacer A8/A9 (« Marmaille admise » / « Ce soir c'est sans les mômes » ; « En escadron » / « Peinard, en solo ») de `SwitchRow.state` vers `SwitchRow.hint`, avec un `state` fonctionnel neuf | `DECISIONS.md` D1 | Moyen — libère la zone de décision de ces deux réglages | à faire |
| 6 | Documenter dans `docs/DESIGN-SYSTEM.md` l'exception des trois champs de créneau sans pastille `Obligatoire`/`Facultatif` | `AUDIT-1.md` §3.2 | Faible — cohérence documentaire | à faire |
| 7 | Ajouter un signifiant visuel (icône) à `LocationField` pour annoncer le comportement enrichi (recherche, carte, géolocalisation) avant le premier tap | `AUDIT-1.md` §3.4 | Faible — amélioration de découvrabilité, pas bloquant | à faire |
| 8 | Revue QA finale, accessibilité, responsive, cohérence, purge des restes | Trajectoire itération 5 | — | à faire |
| 9 | Double mesure finale (vitesse de saisie, présence du ton) vs itération 1 | Trajectoire itération 5 | — | à faire |
| 10 | Brouillon persistant pour `CreateEventPage` (reprise après interruption) | `AUDIT-3.md` §1, §3 — objectif invariant de la routine (section 1) | Élevé — seul des trois formulaires assez long pour que perdre son contenu coûte une reprise complète | fait — it. 3 |
| 11 | Cibles tactiles sous 44 px sur le parcours de saisie (`.stepper__btn`, `.locsearch__back`, `.locsearch__clear`) | `AUDIT-3.md` §4 | Moyen — trois cibles réelles sur le chemin de saisie, plancher déjà choisi ailleurs dans le projet | fait — it. 3 |
| 12 | Mesurer sur rendu réel la hauteur de tap de `.locfield__option` (suggestions et résultats « autour de moi ») avant de corriger | `AUDIT-3.md` §4 | Faible — preuve `code` insuffisante pour trancher | à faire |

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
