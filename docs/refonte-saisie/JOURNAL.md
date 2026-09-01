# JOURNAL.md — routine « Refonte de la saisie de formulaire »

## Itération 1 — 24/08/2026

**Périmètre audité :** parcours de saisie réel — `src/pages/CreateEventPage.tsx`,
`src/components/AperoSettingsForm.tsx`, `src/components/VoteForm.tsx`,
`src/components/AlternativeOptionForm.tsx`, `src/components/CompanionsField.tsx`,
`src/components/LocationField.tsx`, `src/components/ui/*`,
`src/styles/global.css`, `docs/DESIGN-SYSTEM.md`. Preuve `code` uniquement,
aucun navigateur exercé cette itération.

**Constats retenus :**
- Le constat de départ n°1 (« affordance insuffisante ») est **en grande
  partie infirmé** : une refonte d'affordance documentée existe déjà et tient
  sur le code (`AUDIT-1.md` §1). Quatre résidus ponctuels subsistent :
  mention `Obligatoire` manquante sur « Proposé par »
  (`AlternativeOptionForm.tsx:167-178`), absence de `useShakeInvalid` dans ce
  même formulaire, incohérence documentaire sur les trois champs de créneau
  sans pastille, signifiant visuel absent sur `LocationField`.
- Le constat de départ n°2 (« le ton est mal placé ») est **confirmé** : 7 des
  9 tournures en zone de décision sont des messages d'erreur bloquants, 2 sont
  des libellés d'état de `SwitchRow` lus à chaque passage. Aucune tournure ne
  remplace un libellé de champ ou un intitulé de bouton primaire.
- Le champ le plus coûteux du parcours est le lieu (`LocationField`,
  `AUDIT-1.md` §3.5) : 2 à 4 fois plus de gestes que jour ou heure.

**Modifications effectuées :** aucune modification de code cette itération.
Conformément à la trajectoire indicative du prompt de routine, l'itération 1
est un audit complet, le gel du corpus, l'écriture de la charte de placement
et de la doctrine d'affordance, et un plan d'architecture sur papier — pas une
phase d'implémentation. Fichiers créés : `docs/refonte-saisie/AUDIT-1.md`,
`TON.md`, `DECISIONS.md`, `BACKLOG.md`, `JOURNAL.md` (ce fichier).

**Justification :** appliquer directement des correctifs de ton avant d'avoir
gelé le corpus et écrit la charte de placement risquait de rejouer le
rabotage que la routine existe pour empêcher (section 3 du prompt). Les
références UXER mobilisées : `references/affordance-and-signifiers.md`
(vocabulaire réel/perçu, protocole d'audit, table de gravité — utilisés pour
qualifier chaque résidu §3 de l'audit) et `references/distinctive-direction.md`
§2 (signature secondaire vs écart — utilisé pour trancher que le registre
« Confrérie » est une signature secondaire à replacer, pas un écart à
rediscuter) et `references/color-and-type-protocol.md` §2 (la graisse comme
levier de hiérarchie le moins coûteux en densité — retenu dans D1 pour la
piste de hiérarchisation de `.feedback`).

**Ton — déplacements :** aucun cette itération. Le corpus est gelé
(`TON.md`), la charte de placement est écrite (`DECISIONS.md` D1) ; les
déplacements concrets commencent en itération 2 (hiérarchie de `.feedback`) et
se poursuivent en itération 4 (migration `SwitchRow.state` → `SwitchRow.hint`
pour A8/A9), selon le plan de `DECISIONS.md` D3.

**Ton — compteur :** N = 25 / N₀ = 25 · manifestations sur le parcours par
défaut sans erreur : 2 (création, volet réglages ouvert) → 2 (rien n'a changé
cette itération) ; 1 (vote, message de succès) → 1.

**Vérifications :**
- `npm install` (dépendances absentes au démarrage du conteneur) — installées
  sans erreur.
- `npm run build` — succès, `tsc -b && vite build` sans erreur, build produit
  dans `dist/`.
- `npm test` (`vitest run`) — 222 tests, 27 fichiers, tous passés.
- Contrôle grep du corpus : les 25 chaînes de `TON.md` recherchées une à une
  dans `src/pages` et `src/components` — les 25 sont retrouvées telles quelles
  (voir liste des correspondances ci-dessus ; aucune absente).
- Aucun test fonctionnel (`npm run test:functional`, `npm run test:nav`) requis
  cette itération : aucun changement de comportement n'a été introduit.

**Écarté cette fois :** l'exécution réelle dans un navigateur (Playwright ou
équivalent) — non tentée cette itération, faute de nécessité (aucun rendu
n'a changé) ; à réserver aux itérations où un rendu change réellement, pour
que la preuve `exécution`/`visuelle` corresponde à un changement observable.

**Reste à faire / point de reprise exact pour l'itération 2 :** commencer par
la Phase 0 (relire ce journal, `BACKLOG.md`, `DECISIONS.md`, `TON.md`,
recompter N contre N₀ = 25), puis attaquer l'item 1 du backlog (coût du champ
lieu) et l'item 3 (hiérarchie typographique de `.feedback`) dans le même lot,
en gardant l'item 2 (mention `requirement` sur « Proposé par ») comme correctif
bas risque à inclure si le temps le permet. Ne pas toucher à l'ordre des
champs ni à l'architecture générale des trois formulaires : l'audit ne l'a pas
justifié (`DECISIONS.md` D3).

