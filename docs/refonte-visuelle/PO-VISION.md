# PO-VISION — garde-fou produit de la refonte visuelle

> **Document temporaire de pilotage de la refonte visuelle — à supprimer une fois la refonte validée.**
>
> Rédigé le 01/10/2026 par le Product Owner, à partir de la lecture du dépôt. Il ne
> modifie rien : il dit ce que la refonte peut changer, ce qu'elle ne doit pas
> toucher, et comment vérifier qu'elle n'a pas dérivé. Il est **opposable** : un
> changement qui le contredit doit soit être retiré, soit être tranché par le
> propriétaire du produit (section 9).

**Objet de la refonte (mandat reçu).** Supprimer l'effet « carte dans une carte dans
une carte » : aujourd'hui une même zone peut empiler jusqu'à quatre surfaces
bordées. Cas mesurable dans le code : le formulaire de vote rend
`.sheet` (verre dépoli) > `.formsec` (bloc numéroté) > `.slot` (créneau) >
`.choice` (carte de réponse) (`src/components/VoteForm.tsx:363-421`,
`src/components/EventOptionMobileCard.tsx:73-109`). Même empilement à la
création : `form.sheet` > `.formsec` > `.slot.slot--editable` > champs
(`src/pages/CreateEventPage.tsx:403-500`).

**Légende utilisée partout dans ce document.**

- **FAIT** : constaté dans le dépôt, avec le chemin.
- **INFÉRENCE** : déduit des faits, non écrit tel quel. Peut être contesté.
- **QUESTION OUVERTE** : à trancher par le propriétaire du produit. Liste complète en section 9.

---

## 1. Vision produit

| Élément | Contenu | Statut |
|---|---|---|
| Ce que c'est | « un mini Doodle de comptoir : une personne convoque une assemblée, propose plusieurs combinaisons date + heure + lieu, puis partage un lien unique. La tablée invitée vote uniquement sur cette assemblée. » | FAIT, `README.md:5` |
| Problème résolu | Se mettre d'accord pour se retrouver quelque part, sans compte ni inscription, entre amis. | FAIT, `README.md:7` |
| Promesse | Créer en un formulaire, partager un lien, la tablée tranche ; le verdict tombe tout seul (priorité aux « J'y serai », départage aux « J'me tâte »). | FAIT, `README.md:192-199`, `src/pages/HomePage.tsx:131-134` |
| Contrat de ton | « une app de comptoir, absurde et pleine de gouaille, ouverte à toute la tablée » ; contraste voulu entre un nom pompeux, presque chevaleresque, et une mission triviale. Aucune présomption sur le lieu ni sur ce qu'on boit. | FAIT, `README.md:7-9` |
| Promesse technique visible | Zero-knowledge : le serveur ne voit que du chiffré, les clés vivent dans le fragment d'URL. Aucune ressource tierce par CDN (RGPD). | FAIT, `README.md:15-25`, `README.md:327-334`, `CREDITS.md:21-25` |
| Pour qui | Des bandes d'amis qui se retrouvent dans un bar, une terrasse ou « chez Dédé ». Pas de cible professionnelle. | INFÉRENCE (vocabulaire, tablées, palmarès) |
| Caractère | L'humour est porté par **les mots** (noms cérémoniels, registre de la Confrérie) et par **le décor** (photo d'un zinc et d'un mur vert, accent jaune pastis). L'interface elle-même est sobre et fonctionnelle depuis la refonte de saisie. | INFÉRENCE, appuyée sur `docs/DESIGN-SYSTEM.md:3-6` et `src/App.tsx:2,17-19` |

**Ce que la refonte précédente a établi et qui reste vrai.** Les règles d'interface
« ne sont pas des préférences esthétiques : chacune répond à un reproche précis
fait à l'ancienne version, où l'on ne savait ni quoi remplir, ni où appuyer pour
enregistrer, ni quels champs permettaient de choisir quelque chose »
(FAIT, `docs/DESIGN-SYSTEM.md:3-6`). La refonte visuelle ne doit rouvrir aucun de
ces trois reproches.

---

## 2. Personas et contextes d'usage

### 2.1 Rôles réels (tirés du code et des données)

| Persona | Ce qu'il peut faire | Source |
|---|---|---|
| **Organisateur** (créateur, détient `adminKey` sur son appareil) | Créer, partager le lien, « Sonner le rappel », retoucher les réglages, annuler l'apéro, exporter `.ics` et image du verdict | FAIT, `src/pages/InvitePage.tsx:379-411,494-526`, `README.md:219-225` |
| **Invité avec lien complet** (`k` + `w`) | Voter créneau par créneau, modifier son vote, trinquer, proposer un autre créneau, écrire sur le mur, déclarer des renforts, pronostic Traquenard | FAIT, `src/pages/InvitePage.tsx:413-442`, `src/components/VoteForm.tsx` |
| **Invité en lecture seule** (`k` sans `w`) | Consulter les créneaux, rien d'autre | FAIT, `src/pages/InvitePage.tsx:443-479` |
| **Primo-invité** arrivant par lien profond | Pas d'écran d'ouverture ; onboarding blaze puis notifications, puis l'apéro | FAIT, `src/App.tsx:24-32,53-57` |
| **Habitué** qui rouvre l'app | L'accueil montre d'abord le prochain apéro (« Continuer » avant « Nouvelle partie ») | FAIT, `src/pages/HomePage.tsx:12-14,106-125` |
| **Membre d'une tablée** | Bande persistante, annales, palmarès maison, « Convoquer la tablée » | FAIT, `README.md:245-253`, `src/pages/TableePage.tsx` |
| **Utilisateur clavier / lecteur d'écran** | Travail explicite fait sur `aria-describedby`, anneau de focus, légendes | FAIT, `docs/refonte-saisie/DECISIONS.md` D13, D14 |

