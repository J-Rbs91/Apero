# Brief consolidé — verrerie

<!-- mission UXER verrerie — profil standard — créé le 2026-10-18T18:12:50+00:00 -->

## Demande initiale

Garnir le fond de l'app de silhouettes de bouteille, verre à vin, flûte, pinte nonic ; inversion de couleur du texte (mix-blend-mode: difference) pour qu'il reste lisible ; supprimer l'écart de taille perçu entre texte sur fond foncé et sur fond clair. Compléter les contrats de design Point Jaune.

## Objectif reformulé

Ajouter à Point Jaune une couche figurative (« Verrerie ») et une encre inversée qui garde
tout texte lisible quelle que soit sa position, puis égaliser la taille apparente du texte
entre fond foncé et fond clair. Livrable de cette mission : avenant aux contrats
(`docs/uxer/manifesto-void/`), spécimen rendu et mesures. Aucune modification du frontend.

## Hypothèses retenues

- Le croquis (contour blanc) est lu comme une silhouette à remplir ; le trait reste une variante réversible.
- « Inversion de couleur » = inversion ivoire ↔ noir, pas inversion chromatique : le jaune ne s'inverse jamais.
- Clarification sautée : demande et croquis suffisent ; les choix ouverts sont nommés dans le contrat §17.1.

## Portée autorisée

Documents `docs/uxer/manifesto-void/` (contrat, design system, mouvement, spécimen, preuves) et `.uxer/runs/verrerie/`. Code produit : hors portée.

## Critères de réussite

Contrat V11 à V16 ; spécimen : inversion exacte au pixel, aucune teinte inversée ; mesures de compensation consignées.

Gabarit complet des dix-huit sections : `references/request-brief-format.md`
dans le plugin UXER.
