# UXER_QUALIFICATION_REPORT — « Point Jaune »

Mission UXER `manifesto-void` · branche `feat/uxer-manifesto-void` · départ `main` `84e26aa`.
Qualification **locale** uniquement : aucune CI distante déclenchée, rien poussé, fusionné
ni déployé.

**Statut : `READY_FOR_ART_DIRECTION_REVIEW`** (justification §7).

---

## 1. Ce qui a été livré

| Livrable | Où |
|---|---|
| Audit de référence | `UXER_BASELINE_AUDIT.md` |
| Exploration, trois concepts rendus, choix | `UXER_CONCEPT_EXPLORATION.md` |
| Contrat de refonte | `UXER_REDESIGN_CONTRACT.md` |
| Design system | `UXER_DESIGN_SYSTEM.md` + `src/styles/point-jaune/*.css` (11 feuilles, jetons dans `tokens.css`) |
| Système de mouvement | `UXER_MOTION_SYSTEM.md` + `motion.css` + `src/components/field/useFieldCanvas.ts` |
| Composants nouveaux | `src/components/field/` : `PointMark`, `Signature`, `VoteField`, `ComptoirField`, `SignalField`, `useFieldCanvas` ; `src/utils/signalMath.ts` (+ 8 tests) |
| Planches avant / après | `evidence/*.jpg` (ce dossier) |
| Suivi de mission | `.uxer/runs/manifesto-void/` (état, journal, checkpoints) |

Commits : `64bce60` (documents, avant toute modification du frontend), `84ab583`
(implémentation), `ee1d167` (convergence après inspection), puis le commit de ce rapport.

## 2. Tests techniques (exécutés localement, Node 22, Chromium 1228)

| Contrôle | Avant (`84e26aa`) | Après | Commentaire |
|---|---|---|---|
| `npm test` (vitest) | 240/240 (30 fichiers) | **248/248** (31 fichiers) | +8 tests de `signalMath` ; aucun test modifié ni retiré (`git diff 84e26aa -- tests` vide) |
| `npm run build` (`tsc -b` + Vite) | ✓ | **✓** | typecheck strict inclus |
| `npm run test:functional` (E2E, vraie API, faux GitHub) | 71/71 | **71/71** | 9 scénarios, matrice §3 |
| `npm run test:nav` (contrat du geste retour) | 23/23 | **23/23** | |
| `verifier-ton.py` (corpus gelé) | N = 25 | **N = 25** | |
| Lint | — | — | **aucun lint configuré dans le dépôt** : non exécuté, non déclaré réussi |
| `test:functional:sqlite` | périmé sur `main` | non relancé | défaut préexistant documenté, hors périmètre |

Poids livré :

| Ressource | Avant | Après |
|---|---|---|
| CSS | 73,96 ko (17,37 ko gzip) | **72,74 ko (17,53 ko gzip)** |
| JS principal | 374,3 ko (120,1 ko gzip) | 380,6 ko (122,9 ko gzip) : +2,8 ko gzip pour les champs de données |
| Polices (sous-ensemble latin chargé en pratique) | Manrope + Abril Fatface | Archivo variable 90 ko + Fragment Mono 25 ko : **≈ +80 ko** (voir limites §6) |
| Dépendances npm | — | **aucune ajoutée** (`git diff 84e26aa -- package.json` vide) |

## 3. Matrice fonctionnelle avant / après

Source : `tests/functional/run.mjs` (inchangé), `navigation.mjs` (inchangé), parcours
rejoués à l'œil sur le banc de captures.

