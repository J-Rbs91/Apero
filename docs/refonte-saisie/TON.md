# TON.md — corpus gelé du registre « Confrérie »

Ce fichier est **gelé sur le contenu, vivant sur le placement**, conformément à la
règle absolue de la routine « Refonte de la saisie de formulaire » (section 2 et 3
du prompt de routine). Aucune itération n'a le droit de modifier le texte d'une
tournure listée ici. Le seul levier autorisé est où, à quelle taille et à quel
moment elle apparaît.

## 0. Ce qui compte comme « tournure », et ce qui n'en est pas une

Cette distinction est tranchée une fois, en itération 1, et ne se rediscute pas
(elle relève de la même discipline que la charte de placement, section 3 du
prompt de routine : « non-rediscussion »).

**Est une tournure** : une phrase ou un segment de phrase qui porte un trait
d'esprit autonome — un effet de style, une exagération, un aparté, une chute —
au-delà de ce que l'information à transmettre exige.

**N'est pas une tournure, c'est du vocabulaire fonctionnel** : les noms que
l'application donne à ses concepts ordinaires et qui reviennent partout comme la
façon normale de les désigner — « blaze » (nom du participant), « troquet » /
« comptoir » / « rade » (lieu), « tablée » (groupe des convives), « Confrérie »
(le produit), « émarger » (répondre), « registre » (la base d'événements),
« apéro » (événement). Ces mots sont la langue de l'app, pas des jokes
ponctuelles : les déplacer ou les resserrer romprait le produit entier, pas
seulement son ton en zone de saisie. Ils restent donc **hors de ce corpus** et
hors du périmètre de la routine.

Cas limite tranché : les libellés de vote (« J'y serai », « J'me tâte », « Sans
moi », `VoteForm.tsx:44-48`) sont le texte du contrôle principal de l'app, pas un
aparté qui l'entoure — il n'y a nulle part où les « déplacer » sans supprimer le
bouton lui-même. Ils sont exclus du corpus pour cette raison, pas parce qu'ils
manqueraient d'esprit.

## 1. Périmètre de ce gel

Le prompt de routine centre tout son objectif sur *le parcours de saisie réel*
et nomme lui-même la liste des écrans concernés (section 6, Phase 1). L'inventaire
ci-dessous couvre exactement cette liste :
`CreateEventPage.tsx`, `AperoSettingsForm.tsx`, `VoteForm.tsx`,
`AlternativeOptionForm.tsx`, `CompanionsField.tsx`, `LocationField.tsx`, et les
composants de `src/components/ui/` qu'ils utilisent (aucune tournure trouvée dans
`ui/` : ces composants sont neutres, la couleur du registre est injectée par les
écrans appelants via leurs props).

Une même tournure aperçue hors de ce périmètre (ex. `InvitePage.tsx:551`,
`"Sans les mioches"`, une variante distincte de `"Ce soir c'est sans les mômes"`)
n'est **pas** comptée ici : ce n'est pas un défaut, c'est une décision de
périmètre qui pourra être élargie à une itération ultérieure si l'audit
démontre que ces écrans bloquent la saisie (section 8 du prompt de routine).

## 2. Compteur

**N₀ = 25** tournures gelées au 24/08/2026 (itération 1).

Deux paliers, pour prioriser le travail de placement sans changer ce qui compte
dans N :

- **Palier A — zone de décision ou erreur bloquante** (9 tournures) : la
  tournure apparaît pendant que l'utilisateur doit encore agir pour continuer, ou
  remplace l'indicateur d'état d'un contrôle qu'il consulte à chaque passage.
  Ce sont les cibles prioritaires des itérations 2 à 4.
- **Palier B — zone d'aide, de succès ou de texte de substitution** (16
  tournures) : hint, placeholder, message post-validation, note d'un chemin
  secondaire non bloquant. Plusieurs sont déjà correctement placées ; elles
  restent inventoriées pour que le compteur ne puisse pas être contourné en les
  « oubliant ».

## 3. Inventaire

### Palier A — zone de décision / erreur bloquante