Personas de test nommés (utiles pour les vérifications) : Jojo l'Organisateur,
Bob Ricard et Chantal Suze (invités), Denis le Curieux (sans lien), Édith Cognac
(second organisateur). FAIT, `tests/functional/README.md`.

### 2.2 Contexte d'usage

| Contexte | Statut |
|---|---|
| **Mobile d'abord, et quasi seulement.** Colonne `max-width: 480px`, `100dvh`, `safe-area-inset`, aucune media query de largeur, retours haptiques, PWA installable, gestes retour Android/iOS traités | FAIT, `src/styles/global.css:205-225`, `public/manifest.webmanifest`, `docs/NAVIGATION.md` |
| **Lisibilité « au comptoir »** : la taille minimale de 12 px a été posée parce que l'ancien 9,5 px était « illisible au comptoir » | FAIT, `src/styles/global.css:87-88` |
| Thème sombre uniquement (`color-scheme: dark`) | FAIT, `src/styles/global.css:30` |
| Usage d'une main, lumière tamisée, attention partagée (on est avec des gens) | INFÉRENCE |
| Sur ordinateur : la même colonne de 480 px centrée | FAIT (absence de breakpoints) |
| Viewports déjà utilisés pour les preuves : 390 × 844, 390 × 780, 420 × 900, 320 × 640 | FAIT, `tests/functional/*.mjs`, `docs/refonte-saisie/AUDIT-3.md`, `AUDIT-5.md` |

### 2.3 Fréquence par écran

Aucune donnée d'usage n'existe dans le dépôt : **toute cette table est une INFÉRENCE**,
fondée sur le rôle de chaque écran. Aucun écran n'est « quotidien » au sens strict :
c'est une app d'événements ponctuels.

