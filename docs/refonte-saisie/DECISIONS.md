# DECISIONS.md — partis pris structurants

Ce fichier est cumulatif : chaque itération y ajoute ses décisions, elle n'en
retire ni n'en réécrit aucune sauf accord explicite du propriétaire du produit
(section 3 du prompt de routine, « Non-rediscussion »).

---

## Itération 1 — 24/08/2026

### D1. Charte de placement du ton (gelée à partir de cette itération)

Fondée sur l'audit (`AUDIT-1.md` §4) : sur les 9 tournures en zone de décision,
7 sont des messages d'erreur bloquants et 2 sont des libellés d'état de
`SwitchRow`. Le ton n'a jamais pris la place d'un signifiant d'affordance — il
occupe des messages qui apparaissent au moment précis où l'utilisateur cherche
la réponse la plus courte à un problème de saisie. La charte suivante en
découle.

**Zones où le ton ne porte jamais** (aucune tournure ne doit s'y trouver, à
aucune itération) :
- le libellé d'un champ (`Field.label`) ;
- l'intitulé du bouton d'action primaire (`.button--primary`) ;
- la phrase de statut de `ActionBar` tant qu'elle est en tonalité `blocked` ;
- le texte d'une erreur de champ individuel (`Field.error` / `error` de
  `TextField`, `LocationField`, `ChoiceGroup`) — celle-là doit rester lisible
  au premier regard, sans décodage.

**Zones autorisées, par ordre de préférence** (reprises du prompt de routine,
section 2, précisées avec les emplacements réels du code audité) :
1. `Disclosure.summary` et `Field.hint` d'un champ facultatif — déjà le cas de
   B1, B16, B11, B12, B13, B10 dans l'audit ;
2. `placeholder` d'un champ facultatif — déjà le cas de B9 ;
3. message de succès post-validation (`feedbackTone === "ok"`) — déjà le cas
   de B6, B7 ;
4. note d'un chemin secondaire non bloquant (recherche de lieu vide, refus de
   géolocalisation) — déjà le cas de B14, B15 ;
5. `description` d'une option de `ChoiceGroup`, seulement si l'option est
   optionnelle et non pré-sélectionnée par défaut — déjà le cas de B1, B16.

**Zone à statut particulier — les erreurs de formulaire génériques
(`setFeedback` en `role="alert"`, hors erreur de champ)** : A1, A2, A3, A5, A6,
A7. Elles ne peuvent pas être simplement « déplacées » comme un hint : leur
contenu factuel (créneaux passés, nom pris, échec réseau) est l'information
que l'utilisateur cherche à cet instant précis, et il n'existe pas de zone hors
saisie où afficher une erreur de saisie. La charte tranche donc pour elles un
levier différent de celui des hints : **hiérarchie typographique et densité**,
pas déplacement. Concrètement, pour l'itération où ces messages seront
retravaillés (prévu itération 2, cf. `BACKLOG.md`) :
- la chaîne reste un bloc unique, verbatim, jamais scindée en deux fragments
  distincts stylés différemment (scinder changerait la lecture du message,
  pas seulement son style) ;
- son poids visuel doit rester **inférieur ou égal** à celui d'une erreur de
  champ individuelle (`.field__error`), jamais supérieur : aujourd'hui
  `.feedback` est à 13 px, la même taille qu'un `.field__error` — il n'y a pas
  de hiérarchie entre « la donnée manque » et « zéro exploit temporel » alors
  que la première doit primer. Descendre `.feedback` d'un cran de graisse (pas
  seulement de taille, cf. `references/color-and-type-protocol.md` §2 : la
  graisse est le levier le moins coûteux en densité) est la piste retenue.

**Zone à statut particulier — l'état d'un `SwitchRow` (A8, A9)** : le texte de
`state` est lu à chaque passage, il n'est donc pas un « aparté » au sens
strict, mais son rôle fonctionnel (dire si le réglage est activé) n'a pas
besoin d'un tour de phrase pour être rempli — un simple `Oui`/`Non` le
remplirait tout aussi bien. La charte retient : le déplacement de A8/A9 vers
`SwitchRow.hint` (zone déjà prévue par le composant, actuellement vide dans
ces deux usages) est le mécanisme correct — la chaîne existante migre telle
quelle vers `hint`, et `state` reçoit un texte fonctionnel court qui n'entre
pas dans le corpus gelé (ce n'est pas une nouvelle tournure, c'est un libellé
neutre). Ce déplacement précis est réservé à l'itération 4 (« application de la
charte »), pas à celle-ci.