| Parcours | Attendu | Avant | Après | Régression |
|---|---|---|---|---|
| Onboarding blaze + notifications | blaze validé, confirmation, choix notifications | ✓ | ✓ (scénario 1) | aucune |
| Création mono et multi-créneaux | lien avec clés en fragment, chiffrement AES-GCM, zéro clair | ✓ | ✓ (1, 2) | aucune |
| Vote d'un invité + modification | registre, récapitulatif, correction sans doublon | ✓ | ✓ (3) | aucune |
| Contre-proposition | feuille plein écran, créneau attribué | ✓ | ✓ (4) | aucune |
| Second vote sur 4 créneaux | | ✓ | ✓ (5) | aucune |
| Notifications | badge, carnet, silence invité | ✓ | ✓ (6) | aucune |
| Isolation | lecture seule, mauvaise clé, cloisonnement | ✓ | ✓ (7) | aucune |
| Suppression | dialogue, purge, « Apéro annulé » | ✓ | ✓ (8) | aucune |
| Contrat API | | ✓ | ✓ (9) | aucune |
| Geste retour (menu couche, tunnel de création, trace vide…) | 23 contrôles | ✓ | ✓ | aucune |
| Apéro passé (« Servi », « Remettre ça ») | | non couvert par E2E | vu sur capture (horloge avancée de 12 jours) | aucune constatée |
| Chargement, lien cassé, route inconnue | | non couvert par E2E | vus sur captures | aucune constatée |

**Textes** : aucun texte d'interface modifié, sauf la liste des crédits du registre légal
(exactitude juridique, contrat §14). Nouveaux textes visibles : uniquement les repères de
date du champ des votes (`lun. 19`), en `aria-hidden`, doublant une information déjà
écrite. **Ordre des blocs** : inchangé sur tous les écrans. **Volets** : tous repliés par
défaut, comme avant. **Bouton plein unique** : respecté ; les trois écarts préexistants
(tournées passées de `/agenda`, sélecteur d'année de `/comptes`, `/tablee` non-membre,
plus le dialogue de confirmation du blaze qui recouvre « Valider mon blaze ») ne sont pas
aggravés.

## 4. Contrôle visuel (réellement inspecté)

Banc hermétique (faux GitHub, vraie API, Vite, Chromium headless), données produites par
l'interface : 2 apéros, 5 convives, 1 tablée. Captures **hors dépôt** (scratchpad de
session), planches avant / après **dans le dépôt** (`evidence/`).

| Jeu | Contenu |
|---|---|
| Avant | 28 états × 320 / 390 / 1440 = 84 rendus |
| Après, convergence | 4 tours (r1 à r4) de captures inspectées, ≈ 45 images ouvertes et critiquées |
| Après, final | 31 états × 7 largeurs (320, 360, 390, 768, 1024, 1440, 1920) = 245 rendus, dont superpositions (menu, recherche de lieu, feuille de contre-proposition, dialogue de suppression), apéro passé, chargement |
| Mouvement réduit | 31 états × 390 / 1440 = 70 rendus sous `prefers-reduced-motion: reduce` |
| Texte agrandi 200 % | 9 écrans × 320 / 390 / 1440 = 27 rendus, racine à 200 % |

Mesures automatiques sur le jeu final : **0 échec de rendu, 0 débordement horizontal, 0 erreur console** (hors 404 volontaire du lien cassé) sur les 315 rendus ; cibles < 44 px uniquement sur les liens en ligne du registre légal ; plus d'un bouton plein uniquement là où c'était déjà le cas (`/comptes`, dialogue du blaze) ou sous une couche modale (feuille de contre-proposition au-dessus du formulaire de vote).

Journal de convergence (observation sur capture → correction → recapture) :

