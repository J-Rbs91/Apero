# AUDIT-1 — itération 1/5

Périmètre exercé : `src/pages/CreateEventPage.tsx`, `src/components/AperoSettingsForm.tsx`,
`src/components/VoteForm.tsx`, `src/components/AlternativeOptionForm.tsx`,
`src/components/CompanionsField.tsx`, `src/components/LocationField.tsx`,
`src/components/ui/*`, `src/styles/global.css`, `docs/DESIGN-SYSTEM.md`.

Nature des preuves : **preuve `code`** exclusivement — lecture du JSX/TSX et des
règles de `global.css`. Aucun navigateur n'a été utilisé cette itération : aucun
constat ci-dessous n'est présenté comme observation d'exécution ou visuelle. Un
audit ultérieur qui exercerait réellement le formulaire (Playwright ou
équivalent) pourra confirmer ou nuancer, en particulier le contraste réel du
texte à 13 px et le rendu du champ de lieu sur petit écran.

---

## 1. Sur le constat de départ n°1 (« affordance insuffisante ») — à confirmer ou infirmer

**Infirmé en grande partie, sur preuve `code`.** `docs/DESIGN-SYSTEM.md` documente
une refonte d'affordance déjà passée, et le code la tient réellement :

- chaque champ passe par `Field`/`TextField`/`TextAreaField`
  (`src/components/ui/Field.tsx`) et porte un libellé au-dessus, une mention
  `Obligatoire`/`Facultatif`, une aide, une erreur sous contrôle avec
  `aria-describedby`/`aria-invalid` câblés automatiquement ;
- les choix multiples passent par `ChoiceGroup` (cartes cochables, pastille
  visible, jamais un `<select>` maquillé en champ de texte) ;
- un réglage oui/non passe par `SwitchRow`, ligne entière cliquable, état
  annoncé en toutes lettres, `role="switch"` + `aria-checked` posés ;
- `ActionBar` épingle le bouton d'enregistrement en bas de la zone qui défile,
  avec une ligne de statut qui dit toujours la prochaine chose à faire plutôt
  que « erreur » ;
- à l'échec de validation, `useShakeInvalid` fait remonter le regard sur le
  bloc fautif (`shake`, `shakingId`, `registerNode`) plutôt que d'afficher un
  message générique en pied de formulaire — confirmé dans les trois formulaires
  (`CreateEventPage.tsx:108,162-166`, `VoteForm.tsx:108,206-216`,
  implicitement absent dans `AlternativeOptionForm.tsx`, voir 3.3 ci-dessous).

Le premier problème posé par la routine comme constat de départ n'est donc
**pas** confirmé comme un défaut général : une refonte d'affordance a déjà eu
lieu et tient sur les propriétés vérifiables ici. Ce que cet audit trouve à la
place, ce sont des **résidus ponctuels**, listés en section 3 — moins nombreux
et moins structurants que ce que le constat de départ laissait attendre.

## 2. Sur le constat de départ n°2 (« le ton est mal placé, pas mal écrit »)

**Confirmé, sur preuve `code`.** Le registre n'est concentré dans aucun fichier
central : chaque écran l'injecte lui-même dans ses props (`error`, `hint`,
`placeholder`, `status`, `state` de `SwitchRow`) — l'architecture des
composants de `ui/` est neutre (aucune tournure trouvée dans ce dossier), donc
le seul point de correction possible est bien le **site d'appel**, écran par
écran. Le détail est en section 4.

## 3. Ruptures d'affordance localisées

### 3.1 — Important : « Proposé par » sans mention `requirement`, alors qu'il est obligatoire