**Ce qui ne change jamais, quelle que soit l'itération** : aucune fusion de
deux champs séparés par une tournure (« Densité et espacement » du prompt de
routine) — vérifié : aucun cas de ce type n'existe dans le code audité.

### D2. Doctrine d'affordance (adoptée, fondée sur l'audit)

Le constat de départ n°1 (« affordance insuffisante ») est **en grande partie
infirmé** par `AUDIT-1.md` §1 : une refonte d'affordance documentée dans
`docs/DESIGN-SYSTEM.md` est déjà en place et tient sur le code. La doctrine
pour la suite de la routine n'est donc pas « ajouter de l'affordance partout »
mais :

1. **Ne pas rouvrir ce qui fonctionne.** `Field`, `ChoiceGroup`, `SwitchRow`,
   `ActionBar`, `FormSection`, `FormSheet`, `Disclosure` ne sont pas à
   refondre : ils sont la fondation correcte sur laquelle le reste du travail
   s'appuie.
2. **Corriger les résidus nommés, pas en chercher de nouveaux par principe.**
   Les quatre résidus de `AUDIT-1.md` §3 (mention manquante sur « Proposé
   par », absence de shake dans `AlternativeOptionForm`, incohérence
   documentaire sur les trois champs de créneau, signifiant absent sur
   `LocationField`) sont le périmètre affordance de la routine, pas un audit
   général de l'application.
3. **Le coût de saisie prime sur l'esthétique du champ.** Le champ lieu
   (`AUDIT-1.md` §3.5) est 2 à 4 fois plus coûteux que jour ou heure — c'est la
   priorité réelle, conforme à la trajectoire indicative du prompt de routine
   (itération 2 : « le champ le plus coûteux »).
4. **Conformité = plancher.** Toute correction d'affordance garde le
   registre « Confrérie » intact dans son texte ; elle ne le neutralise
   jamais au prétexte qu'une version plus neutre serait plus simple à valider
   (`references/CLAUDE.md` UXER, règle 9).

### D3. Architecture de saisie — plan sur papier (aucun code touché cette itération)

Pas de refonte de l'ordre des champs pour `CreateEventPage` et `VoteForm` : sur
preuve `code` (`AUDIT-1.md` §1), l'ordre actuel est déjà correctement
hiérarchisé — l'obligatoire d'abord (créneaux / réponse par créneau), le
facultatif ensuite et replié (carte de visite, réglages / détails). Aucun
constat de l'audit ne justifie de le changer. La priorité d'architecture pour
les itérations suivantes porte donc sur la **mécanique interne** d'un champ
existant plutôt que sur l'ordonnancement de l'écran :

- **Itération 2 (plan)** : réduire le coût du champ lieu. Piste à instruire,
  pas encore décidée : proposer les résultats de recherche sans passer par
  l'overlay plein écran pour une liste courte (moins de 300 ms après la
  troisième lettre), garder l'overlay uniquement pour la carte et « autour de
  moi ». Corriger 3.1 (mention manquante) dans le même lot, ainsi que la
  hiérarchie typographique de D1 sur les erreurs génériques.
- **Itération 3 (plan)** : états et progression — vide, en cours, erreur,
  succès, brouillon repris. Corriger 3.3 (shake absent dans
  `AlternativeOptionForm`) dans ce lot, puisqu'il s'agit précisément d'un état
  d'erreur.
- **Itération 4 (plan)** : déplacements de ton D1 (erreurs génériques et
  `SwitchRow`), corriger 3.2 et 3.4.
- **Itération 5 (plan)** : revue QA finale, double mesure.

Cette trajectoire reste indicative, comme le prévoit le prompt de routine : la
Phase 1 de chaque itération peut la faire bouger si un nouvel audit ciblé le
justifie, mais elle ne se rouvre pas sans preuve nouvelle.

---

## Itération 2 — 29/08/2026

### D4. Réduction du coût du champ lieu — piste tranchée (D3 « à instruire »)