| # | Texte exact | Fichier:ligne | Écran | Rôle | Statut |
|---|---|---|---|---|---|
| A1 | « Tous tes créneaux sont déjà passés. Joli exploit temporel, zéro convive. La machine à remonter le temps est en réparation : vise l'avenir. » | `src/pages/CreateEventPage.tsx:178` | Créer un apéro | erreur (validation, bloque l'envoi) | en place |
| A2 | « La Confrérie est complète, archi-complète même : trop d'apéros tournent déjà en coulisses dans une magouille généralisée que plus personne ne maîtrise vraiment. Clôture un apéro avant d'en lancer un nouveau, sinon c'est le chaos total. » | `src/pages/CreateEventPage.tsx:312` | Créer un apéro | erreur (échec de création) | en place |
| A3 | « Le service a fait une bêtise. On ne veut pas savoir laquelle. Deux secondes, ça se répare tout seul. » | `src/pages/CreateEventPage.tsx:317` | Créer un apéro | erreur (fallback générique) | en place |
| A4 | « Ce nom d'apéro est déjà pris par un événement en cours. Trouve-en un autre, ou laisse le champ vide pour un tirage au sort. » | `src/pages/CreateEventPage.tsx:196` | Créer un apéro | erreur (nom pris) | en place |
| A5 | « Un apéro sans nom, ça ne se convoque pas. Garde l'ancien ou trouve mieux. » | `src/components/AperoSettingsForm.tsx:58` | Retoucher l'apéro | erreur (validation) | en place |
| A6 | « Quitte à imposer cette contradiction, il s'agirait au moins d'avoir l'élégance d'être précis : un jour, une heure et un lieu, histoire que cette proposition ait meilleure mine que la tienne. » | `src/components/AlternativeOptionForm.tsx:63` | Proposer un créneau | erreur (validation) | en place |
| A7 | « Indique ton blaze, qu'on sache au moins l'intitulé du fauteur de troubles. » | `src/components/AlternativeOptionForm.tsx:70` | Proposer un créneau | erreur (validation) | en place |
| A8 | « Marmaille admise » / « Ce soir c'est sans les mômes » | `src/pages/CreateEventPage.tsx:545` et `src/components/AperoSettingsForm.tsx:136` | Créer un apéro · Retoucher l'apéro | légende d'un `SwitchRow` (`aside`), sous la ligne | déplacé en it. 4 *(compté une fois : même paire de textes, deux points d'appel)* |
| A9 | « En escadron » / « Peinard, en solo » | `src/components/CompanionsField.tsx:46` | Répondre (vote) *(corrigé en it. 5)* | légende d'un `SwitchRow` (`aside`), sous la ligne | déplacé en it. 4 |

### Palier B — hint / placeholder / succès / chemin secondaire