## Itération 2 — 29/08/2026

**Périmètre audité :** relecture ciblée de `LocationField.tsx` (mécanique de
l'overlay de recherche, `MIN_QUERY_LENGTH`, priming géolocalisation),
`AlternativeOptionForm.tsx` (champ « Proposé par »), `src/styles/global.css`
(`.feedback` vs `.field__error`), et `docs/DESIGN-SYSTEM.md` pour la
cohérence documentaire de l'exemple du champ lieu. Preuve `code` pour
l'analyse, preuve `exécution` pour la validation (voir Vérifications) : les
71 vérifications de `npm run test:functional` exercent réellement
`LocationField` dans Chromium (viewport 420×900, recherche Photon
interceptée), et les 23 de `npm run test:nav` confirment qu'aucune régression
de navigation n'a été introduite. Aucune capture visuelle inspectée
(`references/browser-evidence-protocol.md`) : preuve `exécution`
comportementale uniquement, pas de preuve `visuelle`.

**Constats retenus :** avant d'implémenter la piste D3 (« repenser le passage
par l'overlay plein écran »), relecture du code a montré que cet overlay
porte une justification fonctionnelle documentée dans le composant lui-même
(suggestions ancrées qui tomberaient derrière le clavier virtuel mobile sans
lui). Le retirer sans preuve d'exécution sur un rendu mobile réel aurait
rouvert un choix déjà motivé sans élément nouveau qui le justifie — la Phase 0
recompte N contre N₀ et ne trouve aucune régression du corpus, donc rien
n'indique que ce choix ait cessé d'être valable. Décision : garder l'overlay,
réduire le coût par deux leviers vérifiables sans dépendre du rendu du
clavier virtuel (`DECISIONS.md` D4).

**Modifications effectuées :**
- `src/components/LocationField.tsx` — `MIN_QUERY_LENGTH` 3 → 2 (première
  suggestion une lettre de frappe plus tôt) ; ajout de la sélection au
  clavier (Entrée sélectionne la première suggestion quand la liste n'est
  pas vide), pour retrouver le rythme « taper puis valider » de jour/heure
  quand le premier résultat est le bon.
- `src/pages/CreateEventPage.tsx`, `src/components/AlternativeOptionForm.tsx`,
  `docs/DESIGN-SYSTEM.md` — le hint fonctionnel « Tape trois lettres… » →
  « Tape deux lettres… », pour rester exact après le changement ci-dessus
  (ce texte est du vocabulaire fonctionnel, hors corpus gelé — voir `TON.md`
  §0).
- `src/components/AlternativeOptionForm.tsx` — ajout de
  `requirement="required"` sur le champ « Proposé par » (`AUDIT-1.md` §3.1,
  backlog item 2) : le champ est réellement obligatoire (`isReady`,
  `AlternativeOptionForm.tsx`) mais ne le disait pas avant l'échec.
- `src/styles/global.css` — `.feedback` : `font-weight: 700` → `600`, un cran
  sous `.field__error` (`700`, inchangé), conformément à la piste retenue par
  `DECISIONS.md` D1 pour les 6 erreurs génériques du palier A (A1, A2, A3,
  A5, A6, A7). Aucun texte modifié.

**Justification :** le coût de saisie du champ lieu est structurellement plus
élevé que jour/heure parce qu'il exige une recherche en texte libre plutôt
qu'une sélection native (`AUDIT-1.md` §3.5) — cet écart ne disparaît pas sans
changer cette nature, mais les deux gestes ajoutés par-dessus (attendre trois
lettres, puis obligatoirement taper une suggestion du doigt) pouvaient l'être.
Références UXER mobilisées : `reference-packs/mobile-field-agent/` (densité
et saisie au pouce — a confirmé que raccourcir le geste de confirmation prime
sur raccourcir le debounce réseau, qui ne change rien au ressenti) et
`references/color-and-type-protocol.md` §2, déjà cité en itération 1 pour la
piste de graisse, maintenant appliqué.

**Ton — déplacements :** aucun déplacement cette itération (aucune tournure
n'a changé d'écran, de zone ou de moment d'apparition). Le levier utilisé
pour A1, A2, A3, A5, A6, A7 est la **hiérarchie typographique**, pas
l'emplacement — voir `DECISIONS.md` D5 et `TON.md` §4. Prochain déplacement
prévu : itération 4 (A8/A9, `SwitchRow.state` → `SwitchRow.hint`,
`DECISIONS.md` D1).

**Ton — compteur :** N = 25 / N₀ = 25 · manifestations sur le parcours par
défaut sans erreur : 2 (création, volet réglages ouvert) → 2 (inchangé,
aucune tournure du chemin heureux touchée cette itération) ; 1 (vote, message
de succès) → 1 (inchangé).

**Vérifications :**
- `npm install` à la racine et dans `server/` (dépendances absentes au
  démarrage du conteneur, comme en itération 1) — installées sans erreur.
- `npm run build` — succès, `tsc -b && vite build` sans erreur.
- `npm test` (`vitest run`) — 227 tests, 28 fichiers, tous passés (222/27 en
  itération 1 ; l'écart vient de tests ajoutés au dépôt entre-temps, hors
  périmètre de cette routine).
- `npm run test:functional` — 71/71 vérifications réussies, y compris la
  création d'un apéro avec `LocationField` réellement rempli dans Chromium
  (Photon interceptée et neutralisée, conformément au banc d'essai existant).
  C'est la première itération de cette routine où un rendu change réellement
  et où la preuve `exécution` s'applique (voir itération 1, « Écarté cette
  fois »).
- `npm run test:nav` — 23/23 contrôles passés, aucune régression de
  navigation.
- Contrôle grep du corpus (Phase 0 avant modification, Phase 4 après) : les
  25 chaînes de `TON.md` recherchées une à une (par sous-chaîne pour B3 et
  B15, qui s'étendent sur plusieurs lignes JSX) — les 25 retrouvées telles
  quelles dans les deux passes. Détail dans `TON.md` §5.

**Écarté cette fois :** la suppression de l'overlay plein écran pour la
recherche texte (formulation d'origine de l'item 1 du backlog) — voir
« Constats retenus » ci-dessus et `BACKLOG.md`, section « Écarté cette
itération ». Item 4 (`useShakeInvalid` dans `AlternativeOptionForm`), item 6
(documenter l'exception des trois champs de créneau) et item 7 (signifiant
visuel sur `LocationField`) — laissés à `à faire`, hors du lot retenu pour
cette itération (`DECISIONS.md` D3, trajectoire itération 3).

**Reste à faire / point de reprise exact pour l'itération 3 :** commencer par
la Phase 0 (relire ce journal, `BACKLOG.md`, `DECISIONS.md`, `TON.md`,
recompter N contre N₀ = 25). Puis, selon la trajectoire indicative de D3 :
états et progression (vide, en cours, erreur, succès, brouillon repris),
saisie au pouce et cibles tactiles — et dans ce lot, l'item 4 du backlog
(`useShakeInvalid` absent de `AlternativeOptionForm`, puisqu'il s'agit
précisément d'un état d'erreur). Les items 6 et 7 restent disponibles comme
correctifs bas risque à inclure si le temps le permet, comme l'a été l'item 2
cette itération.

## Itération 3 — 01/09/2026

**Périmètre audité :** les états et la progression des trois formulaires de
saisie — vide, en cours, erreur, succès, brouillon repris — puis les cibles
tactiles. Fichiers lus : `src/pages/CreateEventPage.tsx`,
`src/components/VoteForm.tsx`, `src/components/AlternativeOptionForm.tsx`,
`src/components/ui/{ActionBar,FormSheet,FormSection}.tsx`,
`src/hooks/useShakeInvalid.ts`, `src/styles/global.css`. Détail dans
`AUDIT-3.md`.

Nature des preuves : **`code`** pour l'analyse, **`exécution`** pour les
mesures de géométrie (sonde Playwright dédiée, Chromium headless, viewport
390 × 780, Photon interceptée, `vite dev` réel — mesures prises sur le DOM
rendu, pas déduites du CSS), et **`visuelle`** pour deux captures d'écran du
parcours en échec, réellement regardées avant et après correction. C'est la
première itération de cette routine où les trois niveaux de preuve
s'appliquent ; c'est aussi ce qui a permis de trouver le constat principal,
que la lecture de code seule avait laissé passer en itération 1.

**Constats retenus :**

1. **`AUDIT-3.md` §2 — le message d'erreur générique tombe hors de l'écran.
   Gravité : Bloquant.** Sur un formulaire à trois créneaux
   (`div.mobile-page__inner`, 2151 px de contenu pour 780 px d'écran), avec la
   lecture en haut du formulaire, le refus déclenché en
   `CreateEventPage.tsx:175-181` rend son message à `top = 2009 px` — soit
   1229 px sous le bas de l'écran — sans aucun défilement automatique
   (`scrollTop` inchangé à 0). Capture inspectée : l'écran après le refus est
   indiscernable de l'écran avant le tap. `useShakeInvalid` fait exactement ce
   travail de remontée du regard, mais n'était branché que sur le chemin
   « créneau incomplet » (`:161-166`) ; les six autres sorties en échec de
   `handleSubmit` n'avaient aucun équivalent. Même montage dans
   `VoteForm.tsx:430-437` et `AlternativeOptionForm.tsx:181-187`.
2. **`AUDIT-3.md` §3 — la barre d'action annonce « prêt » pendant le refus.
   Gravité : Important.** `isReady` (`CreateEventPage.tsx:124-126`) ne regarde
   que la complétude des champs, alors que A1 se déclenche sur des créneaux
   complets mais passés. Au moment du refus, le seul élément que l'utilisateur
   a sous les yeux affichait `« 3 créneaux prêts. La tablée tranchera. »` en
   tonalité `ready`.
3. **`AUDIT-3.md` §4 — aucune reprise après interruption. Gravité :
   Important.** Rechargement de page : `jour=""`, `heure=""`, `troquet=""`,
   un seul créneau. `CreateEventPage.tsx:89-97` n'initialisait ses états que
   depuis `prefill` ; aucune persistance de la saisie.
4. **Item 4 du backlog** — `useShakeInvalid` toujours absent de
   `AlternativeOptionForm` (`AUDIT-1.md` §3.3), dernière incohérence entre les
   trois formulaires.

**Constats infirmés, et c'est le résultat qui compte autant que les autres :**
les cibles tactiles. `AUDIT-1.md` §7 les avait laissées en `non vérifié` ;
mesurées cette fois sur le rendu réel, les sept cibles du formulaire de
création tiennent le plancher de 44 px (`AUDIT-3.md` §1), la plus juste étant
« Retirer » à 68 × 44. Rien à corriger — le bloc `global.css:2607-2640` fait
ce qu'il annonce. De même, l'état vide, l'état en cours et l'état de succès
sont déjà correctement traités (`AUDIT-3.md` §5) : ils ne sont pas touchés.

**Modifications effectuées :**

- `src/hooks/useShakeInvalid.ts` — seconde porte d'entrée `bringIntoView(id)`
  qui partage le même effet de remontée du regard sans déclencher la secousse.
  Pas de second hook : deux implémentations d'un même mécanisme divergent
  toujours (`DECISIONS.md` D6).
- `src/pages/CreateEventPage.tsx` — le `<p className="feedback">` est
  enregistré auprès du hook ; les trois sorties en échec qui ne visent aucun
  champ (créneaux passés, nom d'apéro déjà pris, `catch` d'envoi) appellent
  `bringIntoView`. La ligne de statut de la barre renvoie au message et passe
  en tonalité `blocked` tant qu'une erreur est affichée. Ajout du brouillon
  local : restauration au montage, sauvegarde continue (débounce 400 ms),
  bandeau de reprise avec « Repartir de zéro », purge aux deux sorties
  réussies.
- `src/services/createEventDraft.ts` (nouveau) — lecture, écriture,
  validation et péremption du brouillon, sur le patron de
  `localAperoRegistry.ts` : un seul endroit qui connaît ce format.
- `src/services/createEventDraft.test.ts` (nouveau) — 9 cas, dont le stockage
  indisponible et le stockage qui refuse l'écriture.
- `src/components/VoteForm.tsx` — même enregistrement du message, même renvoi
  depuis la barre d'action, sur le seul `feedbackTone === "error"` (le
  formulaire porte aussi des messages de succès et d'information, qui ne
  doivent rien bloquer).
- `src/components/AlternativeOptionForm.tsx` — `useShakeInvalid` branché
  (item 4 du backlog) : le bloc des trois champs de créneau et le champ
  « Proposé par » sont enregistrés et secoués selon la faute ; l'échec d'envoi,
  qui ne vise aucun champ, ramène le message. Barre d'action alignée sur les
  deux autres.
- `src/styles/global.css` — règle `.draft-resume` pour le bandeau de reprise.

Pour l'utilisateur : un refus d'envoi se voit désormais, à l'endroit où il
regarde ; la barre du bas ne le félicite plus pendant qu'on lui refuse son
apéro ; et un rechargement de page ne lui coûte plus sa saisie.

**Justification :** `references/affordance-and-signifiers.md` §4 (« Après —
feedback et nouvel état : après l'action, sait-on ce qui s'est passé ? ») et
§12, anti-pattern « feedback global quand l'utilisateur attend un changement
local », pour le constat 1 ; §2, matrice réel × perçu — cas « fausse
affordance », l'écran promet un état que le produit ne fournit pas — pour le
constat 2. `reference-packs/mobile-field-agent/PACK.md` pour les deux autres :
table des états, « erreur de saisie : sous le champ, **visible** malgré le
clavier virtuel » ; table des anti-patterns, « sauvegarde uniquement à la
validation → sauvegarde locale continue » ; règle de navigation, « à la
réouverture, l'application revient là où l'utilisateur était, avec sa saisie
intacte ».

**Ton — déplacements :** aucun déplacement, aucune retouche d'échelle, aucun
texte touché. Le levier employé pour A1, A2, A3, A4 (et B8 dans `VoteForm`,
A6/A7 dans `AlternativeOptionForm`) est celui que D1 avait réservé à cette
zone en écartant le déplacement d'écran : le **moment et le lieu
d'apparition**. Ces tournures restent au même endroit du code, au même rôle,
à la même taille et à la même graisse — elles arrivent simplement sous les
yeux de qui vient de les déclencher. Une tournure hors du champ de vision ne
se manifeste pas : cette itération rend lisible du registre qui était écrit et
perdu, sans en écrire une ligne de plus.

Une conséquence est consignée pour qu'aucune itération ultérieure n'ait à la
redécouvrir (`DECISIONS.md` D7) : sur le seul chemin d'erreur, B2 (« La tablée
tranchera. ») cède la ligne de statut au renvoi vers le message. B2 ne change
ni de texte ni d'emplacement et reste affichée telle quelle sur le chemin
heureux ; son statut `TON.md` reste `en place`.

`DECISIONS.md` D8 note par ailleurs que le bandeau de reprise de brouillon
crée une **zone hors saisie neuve** — un accusé de réception à l'entrée du
formulaire, hors ligne de regard et hors chemin du pouce. C'est exactement le
type d'emplacement que la charte D1 privilégie. Cette itération l'écrit en
vocabulaire fonctionnel neutre et ne s'en sert pas : l'itération 4, qui a
mandat sur les déplacements, décidera si une tournure du corpus y trouve sa
place.

**Ton — compteur :** N = 25 / N₀ = 25.

Manifestations, mesurées à l'écran et non dans le DOM :

- chemin heureux, création (volet réglages ouvert) : 2 → 2 (inchangé) ;
- chemin heureux, vote (message de succès) : 1 → 1 (inchangé) ;
- chemin d'erreur, création à trois créneaux : 1 → 1. Le nombre ne bouge pas,
  mais laquelle des deux change : avant, B2 (« tout est prêt ») était visible
  et A1 (« voilà ce qui coince ») ne l'était pas ; après, c'est l'inverse.
  Détail et raisonnement dans `AUDIT-3.md` §6 et `DECISIONS.md` D7.

**Vérifications :**

- `npm install` à la racine et dans `server/` — dépendances absentes au
  démarrage du conteneur, comme aux deux itérations précédentes. Installées
  sans erreur.
- `npm run build` — succès, `tsc -b && vite build` sans erreur.
- `npm test` (`vitest run`) — **236 tests, 29 fichiers, tous passés**
  (227/28 en itération 2 ; l'écart est le fichier de tests ajouté cette
  itération, 9 cas).
- `npm run test:functional` — **71/71 vérifications réussies**, dont les
  scénarios de création, de vote et de contre-proposition qui exercent
  réellement les trois formulaires modifiés dans Chromium.
- `npm run test:nav` — **23/23 contrôles passés**, aucune régression de
  navigation.
- **Sonde d'exécution, après correction**, mêmes conditions qu'à l'audit
  (3 créneaux passés, lecture en haut du formulaire) :
  - message d'erreur : `top = 553 px` pour un écran de 780 px, `visible: true`
    (il était à 2009 px, invisible) ; le conteneur a défilé de 0 à 1456 px ;
  - ligne de statut : `« L'envoi a été refusé. L'explication est juste
    au-dessus. »`, classe `actionbar__status--blocked`, couleur calculée
    `rgb(255, 143, 133)` — la valeur de `--danger` ;
  - capture inspectée : A1 est lisible en entier dans l'écran, la barre rouge
    juste dessous. C'est bien « juste au-dessus ».
  - brouillon : après rechargement, 3 créneaux restaurés,
    `jour="2020-01-01"`, `heure="19:00"`, `troquet="Le Bar du Coin"`, bandeau
    de reprise affiché avec sa porte de sortie ; « Repartir de zéro » vide le
    formulaire **et** le stockage (`apero_create_draft_v1` → `null`), et un
    rechargement ultérieur ne ressuscite rien.
  - non-régression du chemin « créneau incomplet » : la classe `is-shaking`
    est bien présente à 250 ms (SHAKE_MS vaut 560 ms — une première mesure
    prise à 1500 ms l'avait manquée), et le focus atterrit sur un champ
    `aria-invalid="true"`. Aucun message générique n'apparaît sur ce chemin,
    comme avant.
- **Contrôle grep du corpus** (Phase 0 avant modification, Phase 4 après) :
  les 25 chaînes de `TON.md` recherchées une à une, par sous-chaîne après
  normalisation des espaces (B3 et B15 s'étendent sur plusieurs lignes JSX) et
  de l'apostrophe (le code emploie l'apostrophe typographique « ’ », `TON.md`
  la reproduit) — **25 retrouvées telles quelles dans les deux passes**.
  Ce contrôle est désormais **exécutable et versionné** —
  `python3 docs/refonte-saisie/verifier-ton.py`, bibliothèque standard, sort
  en 1 et nomme la tournure manquante. Le cliquet est la protection centrale
  de cette routine : le laisser dépendre d'un `grep` réécrit de mémoire à
  chaque itération, avec le piège de l'apostrophe au milieu, était le rendre
  faillible exactement là où il doit être sûr.
  Relecture du diff de `src/` sur les 25 chaînes : deux seules occurrences
  apparaissent, et les deux sont des changements d'indentation JSX à texte
  strictement identique (`hint` de « Proposé par », branche `actionStatus` de
  B2). Aucun caractère de corpus modifié.

**Écarté cette fois :**

- **Le message de restauration en registre « Confrérie ».** Le bandeau de
  reprise est écrit en vocabulaire fonctionnel neutre. Écrire une tournure
  neuve gonflerait N₀ et reviendrait à décider seul d'ajouter au corpus, ce
  qui relève du propriétaire du produit ; et déplacer une tournure existante
  vers cette zone est explicitement le mandat de l'itération 4. L'emplacement
  est donc préparé et laissé libre (`DECISIONS.md` D8).
- **La persistance du brouillon de `VoteForm` et de `AlternativeOptionForm`.**
  Ces deux formulaires sont courts et vivent dans une page déjà chargée : le
  coût d'une reprise perdue y est sans commune mesure avec celui du formulaire
  de création, qui peut porter trois recherches de lieu. Inscrit au backlog,
  pas fait cette fois.
- **Items 6 et 7 du backlog** (exception documentaire des trois champs de
  créneau ; signifiant visuel sur `LocationField`) — inchangés, hors du lot,
  toujours fléchés vers l'itération 4 par D3.
- **Le clavier virtuel mobile réel** — Chromium headless n'en ouvre pas. La
  question de l'overlay de recherche de lieu reste donc fermée, à la même
  condition qu'en itération 2.

**Reste à faire / point de reprise exact pour l'itération 4 :** commencer par
la Phase 0 (relire ce journal, `BACKLOG.md`, `DECISIONS.md`, `TON.md`,
recompter N contre N₀ = 25 — le script de contrôle doit normaliser
l'apostrophe typographique, faute de quoi 14 tournures sur 25 remontent
faussement comme absentes). Puis, selon D3 et sans rouvrir la charte D1 :
l'**application de la charte de placement**, c'est-à-dire le déplacement
A8/A9 de `SwitchRow.state` vers `SwitchRow.hint` avec un `state` fonctionnel
neuf (item 5 du backlog, le seul déplacement d'emplacement réellement prévu
par D1) — et l'arbitrage, ouvert par D8, de savoir si une tournure du corpus
prend place dans le bandeau de reprise de brouillon désormais disponible. Les
items 6 et 7 restent les correctifs bas risque à inclure si le temps le
permet, comme l'ont été l'item 2 en itération 2 et l'item 4 cette fois.

### Complément d'itération 3 — fusion d'une passe parallèle (menée le 31/08/2026, fusionnée le 01/09/2026)

**Ce qui s'est passé :** deux passes de l'itération 3 ont été menées en
parallèle depuis le même point de départ (fin d'itération 2). Celle du 01/09,
ci-dessus, a été intégrée la première. Celle du 31/08, sur preuve `code`
uniquement, portait trois correctifs : `useShakeInvalid` dans
`AlternativeOptionForm`, un brouillon local de `CreateEventPage` écrit dans la
page elle-même, et la cible tactile de `.stepper__btn`. La fusion tranche
correctif par correctif, pas fichier par fichier.

**Conservé de la passe parallèle :**
- `src/styles/global.css` — `.stepper__btn` : 42 × 42 px → 44 × 44 px
  (`AUDIT-3.md` §1 complément, `DECISIONS.md` D9, `BACKLOG.md` items 15
  et 16). C'est le seul constat que la sonde du 01/09 ne couvrait pas : elle
  mesurait l'écran de création, et le compteur de renforts vit dans le
  parcours de vote.

**Écarté de la passe parallèle, avec le motif :**
- sa version de `useShakeInvalid` dans `AlternativeOptionForm` — déjà couverte
  ci-dessus (D6), avec en plus la remontée du message sur l'échec d'envoi et
  la barre d'action alignée sur les deux autres formulaires ;
- son brouillon local écrit dans `CreateEventPage.tsx` sous la clé
  `apero_create_draft_v1` — déjà couvert par `createEventDraft.ts` (D8), sous
  la même clé : garder les deux aurait fait cohabiter deux écritures
  concurrentes du même emplacement de stockage. Avec lui disparaissent la note
  « Brouillon retrouvé : reprends où tu t'étais arrêté. » et la règle
  `.field__hint--draft` qui ne servait qu'à elle ;
- son `AUDIT-3.md`, son entrée de journal et ses D6/D7 — remplacés par les
  présents documents ; son constat propre est reporté dans `AUDIT-3.md` §1
  (complément) et `DECISIONS.md` D9, son item de backlog renuméroté 15 (et 16
  pour `.cheer-btn`, laissé hors périmètre).

**Ton :** aucune tournure touchée par la fusion. Contrôle
`python3 docs/refonte-saisie/verifier-ton.py` après fusion : N = 25 / N₀ = 25.

**Vérifications après fusion :**
- `npm run build` — succès, `tsc -b && vite build` sans erreur.
- `npm test` (`vitest run`) — 236 tests, 29 fichiers, tous passés.
- `npm run test:functional` — **71/71 vérifications réussies** (après
  `npm ci` dans `server/` : la mini API de test démarre avec `tsx`, absent
  tant que les dépendances serveur ne sont pas installées).
- `npm run test:nav` — **23/23 contrôles passés**.

**Point de reprise pour l'itération 4 :** inchangé, voir ci-dessus.