D3 laissait la piste ouverte : « proposer les résultats de recherche sans
passer par l'overlay plein écran ». Avant d'implémenter, relecture du code de
`LocationField.tsx` : l'overlay plein écran porte une justification
fonctionnelle documentée dans le composant (commentaire ligne 61-63,
`isSearchOpen`) — sans lui, les suggestions ancrées sous le champ tombent
derrière le clavier virtuel mobile. Retirer l'overlay sans vérifier sur un
rendu mobile réel qu'un remplacement ne recrée pas ce problème serait
rediscuter un choix déjà motivé sans preuve nouvelle qui le justifie
(section 3 du prompt de routine, principe de non-rediscussion appliqué par
analogie à un choix d'architecture documenté).

Décision : **garder l'overlay**, et réduire le coût par deux leviers
vérifiables sans dépendre d'un rendu de clavier virtuel :

1. `MIN_QUERY_LENGTH` : 3 → 2 lettres avant le premier retour visuel
   (`LocationField.tsx`). Un caractère de moins avant la première suggestion,
   sans perte de pertinence Photon documentée.
2. **Sélection au clavier** : Entrée sur le champ de recherche sélectionne la
   première suggestion quand la liste n'est pas vide. Le lieu redevient un
   champ « taper puis valider », au même rythme que jour/heure, pour le cas
   où le premier résultat est le bon — le tap sur une suggestion reste
   disponible pour les autres cas.

Le retrait de l'overlay reste une piste possible pour une itération
ultérieure, mais seulement sur preuve d'exécution réelle (viewport mobile,
clavier virtuel ouvert) qui montre qu'un remplacement ne recrée pas le
problème que l'overlay résout aujourd'hui. Voir `BACKLOG.md`, « Écarté cette
itération ».

### D5. `.feedback` : hiérarchie appliquée (D1)

La piste retenue par D1 pour les erreurs génériques du palier A (A1, A2, A3,
A5, A6, A7) est appliquée : `.feedback` passe de `font-weight: 700` à `600`
dans `src/styles/global.css`, un cran sous `.field__error` (`700`, inchangé).
Aucun texte modifié, aucune tournure déplacée — c'est le levier « hiérarchie
typographique », pas « emplacement » (D1 les traite déjà comme deux leviers
distincts pour cette zone). Les 6 chaînes concernées restent `en place` au
sens de `TON.md`.

---

## Itération 3 — 01/09/2026

### D6. Un refus d'envoi doit se voir, et le regard va à un seul endroit

`AUDIT-3.md` §2 établit sur preuve d'exécution que le message d'erreur
générique de `CreateEventPage` est rendu 1229 px sous le bas de l'écran sur un
formulaire à trois créneaux, sans défilement automatique. Le mécanisme qui fait
exactement ce travail existe déjà dans le dépôt : `useShakeInvalid` — il n'est
simplement branché que sur le chemin « créneau incomplet ».

**Décision : une seule implémentation, celle qui existe.** `useShakeInvalid`
gagne une seconde porte d'entrée, `bringIntoView(id)`, qui partage le même
effet de remontée du regard sans déclencher la secousse. Pas de second hook :
deux implémentations d'un même mécanisme divergent toujours.

**Règle de destination — un refus ne réveille qu'une seule zone :**