| Écran | Route | Qui | Fréquence relative |
|---|---|---|---|
| Apéro (invitation, vote, verdict, mur) | `/invite/:aperoId` | Tous, organisateur compris | **La plus haute** : chaque invité y arrive, y revient voir le verdict et le mur. Seule page du « parcours critique » gardée dans le chunk principal (FAIT, `src/routes/AppRouter.tsx:11-13`) |
| Accueil (Le Comptoir) | `/` | Habitués | Haute : chaque ouverture de l'app |
| Onboarding blaze + notifications | (avant le routeur) | Tout nouvel appareil | Une fois par appareil, mais **100 % des nouveaux** passent par là, primo-invités compris |
| Organiser un apéro | `/create` | Organisateurs | Moyenne : une fois par apéro, mais conditionne tout le reste |
| Au programme (l'ardoise) | `/agenda` | Habitués | Moyenne |
| Notifications (le carnet) | `/notifications` | Habitués | Moyenne, via la cloche |
| Tablées, une tablée | `/tablees`, `/tablee/:id` | Bandes régulières | Faible à moyenne |
| Palmarès, Rétrospective | `/palmares`, `/comptes` | Curieux | Faible |
| Sauvegarde (Coffre), Registre légal | `/coffre`, `/registre-legal` | Rare | Rare |
| Apéro ancien format, lien cassé | `/event/:id`, `*` | Résiduel | Rare |

---

## 3. Parcours critiques (à ne jamais dégrader)

Pour chacun : les écrans, puis **ce qui doit rester lisible en un coup d'œil** au
premier écran, sans défiler sauf mention, en 390 × 844.

### P1. Répondre à une invitation (invité, lien complet, pas encore voté)

Écrans : onboarding blaze (si nouvel appareil) → `/invite/:aperoId`.
L'ordre de page est piloté par le rôle et figé pour la visite : vote d'abord si pas
encore voté (FAIT, `src/pages/InvitePage.tsx:338-359,619-634`).

En un coup d'œil :
- le **nom cérémoniel** de l'apéro, « Une invitation de <organisateur> », le
  nombre de créneaux et de réponses (carte de tête `.sheet--hero`, `.factline`) ;
- pour **chaque créneau** : date · heure, troquet, son état « À voter » /
  « Répondu » ou « En tête », et ses **trois réponses** (« J'y serai »,
  « J'me tâte », « Sans moi ») **sans ambiguïté sur le créneau auquel elles
  appartiennent** ;
- la barre d'action épinglée : statut (« Encore 2 créneaux à trancher. ») et
  **le seul bouton plein** « Envoyer ma réponse ».

Après envoi : « C'est émargé. Le registre te remercie. », récapitulatif « Ta
réponse est au registre », verdict.

### P2. Lire le verdict (tout le monde, après coup)

Écran : `/invite/:aperoId`, panneau `MobileResultsPanel`.
En un coup d'œil : « Le rendez-vous retenu » (ou « Le comptoir délibère » tant que
seul l'organisateur a voté), la date · heure, lieu gagnante, les trois compteurs
Présences / Hésitations / Désertions, la mini-carte si le lieu est localisé.
Le verdict doit rester **la zone la plus distinguable** de la page après la
carte de tête (aujourd'hui : seul bloc teinté pastis, FAIT
`src/styles/global.css`, règle `.verdict`).

### P3. Organiser un apéro (organisateur)

Écrans : `/` ou `/agenda` ou une tablée → `/create` → `/invite/:aperoId`
(le formulaire est **remplacé** dans l'historique, FAIT
`docs/NAVIGATION.md` §2 « Le tunnel de création »).
En un coup d'œil : « Organiser un apéro », la phrase « Une seule chose est
obligatoire : au moins un créneau complet », le bloc 1 numéroté « Les
créneaux » avec son compteur `n/m`, le créneau 1 avec Jour, Heure, Le troquet
(loupe visible dans le champ), et « Créer l'apéro » épinglé.
Le reste (carte de visite, réglages) est second plan, réglages repliés.

### P4. Rameuter (organisateur seul au registre)

Écran : `/invite/:aperoId`. Le partage passe en tête quand personne n'a répondu
(FAIT, `src/pages/InvitePage.tsx:382-384`).
En un coup d'œil : « Personne n'a encore répondu. Envoie le lien, c'est la seule
porte d'entrée. », le lien masqué, le bouton de partage (seul bouton plein).

### P5. Reprendre là où on en était (habitué)

Écran : `/`. En un coup d'œil : la carte « Prochain rendez-vous » / « Ça vote au
comptoir », le nom, la date, le nombre de réponses, « Ouvrir l'apéro » (plein) ;
« Organiser un apéro » passe alors en bouton secondaire.

### P6. Remettre ça (apéro passé)

Écrans : `/invite/:aperoId` (apéro passé) ou `/agenda` → `/create` pré-rempli.
En un coup d'œil : le tampon « Servi » sur le verdict, la carte « Remettre ça » /
« La tournée suivante » et son bouton.

### P7. Revenir en arrière

Tous écrans intérieurs : bouton retour de l'en-tête (`MobileHeader`) et geste
système doivent mener au même écran ; six vérifications de
`docs/NAVIGATION.md` §4. Visuellement : la flèche de retour reste présente,
à 44 px minimum, sur toute page intérieure.

---

## 4. Identité : ce qui est préservé, ce qui est refondable

### 4.1 À PRÉSERVER (aucun changement sans accord du propriétaire)

**Nom et marque.**
- « La Confrérie du Petit Jaune », nom court « La Confrérie » (FAIT,
  `public/manifest.webmanifest`, `index.html`).
- Surtitre « Institution officieuse du comptoir » (accueil, splash).
- Les noms d'écran tels qu'affichés : Le Comptoir, Au programme / L'ardoise du
  comptoir, Tablées, Palmarès / Tableau d'honneur, Rétrospective, Le carnet du
  comptoir, Sauvegarde / Le Coffre de la Confrérie, Le registre légal
  (FAIT, `src/components/ConfrerieMenuPanel.tsx`, en-têtes des pages).

**Vocabulaire fonctionnel protégé** (la « langue de l'app », hors corpus de ton
mais intouchable, FAIT `docs/refonte-saisie/TON.md` §0) : blaze, troquet /
comptoir / rade, tablée, Confrérie, émarger, registre, apéro. S'y ajoutent, par
le même raisonnement (INFÉRENCE) : zinc, ardoise, assemblée, convoquer /
convocation, nom cérémoniel, breloques, Traquenard-O-mètre, Trinquer / Verre
levé, Remettre ça, Servi, mioches / marmaille, renforts, déserteurs, « le cul
entre deux chaises ».

**Libellés de vote** : « J'y serai », « J'me tâte », « Sans moi » (FAIT,
`src/components/VoteForm.tsx:48-52`, exclus du corpus parce qu'ils sont le
contrôle principal).

**Corpus de ton gelé** : 25 tournures, texte intouchable, seul le placement peut
bouger (FAIT, `docs/refonte-saisie/TON.md`, contrôle
`python3 docs/refonte-saisie/verifier-ton.py`). La refonte visuelle ne déplace
**aucune** tournure : le placement a déjà été traité par la routine de saisie.

**Les autres textes d'interface** (punchlines d'états vides, ledes, splash) ne
sont pas gelés formellement, mais la refonte visuelle n'a **aucun mandat
d'écriture** : elle ne réécrit, ne raccourcit ni ne supprime aucun texte.

**Palette** (FAIT, `src/styles/global.css:37-78`) :

| Jeton | Valeur | Rôle |
|---|---|---|
| `--pastis` | `#f4c542` | **Accent unique** : action principale, focus, élément choisi, verdict |
| `--pastis-soft` | `#ffe39a` | Survol, texte d'accent clair |
| `--green-900` à `--green-600` | `#0a241b` … `#1d704d` | Fond comptoir |
| `--comptoir-open` | `#182c1f` | Fond continu du démarrage, `theme_color` du manifeste |
| `--cream` | `#fff7e6` | Texte |
| `--ink` | `#241a12` | Texte sur pastis |
| `--danger` / `--danger-strong` | `#ff8f85` / `#b8322b` | **État** « ça coince », jamais décoratif |
| `--ok` | `#9fdcae` | **État** « c'est passé », jamais décoratif |
| `--bar-red`, `--calm-blue` | `#b8322b`, `#2f6fb0` | Échelle du Traquenard-O-mètre (bleu froid → pastis → rouge chaud, `src/utils/traquenardScale.ts`) |

Règle associée : « Accent unique : `--pastis`. Le rouge et le vert sont des
états, pas des couleurs de marque » (FAIT, `docs/DESIGN-SYSTEM.md:138-139`).

**Typographie** : Manrope seule, auto-hébergée, jamais par CDN (FAIT,
`src/styles/global.css:1-27`, `CREDITS.md:13-25`). Aucune nouvelle police sans
décision du propriétaire.

**Assets et décor** :
- `src/assets/art/Le-zinc.jpg` en fond fixe de toute l'app, sous un voile de
  dégradé (`--overlay-scene`, `--overlay-deep`) (FAIT, `src/App.tsx:2,17-19`,
  `src/styles/global.css:55-61,160-199`) ;
- `src/assets/art/mur-vert.jpg` pour l'écran d'ouverture ;
- l'animation Lottie du verre (`src/assets/wine-glass.json`, crédits CC BY 4.0
  obligatoires) et la blague assumée « le verre est rouge et le nom parle de
  jaune » (FAIT, `src/components/SplashScreen.tsx:16-20`) ;
