# UXER_BASELINE_AUDIT — Manifesto Void

Mission UXER `manifesto-void` (dossier d'exécution : `.uxer/runs/manifesto-void/`).
Audit réalisé le 16/10/2026 **avant toute modification du frontend**.

Légende : **FAIT** (constaté dans le code ou à l'exécution, avec la source) ·
**SUPPOSÉ** (déduit, contestable) · **QUESTION** (au propriétaire).

---

## 0. Protection de l'existant (§3.4 de la mission)

| Contrôle | Résultat |
|---|---|
| Dépôt cible | `/home/ubuntu/apps/apero` — paquet `confrerie-du-petit-jaune`, distant `J-Rbs91/Apero` (FAIT, `package.json`, `git remote`) |
| Autre copie | `/home/ubuntu/apps/apero-main-ref` : copie de fichiers, **pas un dépôt Git** ; non touchée |
| Branche et commit de départ | `main` à `84e26aa` (« Merge pull request #48 … feat/uxer-redesign »), identique à `origin/main` après `git fetch` |
| Arbre de travail | propre : aucun fichier modifié, non suivi ni en conflit ; aucune remise (`stash`) ; un seul worktree |
| Mission concurrente | aucun dossier `.uxer/` ni `.agentic/` présent dans le dépôt avant cette mission ; aucun processus Vite/API du projet en cours |
| Branche de travail | `feat/uxer-manifesto-void` créée depuis `84e26aa` ; rien n'est poussé, fusionné ni déployé |
| Secrets | seul le fichier d'exemple de configuration est présent ; aucun fichier de configuration réel n'a été lu |

**Historique des refontes (à ne pas réintroduire sans analyse).**

| Tentative | État sur `main` | Traitement par cette mission |
|---|---|---|
| « Gazette des Copains » (PR #47) | **rejetée puis annulée** : commit `0fc1fbe revert: retirer entièrement la refonte Gazette des Copains` | Non réintroduite. Aucun fichier, jeton ni classe n'en est repris |
| « Fairground Baroque » (PR #48, `docs/uxer/refonte-contract.md`, `docs/uxer/design-system.md`) | **en production sur `main`** : c'est l'état de référence | Remplacée par cette mission. Ses documents deviennent historiques ; ses **invariants fonctionnels** restent opposables (voir §6) |
| « Registre de zinc » (`docs/refonte-visuelle/*`) | déjà historique | Ses invariants fonctionnels (parcours P1 à P7, textes, classes de repère) restent opposables |

**Verdict de sécurité Git : exécution sûre.** La phase de modification est autorisée.

## 1. Référence technique mesurée (état de départ)

| Contrôle | Résultat sur `84e26aa` |
|---|---|
| `npm test` (vitest) | **240/240**, 30 fichiers |
| `npm run build` (`tsc -b && vite build`) | ✓ — CSS 73,96 ko (17,37 ko gzip) ; JS principal 374,3 ko (120,1 ko gzip) ; Leaflet 43,5 ko gzip et Lottie 48,3 ko gzip en chunks séparés |
| `npm run test:functional` (Chromium + vraie API + faux GitHub) | **71/71** |
| `npm run test:nav` (contrat du geste retour) | **23/23** |
| `python3 docs/refonte-saisie/verifier-ton.py` | sortie 0, N = 25 / N₀ = 25 |
| `npm run test:functional:sqlite` | non relancé : documenté comme périmé sur `main` (`docs/uxer/refonte-contract.md` §12, bouton « Répondre à l'invitation » disparu) |
| Lint | **aucun outil de lint configuré** dans le dépôt (pas d'ESLint, pas de Stylelint) : le typecheck `tsc -b` du build en tient lieu |

Captures « avant » : 28 états × 3 largeurs (390, 1440, 320), banc hermétique hors dépôt
(scratchpad de la session, `shots/before/`). Mesures automatiques : **aucun débordement
horizontal** sur 84 rendus ; 0 erreur console hors lien volontairement inexistant.

## 2. Audit du produit

### 2.1 Finalité (FAIT, `README.md`)

Un « mini Doodle de comptoir » : une personne convoque une assemblée, propose des
créneaux (date + heure + lieu), partage un lien unique ; la tablée vote créneau par
créneau ; le verdict tombe seul (priorité aux « J'y serai », départage aux « J'me
tâte »). Sans compte. **Zéro connaissance** : chaque apéro est un blob AES-GCM, la clé
voyage dans le fragment d'URL et ne quitte jamais le navigateur.

Ton : un nom pompeux, presque chevaleresque, pour une mission triviale ; gouaille,
tutoiement, jamais moralisateur sur la boisson. Corpus de 25 tournures gelé
(`docs/refonte-saisie/TON.md`).

### 2.2 Utilisateurs (FAIT, `docs/refonte-visuelle/PO-VISION.md` §2.1, code)

Organisateur (détient `adminKey`) · invité avec lien complet (`k` + `w`) · invité en
lecture seule (`k` seul) · primo-invité arrivant par lien profond · habitué · membre
d'une tablée · utilisateur clavier / lecteur d'écran.

### 2.3 Écrans et états observés

| Route | Écran | États observés à l'exécution |
|---|---|---|
| (avant routeur) | Écran d'ouverture | Lottie du verre, une boucle, tap pour passer ; absent sur lien profond |
| (avant routeur) | Onboarding blaze | vide, erreur, confirmation modale |
| (avant routeur) | Onboarding notifications | 4 raisons, « Activer », « Plus tard » |
| `/` | Le Comptoir | avec prochain apéro / sans ; menu de la Confrérie ouvert |
| `/create` | Organiser un apéro | vide, refus (créneau incomplet), recherche de lieu plein écran |
| `/invite/:id` | Apéro | organisateur (partage en tête si personne n'a répondu), invité qui n'a pas voté (vote en tête), vote en cours, refus, a voté (récapitulatif), lecture seule, lien cassé / introuvable / annulé, apéro passé (« Servi », « Remettre ça ») |
| `/event/:id` | Ancien format | résiduel |
| `/agenda` | Au programme | liste, vide, tournées passées |
| `/notifications` | Le carnet | liste avec non lus, vide |
| `/palmares` | Palmarès | **toujours vide en production** (constat hors périmètre déjà consigné : grand livre vide en mode `api-vps`) |
| `/comptes` | Rétrospective | vide (« Lancer l'année »), avec activité |
| `/coffre` | Sauvegarde | sceller / ouvrir un coffre |
| `/registre-legal` | Registre légal | texte long |
| `/tablees`, `/tablee/:id` | Tablées | liste vide, formulaire de fondation, tablée (annales, palmarès maison, partage) |
| `*` | Lien qui coince | repli |

Formulaires : blaze ; création (créneaux multiples, lieu autocomplété OSM, pointage carte,
réglages) ; vote (blaze, une réponse par créneau, détails repliés, Traquenard-O-mètre) ;
contre-proposition (feuille plein écran) ; retouche des réglages ; mur ; fondation de
tablée ; coffre (mot de passe, fichier).

Fonctions dépendant de l'appareil (pas d'authentification) : rôle organisateur
(`adminKey` locale), droit d'écrire (`w` dans le lien), agenda et notifications (registre
local).

**Fonctionnalités supposées puis vérifiées absentes** : aucun grade, aucun compte, aucune
statistique serveur. Les « récompenses » existent (11 breloques, `src/types/badges.ts`)
mais ne s'affichent pas en production (voir `/palmares`). La mission ne les invente pas.

### 2.4 Matière réelle disponible pour une DA « Data Sublime » (FAIT)

Seules ces données existent ; elles seules peuvent devenir matière graphique :

| Donnée | Où | Usage possible |
|---|---|---|
| Matrice créneaux × convives × réponse (oui / peut-être / non) | `event.participants[].votes`, `calculateBestOptions` | champ de données du verdict |
| Créneau en tête, égalité, attente | `calculateResults.ts` | signal jaune unique |
| Identifiant public de l'assemblée (`aperoId`, `tableeId`) | URL | signature générative déterministe (jamais les clés `k`/`w`) |
| Dates des créneaux, intervalle avant l'apéro | `options[].date/time` | rythme temporel, chiffres monumentaux |
| Nombre de réponses, verres levés, mots du mur | `participants`, `cheers`, `messages` | densité |
| Pronostic Traquenard (0 à 10, moyenne) | `traquenardLevel` | barres de niveau |
| Apéros connus de l'appareil (dates, nombre de réponses) | `getLocalAperos` + cache | constellation de l'accueil |
| Compteurs annuels | `utils/yearRecap.ts` | chiffres manifestes de la rétrospective |

## 3. Audit de la direction artistique existante (Fairground Baroque)

| Dimension | Constat (captures `before/*`) | Verdict |
|---|---|---|
| Typographie | Manrope (texte) + Abril Fatface (didone d'affiche pour titres et dates) ; titres serif gras, pas d'échelle monumentale réelle sur mobile (h1 ≈ 30 px) | **Remplacer** : la didone porte le registre forain, incompatible avec un manifeste typographique grotesque |
| Palette | Vert forêt, ivoire, rouge, jaune pastis, thème clair par défaut + sombre | **Remplacer** ; conserver le **jaune** comme signal identitaire (le « Petit Jaune ») |
| Grille | Colonne de 36 rem ; deux colonnes ≥ 960 px sur l'invitation ; marges symétriques | **Reconcevoir** : composition asymétrique à grille technique |
| Espacements | Échelle 4→64 px, rythme uniforme | **Reconcevoir** : échelle étendue jusqu'aux respirations monumentales |
| Composants | Tickets perforés, arches de compteurs, ampoules, rosettes, auvent rayé | **Remplacer les ornements** ; conserver toute la sémantique (`ui/*`) |
| Navigation | Couche de menu dans l'historique, cloche, bouton retour sur toute page intérieure | **Conserver intégralement** (contrat `docs/NAVIGATION.md`, 23 tests) ; restyler |
| Transitions | Montée de page, chasse d'ampoules, poinçon, carrousel | **Remplacer** par une grammaire de mouvement dédiée |
| Illustrations | `Le-zinc.jpg` en fenêtre cintrée sur l'accueil ; `mur-vert.jpg` inutilisée | **Retirer** de l'interface : une photo de bistrot illustrée contredit le vide structurant |
| Icônes | SVG `currentColor`, 13 glyphes, aucun emoji | **Conserver** le principe ; redessiner au trait fin géométrique |
| Marque | Verre animé (Lottie, CC BY 4.0) | **Remplacer** par un point jaune ; le Lottie devient inutilisé (voir contrat §14) |
| États interactifs | Focus visible, cibles ≥ 44 px, mouvement réduit couvert | **Conserver le niveau**, redessiner |
| Mobile / bureau | Mobile soigné ; bureau = colonne élargie | **Reconcevoir le bureau** comme composition propre |

**À conserver absolument** : la voix et les textes (aucun mandat d'écriture), la structure
d'écran du kit `ui/` (libellé, mention Obligatoire/Facultatif, aide, erreur sous le
champ ; sélectionnable qui ressemble à un sélectionnable ; action épinglée ; un seul
bouton plein), l'ordre des blocs piloté par le rôle, les volets repliés.

## 4. Audit technique

| Sujet | Constat (FAIT) |
|---|---|
| Stack | React 19, React Router 8 (HashRouter), Vite 7, TypeScript 5.8, vitest 5 ; Leaflet ; lottie-web |
| Architecture | `pages/` (12), `components/` (≈ 40), `components/ui/` (7 primitives de saisie), `routes/` (arbre de navigation unique), `services/` (chiffrement, stockage, notifications), `utils/` |
| Styles | **Une seule feuille** `src/styles/global.css` (3 903 lignes, 30 couleurs hexadécimales, 9 `@keyframes`, BEM léger) ; aucun CSS-in-JS ; jetons en tête de feuille |
| Animation | CSS uniquement + Lottie pour le verre ; `prefers-reduced-motion` coupe tout (CSS) et est lu en JS dans `WineGlassMark` et `useShakeInvalid` |
| Tests | unitaires vitest (logique pure, arbre de navigation lu comme texte source), E2E Playwright maison (`tests/functional/*`) ; **aucun test ne lit `global.css`** ; les E2E s'accrochent à des classes (`.slot`, `.vote-form`, `details.disclose`, `.share code`, `.person__name`, `.notif-badge`, `.notif-bell`, `.notif-list`, `.brand-menu__panel`, `.bk`, `.field--wide input`), à des rôles et à des textes exacts |
| Contrats API | `server/` (Express) inchangé par cette mission ; client `services/aperoApiClient.ts` |
| État | `useState` local, registres `localStorage`, historique comme source de vérité du menu |
| Responsive | 2 points de rupture de mise en page (640, 960) + 400 et 359 ; `safe-area-inset` géré |
| Accessibilité | `aria-describedby` câblé par `Field`/`ChoiceGroup`/`SwitchRow`, `role=switch`, groupes de radios, modales avec piège au focus (`useModalDialog`), `role=status/alert` (24 occurrences), cible ≥ 44 px |
| Performance | CSS 17 ko gzip ; police d'affiche + Manrope auto-hébergées ; Lottie chargé paresseusement |
| Couleurs codées hors CSS | `utils/verdictImage.ts` + `recapImage.ts` (images exportées), `utils/leaflet.ts` (marqueur), `index.html` et `manifest.webmanifest` (`theme-color #11342a`), `public/favicon.svg` |

**Réutilisable sans réarchitecture** : tout. La refonte reste dans la couche de
présentation : `global.css`, balisage JSX des composants de présentation, quelques
composants visuels nouveaux, polices, couleurs codées hors CSS. Aucun service, aucune
route, aucun contrat serveur n'a besoin de changer.

## 5. Risques identifiés avant implémentation

1. **Tests accrochés aux classes** : une classe peut perdre son style, jamais disparaître du DOM.
2. **Textes testés** : aucun texte fonctionnel ne change ; aucun texte décoratif n'est ajouté au DOM sans `aria-hidden`.
3. **Contraste** sur fond quasi noir : le gris secondaire et les traits de contrôle doivent être mesurés.
4. **Titres monumentaux et noms longs** (« La Grande Manœuvre des Glaçons ») à 320 px : rupture de ligne et débordement.
5. **Performance** : un canvas animé par écran au plus, suspendu hors champ, statique en mouvement réduit.
6. **Bouton plein unique** : écarts préexistants (`/agenda` tournées passées, `/comptes`, `/tablee` non-membre) à ne pas aggraver.

## 6. Invariants fonctionnels retenus (opposables à l'implémentation)

Repris de `docs/refonte-visuelle/PO-VISION.md` §5.1 et `docs/uxer/refonte-contract.md` §6,
toujours vrais sur `main` : 13 routes + repli ; arbre de navigation unique ; couche de menu
dans l'historique ; bouton retour sur toute page intérieure ; ordre des blocs de
`/invite` piloté par le rôle ; sémantique et props des 7 composants `ui/` ; volets
repliés par défaut ; états visibles (créneau incomplet / en faute / complet, réponse
choisie, en tête, servi, non lu, barre d'action neutre / prête / bloquée) ; textes ;
classes de repère ; cibles ≥ 44 px ; texte ≥ 12 px ; focus visible ; mouvement réduit ;
aucune police ni ressource par CDN ; attribution OpenStreetMap visible.

Checkpoint : **AUDIT_COMPLETE**.