| Nature du refus | Où va le regard |
|---|---|
| Un champ précis est en faute (créneau incomplet, blaze manquant) | Le bloc fautif — secousse, focus sur le champ refusé. Inchangé |
| Le refus est global (créneaux passés, nom d'apéro pris, échec réseau, erreur du service) | Le message qui l'explique — remontée dans le champ de vision, sans secousse |

Elles ne se déclenchent jamais ensemble : deux `scrollIntoView` concurrents
choisissent l'un pour l'autre où l'utilisateur doit regarder, ce qui est pire
que ne rien faire.

Fondement UXER : `references/affordance-and-signifiers.md` §4 (« Après —
feedback et nouvel état » : après l'action, sait-on ce qui s'est passé ?) et
§12, anti-pattern « feedback global quand l'utilisateur attend un changement
local ». `reference-packs/mobile-field-agent/PACK.md`, table des états :
« Erreur de saisie — sous le champ, **visible** malgré le clavier virtuel ».

**Ce que cette décision fait au ton, et pourquoi elle relève de la charte D1
sans la rouvrir.** A1, A2, A3, A4 sont quatre tournures du corpus posées dans
cette zone. Elles ne changent ni de texte, ni d'écran, ni de rôle, ni
d'échelle : elles arrivent simplement sous les yeux de qui vient de les
déclencher. C'est le levier « moment et lieu d'apparition » que D1 avait
réservé pour cette zone en écartant le déplacement d'écran — il est appliqué,
pas redéfini. Une tournure hors du champ de vision ne se manifeste pas :
cette correction **augmente** la présence effective du registre.

### D7. La barre d'action ne dit jamais « prêt » pendant un refus

`AUDIT-3.md` §3 : `isReady` ne regarde que la complétude des champs, alors que
A1, A4 et les erreurs du `catch` surviennent toutes sur un formulaire complet.
Au moment du refus, la barre collante — le seul élément que l'utilisateur a
effectivement sous les yeux — affiche l'état `ready` en vert. C'est une fausse
affordance au sens de la matrice réel × perçu de
`references/affordance-and-signifiers.md` §2 : l'écran promet un état que le
produit ne fournit pas.

**Décision :** tant qu'un message d'erreur générique est affiché, la barre
d'action passe en tonalité `blocked` et sa ligne de statut renvoie au message
au lieu d'annoncer l'état de complétude. Vaut pour les trois formulaires.

Le texte de cette ligne est du **vocabulaire fonctionnel**, jamais une
tournure : D1 interdit explicitement le ton dans la phrase de statut de
`ActionBar` en tonalité `blocked`, et cette décision ne fait qu'y ajouter un
cas d'application.

Conséquence assumée sur le corpus, consignée ici pour qu'aucune itération
ultérieure n'ait à la redécouvrir : sur le seul chemin d'erreur, B2
(« La tablée tranchera. ») cède la ligne de statut au renvoi vers le message.
B2 ne change pas de texte, ne change pas d'emplacement, et reste affichée
telle quelle sur le chemin heureux — son statut `TON.md` reste `en place`,
N reste à 25.

Le bilan de manifestations sur ce seul chemin d'erreur reste de **1 visible
avant, 1 visible après** : ce n'est pas la quantité qui change, c'est laquelle
des deux. Avant, la tournure visible était B2, qui annonce que tout va bien
au moment d'un refus ; après, c'est A1, qui dit ce qui coince. Une itération
ultérieure qui voudrait « récupérer » B2 sur ce chemin doit d'abord expliquer
comment deux messages contradictoires coexistent sans que l'un annule
l'autre — c'est cette question, et non le goût, qui a tranché ici.

### D8. La saisie survit à l'interruption

`AUDIT-3.md` §4 : un rechargement de page vide intégralement le formulaire de
création. `reference-packs/mobile-field-agent/PACK.md` classe « sauvegarde
uniquement à la validation » parmi ses anti-patterns, avec pour correction
« sauvegarde locale continue », et pose en règle de navigation : « à la
réouverture, l'application revient là où l'utilisateur était, avec sa saisie
intacte ».

**Décision :** brouillon local du formulaire de création, dans un module dédié
(`src/services/createEventDraft.ts`), sur le patron des autres registres
locaux du dépôt (`localAperoRegistry.ts`) — un seul endroit qui lit, écrit et
valide.

Bornes, pour que la commodité ne devienne pas un piège :

1. **Rien de sensible.** Le brouillon ne contient que ce que l'utilisateur a
   tapé dans le formulaire. Aucune clé, aucun identifiant d'apéro : ces
   objets-là n'existent pas encore au moment où le brouillon vit.
2. **Péremption à 24 h.** Au-delà, il est ignoré et effacé. Un brouillon d'il
   y a trois semaines qui repeuple un formulaire est une surprise, pas un
   service.
3. **Le pré-remplissage prime.** Arriver par « Remettre ça » (`prefill` dans
   l'état de navigation) est une intention explicite et récente : elle passe
   devant un brouillon dormant. Conséquence à connaître : il n'existe qu'un
   seul emplacement de brouillon, donc la saisie de cette visite-là remplace
   le brouillon précédent. C'est la sémantique voulue — le travail le plus
   récent est celui qu'on protège — mais elle mérite d'être écrite plutôt que
   découverte. Un brouillon par point d'entrée coûterait plus de complexité
   qu'il ne rendrait de service : les deux chemins mènent au même formulaire,
   et personne ne remplit deux créations d'apéro en parallèle.
4. **Effacé dès que l'apéro existe.** La création réussie purge le brouillon,
   avant la navigation de sortie.
5. **Toujours une porte de sortie.** Un brouillon restauré s'annonce et offre
   « Repartir de zéro ». Une saisie restaurée qu'on ne peut pas vider est
   pire que pas de restauration du tout.
6. **Aucune promesse de sauvegarde non tenue.** Si `localStorage` est
   indisponible ou plein, l'écriture échoue en silence et le formulaire
   continue de fonctionner — il n'affiche alors aucun message de restauration,
   puisqu'il n'y a rien à restaurer.

**Ce que cette décision ouvre pour l'itération 4.** Le message de reprise de
brouillon est écrit ici en vocabulaire fonctionnel neutre, délibérément. Il
crée une **zone hors saisie neuve** — un accusé de réception à l'entrée dans
le formulaire, hors de la ligne de regard et hors du chemin du pouce — qui est
exactement le type d'emplacement que la charte D1 privilégie. L'itération 4,
qui a mandat sur les déplacements, décidera si une tournure du corpus y trouve
sa place. Cette itération ne le fait pas et n'écrit aucune tournure neuve : le
corpus est gelé, et en inventer relève d'une décision du propriétaire du
produit, pas d'une itération.

### D9. Cibles tactiles — le plancher de 44 px s'applique à tout le parcours de saisie, pas seulement aux contrôles déjà couverts

Décision issue d'une passe parallèle de cette même itération (31/08/2026,
preuve `code`), fusionnée ici ; elle complète le §1 de `AUDIT-3.md`, dont la
sonde ne mesurait que l'écran de création.

Le bloc « Cibles tactiles » de `global.css` (`global.css:2623-2625`) documente
déjà un plancher de 44 px et l'applique à `.bk`, `.slot__x`, `.share .cp`,
`.ghost-link` et `.minimap__expand`. `AUDIT-3.md` §1 (complément) montre que
`.stepper__btn` (compteur de renforts, `CompanionsField.tsx`, dans les
parcours de vote et de contre-proposition) y échappait à 42 × 42 px. Ce n'est
pas un nouveau principe à trancher : c'est l'application d'un principe déjà
écrit dans le fichier à un contrôle qu'aucun audit n'avait encore couvert.
Corrigé à 44 × 44 px, sans changement visuel perceptible (2 px), selon la
méthode déjà en usage dans cette section (dimension minimale, pas de
redessin).

`.cheer-btn` (40 px) reste **hors périmètre** : ce n'est pas un contrôle de
saisie de formulaire (action secondaire de « trinquer »), et rien dans l'audit
ne démontre qu'il bloque la saisie (section 8 du prompt de routine). Consigné
dans `BACKLOG.md` (item 16) pour une itération qui traiterait spécifiquement
les actions secondaires, si le produit le demande.

**Ce que la fusion de cette passe parallèle a écarté, et pourquoi.** La même
passe avait aussi branché `useShakeInvalid` sur `AlternativeOptionForm` et
écrit un brouillon local du formulaire de création directement dans
`CreateEventPage.tsx`, sous la même clé `apero_create_draft_v1`. Les deux
étaient déjà couverts par D6 et D8, avec un périmètre plus large (remontée du
message d'erreur pour les refus globaux, péremption à 24 h, porte de sortie
« Repartir de zéro », tests unitaires du brouillon). Garder les deux versions
aurait fait cohabiter deux implémentations du même mécanisme sur la même clé
de stockage — exactement ce que D6 refuse. Seule la version de D6/D8 est
conservée ; la note de reprise « Brouillon retrouvé : reprends où tu t'étais
arrêté. » et la règle `.field__hint--draft` qui l'accompagnait ne sont pas
entrées dans le code.

---

## Itération 4 — 02/09/2026

### D10. A8/A9 sortent du bouton : application de la charte D1, avec le support qu'elle n'avait pas prévu

C'est le déplacement que D1 avait réservé à cette itération. Il est appliqué,
pas rediscuté : la destination (sous la ligne, hors du bouton, un cran plus
bas), le mécanisme (la chaîne migre telle quelle, `state` reçoit un libellé
fonctionnel neutre) et le motif sont ceux de D1. Ce que cette décision ajoute
est le **support**, parce que l'audit a montré que celui nommé par D1 n'est pas
libre.

**Ce que l'audit établit, et que D1 ne pouvait pas savoir** (`AUDIT-4.md` §3) :
D1 écrit que `SwitchRow.hint` est « actuellement vide dans ces deux usages ».
C'est exact pour `CreateEventPage` et `CompanionsField`, faux pour
`AperoSettingsForm.tsx:138-142`, qui passe un `hint` conditionnel depuis le
commit `9738a47` — antérieur à l'itération 1. Appliquer D1 à la lettre y ferait
cohabiter, dans un même paragraphe, une tournure du registre et une note qui
prévient d'une conséquence de l'enregistrement. Les deux y perdraient :
l'information de conséquence deviendrait la fin d'une phrase drôle, et la
tournure le préambule d'un avertissement.

**Décision : un support nommé pour l'aparté, distinct de l'aide fonctionnelle.**
`SwitchRow` reçoit une prop `aside`, rendue sous la ligne, à côté de `hint` et
sans le remplacer. Trois textes, trois rôles, et le composant les tient
séparés :

| Prop | Rôle | Où |
|---|---|---|
| `title` | la question posée | dans le bouton |
| `state` | **la réponse** à cette question, tenue courte | dans le bouton |
| `aside` | le commentaire de la maison sur l'état courant | sous la ligne, hors du bouton |
| `hint` | une précision fonctionnelle, quand il en faut une | sous la ligne, hors du bouton |

Ce n'est pas une réouverture de la charte : D1 décide **où le ton va** et à
quelle échelle, pas par quel nom de prop il y arrive. Sa prémisse factuelle
était inexacte ; sa destination ne l'était pas.

**Le `state` fonctionnel est `Oui` / `Non`.** C'est le libellé que D1 nomme
elle-même (« un simple `Oui`/`Non` le remplirait tout aussi bien »). Les deux
titres sont des questions fermées — « Les mioches sont-ils conviés ? », « Tu
débarques accompagné·e ? » — donc la réponse d'un mot est littéralement la
réponse, pas un raccourci. Ce libellé est du vocabulaire fonctionnel : il
n'entre pas au corpus gelé et ne fait pas monter N₀.

**Ce que la mesure dit du résultat** (`AUDIT-4.md` §2, et la table de
`TON.md` §4) : la tournure passe de 13 px/600 à 12.5 px/500, sort de la cible
tactile de 60 px et du nom accessible du bouton, gagne 96 px de largeur
disponible — et son **contraste mesuré sur pixels rendus est de 7.94 : 1**,
au-dessus du plancher AA de 4.5 : 1. Le contraste monte au lieu de baisser :
l'opacité passe de 0.62 à 0.72 et le texte quitte le fond éclairci du bouton
pour le fond de page, plus sombre.

**Ce que ça coûte à la saisie : rien, et ça lui rend quelque chose.** Le seul
texte de la ligne qui change quand on bascule était une phrase de 28
caractères ; c'est maintenant un mot. La vérification « la bascule a-t-elle
pris ? » cesse de demander une lecture. Fondement UXER :
`references/affordance-and-signifiers.md` §5.5 (les états doivent rester
distinguables) et §5.4 (agrandir la cible ne rend pas l'action découvrable —
c'est un signal cohérent qui porte l'intention, ici la bascule elle-même) ;
`references/color-and-type-protocol.md` §2 pour la graisse comme levier de
hiérarchie le moins coûteux en densité, déjà mobilisé par D1 et D5.

### D11. Les deux derniers résidus nommés par D2 sont clos

D2 fixe le périmètre affordance de la routine aux quatre résidus de
`AUDIT-1.md` §3 — « corriger les résidus nommés, pas en chercher de nouveaux
par principe ». 3.1 est clos en itération 2, 3.3 en itération 3. Les deux
derniers le sont ici, ce qui ferme ce périmètre sans l'élargir.

**3.4 — `LocationField` porte un signifiant persistant.** Le champ ouvre une
recherche, une carte et une géolocalisation ; `role="combobox"` et
`aria-expanded` le disaient déjà, mais seulement aux lecteurs d'écran. Une
loupe de 17 px est posée **dans** le contrôle (`.locfield__glyph`, mesurée à
8 px du début du texte saisi, `pointer-events: none`), et vire au rouge avec le
contour quand le champ est en faute. C'est le cas que
`references/affordance-and-signifiers.md` §7 sépare en deux obligations
distinctes — sémantique et apparence — dont une seule était tenue. §5.3 en fixe
la limite, et elle est respectée : l'icône **s'ajoute** au libellé « Le
troquet » et à sa mention `Obligatoire`, elle ne les remplace pas. Une icône
seule aurait été l'exception que cette règle proscrit.

**3.2 — `docs/DESIGN-SYSTEM.md` documente son exception.** Le document exigeait
« une mention explicite `Obligatoire` ou `Facultatif` » sur tout champ, alors
que les trois champs d'un créneau y dérogent délibérément — la raison étant
écrite en commentaire dans le code, et nulle part dans le document. Il se
contredisait donc pour qui le lit sans ouvrir le code. L'exception est
maintenant énoncée avec son motif (trois pastilles identiques sur une ligne
serrée répètent la même chose et poussent le troquet à passer à la ligne ; la
phrase de statut du bloc porte l'information une fois pour les trois) **et sa
borne** : elle vaut pour ce bloc et ne s'étend à aucun autre champ.

La même mise à jour corrige ce que D10 rend inexact dans ce document, qui
décrivait `SwitchRow` comme annonçant « son état en toutes lettres
(« Marmaille admise » / « Ce soir c'est sans les mômes ») ». Les deux
tournures y restent citées, à leur nouveau rôle.

### D12. Le bandeau de reprise de brouillon reste en vocabulaire fonctionnel — question tranchée

D8 avait ouvert la question et l'avait explicitement remise à cette itération,
qui a mandat sur les déplacements. Elle est tranchée, pas reportée.

**Décision : aucune tournure du corpus ne se déplace vers ce bandeau.** Le
raisonnement porte sur les 25 entrées, une par une (`AUDIT-4.md` §4). Il se
résume à ceci : chaque tournure du corpus est déjà **attachée** à un champ, à
un chemin ou à un moment qui n'existe pas dans un bandeau de reprise. Aucune
n'est disponible ; toutes sont occupées. La seule dont le sens conviendrait,
B5 (« Le registre se souvient de toi. Retouche, si le cœur t'en dit. »), est
l'accueil du chemin de vote — l'y prendre ne serait pas un déplacement mais un
transfert, qui viderait un chemin pour meubler l'autre.

L'emplacement reste donc ce que l'itération 3 en a fait : un bon emplacement,
libre, en vocabulaire neutre. Ce n'est pas un échec du placement — c'est le
constat que le corpus, tel qu'il est, n'a pas de tournure qui lui corresponde.

**Proposition adressée au propriétaire du produit, et à lui seul.** Donner à
ce bandeau une couleur de registre demande d'y **écrire une tournure neuve**.
Cela fait monter N₀, et étendre le corpus n'est pas une décision d'itération
— symétriquement à ce qui vaut pour une suppression (sections 2 et 3 du prompt
de routine). Si le propriétaire le souhaite, l'emplacement est prêt et son
cahier des charges est écrit : un accusé de réception à l'entrée du formulaire,
au registre de la maison, à poser en remplacement de « Ta saisie précédente a
été retrouvée sur cet appareil. Reprends où tu en étais. » (`.draft-resume`,
`CreateEventPage.tsx`), et qui doit continuer à dire deux choses — que la
saisie a été retrouvée, et qu'on peut repartir de zéro. Aucune itération de
cette routine ne l'écrira d'elle-même.

---

## Itération 5 — 04/09/2026

### D13. Ce qui est posé sous une ligne de réglage doit être annoncé avec elle

**Le constat.** `Field` et `ChoiceGroup` relient leur `hint` et leur `error` au
contrôle par `aria-describedby` ; `Field.tsx:3-8` en fait une promesse de
composant (« impossible d'oublier le lien libellé/aide/erreur »). `SwitchRow`
ne le faisait pas : `aside` et `hint` étaient deux `<p>` sans `id`, et le bouton
ne portait aucun `aria-describedby` (`AUDIT-5.md` §3, mesuré sur les trois
rendus et aux deux viewports).

**La décision.** `SwitchRow` fabrique désormais ses identifiants et relie
`aside` puis `hint` au bouton, dans l'ordre de lecture. Un seul mécanisme, celui
que les deux autres composants appliquaient déjà — pas une seconde
implémentation.

**Pourquoi cette décision appartient à la couche « ton » autant qu'à
l'accessibilité.** L'itération 4 a sorti A8 et A9 du nom accessible du bouton,
et elle a eu raison : un nom accessible qui récitait
« Les mioches sont-ils conviés ?Ce soir c'est sans les mômes » était bavard.
Mais rien n'avait pris le relais. Le résultat net, sur le chemin assistif,
était que **la tournure avait disparu du contrôle** — ni dans le nom, ni dans
une description. Le contrôle de ton de la routine ne pouvait pas le voir : il
cherche la chaîne dans le code, où elle était bien présente.

C'est donc la lecture stricte du cliquet de la section 3 du prompt de routine,
appliquée à un chemin que la routine n'avait pas encore regardé : **une
itération qui fait disparaître le registre d'un parcours a échoué, même sans
toucher au texte.** Ce correctif est le seul de l'itération qui touche au
registre, et il l'augmente : il repose la tournure sur le chemin assistif sans
écrire un caractère, sans la déplacer, sans changer son échelle. C'est du
placement au sens exact de D1.

Fondement UXER : `references/affordance-and-signifiers.md` §7 (« sémantique et
apparence sont deux obligations distinctes ») — l'apparence était réglée par
l'itération 4, la sémantique ne l'était pas.

**Ce que la décision ne fait pas.** Elle ne met aucune tournure dans un nom
accessible, ni dans un libellé, ni dans une erreur bloquante : les zones que D1
interdit restent interdites. Une description accompagne un contrôle, elle ne le
nomme pas.

### D14. Le champ promu en chemin clavier rapide garde l'anneau commun

`global.css` porte une règle unique donnant à quinze sélecteurs — dont
`input:focus-visible` — un anneau `3px solid var(--pastis)`. `.locsearch__input`
en était **la seule exception du parcours de saisie** : `outline: none`,
remplacé par un raffermissement de bordure de 1 px.

**Le plancher normatif était tenu**, et c'est dit sans détour : l'indicateur
existait et mesurait 3.74 : 1 contre le dehors, au-dessus des 3 : 1 de WCAG
1.4.11. Ce constat n'a donc jamais été classé bloquant, et il ne se plaide pas
sur le goût.

Ce qui le rend opposable est un fait, pas une préférence : **D4 a fait de ce
champ le chemin clavier rapide du champ le plus coûteux du parcours** — Entrée
valide la première suggestion, « le lieu redevient un champ taper puis
valider ». Le contrôle qui porte le gain de vitesse au clavier de l'itération 2
était celui dont le repère de focus était le plus faible du parcours, et le
seul à déroger à la convention du produit.

Décision : retirer le `outline: none`. La bordure raffermie reste — elle
s'ajoute à l'anneau, elle ne le remplace plus. Mesuré après : trait
`[244,197,66]`, **11.14 : 1** contre le dehors (contre 3.74 avant), et
vérification visuelle faite — l'anneau ne déborde ni sur le bouton retour ni
hors du panneau.

**D4 n'est pas rouverte.** L'overlay est conservé, sa justification
fonctionnelle intacte. Le changement porte sur le repère de focus de son input,
pas sur son existence.

### D15. Les restes de l'ancien parcours sortent du CSS

19 classes sans aucune occurrence dans le dépôt hors `global.css` sont
retirées (`AUDIT-5.md` §5), dont deux familles qui sont littéralement des restes
du parcours d'avant :

- `vote-chip__*` (12 classes) — la chip récapitulative d'avant la refonte
  d'interface. Le balisage a été retiré par le commit `cb8e9c2` ; le CSS a
  survécu. L'implémentation vivante est `.recap__*`, structurellement jumelle ;
- `locfield__list` — la liste de suggestions **ancrée sous le champ**, c'est-à-dire
  l'architecture que D4 a explicitement tranchée en faveur de l'overlay.

Méthode, pour que le contrôle soit rejouable : recensement des 326 sélecteurs de
classe confrontés à `src/**/*.ts(x)`, puis **vérification une par une** des 21
correspondances manquantes qui sont en réalité des modificateurs construits par
gabarit (`recap__answer--${vote}`, `field__req--${requirement}`…). Une purge qui
se fierait au seul recensement littéral casserait ces sept familles.

`button--secondary` partageait deux règles avec `button--ghost`, qui est bien
utilisé : seul le sélecteur mort a été retiré, pas le bloc.

Résultat : 326 → 307 classes, `global.css` 72 119 → 70 289 octets, CSS livré
61 420 → 59 913 octets. Aucun rendu ne change — la vérification est que la
suite complète passe à l'identique.

### D16. Une localisation fausse dans `TON.md` se corrige, et ce n'est pas toucher au corpus

`TON.md` attribuait A9, B11, B12 et B13 à l'écran « Proposer un créneau ». Or
`CompanionsField` n'est monté qu'en `VoteForm.tsx:427` ; `AlternativeOptionForm`
ne l'importe pas et ne l'a jamais importé (`git log -S`, aucun commit). Vérifié
à l'exécution : la feuille de contre-proposition contient 0 `SwitchRow`.

La correction porte sur la colonne « Écran », jamais sur un texte ni sur le
compteur : les quatre tournures existent, au `fichier:ligne` déclaré, **N reste
25**. `TON.md` est « gelé sur le contenu, vivant sur le placement » — une
position mal décrite est exactement ce que la routine doit tenir à jour, et la
laisser fausse ferait travailler la prochaine itération sur une carte inexacte.
C'est la même nature d'erreur que celle trouvée dans la prémisse de D1 par
l'itération 4 (`AUDIT-4.md` §3).