- icônes : SVG monochromes `currentColor`, **aucun emoji**, aucune ressource
  IconScout (FAIT, `README.md:307-315`).

**Ton** : gouaille, emphase cérémonieuse, jamais vulgaire, jamais moralisateur
sur la boisson ; tutoiement ; écriture inclusive au point médian ponctuelle
(« invité·e ») ; **aucun tiret cadratin dans un texte visible** (FAIT,
`CONTRIBUTING.md`, `docs/DESIGN-SYSTEM.md:146-153`).

### 4.2 Librement REFONDABLE (c'est le mandat)

- **Surfaces** : fond, bordure, ombre, flou des conteneurs `.sheet`,
  `.formsec`, `.slot`, `.choice`, `.disclose`, `.verdict`, `.share`, `.recap`,
  `.wall-item`, `.cnt`, `.badge-medal`, `.notif-item`, `.draft-resume`,
  `.actionbar`. Le nombre de niveaux de surface est **la** cible.
- **Rayons** : valeurs et usage, à condition de rester dans **une seule échelle**
  (règle existante, FAIT `docs/DESIGN-SYSTEM.md:140`). Constat : des rayons
  hors échelle existent déjà (16, 14, 13, 9 px en dur dans `.verdict`, `.share`,
  `.wall-item`, `.cnt`, `.badge-medal`) : la refonte peut les résorber, pas en
  ajouter.
- **Ombres** : libres, sauf que l'ombre portée du bouton plein le distingue de
  tout le reste (FAIT, `src/styles/global.css:545-551`) : ce rôle de
  distinction doit survivre, par ce moyen ou un autre.
- **Espacements et composition** : marges, gouttières, regroupement par
  proximité, séparateurs, alignements. **Pas** l'ordre des blocs (section 5.2).
- **Hiérarchie typographique fine** dans Manrope : tailles et graisses, sous
  réserve du plancher de 12 px et de la hiérarchie d'erreurs (D5 : `.feedback`
  un cran sous `.field__error`).
- **Traitement de la carte de tête et du verdict**, tant qu'ils restent les deux
  zones dominantes de la page d'apéro.
- **Le verre dépoli** : refondable **sous réserve** de la QUESTION OUVERTE Q1.
  Défaut provisoire tant qu'elle n'est pas tranchée : au plus **un** niveau de
  verre (surface de premier niveau posée sur le décor), jamais de verre dans du
  verre.

---

## 5. Invariants fonctionnels et dérives à surveiller

### 5.1 Ce qui ne change pas

**Routes et navigation.**
- Les 13 routes et la route de repli de `src/routes/AppRouter.tsx`, inchangées.
- `src/routes/navigationTree.ts` reste la seule déclaration de l'arbre ;
  navigation par `AppLink` / `aller()` uniquement ; menu = couche dans
  l'historique ; bouton retour `MobileHeader` sur toute page intérieure
  (FAIT, `docs/NAVIGATION.md` §2, §5).

**Comportements.**
- Ordre de la page d'apéro piloté par le rôle (`shareFirst`, `voteFirst` figé
  pour la visite), FAIT `src/pages/InvitePage.tsx:338-384,619-671`.
- Les sept composants de `src/components/ui/` (`Field`, `ChoiceGroup`,
  `SwitchRow`, `ActionBar`, `FormSection`, `FormSheet`, `Disclosure`) gardent
  leur sémantique et leurs props : « Ne pas rouvrir ce qui fonctionne » (FAIT,
  `docs/refonte-saisie/DECISIONS.md` D2). Le restyle est permis, pas le
  changement de comportement.
- Les quatre règles de `docs/DESIGN-SYSTEM.md` : libellé au-dessus + mention
  `Obligatoire`/`Facultatif` + aide + erreur sous le champ ; ce qui se
  sélectionne ressemble à quelque chose qui se sélectionne ; action épinglée
  sous le pouce avec statut ; **un seul bouton plein par écran**.
