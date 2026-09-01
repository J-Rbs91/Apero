# AUDIT-3 — itération 3/5

Thème imposé par la trajectoire (`DECISIONS.md` D3) : **états et progression** —
vide, en cours, erreur, succès, brouillon repris — puis saisie au pouce et
cibles tactiles.

Nature des preuves de cet audit :

- **preuve `code`** — lecture de `CreateEventPage.tsx`, `VoteForm.tsx`,
  `AlternativeOptionForm.tsx`, `src/components/ui/{ActionBar,FormSheet,FormSection}.tsx`,
  `src/hooks/useShakeInvalid.ts`, `src/styles/global.css` ;
- **preuve `exécution`** — sonde Playwright dédiée, Chromium headless, viewport
  390 × 780 (mobile), Photon interceptée, `npm run dev` réel. Mesures de
  géométrie prises sur le DOM rendu, pas déduites du CSS ;
- **preuve `visuelle`** — deux captures d'écran du parcours en échec,
  réellement inspectées (`références/browser-evidence-protocol.md` d'UXER :
  une capture créée mais non regardée n'est pas une vérification visuelle).

---

## 0. Non-régression des constats corrigés en itération 2

Vérifié avant tout nouveau constat, comme l'impose la Phase 1 du prompt de
routine (« vérifier d'abord que les constats corrigés la fois d'avant ont
réellement disparu »).

| Constat corrigé en it. 2 | Vérification | État |
|---|---|---|
| Mention `requirement` absente sur « Proposé par » (`AUDIT-1.md` §3.1) | `AlternativeOptionForm.tsx:169` porte `requirement="required"` | corrigé, tient |
| Premier retour visuel du lieu à 3 lettres (`D4`) | `LocationField.tsx:17` — `MIN_QUERY_LENGTH = 2` | corrigé, tient |
| Pas de sélection au clavier sur la recherche de lieu (`D4`) | `LocationField.tsx:175` — `Enter` sélectionne la première suggestion | corrigé, tient |
| `.feedback` au même poids qu'une `.field__error` (`D5`) | `global.css:1363-1369` — `font-weight: 600` contre `700` pour `.field__error` | corrigé, tient |
| Hint fonctionnel resté à « trois lettres » | `CreateEventPage.tsx:401`, `AlternativeOptionForm.tsx:160` — « Tape deux lettres » | corrigé, tient |

Aucune régression. Le corpus gelé est intact : **N = 25 / N₀ = 25** (contrôle
`grep` de Phase 0, détail dans `JOURNAL.md`).

---

## 1. Cibles tactiles — mesurées, pas supposées

`AUDIT-1.md` §7 listait « le ressenti tactile des cibles » comme non vérifié.
C'est fait, par mesure de `getBoundingClientRect()` sur le rendu réel en 390 × 780 :

| Cible | Mesure réelle | Plancher 44 px |
|---|---|---|
| Bouton « Créer l'apéro » (`.actionbar .button--primary`) | 302 × 52 | OK |
| « + Ajouter un créneau » (`.addline`) | 294 × 50 | OK |
| Champ Jour (`input[type=date]`) | 126 × 50 | OK |
| Champ Heure (`input[type=time]`) | 126 × 50 | OK |
| Champ Le troquet | 264 × 50 | OK |
| Volet « Réglages de l'assemblée » | 322 × 74 | OK |
| « Retirer » un créneau (`.slot__x`) | 68 × 44 | OK (limite basse) |

**Constat : rien à corriger ici.** Le bloc « Cibles tactiles » de
`global.css:2607-2640` fait ce qu'il annonce. Le constat de départ n°1 de la
routine (« zone tactile trop petite ») est **infirmé sur preuve d'exécution**
pour l'écran de création — comme l'avait déjà été, sur preuve `code`,
l'essentiel du volet affordance en itération 1.

---

## 2. Constat central de cette itération : l'erreur générique tombe hors de l'écran

**Gravité : Bloquant.** C'est le constat le plus lourd trouvé depuis le début
de la routine, et il n'était pas visible en preuve `code` seule — c'est
précisément la lacune que `AUDIT-1.md` §7 avait nommée.

### Ce qui a été observé

Sonde : trois créneaux remplis, tous datés dans le passé (déclenche A1, la
première erreur générique de `handleSubmit`). Conteneur défilant réel :
`div.mobile-page__inner`, `scrollHeight = 2151 px` pour `clientHeight = 780 px`.
Position de lecture : haut du formulaire (`scrollTop = 0`) — position naturelle
de qui relit son créneau 1 avant d'appuyer, puisque **la barre d'action est
collante et donc toujours atteignable sans descendre** (`global.css:3113-3116`,
`position: sticky; bottom: 8px`).

Après le tap sur « Créer l'apéro » :

```
message d'erreur (.feedback) : top = 2009 px, bottom = 2064 px
barre d'action collante      : top = 653 px
hauteur de l'écran           : 780 px
scrollTop après l'envoi      : 0   (inchangé)
→ message visible à l'écran  : NON
```

Le message est rendu **1229 px sous le bas de l'écran**, et rien ne l'y amène :
aucun défilement automatique, aucun focus déplacé.

Capture d'écran prise après le refus et **réellement inspectée** — ce qu'elle
montre, de haut en bas : le titre « Organiser un apéro », l'étape 1 « Les
créneaux » avec sa pastille `3/3` et sa coche verte de section terminée, le
créneau 1 marqué `Complet`, puis la barre d'action portant
« 3 créneaux prêts. La tablée tranchera. » et le bouton « Créer l'apéro ».
Aucun message d'erreur n'est visible, nulle part. Rien à l'écran n'indique que
l'envoi vient d'être refusé.

### Pourquoi

`CreateEventPage.tsx:484-488` place le `<p className="feedback" role="alert">`
en flux normal, juste avant `<ActionBar>` (`:490-497`). La barre étant
`sticky`, elle est la seule des deux à remonter dans le champ de vision ; le
message, lui, reste à sa position naturelle, en fin de document. `role="alert"`
le fait annoncer par un lecteur d'écran — l'utilisateur voyant, lui, n'a
aucun signal.

`useShakeInvalid` (`src/hooks/useShakeInvalid.ts`) fait exactement ce travail
de remontée du regard, mais il n'est branché que sur le chemin « créneau
incomplet » (`CreateEventPage.tsx:161-166`). Les six autres sorties en échec
de `handleSubmit` — A1 (`:175-181`), A4 nom pris (`:193-199`), et les cinq
branches du `catch` (`:304-318`, dont A2 et A3) — passent toutes par
`setFeedback` et n'ont aucun équivalent.

### Ce que ça coûte à la saisie

L'utilisateur appuie, l'écran ne bouge pas. Le geste rationnel suivant est de
ré-appuyer, puis de chercher. Le coût n'est pas une seconde perdue : c'est un
parcours qui n'aboutit pas tant que l'utilisateur n'a pas eu l'idée de faire
défiler jusqu'en bas d'un formulaire dont rien n'indique qu'il faut le faire.

### Ce que ça coûte au ton — et c'est le point qui compte pour cette routine

A1, A2, A3, A4 sont quatre tournures du corpus gelé (palier A). **Elles sont
écrites, elles sont en place, et personne ne les lit.** Le compteur de
manifestations du registre les compte comme présentes ; l'écran ne les montre
pas. Une tournure hors du champ de vision ne se manifeste pas.

C'est la démonstration la plus nette, depuis le début de la routine, que le
problème posé au départ est bien un problème de **placement** et non de
contenu : ces quatre chaînes n'ont pas besoin d'être touchées d'un caractère,
elles ont besoin d'arriver sous les yeux.

### Portée

Même montage dans `VoteForm.tsx:430-437` (feedback juste avant l'`ActionBar`
de `:439-465`) et dans `AlternativeOptionForm.tsx:181-187` (feedback dans le
corps défilant de la `FormSheet`, barre d'action dans le pied fixe
`formsheet__foot`). Les trois formulaires de saisie sont concernés.

Nuance mesurée, pas supposée : sur un formulaire court (un seul créneau,
`scrollHeight = 1316 px` mais message rendu à `y = 621` pour un écran de
780 px), le message **est** visible. Le défaut n'apparaît qu'à partir du moment
où le formulaire dépasse l'écran — c'est-à-dire dès deux créneaux, et toujours
sur `VoteForm` dès qu'il y a plusieurs créneaux à trancher.

---

## 3. La barre d'action annonce « prêt » au moment même où l'envoi est refusé

**Gravité : Important.** Observé dans la même sonde.

`CreateEventPage.tsx:130-136` calcule `actionStatus` à partir de `isReady`,
qui ne regarde que la complétude des champs (`:124-126`). Or A1 se déclenche
sur des créneaux **complets mais passés** : `isReady` est vrai, donc au moment
du refus la barre affiche `« 3 créneaux prêts. La tablée tranchera. »` en
tonalité `ready` — soit la couleur `--ok`, le vert pâle `#9fdcae`
(`global.css:3143-3145`, `:71`) — sous le pouce, pendant que l'envoi vient
d'être refusé. La coche de section terminée et la pastille `Complet` du
créneau disent la même chose sur la capture inspectée.

Le seul élément que l'utilisateur a effectivement sous les yeux lui dit donc
que tout va bien. C'est une rupture d'affordance au sens strict de la doctrine
D2 : l'état perçu contredit l'état réel.

Même mécanique pour A4 (nom d'apéro déjà pris) et pour les cinq erreurs du
`catch` : toutes surviennent après que `isReady` est passé à vrai.

---

## 4. Rien n'est conservé : une interruption coûte toute la saisie

**Gravité : Important.** Observé : trois champs remplis, rechargement de la
page, relecture du DOM.

```
après rechargement — jour="" heure="" troquet="" créneaux=1
```

`CreateEventPage.tsx:89-97` n'initialise ses états que depuis `prefill`
(l'état de navigation « Remettre ça »). Aucune persistance : `grep
localStorage src/` ne trouve, pour cet écran, que le blaze mémorisé
(`useComptoirName`) — pas les créneaux, pas le nom, pas le prétexte, pas les
réglages.

Conséquence concrète pour l'usage réel de l'app (téléphone, au comptoir) :
tout ce qui ferme l'onglet ou recharge la page — appel entrant, bascule
d'application avec purge mémoire, tap malheureux sur « recharger » — repart de
zéro. Sur un apéro à trois créneaux, cela représente la totalité de la saisie,
y compris trois recherches de lieu, qui sont le geste le plus coûteux du
formulaire (`AUDIT-1.md` §3.5).

C'est le point « brouillon repris » nommé par la trajectoire de l'itération 3,
et l'audit le confirme comme réellement absent, pas seulement perfectible.

---

## 5. Ce qui va bien, et qu'on ne touche pas

À noter pour éviter qu'une itération ultérieure ne « corrige » ce qui
fonctionne (doctrine D2, règle 1) :

- **État vide** : `FormSection` porte un numéro d'étape, un titre, une amorce,
  et pour l'étape 1 un compteur `n/total` (`CreateEventPage.tsx:342`,
  `VoteForm.tsx:375`) ; chaque créneau porte sa propre pastille
  `Complet` / `À compléter` (`CreateEventPage.tsx:362-370`). La progression est
  déjà lisible sans avoir à compter soi-même.
- **État de succès** : `VoteForm` replie le formulaire en récapitulatif après
  envoi (`:262-344`), avec B6/B7 en message de statut. C'est le bon patron —
  `TON.md` le note déjà comme « bon exemple ».
- **État en cours** : les trois formulaires changent le libellé du bouton
  pendant l'envoi (`« Création de l'apéro… »`, `« On émarge… »`, `« Envoi… »`)
  et posent un verrou synchrone contre le double envoi
  (`submitLockRef`). Rien à ajouter.
- **Retour au bloc fautif** : opérationnel sur `CreateEventPage` et `VoteForm`.
  Absent de `AlternativeOptionForm` — c'est l'item 4 du backlog, repris
  ci-dessous.

---

## 6. Position du registre : ce que cette itération observe

Le tableau complet reste celui de `TON.md`. Cette itération n'ajoute qu'un
constat, celui de la section 2 : **quatre tournures du palier A (A1, A2, A3,
A4) sont posées dans une zone qui, sur un formulaire plus long que l'écran,
n'est jamais regardée.**

Échelle et graisse par rapport au libellé de champ voisin : `.feedback` est à
13 px / 600 depuis l'itération 2, contre 13 px / 700 pour `.field__error` et
un libellé de champ à 13 px / 700 (`global.css:1363`, `:734`). La hiérarchie
voulue par D1 est en place. **Ce n'est donc pas un problème d'échelle : c'est
un problème de position.**

Aucune de ces quatre tournures n'est dans la ligne de regard de la saisie ni
dans le chemin du pouce — elles sont hors écran, ce qui est l'excès inverse.
Le levier à employer est celui de la charte D1 pour cette zone : ni
déplacement d'écran, ni retouche d'échelle, mais le **moment et le lieu
d'apparition** — la faire arriver là où l'œil est déjà.

Compte de manifestations du registre sur le parcours de création **avec une
erreur générique déclenchée**, formulaire à trois créneaux, avant correction —
mesuré à l'écran, pas dans le DOM :

| Tournure | Dans le DOM | Effectivement visible |
|---|---|---|
| A1, le message qui explique le refus | oui | **non** — rendue à 1229 px sous le pli |
| B2, « La tablée tranchera. » dans la ligne de statut | oui | oui — la barre d'action est collante |

Soit **1 manifestation visible sur 2 présentes** — et c'est celle qui félicite
qui survit, pas celle qui explique. Le déséquilibre est là, pas dans un
manque de quantité.

Sur le chemin heureux, la mesure de référence de `AUDIT-1.md` §5 est
inchangée : 2 (volet réglages ouvert), 1 sur le parcours de vote.

---

## 7. Classement par impact sur l'objectif de la routine

1. **§2 — l'erreur générique hors écran.** Bloque l'aboutissement du parcours
   *et* rend quatre tournures du corpus invisibles. Les deux objectifs de la
   routine sont touchés par le même défaut, et par la même correction.
2. **§3 — la barre d'action dit « prêt » pendant un refus.** Même moment, même
   écran ; corriger §2 sans corriger §3 laisserait deux messages contradictoires
   côte à côte.
3. **§4 — aucune reprise après interruption.** Coût par occurrence le plus
   élevé du parcours ; fréquence plus faible que §2.
4. **Item 4 du backlog — `useShakeInvalid` absent de `AlternativeOptionForm`.**
   Même famille que §2 (retour du regard sur ce qui coince), formulaire court
   donc impact pratique faible, mais c'est la dernière incohérence entre les
   trois formulaires.
5. Items 6 et 7 du backlog (documentation de l'exception des trois champs de
   créneau ; signifiant visuel sur `LocationField`) — inchangés, hors du lot.

---

## 8. Ce qui n'a pas été vérifié cette itération

- Le clavier virtuel mobile réel : Chromium headless n'en ouvre pas. L'effet
  de l'overlay de recherche de lieu clavier ouvert reste
  `non vérifié dans cette exécution`, comme en itération 2 — c'est toujours la
  condition posée par `BACKLOG.md` pour rouvrir la question de l'overlay.
- Le contraste effectif des couleurs (`.feedback`, `.actionbar__status--ready`)
  n'a pas été mesuré au ratio ; il est prévu pour la revue QA de l'itération 5.
- `prefers-reduced-motion` : le code le respecte (`useShakeInvalid.ts:8-13`),
  mais aucun rendu n'a été exercé sous ce réglage.