| # | Texte exact | Fichier:ligne | Écran | Rôle | Statut |
|---|---|---|---|---|---|
| B1 | « On verra bien après. » | `src/pages/CreateEventPage.tsx:44`, `src/components/AperoSettingsForm.tsx:10` | Créer un apéro · Retoucher l'apéro | description d'une option de `ChoiceGroup` (cadence) | en place |
| B16 | « Le rituel hebdomadaire. » | `src/pages/CreateEventPage.tsx:45`, `src/components/AperoSettingsForm.tsx:11` | Créer un apéro · Retoucher l'apéro | description d'une option de `ChoiceGroup` (cadence) | en place |
| B2 | « La tablée tranchera. » | `src/pages/CreateEventPage.tsx:132` | Créer un apéro | statut de la barre d'action (état prêt) | en place |
| B3 | « Une assemblée qui se répète devient un rituel : une fois celle-ci passée, la Confrérie proposera de convoquer la suivante dans la foulée, mêmes lieu et heure, date décalée d'autant. » | `src/pages/CreateEventPage.tsx:477-479` | Créer un apéro | hint conditionnel (récurrence choisie) | en place |
| B4 | « Date mystère » | `src/components/VoteForm.tsx:57` | Répondre (vote), récapitulatif | texte de repli si date absente | en place |
| B5 | « Le registre se souvient de toi. Retouche, si le cœur t'en dit. » | `src/components/VoteForm.tsx:173` | Répondre (vote) | feedback info (réponse existante détectée) | en place |
| B6 | « Le registre est corrigé. On ne dira rien. » | `src/components/VoteForm.tsx:239` | Répondre (vote) | feedback succès (modification) | en place — bon exemple |
| B7 | « C'est émargé. Le registre te remercie. » | `src/components/VoteForm.tsx:240` | Répondre (vote) | feedback succès (première réponse) | en place — bon exemple |
| B8 | « L'envoi a raté. Ta réponse reste sous le coude, réessaie. » | `src/components/VoteForm.tsx:255` | Répondre (vote) | erreur (échec réseau, pas une erreur de validation) | en place |
| B9 | « Je viendrai si le monde ne s'est pas arrêté de tourner d'ici là. » | `src/components/VoteForm.tsx:425` | Répondre (vote) | placeholder d'un champ facultatif | en place — bon exemple |
| B10 | « Pour que la tablée sache qui a bousculé le programme. » | `src/components/AlternativeOptionForm.tsx:169` | Proposer un créneau | hint d'un champ | en place |
| B11 | « Les mioches comptent dans le lot. » | `src/components/CompanionsField.tsx:37` | Répondre (vote) *(corrigé en it. 5)* | hint conditionnel (mioches admis) | en place |
| B12 | « C'est sans les mioches ce coup-ci : on parle de renforts en âge de trinquer. » | `src/components/CompanionsField.tsx:38` | Répondre (vote) *(corrigé en it. 5)* | hint conditionnel (mioches refusés) | en place |
| B13 | « Le nombre de bouches en plus, qu'on prévoie assez de cacahuètes. » | `src/components/CompanionsField.tsx:79` | Répondre (vote) *(corrigé en it. 5)* | hint du compteur de renforts | en place |
| B14 | « Position refusée : pas de tournée du quartier sans ton feu vert. La recherche et la carte restent là. » | `src/components/LocationField.tsx:231` | Créer un apéro · Répondre · Proposer un créneau (partout où `LocationField` est monté) | note d'erreur (chemin secondaire, géolocalisation refusée) | en place |
| B15 | « Aucun comptoir recensé à moins de 800 m. Soit le désert, soit une carte OpenStreetMap à compléter. La recherche reste là. » | `src/components/LocationField.tsx:454-455` | idem | note (résultat vide d'un chemin secondaire) | en place |

## 4. Historique des déplacements

*(vide à l'itération 1 — aucune tournure déplacée cette fois : itération 1 est
audit, gel et charte, pas application. Voir `DECISIONS.md`.)*

*Itération 2 :* aucun déplacement (aucune tournure n'a changé d'écran ni de
zone). A1, A2, A3, A5, A6, A7 ont reçu le traitement de **hiérarchie**
(pas de déplacement) prévu par D1 : `.feedback` passe de `font-weight: 700`
à `600` dans `src/styles/global.css`, un cran sous `.field__error` — voir
`DECISIONS.md` D5. Statut inchangé : `en place`.

*Itération 3 :* aucun déplacement d'écran, aucune retouche d'échelle, aucun
texte touché. Le levier employé pour A1, A2, A3, A4 (`CreateEventPage`), B8
(`VoteForm`) et A6, A7 (`AlternativeOptionForm`) est le **moment et le lieu
d'apparition** — celui que D1 avait réservé à cette zone en écartant le
déplacement d'écran. Ces tournures restent au même endroit du code, au même
rôle, à la même taille et à la même graisse ; elles sont désormais ramenées
dans le champ de vision au moment du refus, alors qu'elles se rendaient
jusqu'ici sous le pli d'un formulaire plus long que l'écran
(`AUDIT-3.md` §2, `DECISIONS.md` D6). Statut inchangé : `en place`.

Une précision de placement, pour B2 (« La tablée tranchera. ») : sur le seul
chemin d'erreur, la ligne de statut de `ActionBar` cède la place à un renvoi
fonctionnel vers le message (`DECISIONS.md` D7). B2 ne change ni de texte ni
d'emplacement et reste affichée telle quelle sur le chemin heureux — c'est le
seul état où elle a du sens. Statut inchangé : `en place`.

Zone nouvelle, ouverte et laissée libre : le bandeau de reprise de brouillon
du formulaire de création (`CreateEventPage`, sous la ligne d'introduction).
Accusé de réception à l'entrée, hors ligne de regard et hors chemin du pouce —
exactement ce que la charte D1 privilégie. L'itération 3 l'écrit en
vocabulaire fonctionnel neutre et ne s'en sert pas ; l'itération 4 décidera
si une tournure du corpus y prend place (`BACKLOG.md` item 13).

*Itération 4 :* **premier déplacement d'emplacement de la routine.** A8 et A9
quittent le `state` d'un `SwitchRow` — c'est-à-dire l'intérieur du bouton, la
seconde ligne de la cible tactile de 60 px — pour le nouveau support `aside`,
posé **sous** la ligne, hors du bouton. Le `state` reçoit à leur place la
réponse à la question du titre (`Oui` / `Non`), qui est du vocabulaire
fonctionnel et n'entre pas au corpus. Détail et fondement : `DECISIONS.md`
D10, mesures dans `AUDIT-4.md` §2 et §3.

Ce que le déplacement change, mesuré sur le rendu (Chromium, 390 × 780) :

| | Avant (dans le bouton) | Après (sous la ligne) |
|---|---|---|
| Taille | 13 px | 12.5 px |
| Graisse | 600 | 500 |
| Couleur | `rgba(255, 247, 230, 0.62)` | `rgba(255, 247, 230, 0.72)` |
| Largeur disponible | 198 px | 294 px |
| Dans la cible tactile | oui | **non** (`asideInsideButton: false`) |
| Dans le nom accessible du bouton | oui | non — le bouton s'annonce désormais « Les mioches sont-ils conviés ?Non » |
| Contraste mesuré sur pixels rendus | — | **7.94 : 1** (plancher AA : 4.5 : 1) |

Aucun caractère n'est modifié : les deux paires de chaînes sont recopiées
telles quelles dans la prop `aside`. Le contraste **monte** au lieu de baisser
— l'opacité passe de 0.62 à 0.72, et le texte quitte le fond éclairci du
bouton (`--fill-soft`, une surcouche crème à 6 %) pour le fond de page, plus
sombre. Une tournure plus petite n'est pas une tournure plus discrète si elle
gagne en lisibilité : c'est le sens de la ligne « Le ton peut être petit et
rester présent » du prompt de routine.

Zone du bandeau de reprise de brouillon : **question tranchée, aucune tournure
n'y est déplacée.** Le raisonnement, entrée par entrée sur les 25, est dans
`AUDIT-4.md` §4 ; la décision et la proposition adressée au propriétaire du
produit sont dans `DECISIONS.md` D12. Ce n'est pas un report : l'item 13 du
backlog est clos.

*Itération 5 :* **aucun déplacement d'écran, aucune retouche d'échelle, aucun
texte touché.** A8 et A9 restent exactement où l'itération 4 les a posées, à la
même taille, à la même graisse, à la même couleur — remesuré : 12.5 px /
graisse 500 / `rgba(255, 247, 230, 0.72)`, `asideDansBouton: false` sur les
trois rendus et aux deux viewports.

Le levier employé cette fois est un **support** que la charte D1 n'avait pas
regardé : le chemin assistif. `SwitchRow` relie désormais son `aside` au bouton
par `aria-describedby` (`DECISIONS.md` D13). Mesuré avant / après :

| | Avant | Après |
|---|---|---|
| `aria-describedby` du bouton | *(absent)* | `switch-…-aside` |
| Description accessible | `null` | « Peinard, en solo » / « En escadron » / « Ce soir c'est sans les mômes » |
| Nom accessible | « Tu débarques accompagné·e ?Non » | inchangé |
| Taille, graisse, couleur, largeur, position | — | **inchangées** |

Ce que cela corrige : depuis l'itération 4 — à raison — les deux tournures
avaient quitté le nom accessible du bouton, et rien n'avait pris le relais.
Elles n'étaient donc **ni dans le nom, ni dans une description** : pour qui
navigue de contrôle en contrôle, le registre avait disparu de la ligne de
réglage, alors que le compte visuel, lui, n'avait pas bougé. Le contrôle
exécutable ne pouvait pas le voir : il cherche la chaîne dans le code, où elle
était bien présente.

**C'est donc un gain de présence du registre, pas un déplacement**, et il est
obtenu sans écrire ni déplacer un seul caractère.

**Correction de localisation (`DECISIONS.md` D16).** A9, B11, B12 et B13
portaient la colonne « Répondre (vote), Proposer un créneau ». C'est faux
depuis l'itération 1 : `CompanionsField` n'est monté qu'en `VoteForm.tsx:427`,
`AlternativeOptionForm` ne l'importe pas et ne l'a jamais importé (`git log -S`,
aucun commit ; et 0 `SwitchRow` mesuré dans la feuille de contre-proposition
réellement ouverte). La colonne est corrigée en « Répondre (vote) ». **Aucun
texte, aucun `fichier:ligne` et aucun compteur ne changent : N reste 25.**

## 5. Contrôle de non-régression

À chaque fin d'itération, chaque texte exact ci-dessus doit se retrouver tel
quel dans le code. Depuis l'itération 3, le contrôle est **exécutable** plutôt
que réécrit à chaque fois :

```bash
python3 docs/refonte-saisie/verifier-ton.py
```

Il sort en 1 si une tournure manque, et dit laquelle. Le résultat de chaque
passe est consigné dans l'entrée du `JOURNAL.md` de l'itération correspondante.
En cas de divergence entre le script et ce fichier, **c'est ce fichier qui fait
foi** : le script est un outil de vérification, pas la source du corpus.

**Itération 2 :** les 25 tournures ont été recomptées avant (Phase 0) et
après (Phase 4) modification — les 25 sont retrouvées telles quelles dans les
deux cas (deux d'entre elles, B3 et B15, s'étendent sur plusieurs lignes JSX ;
retrouvées par recherche de sous-chaîne, pas par une seule ligne `grep`).
N = 25 / N₀ = 25, aucune régression.

**Itération 3 :** les 25 tournures recomptées avant (Phase 0) et après
(Phase 4) modification — les 25 retrouvées telles quelles dans les deux
passes. N = 25 / N₀ = 25, aucune régression. Deux précisions de méthode, pour
que l'itération suivante n'ait pas à les redécouvrir :

- le contrôle normalise **l'apostrophe** avant de comparer : le code emploie
  l'apostrophe typographique « ’ », et un `grep` sur l'apostrophe droite fait
  remonter faussement 14 tournures sur 25 comme absentes ;
- il normalise aussi **les espaces**, B3 et B15 s'étendant sur plusieurs
  lignes JSX.

Contrôle complémentaire cette itération : relecture du `git diff` de `src/`
filtré sur les 25 chaînes. Deux occurrences seulement y apparaissent, et les
deux sont des changements d'indentation JSX à texte strictement identique
(le `hint` de « Proposé par », la branche `actionStatus` qui porte B2). Aucun
caractère de corpus modifié.

**Itération 4 :** `python3 docs/refonte-saisie/verifier-ton.py` lancé en
Phase 0 (avant toute modification) et en Phase 4 (après) — **N = 25 / N₀ = 25
dans les deux passes**, sortie 0, aucune tournure absente.

C'est l'itération où ce contrôle compte le plus depuis qu'il existe : c'est la
première où des chaînes du corpus **changent de ligne et de prop**. Le contrôle
seul ne suffirait pourtant pas à prouver qu'aucun texte n'a bougé — il cherche
des sous-chaînes, et une chaîne allongée le satisferait encore. Il a donc été
doublé d'une relecture du `git diff` de `src/` sur les trois lignes concernées
(`CreateEventPage.tsx:545`, `AperoSettingsForm.tsx:136`,
`CompanionsField.tsx:46`) : dans les trois, la ligne retirée et la ligne
ajoutée ne diffèrent que par le nom de la prop (`state=` → `aside=`), l'expression
ternaire et ses deux littéraux étant reportés caractère pour caractère. Les
trois lignes `state=` neuves ne portent que `"Oui"` et `"Non"`.

**Itération 5 :** `python3 docs/refonte-saisie/verifier-ton.py` lancé en Phase 0
(avant toute modification) et en Phase 4 (après) — **N = 25 / N₀ = 25 dans les
deux passes**, sortie 0, aucune tournure absente.

Doublé, comme en itération 4, d'une relecture du `git diff` de `src/` : le seul
fichier du parcours touché par cette itération est `src/components/ui/SwitchRow.tsx`,
qui ne contient aucune chaîne du corpus — il n'en transporte que les props. Les
trois points d'appel (`CreateEventPage.tsx:545`, `AperoSettingsForm.tsx:136`,
`CompanionsField.tsx:46`) ne sont **pas** modifiés cette itération : `git diff`
ne les mentionne pas. Le risque qu'une chaîne bouge était donc structurellement
nul, et il est vérifié plutôt que supposé.

Deux mesures d'exécution complètent le contrôle, parce qu'un `grep` ne dit pas
si une tournure est *rendue* : les trois `aside` ont été relus à l'écran après
modification (texte exact, typographie, contraste), et la description accessible
de chaque bouton restitue désormais la tournure mot pour mot.