- Divulgation progressive : le second plan reste replié (`Disclosure` sur « Qui
  vient ? », « Le mur du comptoir », « Coulisses de l'organisation », « Ajouter
  des détails », « Réglages de l'assemblée »), avec leurs résumés et pastilles
  de compte.
- États visibles : créneau incomplet / en faute / complet, bloc numéroté fait
  (pastille verte), réponse choisie (pleine, et `danger` / `warn` pour « Sans
  moi » / « J'me tâte »), récapitulatif vert, apéro passé en retrait, tampon
  « Servi », « En tête », notification non lue, barre d'action `neutral` /
  `ready` / `blocked`.
- Mécanismes de la routine de saisie : secousse et remontée du regard
  (`useShakeInvalid`, D6), barre jamais « prête » pendant un refus (D7),
  bandeau de reprise de brouillon (D8), loupe du champ lieu (D11), overlay plein
  écran de recherche du lieu (D4, ne pas le retirer sans preuve sur clavier
  virtuel réel).

**Textes fonctionnels.** Aucun texte modifié, notamment ceux que les tests lisent
(section 5.1, Tests). Aucun tiret cadratin introduit.

**Accessibilité existante (plancher).**
- Cibles tactiles ≥ 44 px (bloc « Cibles tactiles » de `global.css`) ;
  exceptions connues et non aggravables : `.cheer-btn` 40 px, `a.notif-bell`
  42 px (FAIT, `docs/refonte-saisie/BACKLOG.md` items 16, 23).
- Anneau de focus commun `3px solid var(--pastis)`, `outline-offset: 2px`, y
  compris sur `.locsearch__input` (FAIT, D14).
- `aria-describedby` câblé par les composants (`Field`, `ChoiceGroup`,
  `SwitchRow`) ; `role="switch"`, groupes de radios, `.sr-only` sur les légendes
  répétées.
- `prefers-reduced-motion` couvert (blocs en fin de feuille).
- Aucun débordement horizontal à 320 px (mesuré à 0, FAIT `AUDIT-5.md` §6.1).
- Contrastes mesurés à respecter ou dépasser : tournures sous ligne de réglage
  7,94 : 1 et 9,31 : 1 ; anneau du champ lieu 11,14 : 1 (FAIT, `JOURNAL.md`
  itération 5).
- La sélection d'une réponse ne repose pas sur la couleur seule (pastille
  remplie `.choice__mark`).

**Données et licences.** Aucun changement de modèle, de stockage, de chiffrement.
Aucune ressource par CDN, aucune nouvelle dépendance npm, aucun actif sans
licence de redistribution, attribution « © les contributeurs OpenStreetMap »
visible partout où des données OSM sont restituées (FAIT, `CREDITS.md:67-80`).

**Tests** (dernier état connu, FAIT `JOURNAL.md` itération 5, 04/09/2026) :
`npm test` 236 tests / 29 fichiers ; `npm run test:functional` 71/71 ;
`npm run test:nav` 23/23 ; `verifier-ton.py` N = 25.
Les tests fonctionnels s'appuient sur des **classes CSS comme points d'accroche** :
`.slot`, `.vote-form`, `.vote-form .slot`, `form .slot`, `details.disclose`,
`summary`, `.notif-badge`, `.notif-bell`, `.notif-list`, `.share code`,
`.person__name`, `.field--wide input`, `.brand-menu__panel`,
`input[type="date"]`, `input[type="time"]`, et sur des rôles et textes exacts
(« Créer l'apéro », « + Ajouter un créneau », « Proposer un autre créneau »,
« Modifier ma réponse », « Annuler l'apéro », « Oui, tout rayer », dialogue
« Proposer un autre créneau », radios de vote, etc.). FAIT,
`tests/functional/run.mjs`, `navigation.mjs`.
**Règle** : une classe peut perdre son style, elle ne disparaît pas du DOM ; si un
renommage est indispensable, le test est mis à jour dans le même changement,
**sans retirer une seule assertion**.

### 5.2 Dérives à surveiller (liste de contrôle)

| # | Dérive | À quoi on la reconnaît |
|---|---|---|
| D-1 | **Perte de regroupement** en retirant les cartes | Sur la page de vote, on ne sait plus à quel créneau appartient une rangée « J'y serai / J'me tâte / Sans moi » ; deux créneaux se lisent comme un seul bloc |
| D-2 | **Perte d'affordance de sélection** | Les `.choice` deviennent du texte ou des radios natives nues ; on ne voit plus ce qui est cliquable ni ce qui est choisi (règle 2 de `DESIGN-SYSTEM.md`) |
| D-3 | **Perte d'état** | « À voter » / « Répondu », créneau incomplet (bord pastis), créneau en faute (rouge), bloc fait (vert) ne se distinguent plus une fois les bordures retirées |
| D-4 | **Suppression d'information** « pour épurer » | Disparition de `.factline`, `.tagrow`, compteurs, nombre de verres levés, « proposé par », lien carte, jauge Traquenard, attribution OSM, résumé et pastille des volets, numéros d'étape et compteurs `n/m` |
| D-5 | **Changement de ton** | Texte réécrit, raccourci, « neutralisé », punchline d'état vide supprimée, eyebrow retiré, tiret cadratin introduit, `verifier-ton.py` qui sort en 1 |
| D-6 | **Sur-minimalisme générique** | Fond uni sombre, cartes blanches ou grises arrondies, plus de décor zinc visible, pastis réduit à un détail : l'app pourrait habiller n'importe quel outil (échec du test de substitution, section 6) |
| D-7 | **Perte du caractère « troquet »** | Décor photo masqué par un aplat opaque partout, splash ou verre animé retiré, vocabulaire d'écran remplacé par des termes génériques (« Événements », « Paramètres ») |
| D-8 | **Dilution de l'accent** | Pastis utilisé en décor (titres, fonds, séparateurs), ou plus d'un bouton plein visible par écran |
| D-9 | **Contraste effondré** | Texte posé directement sur la photo sans voile ni surface : ledes, aides et méta sous 4,5 : 1 à certaines positions de défilement |
| D-10 | **Texte < 12 px** | Nouvelle règle sous 12 px, ou règle existante réduite. Constat de départ : **23 règles** déjà sous 12 px malgré la règle écrite (`.field__req` 10,5, `.cnt span` 9,5, `.agenda-lead` 9,5, `.palmares-tag` 9,5, `.traq__title` 10, `.slot__state` 11, `.formsec__status` 11, etc.) |
| D-11 | **Régression mobile** | Débordement à 320 px, barre d'action qui masque définitivement un contenu, `safe-area` ignorée, cible < 44 px, page qui ne défile plus dans `.mobile-page__inner` |
| D-12 | **Composant UI remplacé** | `Disclosure` réécrit sans `<details>/<summary>`, `FormSheet` remplacé par un volet partiel, `ChoiceGroup` en `<select>` : casse tests et accessibilité |
| D-13 | **Focus affaibli** | `outline: none` sans anneau équivalent, anneau qui n'est plus pastis 3 px |
| D-14 | **Nouvel écart non décidé** | Nouvelle police, dégradés, glassmorphism accentué, animations d'entrée, illustrations, emoji, thème clair : tout ajout expressif non demandé |
| D-15 | **Hiérarchie de page renversée** | Le verdict ou la carte de tête ne dominent plus ; un volet de second plan a plus de poids visuel que le geste attendu |
| D-16 | **Ordre ou parcours modifiés** au prétexte de composition | Blocs réordonnés sur `/invite`, étape de formulaire fusionnée, volet déplié par défaut |
| D-17 | **Nouvelle dépendance ou poids** | Ajout à `package.json`, framework CSS, CSS livré qui grossit sans raison (référence : 59 913 octets, FAIT `JOURNAL.md` it. 5) |
| D-18 | **Animation sans repli** | Nouveau mouvement non couvert par `prefers-reduced-motion` |

---

## 6. Critères d'acceptation PO

Chaque critère a une méthode. « Réussie » = tous les critères R tiennent.
« Dérivée » = un seul critère D est constaté.

### 6.1 La refonte est réussie si

| # | Critère | Méthode de vérification |
|---|---|---|
| R1 | **Profondeur de surface ≤ 2** sur toutes les pages : une surface de premier niveau sur le décor, au plus un niveau d'élément distingué dedans (ex. la carte de réponse) | Playwright, viewport 390 × 844 : pour chaque élément visible, compter ses ancêtres (lui compris) ayant un fond non transparent, une bordure visible ou une ombre. Maximum relevé ≤ 2 sur `/`, `/create`, `/invite/:id` (vote ouvert, récapitulatif, apéro passé), `/agenda`, `/tablee/:id`, `/notifications`. Point de départ : 4 sur le vote |
| R2 | **Tous les tests passent, sans assertion retirée** | `npm test`, `npm run test:functional`, `npm run test:nav` verts ; `git diff tests/` ne retire aucune assertion ; `python3 docs/refonte-saisie/verifier-ton.py` sort en 0, N = 25 |
| R3 | **Aucun texte modifié** | Pour chaque écran et état listés en R1, comparer `document.body.innerText` normalisé (espaces, apostrophes) avant / après : différence vide. `git diff src/**/*.tsx` ne touche aucun littéral affiché |
| R4 | **Regroupement par créneau sans ambiguïté** (P1) | Test de lecture à 5 personnes (ou à défaut 3) sur capture 390 × 844 d'un vote à 3 créneaux : chacun associe correctement chaque rangée de réponses à son créneau. Mesure complémentaire : l'écart vertical entre deux créneaux est au moins le double de l'écart interne d'un créneau |
| R5 | **États toujours distinguables** | Captures **réellement regardées** des états : créneau incomplet, en faute, complet ; réponse choisie yes/maybe/no ; bloc fait ; barre neutral/ready/blocked ; apéro passé ; notification non lue. Chaque état se distingue de son voisin **sans la couleur seule** (forme, pastille, texte ou trait) |
| R6 | **Un seul bouton plein par écran** | Playwright : compter les `.button--primary` visibles par écran et par état. 1 partout, sauf exceptions préexistantes non aggravées (Q4) |
| R7 | **Contraste** | Sur **pixels décodés** (méthode déjà utilisée en `AUDIT-5.md` §0) : texte courant ≥ 4,5 : 1, contour des cartes de réponse et anneau de focus ≥ 3 : 1, à trois positions de défilement par écran (haut, milieu, fin) pour tenir compte du décor fixe |
| R8 | **Plancher typographique** | `grep -nE "font-size: (9\|10\|11)(\.[0-9]+)?px" src/styles/global.css` (barres non échappées dans la commande réelle) : aucune règle nouvelle ; nombre ≤ 23 ; toute règle d'une surface refondue est remontée à ≥ 12 px |
| R9 | **Mobile** | 320 × 640 : `scrollWidth == clientWidth` sur tous les écrans de R1 ; cibles ≥ 44 px (sauf `.cheer-btn`, `.notif-bell`, non réduites) ; `safe-area` conservée |
| R10 | **Focus** | Tabulation sur `/create` et sur le vote : chaque arrêt porte `3px solid rgb(244, 197, 66)` |
| R11 | **Coup d'œil des parcours** | Pour P1 à P6, capture 390 × 844 du premier écran : les éléments listés en section 3 sont visibles sans défiler (sauf mention). Grille cochée, un élément manquant = échec |
| R12 | **Identité tenue** (tests de `distinctive-direction.md` §7) | *Substitution* : masquer nom et données sur 3 captures (`/invite`, `/agenda`, `/registre-legal`) et les poser à côté d'une app d'agenda générique : un tiers les rattache au même produit. *Trois écrans* : décor zinc, pastis et voix identifiables sur les trois |
| R13 | **Pas de nouvelle dépendance, poids maîtrisé** | `git diff package.json` vide ; CSS livré (`npm run build`) ≤ 59 913 octets × 1,05 |
| R14 | **Mouvement** | Toute animation ajoutée a sa règle `prefers-reduced-motion: reduce` ; vérifié en émulation |
| R15 | **Navigation intacte** | `npm run test:nav` 23/23 et les six vérifications manuelles de `docs/NAVIGATION.md` §4 sur un vrai téléphone |

### 6.2 La refonte a dérivé si

| # | Signal | Méthode |
|---|---|---|
| X1 | Un texte affiché a changé, disparu ou été ajouté | Diff `innerText` de R3 non vide |
| X2 | Une information de la liste D-4 manque sur un écran | Diff `innerText` + inventaire par écran |
| X3 | Un test a été supprimé, désactivé ou affaibli | `git diff tests/` |
| X4 | Une couleur hors palette 4.1 apparaît, ou le pastis sert de décor | `grep -oE "#[0-9a-fA-F]{6}" src/styles/global.css` comparé à l'existant ; revue des usages de `--pastis` |
| X5 | Une police, un framework, un CDN ou une dépendance est ajouté | `git diff package.json index.html src/styles/global.css` |
| X6 | Le décor photo n'est plus visible sur aucune page intérieure, sans décision Q3 | Capture des pages de R1 |
| X7 | Une cible passe sous 44 px, un contraste sous plancher, un débordement apparaît à 320 px | R7, R9 |
| X8 | L'ordre des blocs de `/invite` ou de `/create` a changé | Comparaison de l'ordre des titres et eyebrows avant / après |
| X9 | Un volet replié par défaut est devenu déplié, ou l'inverse | État initial des `details` avant / après |
| X10 | Le test de substitution R12 échoue | R12 |

---

## 7. Priorisation des écrans

Du plus vu et du plus critique au moins vu. La justification combine fréquence
(section 2.3), criticité du parcours (section 3) et profondeur d'imbrication
actuelle (le mal à corriger).

| Rang | Écran / composants | Justification |
|---|---|---|
| 1 | **Page d'apéro `/invite/:aperoId`** : `VoteForm`, `EventOptionMobileCard`, `ChoiceGroup`, `MobileResultsPanel`, `MobileShareBox`, `ParticipantList`, `ComptoirWall`, `TableeAttachSection`, `VerdictExportSection`, feuilles `AlternativeOptionForm` et `AperoSettingsForm` | Écran le plus vu par tous les rôles ; porte P1, P2, P4, P6 ; imbrication maximale (4 niveaux) ; chunk principal |
| 2 | **Organiser un apéro `/create`** : `FormSection`, `slot--editable`, `LocationField`, `Disclosure`, `ActionBar` | Porte P3, conditionne l'existence de tout apéro ; imbrication 3 à 4 niveaux ; partage les mêmes composants que le rang 1, donc à traiter juste après pour la cohérence |
| 3 | **Accueil `/`** et **onboarding** (blaze, notifications) | Première impression de 100 % des nouveaux appareils ; P5 ; peu d'imbrication, mais c'est là que l'identité (décor, nom, ton) se juge d'abord |
| 4 | **Au programme `/agenda`** | Retour régulier des habitués ; `sheet` > `slot` répété ; contient une exception au bouton plein unique (Q4) |
| 5 | **Notifications `/notifications`** | Atteint par la cloche ; liste d'items bordés dans une surface |
| 6 | **Tablées `/tablees`, `/tablee/:id`** | Usage régulier mais minoritaire ; `sheet` > `slot` dans les annales ; deux boutons pleins possibles (Q4) |
| 7 | **Palmarès, Rétrospective** | Consultation occasionnelle ; médailles et compteurs en cartes dans des cartes |
| 8 | **Sauvegarde, Registre légal, apéro ancien format, lien cassé, écrans de chargement** | Rares ; à aligner en dernier, sans création de motif propre |

Règle de séquencement : **on ne touche pas un composant partagé** (`ui/*`,
`.slot`, `.choice`, `.disclose`) pour un écran de rang bas avant d'avoir validé
son rendu sur les rangs 1 et 2.

---

## 8. Règle de décision en cas de doute

Entre deux options, appliquer **dans cet ordre** ; la première question qui
départage tranche.

1. **Invariant (section 5.1) ou plancher d'accessibilité touché ?** L'option qui
   le casse est éliminée. Ce n'est pas un arbitrage.
2. **Laquelle garde la tâche du parcours lisible en un coup d'œil** (section 3),
   surtout P1 ? La tâche prime toujours sur l'effet.
3. **Laquelle conserve toute l'information et tous les états ?** Replier,
   regrouper, hiérarchiser : oui. Supprimer : non.
4. **Laquelle conserve l'affordance** (ce qui se clique ressemble à ce qui se
   clique, un seul bouton plein) ?