`src/components/AlternativeOptionForm.tsx:167-178`. Le champ est réellement
requis : `isReady` à la ligne 51 dépend de `trimmedName`, et un envoi sans nom
déclenche une erreur bloquante (ligne 68-72, « Indique ton blaze… »). Pourtant
`TextField` n'y reçoit aucune prop `requirement`, contrairement à
« Nom de l'apéro » dans `AperoSettingsForm.tsx:114-121` qui, lui, porte
`requirement="required"`. Un convive qui atteint ce champ sans avoir lu le
statut du pied de feuille (`"Jour, heure et troquet sont obligatoires."`,
ligne 122-126, qui ne mentionne d'ailleurs pas le nom) ne sait pas qu'il est
obligatoire avant de se heurter à l'erreur. Coût : un aller-retour évitable.
Gravité : **Important** (action fréquente — proposer un créneau alternatif —
dont une contrainte réelle reste cachée jusqu'à l'échec).

### 3.2 — Amélioration : les trois champs du créneau restent sans mention explicite, par choix documenté

`src/pages/CreateEventPage.tsx:382-384` et `AlternativeOptionForm.tsx:140-141`
expliquent en commentaire pourquoi aucun des trois champs de créneau (jour,
heure, troquet) ne porte de pastille `Obligatoire` : la phrase de statut du
bloc le dit une fois. C'est un compromis délibéré et documenté, pas un oubli —
il déroge cependant à la règle 1 du `DESIGN-SYSTEM.md` (« une mention explicite »)
sans que ce fichier ne documente l'exception. Gravité : **Amélioration** (le
choix est défendable pour la densité, mais `DESIGN-SYSTEM.md` devrait le dire
pour ne pas se contredire lui-même).

### 3.3 — Amélioration : pas de retour au bloc fautif dans `AlternativeOptionForm`

Contrairement à `CreateEventPage` et `VoteForm`, `AlternativeOptionForm.tsx` ne
mobilise pas `useShakeInvalid` : à l'échec de validation (lignes 60-72), seul
le message `feedback` en pied de feuille (ligne 180-186) signale l'erreur —
aucun tremblement, aucun focus renvoyé sur le champ vide. La feuille étant
courte (3+1 champs, tout à l'écran sans défilement sur mobile probable), l'effet
pratique est faible, mais l'incohérence avec les deux autres formulaires est
réelle. Gravité : **Amélioration**.

### 3.4 — Amélioration : `LocationField` ne porte aucun signifiant visuel distinct d'un champ de texte ordinaire

`src/components/LocationField.tsx:290-303`. Le champ a `role="combobox"` et
`aria-expanded`, ce qui est sémantiquement correct, mais visuellement rien (ni
icône de recherche, ni icône de carte) ne distingue ce champ d'un `TextField`
ordinaire avant qu'on le touche. Le tap ouvre un overlay plein écran avec carte
et géolocalisation — un comportement plus riche qu'un champ de texte, sans
signifiant persistant qui l'annonce avant le premier usage (test de prédiction,
`references/affordance-and-signifiers.md` section 8, étape E). Une fois
découvert, le comportement est cohérent et bien construit (priming avant la
demande de permission navigateur, squelette de chargement, retour clavier
Échap) — c'est la **découvrabilité initiale**, seule, qui est en cause.
Gravité : **Amélioration**.

### 3.5 — Champ le plus coûteux du parcours : le lieu (`LocationField`)

Sur preuve `code`, la chaîne d'interactions pour renseigner un lieu est la plus
longue des trois champs obligatoires d'un créneau :

- **Recherche texte** : tap (ouvre l'overlay plein écran) → au moins 3
  caractères tapés (`MIN_QUERY_LENGTH`, ligne 12) → 300 ms de debounce
  (`SEARCH_DEBOUNCE_MS`, ligne 11) → tap sur une suggestion. Minimum 2 gestes
  après le tap d'ouverture, plus la frappe.
- **Autour de moi** : tap « Les rades autour de moi » (ouvre l'explication,
  `handleNearbyPrime`) → tap « Chercher autour de moi » (déclenche la
  permission navigateur, `handleNearbyScan`) → autorisation système → tap sur
  un résultat. Quatre gestes, dont un hors de l'app (le prompt système).
- **Carte** : tap « Pointe-le toi-même sur la carte » → tap sur la carte
  (`handleMapPick`). Deux gestes, mais suppose de savoir déjà où pointer.

Contre un jour (1 tap + sélection native) et une heure (1 tap + sélection
native), le lieu est structurellement 2 à 4 fois plus coûteux. C'est le
candidat naturel de l'itération 2 (« le champ le plus coûteux »), conforme à la
trajectoire indicative du prompt de routine.

## 4. Position du registre : ce que ça coûte, écran par écran

Le tableau complet des 25 tournures avec fichier:ligne, écran et rôle est dans
`TON.md`. Synthèse par écran, comptage des manifestations visibles sur un
parcours par défaut (aucune erreur déclenchée, aucune option secondaire
ouverte) :

| Écran | Tournures visibles par défaut | Tournures qui n'apparaissent qu'après une action (erreur, choix secondaire) |
|---|---|---|
| Créer un apéro (`CreateEventPage`) | 3 — B1, B16 (descriptions de `ChoiceGroup`, sous un volet replié par défaut donc *non* visibles avant ouverture — voir note) · B2 (statut, visible seulement une fois un créneau complet) | A1, A2, A3, A4, A8, B3 |
| Retoucher l'apéro (`AperoSettingsForm`) | B1, B16 (idem, non repliées ici — le formulaire n'a pas de `Disclosure`) | A5, A8 |
| Répondre (`VoteForm`) | 0 par défaut (formulaire vierge) | A9, B4, B5, B6, B7, B8, B9, B11, B12, B13 |
| Proposer un créneau (`AlternativeOptionForm`) | 0 par défaut | A6, A7, B10, B14, B15 |

