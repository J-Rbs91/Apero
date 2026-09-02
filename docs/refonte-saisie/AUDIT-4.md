# AUDIT-4 — itération 4 : où le registre est posé, et à quelle échelle

Audit ciblé sur l'objectif de la routine (vitesse et complétude de saisie), et
non sur l'application entière. Périmètre de cette itération : **la géographie
et l'échelle typographique du registre dans le parcours de saisie**, plus la
non-régression des corrections de l'itération 3.

**Nature des preuves.** `code` pour la lecture des composants et de la feuille
de style ; `exécution` pour toutes les mesures de géométrie et de typographie
ci-dessous — sonde Playwright dédiée, Chromium headless, viewport 390 × 780,
`vite dev` réel, Photon et l'API GitHub interceptées, blaze pré-posé dans
`localStorage` comme le fait le banc d'essai du dépôt. Les valeurs sont lues
sur le DOM rendu (`getBoundingClientRect`, `getComputedStyle`), pas déduites
du CSS. Aucune capture n'a été inspectée cette fois : les constats portent sur
des nombres, pas sur une impression de rendu — la preuve `visuelle` n'est donc
pas revendiquée.

---

## 1. Non-régression des corrections de l'itération 3

Vérifié **avant** toute modification de cette itération, sur le même scénario
que `AUDIT-3.md` §2 : trois créneaux complets mais entièrement passés
(2020-01-01/02/03, 19:00, « Le Bar du Coin »), lecture ramenée en haut du
formulaire (`scrollTop = 0`), puis tap sur « Créer l'apéro ».

| Mesure | Avant l'envoi | Après le refus |
|---|---|---|
| Conteneur `.mobile-page__inner` | `scrollTop = 0`, `scrollHeight = 2504` | `scrollTop = 1809` |
| Message `.feedback` | absent | rendu à `top = 553 px` pour un écran de 780 px, `visible = true` |
| Ligne de statut de `ActionBar` | « 3 créneaux prêts. La tablée tranchera. », classe `actionbar__status--ready` | « L'envoi a été refusé. L'explication est juste au-dessus. », classe `actionbar__status--blocked` |

**Les trois corrections de l'itération 3 tiennent sur le code d'aujourd'hui.**
D6 (le refus remonte dans le champ de vision), D7 (la barre cesse d'annoncer
« prêt » pendant un refus) et le renvoi fonctionnel vers le message se
comportent exactement comme le journal de l'itération 3 les décrit. Le
constat de `AUDIT-3.md` §2 — message rendu 1229 px sous le bas de l'écran —
ne se reproduit pas.

C'est aussi la confirmation que A1 est **effectivement visible** au moment où
elle se déclenche : le premier acquis de placement de cette routine n'a pas
été perdu.

---

## 2. Où A8 est posée, et ce que cette position coûte

Écran de création, volet « Réglages de l'assemblée » ouvert, viewport
390 × 780. Mesures sur le DOM rendu.

| Élément | Texte | Taille | Graisse | Couleur | Géométrie |
|---|---|---|---|---|---|
| `.switchrow__button` | *(la ligne entière)* | — | — | — | 294 × 60 px, `top = 1161` dans un conteneur de 1669 px |
| `.switchrow__title` | « Les mioches sont-ils conviés ? » | 13.5 px | 700 | `rgb(255, 247, 230)` | 198 × 18 px |
| `.switchrow__state` | **« Ce soir c'est sans les mômes »** (A8) | **13 px** | **600** | `rgba(255, 247, 230, 0.62)` | 198 × 18 px |
| `.field__label` voisin | « Jour » | 13.5 px | 700 | `rgb(255, 247, 230)` | — |
| `.field__hint` de cette ligne | *(absent)* | — | — | — | — |
| `.actionbar` (chemin du pouce) | — | — | — | — | `top = 653` → `bottom = 752` |

Trois constats, tous vérifiables par quelqu'un qui n'a pas le même goût que
l'auteur de cet audit.