5. **Laquelle réduit le plus l'imbrication** de surfaces ? C'est l'objectif de la
   refonte, il départage à égalité sur les points 1 à 4.
6. **Laquelle préserve le caractère** (décor zinc, pastis, voix) ? Corriger la
   propriété qui échoue, conserver le caractère qui tient : on ne neutralise pas
   un choix au seul motif qu'une version plus neutre serait plus simple à
   vérifier (principe déjà appliqué, `DECISIONS.md` D2 point 4).
7. **Toujours à égalité : la plus proche de l'existant et la moins coûteuse**
   (moins de fichiers, moins de CSS, réversible).

Deux règles de forme :
- **Mesurer plutôt qu'argumenter.** Un contraste, un regroupement, une cible se
  mesurent (section 6) ; une préférence esthétique n'est jamais une raison
  suffisante, ni pour garder ni pour changer.
- **Escalader, ne pas trancher en douce.** Si le doute porte sur le ton, le
  vocabulaire, la palette, le décor ou l'une des questions de la section 9, on
  applique le défaut provisoire indiqué et on consigne la question pour le
  propriétaire.

---

## 9. Questions ouvertes (à trancher par le propriétaire)

Les questions **bloquantes** empêchent une décision visuelle structurante ; les
autres ont un défaut provisoire utilisable.

