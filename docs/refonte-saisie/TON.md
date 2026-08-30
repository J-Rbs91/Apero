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
| A8 | « Marmaille admise » / « Ce soir c'est sans les mômes » | `src/pages/CreateEventPage.tsx:461` et `src/components/AperoSettingsForm.tsx:135` | Créer un apéro · Retoucher l'apéro | état d'un `SwitchRow` (lu à chaque passage) | en place *(compté une fois : même paire de textes, deux points d'appel)* |
| A9 | « En escadron » / « Peinard, en solo » | `src/components/CompanionsField.tsx:45` | Répondre (vote), Proposer un créneau | état d'un `SwitchRow` (lu à chaque passage) | en place |

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
| B11 | « Les mioches comptent dans le lot. » | `src/components/CompanionsField.tsx:37` | Répondre (vote), Proposer un créneau | hint conditionnel (mioches admis) | en place |
| B12 | « C'est sans les mioches ce coup-ci : on parle de renforts en âge de trinquer. » | `src/components/CompanionsField.tsx:38` | Répondre (vote), Proposer un créneau | hint conditionnel (mioches refusés) | en place |
| B13 | « Le nombre de bouches en plus, qu'on prévoie assez de cacahuètes. » | `src/components/CompanionsField.tsx:79` | Répondre (vote), Proposer un créneau | hint du compteur de renforts | en place |
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

## 5. Contrôle de non-régression

À chaque fin d'itération, chaque texte exact ci-dessus doit se retrouver tel
quel par `grep` dans le code. Voir la commande et son résultat dans l'entrée du
`JOURNAL.md` de l'itération correspondante.

**Itération 2 :** les 25 tournures ont été recomptées avant (Phase 0) et
après (Phase 4) modification — les 25 sont retrouvées telles quelles dans les
deux cas (deux d'entre elles, B3 et B15, s'étendent sur plusieurs lignes JSX ;
retrouvées par recherche de sous-chaîne, pas par une seule ligne `grep`).
N = 25 / N₀ = 25, aucune régression.

**Itération 3 :** même contrôle avant (Phase 0) et après (Phase 4) — les 25
chaînes retrouvées telles quelles (23 par correspondance exacte, B3 et B15
par sous-chaîne, comme en itération 2). N = 25 / N₀ = 25, aucune régression.
Aucun déplacement cette itération : le travail a porté sur un correctif
d'affordance (`useShakeInvalid` dans `AlternativeOptionForm`), un brouillon
persistant pour `CreateEventPage`, et trois cibles tactiles — aucune tournure
du corpus n'a changé d'écran, de zone, de taille ni de moment d'apparition.
Le nouveau texte de statut « Brouillon retrouvé : la saisie reprend là où tu
l'avais laissée. » n'entre pas dans ce compte : ce n'est pas une tournure au
sens de §0 (aucun trait d'esprit au-delà du fait qu'il annonce), voir
`DECISIONS.md` D6.
