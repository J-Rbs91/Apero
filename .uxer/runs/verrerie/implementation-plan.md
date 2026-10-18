# Plan d'implémentation — verrerie

<!-- mission UXER verrerie — profil standard — créé le 2026-10-18T18:12:50+00:00 -->

## Phases retenues

contract (faite) → implementation → qualification.

## Unités atomiques

| Ordre | Unité | Phase | Dépend de | Validation attendue | Fichiers probables |
|---|---|---|---|---|---|
| 1 | Avenant aux contrats et spécimen | contract | — | relecture, rendu du spécimen | `docs/uxer/manifesto-void/*` |
| 2 | Jetons `--inv-*`, `--fw-comp`, `--stroke-comp` | implementation | 1 | `npm test`, build | `src/styles/point-jaune/tokens.css`, `base.css`, `controls.css` |
| 3 | Compensation optique des contextes clairs | implementation | 2 | V15 mesure | `controls.css`, `lists.css`, `screens.css` |
| 4 | Composant `Verrerie` et tirage par identifiant | implementation | 2 | tests unitaires du tirage | `src/components/field/Verrerie.tsx` |
| 5 | Empilement : `.facade`, `pj-rise`, `.h1__ink` / `.h1__point` | implementation | 4 | `npm run test:nav`, V11, V13 | `shell.css`, `motion.css`, `HomePage.tsx` |
| 6 | Écrans §17.4 | implementation | 5 | V12, V14 | pages concernées |
| 7 | Qualification | qualification | 6 | V1 à V16, captures 320 → 1920 | `UXER_QUALIFICATION_REPORT.md` |