Note sur `CreateEventPage` : B1/B16 sont dans le `ChoiceGroup` de récurrence,
lui-même dans le `Disclosure` « Réglages de l'assemblée » (`defaultOpen` non
posé → replié). Elles ne sont donc visibles qu'après un tap volontaire sur le
volet — ce qui est déjà, de fait, un placement correct au sens de la charte
(section 5).

**Constat central, celui qui justifie le constat de départ n°2** : sur les 9
tournures du palier A (zone de décision), **7 sur 9 sont des messages
d'erreur bloquants** (A1, A2, A3, A4, A5, A6, A7) et **2 sur 9 sont des
libellés d'état lus à chaque passage** (A8, A9 — `SwitchRow`). Aucune tournure
du palier A n'est un libellé de champ, un intitulé de bouton primaire ou un nom
d'étape — ce qui borne déjà le problème : le ton n'a jamais pris la place d'un
signifiant d'affordance, il occupe des messages qui apparaissent *au moment où
l'utilisateur cherche une réponse à un problème de saisie*, pas pendant la
saisie elle-même. C'est un problème de **moment d'apparition** (levier
« Moment d'apparition » de la section 2 du prompt de routine) autant que
d'emplacement : la blague arrive exactement quand l'utilisateur veut la
réponse la plus courte possible.

## 5. Compte de manifestations du registre (mesure de référence, itération 1)

Sur un parcours de création complet **sans jamais déclencher d'erreur** (le
chemin heureux, celui que la majorité des créations suivent) :
**2 manifestations** (B1, B16 — uniquement si le volet réglages est ouvert ;
0 sinon) avant le tap sur « Créer l'apéro », puis 0 après (redirection directe
vers la page de l'événement créé, pas de message de succès textuel dans ce
formulaire).

Sur un parcours de vote complet sans erreur : 1 manifestation (B6 ou B7, message
de succès après envoi).

Cette mesure sert de repère à l'itération 5 pour la double mesure finale
(vitesse vs présence du ton). Elle sera reprise à l'identique — même méthode,
mêmes parcours — pour rester comparable.

## 6. Classement par impact (base des priorités d'itération 2 à 4)

1. **Le champ lieu** (section 3.5) — impact direct sur la vitesse de saisie,
   touche trois formulaires.
2. **Palier A du ton** (7 erreurs + 2 états) — impact direct sur l'objectif
   n°2 de la routine, nécessite la charte de placement (section suivante) avant
   tout déplacement.
3. **3.1 (mention manquante sur « Proposé par »)** — corrigible en une ligne,
   impact réel mais localisé à un seul formulaire secondaire.
4. **3.3 (pas de shake dans `AlternativeOptionForm`)** — cohérence, impact
   faible en pratique sur ce formulaire court.
5. **3.2 et 3.4** — améliorations documentées, non bloquantes.

## 7. Ce qui n'a pas été vérifié cette itération

- Aucun rendu réel (navigateur/Playwright) : le contraste effectif du texte à
  13 px (`.feedback`, `.field__hint`), la lisibilité de l'overlay de recherche
  sur petit écran, et le ressenti tactile des cibles n'ont pas été observés.
  Ces points restent `non vérifié dans cette exécution` au sens du protocole
  UXER de preuve.
- Aucun test manuel du geste retour, du clavier virtuel mobile, ni du
  comportement `prefers-reduced-motion` cité dans `DESIGN-SYSTEM.md`.