| # | Observation | Correction |
|---|---|---|
| 1 | Loupe du champ lieu posée sur le texte saisi | spécificité du sélecteur générique des champs abaissée (`:where`) |
| 2 | Bouton « Organiser un apéro » étiré sur 8 colonnes au bureau | largeur automatique ≥ 768 px |
| 3 | Boutons du rituel du blaze sur trois lignes | empilés dans les dialogues |
| 4 | Vide superflu au-dessus du titre de l'apéro (P1) | en-tête resserré sur les écrans de tâche |
| 5 | Champ des votes minuscule au bureau | rangées de 40 px, pas de colonne relu depuis le CSS |
| 6 | « Hésitation s » coupé dans un compteur | libellés à retour sous la marque, jamais en milieu de mot |
| 7 | Barres Traquenard vides trop présentes | barres éteintes au trait |
| 8 | Créneaux compacts de l'agenda trop espacés | écart réduit pour les rangées compactes |
| 9 | Champs date / heure sans anneau de focus quand l'icône interne a le focus | `:focus-within` (cause : Chromium ne propage pas `:focus` à l'hôte) |
| 10 | Débordement horizontal à 200 % de texte (accueil, apéro, rétrospective) | coupure de dernier recours sur les mots monumentaux, compteurs repliables |
| 11 | Écrans d'erreur sans le vide prévu | en-tête réduit à un titre = Silent Frame |
| 12 | Titres pendants décalés de 16 px de leur filet (bureau) | marge du premier élément de contenu annulée |
| 13 | Apéro passé : rangée gagnante encore jaune, « oct.. » | le passé s'éteint : ni jaune ni point final |
| 14 | Texte « le badge rouge reste là » alors que le badge était jaune | badge rendu rouge (le texte fait foi) |
| 15 | P1 à 390 × 844 : le haut du premier créneau, visible avant au-dessus de la barre d'action, était repoussé dessous | en-tête des écrans de tâche resserré (≈ 70 px) ; le premier créneau commence désormais **au ras** de la barre : compromis consigné en limite §6 |

## 5. Accessibilité (WCAG 2.2 AA, périmètre modifié)

| Critère | Méthode | Résultat |
|---|---|---|
| Contraste du texte (1.4.3) | calcul sur chaque nœud texte visible contre son fond effectif (pile des fonds), 13 écrans à 390 px | **0 écart** (13 écrans, y compris le registre légal en ivoire) |
| Contraste des composants (1.4.11) | jetons : contours de contrôles 4,8 / 4,4 / 3,7 : 1 | ≥ 3 : 1 |
| Focus visible (2.4.7, 2.4.11) | 14 tabulations par écran, anneau ≥ 2 px requis à chaque arrêt | **0 arrêt sans anneau** après correction n° 9 |
| Taille des cibles (2.5.8) | mesure automatique, 210 rendus | ≥ 44 px partout sauf liens en ligne du registre légal (exception « inline » du critère) |
| Texte agrandi (1.4.4) | racine à 200 %, 9 écrans × 320 / 390 / 1440 | **0 débordement** après correction n° 10 |
| Reflow (1.4.10) | 320 px | aucun défilement horizontal |
| Mouvement (2.3.3) | émulation `reduce` : `document.getAnimations()` | **0 animation active** (accueil, apéro, agenda) ; champs de données dessinés directement dans leur état final (vu sur capture) |
| Clignotement (2.3.1) | aucune animation > 3 Hz (impulsion unique de 600 ms, points de chargement à 1,1 Hz) | conforme par construction |
| Information par la couleur seule (1.4.1) | réponses : marques plein / hachuré / barré + libellés ; « En tête » : texte + point ; erreurs : texte + trait + « ! » | conforme |
| Noms accessibles | inchangés (tests E2E par rôle et nom) | conforme |
| Matières computationnelles | toutes `aria-hidden`, information doublée en texte | conforme |

**Non vérifié** (aucun environnement disponible) : lecteur d'écran réel, Safari / Firefox,
appareil tactile réel, clavier virtuel réel sur la recherche de lieu.

## 6. Limites et régressions connues

- **Poids des polices** : +80 ko environ au premier chargement (Archivo variable, deux
  axes). Piste : instancier l'axe de chasse sur 62-100 % et sous-ensembler (outil
  `fonttools`, non disponible ici sans installation).
- **Images exportées** (« Tableau de chasse », bilan annuel) : couleurs et police alignées
  sur Point Jaune, **composition non redessinée** ; leur direction reste à faire.
- **Écran d'ouverture** : le verre Lottie reste (choix argumenté, contrat §3) ; c'est un
  point de goût à trancher par le propriétaire.
- **Thème clair supprimé** : l'application est sombre ; seuls le registre légal et les
  dialogues rituels passent en ivoire. À confirmer par le propriétaire.
- **Cartes** : tuiles OpenStreetMap bloquées dans le banc ; le filtre monochrome nocturne
  des tuiles n'a pas été vu sur de vraies tuiles.