**2.1 — La tournure est le texte d'un contrôle, pas un aparté à côté de lui.**
A8 est rendue **à l'intérieur** de `.switchrow__button`, la cible tactile de
60 px de haut. Ce n'est pas « près de la zone de décision » : c'est la seconde
ligne de la chose sur laquelle on appuie. Le nom accessible du bouton mesuré
est d'ailleurs `« Les mioches sont-ils conviés ?Ce soir c'est sans les mômes »`
— la tournure fait partie de l'intitulé du contrôle.

**2.2 — L'échelle ne dit pas « aparté », elle dit « pair d'un libellé ».**
13 px / 600 contre 13.5 px / 700 pour le libellé de champ voisin : la tournure
est à **96 % de la taille** d'un libellé de champ, à un seul cran de graisse
en dessous. La hiérarchie annonce donc deux textes de rang quasi identique là
où l'un est une question à laquelle répondre et l'autre un commentaire sur la
réponse en cours.

**2.3 — Ce que la position coûte réellement à la saisie.** Le réglage pose une
question fermée ; sa réponse tient en un mot. Le lecteur doit à la place
analyser une phrase de 28 caractères pour confirmer que la bascule a bien pris
l'état voulu — et il le fait **à chaque passage**, puisque c'est le seul texte
de la ligne qui change quand on bascule. `references/affordance-and-signifiers.md`
§5.5 (« les états doivent rester distinguables… deux états qui signifient des
choses différentes ne doivent pas dépendre d'une nuance visuelle impossible à
distinguer dans les conditions réelles d'usage ») et §5.4 (« agrandir la cible
ne rend pas l'action découvrable — un signal cohérent doit porter
l'intention ») disent la même chose sous deux angles : c'est la bascule
elle-même, pas la phrase, qui porte l'état ; la phrase la double sans la
remplacer.

**Le constat ne porte pas sur le texte.** Il porte sur le fait qu'un aparté est
rendu à l'échelle d'un libellé, dans le rectangle sur lequel on appuie. La
charte D1 avait déjà tranché ce point à l'itération 1 en lecture de code ; les
nombres ci-dessus l'établissent sur le rendu.

A9 (« En escadron » / « Peinard, en solo », `CompanionsField.tsx:45`) est le
même montage exactement : même composant, même `state`, aucun `hint` passé.
Les mesures ci-dessus valent pour elle par construction — elle n'a pas été
mesurée séparément, le parcours de vote demandant un apéro réellement créé.

---

## 3. La charte D1 s'applique à trois points d'appel, pas deux — et le troisième est déjà occupé

Constat neuf, sur preuve `code`, que ni l'itération 1 ni les suivantes
n'avaient relevé.

D1 écrit que le déplacement se fait vers `SwitchRow.hint`, « zone déjà prévue
par le composant, **actuellement vide dans ces deux usages** ». La vérification
point par point :

| Point d'appel | `hint` passé aujourd'hui |
|---|---|
| `src/pages/CreateEventPage.tsx:542-547` | non — mesuré absent du DOM rendu |
| `src/components/CompanionsField.tsx:43-48` | non — aucune prop `hint` |
| `src/components/AperoSettingsForm.tsx:133-143` | **oui**, conditionnel : « Rien n'avait été précisé jusqu'ici : enregistrer tranchera la question pour toute la tablée. » |

Ce troisième `hint` n'est pas récent : il date du commit `9738a47`
(« Permettre à l'auteur de retoucher son apéro en cours »), **antérieur à
l'itération 1**. La prémisse de D1 était donc inexacte au moment où elle a été
écrite, sans que cela ait été vu.

**Conséquence.** Appliquer D1 à la lettre ferait cohabiter, dans un même
paragraphe, une tournure du registre et une note fonctionnelle qui prévient
d'une conséquence de l'enregistrement. Les deux perdraient : l'information de
conséquence deviendrait la fin d'une phrase drôle, et la tournure deviendrait
le préambule d'un avertissement. La destination de D1 est bonne — sous la
ligne, hors du bouton, un cran plus bas — mais elle a besoin d'un support
propre plutôt que du seul emplacement encore libre.

---

## 4. Item 13 — le bandeau de reprise de brouillon : une tournure du corpus y a-t-elle sa place ?

Question ouverte par `DECISIONS.md` D8 et explicitement remise à cette
itération. L'emplacement, mesuré à l'itération 3 et inchangé : accusé de
réception à l'entrée du formulaire, sous la ligne d'introduction, hors de la
ligne de regard entre deux champs et hors du chemin du pouce
(`.actionbar` occupe 653 → 752 px, le bandeau est en haut du conteneur). C'est
une bonne zone au sens de la charte D1 — la question n'est pas là.

Revue des 25 entrées du corpus, une par une, contre ce que le bandeau dit
(« ta saisie précédente a été retrouvée, tu peux reprendre ou repartir de
zéro ») :

- **A1 à A7** sont des erreurs. D1 tranche déjà qu'elles ne se déplacent pas :
  leur contenu factuel est l'information cherchée à l'instant du refus, et il
  n'existe pas de zone hors saisie où afficher une erreur de saisie. Les poser
  dans un bandeau de reprise les retirerait du chemin où elles servent.
- **A8, A9** sont des états de réglage, traités par ailleurs dans cette
  itération ; hors sujet ici.
- **B1, B3, B10 à B16** sont attachées à un champ ou à un chemin précis
  (cadence, renforts, lieu). Les déplacer viderait ce champ de son aide.
- **B2, B4, B6, B7, B8, B9** appartiennent à un moment du parcours — statut de
  barre, repli de date, succès, échec d'envoi, placeholder — qui n'existe pas
  dans un bandeau de reprise.
- **B5** — « Le registre se souvient de toi. Retouche, si le cœur t'en dit. »
  — est la seule dont le **sens** conviendrait : c'est déjà un accusé de
  réception de retour. Mais c'est le feedback d'information de `VoteForm`
  quand une réponse existante est détectée (`VoteForm.tsx:173`), et elle y est
  classée `en place — bon exemple`. La déplacer ne serait pas un déplacement,
  ce serait un transfert qui viderait le chemin du vote de son accueil pour
  meubler celui de la création.

**Verdict : aucune tournure du corpus ne se déplace vers ce bandeau.** Ce
n'est pas un report — la question est tranchée. Le seul geste qui donnerait au
bandeau une couleur de registre serait d'y **écrire une tournure neuve**, ce
qui fait monter N₀ et relève du propriétaire du produit, pas d'une itération
(section 2 et 3 du prompt de routine, symétriquement à ce qui vaut pour une
suppression). Une proposition lui est adressée dans `DECISIONS.md` D12.

---

## 5. Les deux derniers résidus nommés de la doctrine d'affordance (D2)

D2 fixe le périmètre affordance de la routine aux quatre résidus nommés par
`AUDIT-1.md` §3. Deux sont corrigés (3.1 en itération 2, 3.3 en itération 3).
Les deux qui restent ont été vérifiés à nouveau sur le code d'aujourd'hui :

**5.1 — Résidu 3.2, toujours ouvert.** `docs/DESIGN-SYSTEM.md` §1 exige « une
mention explicite `Obligatoire` ou `Facultatif` » sur tout champ. Les trois
champs de créneau (`CreateEventPage.tsx`, `AlternativeOptionForm.tsx`) y
dérogent délibérément, avec la raison écrite en commentaire dans le code — la
phrase de statut du bloc porte l'information une fois pour les trois. Le
document, lui, ne dit toujours pas que l'exception existe : il se contredit
donc lui-même pour qui le lit sans ouvrir le code.

**5.2 — Résidu 3.4, toujours ouvert.** `LocationField` reste visuellement
indiscernable d'un `TextField` avant le premier tap : `role="combobox"` et
`aria-expanded` sont corrects, mais aucun signifiant persistant n'annonce
l'overlay de recherche, la carte et la géolocalisation qui se trouvent
derrière. C'est le cas exact que `references/affordance-and-signifiers.md` §7
sépare en deux obligations distinctes — « sémantique et apparence » — dont
seule la première est tenue ici. §5.3 en fixe la limite : une icône ajoutée
**à côté** d'un libellé existant est un complément, pas le raccourci qu'elle
proscrit ; le libellé « Le troquet » et sa mention `Obligatoire` restent en
place.

---

## 6. Classement par impact sur l'objectif de la routine

Impact sur la **vitesse et la complétude de saisie**, pas sur la facilité de
correction.

| Rang | Constat | Impact | Retenu pour l'itération 4 |
|---|---|---|---|
| 1 | §2 — la tournure d'état est lue à chaque passage, à l'échelle d'un libellé, dans la cible tactile | Moyen, mais **récurrent** : trois points d'appel, deux parcours, à chaque ouverture du réglage | oui |
| 2 | §3 — le support prévu par D1 est occupé sur un des trois points d'appel | Bloquant pour le rang 1 : sans support propre, le déplacement dégrade deux textes | oui |
| 3 | §5.2 — `LocationField` n'annonce pas son comportement enrichi | Faible par occurrence, sur le champ le plus coûteux du parcours (`AUDIT-1.md` §3.5) | oui |
| 4 | §5.1 — `DESIGN-SYSTEM.md` se contredit sur la mention obligatoire | Nul sur la saisie, réel sur le coût de la prochaine contribution | oui |
| 5 | §4 — le bandeau de reprise reste en vocabulaire fonctionnel | Nul sur la saisie | tranché, sans code |

Rien d'autre n'a été trouvé dans le périmètre de cette itération. En
particulier, **aucune régression** des acquis des itérations 1 à 3 : §1 le
vérifie sur le seul point mesurable à l'exécution, et le compteur de corpus
est à N = 25 / N₀ = 25 en Phase 0 comme en Phase 4.

---

## 7. Compte de manifestations du registre sur le parcours

Mesuré à l'écran, dans les mêmes conditions que l'itération 3, et lu avec le
coût de saisie — jamais seul.

| Chemin | Avant l'itération 4 | Après |
|---|---|---|
| Création, chemin heureux, volet réglages ouvert | 2 (A8 dans la ligne de réglage, B2 dans la barre) | 2 (A8 sous la ligne de réglage, B2 inchangée) |
| Création, chemin d'erreur à trois créneaux | 1 (A1, visible depuis l'itération 3) | 1 |
| Vote, message de succès | 1 (B6 ou B7) | 1 |
| Vote / contre-proposition, bloc renforts | 1 (A9 dans la ligne) + 1 conditionnel (B11 ou B12 une fois « oui ») | idem, A9 sous la ligne |

**Le registre ne recule sur aucun chemin.** Ce que l'itération change est
l'endroit et l'échelle de deux de ces manifestations, pas leur nombre.