| # | Question | Pourquoi elle se pose | Défaut provisoire | Bloquante |
|---|---|---|---|---|
| Q1 | **Le verre dépoli est-il une signature à garder ?** | Le CSS nomme `.sheet` « Frosted glass sheet — signature container » (FAIT, `src/styles/global.css:491`), mais `docs/DESIGN-SYSTEM.md` ne le cite pas comme règle d'identité | Au plus un niveau de verre, jamais de verre dans du verre | **Oui** |
| Q2 | **Quelle est la dimension qui porte l'identité ?** La voix seule, ou voix + matière (décor photo du zinc) ? | La routine de saisie a classé le registre comme « signature secondaire » (FAIT, `JOURNAL.md` itération 1) ; or, au sens de `UXER/references/distinctive-direction.md` §2-3, la voix semble être l'écart principal (INFÉRENCE). La réponse dit si la refonte a droit à un écart visuel (typographie de titrage, matière) ou doit rester strictement conventionnelle | Aucun nouvel écart visuel : on retire de l'imbrication, on n'ajoute pas d'expression | **Oui** |
| Q3 | **Le décor photo reste-t-il visible derrière toutes les pages intérieures**, ou seulement à l'accueil et au splash ? | Il est aujourd'hui fixe derrière toute l'app (FAIT, `src/App.tsx`) ; sans cartes, le texte se retrouve plus près de la photo (risque D-9) | Garder le décor partout, renforcer le voile si besoin plutôt que l'occulter | **Oui** |
| Q4 | **Corriger les écarts existants aux règles écrites** dans la refonte, ou les laisser ? Plusieurs boutons pleins (tournées passées de `/agenda`, sélecteur d'année de `/comptes`, `/tablee` pour un non-membre), 23 règles sous 12 px, rayons hors échelle | Ce sont des contradictions entre `DESIGN-SYSTEM.md` et le code (FAIT) ; la refonte va toucher ces surfaces | Ne rien aggraver ; remonter à 12 px les règles des surfaces refondues ; les boutons pleins multiples restent en l'état | Non |
| Q5 | **Le créneau reste-t-il une unité délimitée par un trait**, ou peut-il être délimité par l'espacement et un séparateur ? | C'est le cœur de l'imbrication (`.slot` dans `.formsec` dans `.sheet`) et le point de rupture le plus probable de P1 (D-1, D-3) | Le choix est libre si R4 et R5 passent | Non |
| Q6 | **Les numéros d'étape** (pastilles 1, 2 de `FormSection`) et leurs compteurs `n/m` survivent-ils sans le cadre de bloc ? | Ils sont une règle documentée de structure d'écran (FAIT, `docs/DESIGN-SYSTEM.md:121-129`) | Oui, conservés | Non |
| Q7 | **Les images exportées** (`src/utils/verdictImage.ts`, `recapImage.ts`, dessinées « dans la DA de l'app » avec des couleurs en dur) doivent-elles suivre la nouvelle surface ? | Elles divergeront si l'app change de surfaces | Hors périmètre : palette inchangée, donc cohérence suffisante | Non |
| Q8 | **Tournure neuve pour le bandeau de reprise de brouillon** (proposition de `DECISIONS.md` D12) | Hors refonte visuelle, rappelée pour qu'aucun agent ne l'écrive de lui-même | Aucune écriture | Non |
| Q9 | **Traversée clavier du champ lieu** (`BACKLOG.md` item 22) | Toucher à l'overlay demande une preuve sur clavier virtuel réel (D4) | Hors périmètre de la refonte visuelle | Non |