- **Champs date / heure** : rendus au format US par Chromium headless ; le rendu natif
  réel dépend du téléphone.
- **Palmarès** : toujours vide en mode `api-vps` (défaut préexistant, hors périmètre) ;
  l'état « avec breloques » n'a pas été vu en rendu.
- **P1 à 390 × 844** : nom, blaze, action « Envoyer ma réponse » et statut sont visibles
  sans défiler ; le premier créneau commence au ras de la barre d'action (avant : son
  en-tête dépassait d'une ligne). Prix assumé du titre monumental, à juger sur téléphone.
- `traquenardScale.ts` garde ses couleurs historiques (exportées, testées, non affichées).

## 7. Évaluation artistique (autoévaluation, pas une preuve)

Notes sur 10, justifiées par les captures ; un œil humain doit les contredire ou les
confirmer.

| Critère | Poids | Note | Justification et réserve |
|---|---|---|---|
| Originalité et singularité | 25 % | 7,5 | Le point jaune unique, la signature binaire par assemblée et le champ des votes calculé n'appartiennent à aucun gabarit. Réserve : « noir + grotesque condensé » reste une famille visuelle connue ; la distinction repose sur les signes de données et la voix, pas sur la palette |
| Cohérence du langage visuel | 20 % | 8 | Même grammaire du formulaire au verdict (plein / hachuré / barré), mêmes légendes monospace, même filet ; le registre légal en ivoire reste reconnaissable. Réserve : le verre Lottie de l'ouverture est le seul objet figuratif |
| Interprétation des trois références | 20 % | 7 | Ma : vide structurant, intervalles, récipient vide de l'accueil. Manifeste : chasse variable, titres jusqu'à 184 px, légendes de 12 px. Data Sublime : matrice réelle, constellation, émergence. Réserve : le « sublime » reste à l'échelle d'un téléphone, loin de la monumentalité d'une installation |
| Qualité des compositions | 15 % | 7 | Accueil bureau et verdict sont les plus forts ; les pages de formulaire sont sobres, peut-être trop proches d'un formulaire sombre soigné |
| Qualité du motion design | 10 % | 6,5 | Grammaire complète et sobre ; vue sur captures statiques et par mesure, **pas jugée en vidéo** |
| Qualité perçue des détails | 10 % | 7,5 | Alignements, marques de choix, états d'erreur, focus, 200 %, apéro passé traités |
| **Total pondéré** | | **≈ 7,3** | |

**À trancher par un humain** : le verre de l'ouverture ; l'absence de thème clair ; la
force de la typographie sur les pages de formulaire ; la lisibilité du champ des votes
pour un convive non averti (aucun test utilisateur réalisé).

## 8. État Git

| Élément | État |
|---|---|
| Branche | `feat/uxer-manifesto-void`, **locale, non poussée** |
| `main` | inchangé à `84e26aa` (égal à `origin/main` au départ) |
| Commits de la mission | `64bce60` docs · `84ab583` implémentation · `ee1d167` convergence · commit de clôture (rapport, planches, dernier resserrement) |
| Arbre de travail | propre après le commit de clôture |
| CI distante | non déclenchée (aucun push ; la CI ne tourne que sur `main` et les PR) |

Retour arrière : tout le travail de la mission est sur `feat/uxer-manifesto-void`
(4 commits au-dessus de `84e26aa`) ; supprimer la branche suffit, `main` n'a pas bougé.

## 9. Checkpoints

AUDIT_COMPLETE · CONCEPT_SELECTED · CONTRACT_LOCKED · DESIGN_SYSTEM_READY ·
FOUNDATIONS_IMPLEMENTED · SCREENS_IMPLEMENTED · MOTION_IMPLEMENTED ·
FUNCTIONAL_VALIDATION_COMPLETE · VISUAL_VALIDATION_COMPLETE · MISSION_READY_FOR_REVIEW
(enregistrés dans `.uxer/runs/manifesto-void/state.json` et `journal.ndjson`).
