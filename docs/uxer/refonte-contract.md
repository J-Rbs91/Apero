# Contrat de refonte UXER — La Confrérie du Petit Jaune (Apéro)

> **Document historique (16/10/2026).** Contrat de refonte « Fairground Baroque » remplacé par la direction **Point Jaune**
> (mission UXER `manifesto-void`) : voir `docs/uxer/manifesto-void/`. Ses invariants
> **fonctionnels** restent opposables ; ses choix esthétiques (auvent, ampoules, tickets,
> didone d'affiche, thème clair) ne le sont plus.

Protocole appliqué : `references/full-redesign-contract.md` d'UXER.
Branche : `feat/uxer-redesign` (jamais fusionnée ni déployée par cette mission).
Signataire : l'agent de refonte, sur carte blanche du propriétaire. Cette signature ne vaut **aucune approbation humaine** ; le contrat est opposable à l'implémentation, pas au propriétaire.
Documents liés : [`design-system.md`](design-system.md) (spécification implémentable).

> Règle : aucun fichier de `src/`, `index.html` ou `public/` n'est modifié avant le commit de ces deux documents.


> ## Addendum d'intégration — PR #48, base `main` `0fc1fbe` (15/10/2026)
>
> La branche a été intégrée à `main` après 256 commits de divergence (React Router v8, `AppLink`/`useAppNavigation`, kit de saisie `ui/`, tablées, coffre, rétrospective, recherche de lieu, barre d'action, volets…). Ce contrat a été écrit sur l'ancienne base ; **les décisions ci-dessous remplacent les passages correspondants** (le reste du texte est conservé comme historique de la décision artistique, qui, elle, est inchangée : *Fairground Baroque*).
>
> | Passage d'origine | Décision après intégration | Pourquoi |
> |---|---|---|
> | §4 point 1 : barre de navigation persistante à la place du menu | **Abandonnée.** Le menu de la Confrérie reste une *couche d'historique* (`BrandMenu`, `HeaderNav`, `ConfrerieMenuPanel`), restylé en panneau de papier ; cloche et menu sont dans l'en-tête de toutes les pages intérieures | Sur `main`, le menu et la cloche suivent déjà l'utilisateur partout (le constat F5 n'existe plus) et `docs/NAVIGATION.md` + `npm run test:nav` en font un contrat (couche dans la pile, `.brand-menu__panel`, `aria-label="Menu de la Confrérie"`). Remplacer le menu aurait exigé de modifier ces tests |
> | §10 : bouton « Je réponds » | **Retiré.** La barre d'action épinglée de `main` (`ActionBar`, « Envoyer ma réponse ») répond déjà au constat F6 | Une action de plus aurait doublé un geste existant |
> | §10 : composant `Dialog` | **Retiré.** `ConfirmDialog` et `useModalDialog` de `main` assurent focus, piège à Tab, Échap et retour du focus | Doublon |
> | §6.2, §7 : polices chargées depuis Google Fonts | **Auto-hébergées** : `src/assets/fonts/abril-fatface-*.woff2` à côté de Manrope, licences dans `CREDITS.md` | RGPD : `main` interdit tout CDN de police (`CREDITS.md`, `index.html`) |
> | §6.1 : verdict dans l'enseigne, formulaire ensuite | **Ordre piloté par le rôle conservé** (`voteFirst`, `shareFirst`, apéro passé) : le verdict est une bande de façade **posée où l'ordre de `main` la met** ; l'enseigne ne porte que l'identité de l'assemblée | L'ordre des blocs est un comportement fonctionnel de `main`, pas un choix de composition |
> | Accueil verrouillé en une vue (`.is-locked`) | Retiré : la composition n'a plus besoin de verrouiller le défilement | Une page qui tient dans l'écran ne défile pas ; une page qui déborde peut défiler |
> | Écran d'ouverture (`SplashScreen`) | Conservé tel quel (une boucle du verre, tap pour passer) ; habillé en façade sous l'auvent. **Correction** : en mouvement réduit le verre ne boucle plus, donc l'écran se retire après 700 ms au lieu d'attendre le filet de 4 s | Régression de fusion détectée à la lecture de `WineGlassMark` |
>
> **Documents de `main` qui parlent de l'identité précédente** (« registre de zinc ») : `docs/refonte-visuelle/PO-VISION.md` et `IDENTITE.md` portent désormais un bandeau « historique ». Leurs invariants **fonctionnels** (parcours P1-P7, ordre des blocs, kit `ui/`, textes, tests, classes de repère, cibles ≥ 44 px, plancher 12 px, focus visible, mouvement réduit, aucun CDN) restent tenus ; leurs choix **esthétiques** (accent pastis unique, décor photo plein cadre sous voile, Manrope seule, thème sombre unique) sont remplacés par la décision du propriétaire d'adopter cette direction.
>
> Les preuves du §11 ont été **rejouées sur l'arbre intégré** : voir le §12.

---

## 1. Exploration du produit

### 1.1 Comment l'application a été vue
- Pile hermétique reproduisant `tests/functional` (faux GitHub en mémoire + vraie API `server/` + Vite) ; aucun réseau applicatif réel, aucune donnée de production.
- Chromium (Playwright, `playwright-core` déjà au dépôt) piloté en vrai : onboarding réel, création réelle d'un apéro chiffré, votes de 3 invités, contre-proposition, retour de l'organisateur (notifications générées pour de vrai).
- 115 captures « avant » à 390×844 (mobile), 320×640 (très étroit) et 1280×800 (large), états : onboarding (nom, erreur, confirmation, notifications), accueil, menu ouvert, focus clavier, création (vide, erreur, suggestions de lieu, carte de pointage), invitation (organisateur, autres réponses, formulaire de contre-proposition, retour de vote, modale de suppression, lecture seule, lien introuvable, lien mal formé, clé erronée), agenda, notifications, palmarès, et les trois états vides. 0 erreur console.
- **Limite connue** : les tuiles OpenStreetMap sont bloquées dans le banc (réseau coupé) ; les cartes s'affichent en gris. Le cadrage de la carte est donc jugé, pas son fond de plan.
- **Limite connue** : `<input type="date|time">` natifs rendus au format US par Chromium headless ; le rendu natif réel dépend du téléphone.
- Captures stockées **hors dépôt** : `…/scratchpad/shots/before/` (nommage `<m|s|d>-<NN>-<écran>.png`).

### 1.2 Surfaces (carte des routes)
| Route | Écran | Rôle |
|---|---|---|
| (avant routeur) | Onboarding blaze + dialogue de confirmation | tous |
| (avant routeur) | Onboarding notifications | tous |
| `#/` | Accueil, menu de la Confrérie, cloche | tous |
| `#/create` | Création d'une assemblée (créneaux multiples, lieu autocomplété, carte de pointage) | organisateur |
| `#/invite/:aperoId?k=&w=` | Apéro : verdict, carte, jauge, vote par créneau, mot, contribution, contre-proposition, registre, partage, suppression | organisateur / invité (écriture) / lecteur (sans `w`) |
| `#/event/:eventId` | Ancien flux `legacy-github` (désactivé en écriture, route conservée) | historique |
| `#/agenda` | Apéros à venir de cet appareil | tous |
| `#/notifications` | Carnet + autorisation système | tous |
| `#/palmares` | Breloques par convive | tous |

### 1.3 Tâches, fréquence, contexte matériel
1. **Répondre à une invitation** (la plus fréquente : N invités par apéro, un seul organisateur) : ouvrir un lien reçu par messagerie, sur téléphone, souvent en situation de mobilité ou de bar. Trois réponses par créneau. Une main, pouce.
2. **Lire le verdict** (organisateur, puis tous) : date/heure/lieu retenu, qui vient.
3. **Organiser** : nom, description, 1..n créneaux (jour, heure, lieu), envoyer. Fréquence faible, mais c'est le point d'entrée du produit.
4. **Partager** le lien (clés dans le fragment d'URL : le lien complet est un secret).
5. Secondaires : agenda, carnet de notifications, palmarès, changement de blaze.
- Actions **irréversibles** : suppression définitive d'un apéro (organisateur seulement, depuis l'appareil créateur) ; « graver » son blaze.
- Dépendances sensibles : chiffrement AES-GCM côté client, clés en fragment d'URL, zéro donnée en clair côté serveur, notifications calculées côté client. Rien de cela n'est touché par la refonte.

### 1.4 Faits observés (séparés des hypothèses et des goûts)
**Faits** (captures) :
- F1. Les 10 écrans partagent **une seule composition** : une pile verticale de la même « carte » en verre sombre translucide sur la même photo plein cadre. Le verdict, le formulaire, la liste de personnes et le partage n'ont pas de poids visuel différent hors une bordure jaune pâle sur le verdict.
- F2. Sur grand écran (1280 px), l'app est une colonne de 480 px au centre d'un décor de 2560 px : ~63 % de la largeur est de la photo. Aucune adaptation de la disposition.
- F3. Le verre translucide laisse transparaître la photo (bouteille, verre) sous le texte du verdict et de l'en-tête d'accueil ; la lisibilité dépend de la position de défilement du contenu par rapport au décor fixe.
- F4. Sur-titres en capitales espacées en jaune présents sur **tous** les écrans (≥ 14 occurrences), y compris pour des libellés fonctionnels (« Qui vient ? », « Rameuter le comptoir »).
- F5. L'unique navigation transversale (Notifications / Agenda / Palmarès / Changer de blaze) est cachée derrière un menu qui n'existe **que sur l'accueil**. Les autres écrans n'ont qu'un bouton retour.
- F6. La pleine page `invite` pèse ~2000 px de hauteur à 300 px de large (mobile) pour un organisateur : verdict, puis formulaire de vote de 4 créneaux, mot, jauge, bouton, contre-proposition, registre, partage. Le bouton de réponse n'est visible qu'après défilement.
- F7. Les trois états du vote partagent la même forme (pilule) ; l'état sélectionné ne se distingue que par la couleur de fond (jaune / bleu / rouge pâle), sans glyphe.
- F8. Le fond photo continue de défiler sous les pages courtes : sur Palmarès/Agenda/Notifications ~70 % de l'écran est du décor vide sous un contenu de 300 px.
- F9. Le focus clavier est visible (anneau jaune) mais pas contrasté sur les zones claires du décor.
- F10. Le Traquenard-O-mètre est un curseur horizontal ordinaire ; sa couleur seule porte le sens.
**Qualités à renforcer** : ton éditorial singulier (humour de comptoir) ; palette vert bouteille / jaune pastis / rouge de comptoir déjà reconnaissable ; illustration « Le zinc » (avec un store rayé à festons) ; mini-verdict (3 chiffres) clair ; cohérence terminologique.
**Hypothèses** : H1. la répétition de F1 est la cause principale du sentiment « interchangeable » (aucune hiérarchie entre les moments). H2. F5 explique que la découverte de l'agenda/palmarès est faible.
**Goûts** : le fond photo est séduisant à l'accueil (assumé, conservé sous une autre forme).

### 1.5 Invariants fonctionnels (ne doivent pas régresser)
Tout ce qui figure au tableau 6 (contrat fonctionnel). Contraintes dures : routes et paramètres de lien inchangés ; textes éditoriaux et libellés testés inchangés (voir §6.3) ; classes de repère des tests fonctionnels conservées ; aucune dépendance de production ajoutée sans trace ici (voir §7).

---

## 2. Style retenu

### 2.1 Consultation du corpus (provenance)
- Lecteur `scripts/aesthetics_library.py`, statut : `full_corpus_available: true`, 1 201 fiches, révision source `77267da3b6f486227253becbcb6c4beff070e14d`, licence de contenu CC-BY-SA-4.0 (cache hors dépôt `~/.cache/uxer/aesthetics-wiki/`).
- `--list --json` : inventaire des 1 201 noms lu. Recherches (`--search`) sur des qualités tirées du produit, **après** l'exploration : cafe, bistro, chalkboard, diner, French, pub, tavern, mid-century, ticket, posters, enamel, sign painting, tiki, retro, vintage advertising, art deco, playbill, folk, bureaucracy, ledger, label, stamp, heraldry, fraternity, brotherhood, club, Parisian, seventies, 1970s, gouache, linocut, risograph, screen print, packaging, gentleman, absurd, humor, kitsch, cabaret, carnival, circus, newspaper, pop art. Les requêtes sans résultat (bistro, chalkboard, enamel, bureaucracy…) ont été **constatées vides**, non comblées.
- Fiches **intégrales lues** (`--get --full --json`) : `fairground-baroque`, `polish-poster-school`, `giscardpunk`, `genericana`, `dollar-store-vernacular`.
- Fiches **lues en métadonnées seulement** (nom, résumé, couleurs, motifs) : `weimar-cabaret`, `vintage-americana`, `art-nouveau`. Ces trois n'ont pas été lues intégralement ; elles ne fondent aucun choix.
- Le catalogue original de 218 styles (`aesthetic-style-catalog.md`) n'a servi qu'à une recherche lexicale complémentaire (une mention : Belle Époque) ; il n'a **pas** substitué le corpus.
- Aucune recherche externe (web) ouverte.

### 2.2 Trois directions réellement différentes, comparées sur le même contenu
Spécimens rendus à 390 px sur le **même contenu réel** (accueil, verdict, un créneau avec ses trois réponses) : `…/scratchpad/spec/{a,b,c}.png`.

| | A — Fairground Baroque | B — Polish Poster School | C — Genericana |
|---|---|---|---|
| ID | `fairground-baroque` | `polish-poster-school` | `genericana` |
| Nature | univers + grammaire de façade (arts forains, Belle Époque) | courant graphique (affiche, années 50-80) | traitement d'emballage générique (années 80 citant 1920-50) |
| Source lue | fiche intégrale | fiche intégrale | fiche **intégrale mais squelettique** (« Under construction ») : seul le résumé fonde le propos |
| Verdict spécimen | lisible, chaleureux, dates en chiffres romains gras identifiables de loin | percutant, mais le pictogramme dessiné à la main d'agent est grossier ; couleurs trop denses pour des formulaires | très lisible, froid, interchangeable ; perd l'illustration et le vert maison |
| Rejet / retenue | **retenu** (avec correctifs §2.4) | rejeté comme dominant ; sa règle d'économie de couleur est retenue comme grammaire secondaire | rejeté : « un modèle de boîte générique » ; aurait effacé l'identité du produit |

Candidats écartés à la lecture : `dollar-store-vernacular` (densité volontairement illisible, hostile au vote), `giscardpunk` (français mais nostalgie techno/Minitel : aucun rapport avec le sujet), `weimar-cabaret` et `vintage-americana` (registre étranger au produit).

### 2.3 Direction dominante : **Fairground Baroque / Arts forains**
Fiche : *esthétique issue de la tradition architecturale et décorative de la fête foraine européenne, milieu XIXe–début XXe, apogée Belle Époque ; façades dorées et peintes, toiles peintes, miroirs biseautés, perches de laiton, affiches lithographiques ; valeurs : savoir-faire, spectacle, merveille, éphémère, communauté ; couleurs : rouge profond, feuille d'or, ivoire, vert forêt, bleu roi, polychromie ; « couleurs vives à fort contraste, pour la lisibilité à distance »* (sources : fiche `fairground-baroque`). La fiche précise aussi que ces structures sont **modulaires et démontables mais visent la monumentalité** ; la fête foraine est une fête séculière qui réunit toutes les classes.

**Grammaire secondaire (rôle distinct)** : `polish-poster-school` — uniquement la règle « **couleur isolée contre fond neutre** » (fiche : « isolated color pops against muted backgrounds ») pour décider où la couleur saturée est autorisée. Elle ne fournit ni illustration, ni lettrage, ni ton.

**Traitement UI local** : aucun (en particulier pas de glassmorphisme, que le produit actuel employait).

### 2.4 Description sensible et structurante
Une **baraque foraine** : un auvent rayé à festons au-dessus d'une façade verte sombre portant l'enseigne, un comptoir de papier ivoire où l'on remplit des tickets, et, pour l'annonce qui compte, un panneau peint grand format (le verdict) bordé d'une rangée d'ampoules.
- **Rythme** : alternance de bandes (sombre / claire / sombre) plutôt que d'empilement de cartes. Le sombre = ce qui annonce (enseigne, verdict) ; le clair = ce qu'on fait (formulaires, listes).
- **Densité** : généreuse sur le verdict et l'enseigne, serrée et régulière sur les tickets et le registre.
- **Proportions** : chiffres de date très grands (affiche lue à distance), corps de texte à 16 px, lignes ≤ 62 caractères.
- **Rapport texte/image** : l'illustration « Le zinc » devient une **fenêtre cintrée** (toile peinte) sur l'accueil seulement ; elle ne sert plus de papier peint.
- **Matérialité** : papier ivoire, peinture opaque, laiton/or **sur fond sombre seulement**, ampoules ; aucun verre dépoli.
- **Contraste** : texte encre sur ivoire (14:1), ivoire sur vert (11:1), jaune pastis sur vert (8:1) ; l'or n'est jamais un texte sur fond clair.
- **Mouvement** : mécanique et discret — des ampoules qui s'allument, un ticket qu'on poinçonne ; ce qui est du formulaire ne bouge pas.

### 2.5 Transposition au produit (et non à un thème)
Pourquoi **ce** langage pour **ce** produit :
1. *Le nom* : « La Confrérie du Petit Jaune », nom pompeux pour une mission modeste. La façade à fronton, l'enseigne et le verdict « panneau de fête » portent exactement ce décalage — solennité de baraque pour une date d'apéro — sans l'écrire en décoration.
2. *La fonction centrale* : voter, **collectivement**, un moment de fête. L'arts forains est l'esthétique de la fête publique ouverte à toutes les classes (fiche) : la même langue convient à « pastaga, pinard, soft, Perrier ou juste des cacahuètes ».
3. *Le Traquenard-O-mètre* est déjà un **jeu de foire** (testeur de force) : il devient une rangée d'ampoules qui monte.
4. *Les breloques du palmarès* sont des **lots de tombola** : rosettes.
5. *Le vote par créneau* est un **ticket** : on le poinçonne.
6. *L'identité existante* (vert bouteille, jaune pastis, rouge de comptoir, store rayé festonné de l'illustration) est **déjà** celle de la baraque foraine. La refonte la retrouve au lieu de la remplacer.

**Repris** : auvent rayé à festons ; façade sombre à enseigne ; panneau de verdict à ampoules ; fenêtre cintrée (toile peinte) ; chiffres d'affiche en didone gras (Belle Époque) ; couleurs vives à fort contraste ; ticket à perforations ; rosette.
**Adapté** : la dorure → un seul jaune pastis plein (jamais de dégradé métal) ; la polychromie → 3 couleurs actives par écran au plus ; le baroque → une symétrie frontale sobre.
**Explicitement écarté (cliché)** : cadres dorés à filigranes ; carrousel/chevaux/clown comme images ; polices de cirque (Western, Rye) ; fond à ampoules animées en continu ; dégradés métal ; ombres portées multiples ; texte en capitales espacées.

### 2.6 Alternative rejetée et meilleur argument contre le choix
- **Alternative** : Polish Poster School comme dominante. Elle offrait le ton d'esprit et le plus fort impact à l'accueil.
- **Meilleur argument contre Fairground Baroque** : ornement = bruit. Sur un écran de formulaire de téléphone, tout motif concurrence la lecture ; « or + vert + serif » est aussi un trio « luxe » générique. *Réponse contractuelle* : l'ornement est **budgété par zone** (§5) — auvent, bandeau de verdict, jauge, rosettes, écran de chargement — et **banni** des champs, listes, textes. L'or n'est pas un matériau (pas de dégradé), c'est un jaune plat qui existe déjà dans la marque. Le spécimen A, tel que rendu, tombait lui-même dans l'« échec révélateur » (enseigne encadrée à bordure dorée + sur-titre en capitales espacées + titre serif + bouton coloré) : correctifs décidés après lecture du rendu : suppression du sur-titre espacé, suppression de la double bordure dorée, l'enseigne **est** la façade (pas un cadre dans la page), la date en chiffres d'affiche porte la seule fonction « gros titre serif ».

---

## 3. Signature et limites

### 3.1 Trois décisions distinctives observables
1. **L'auvent à festons** : bande rayée rouge/ivoire sur toute la largeur, en haut de chaque écran, au-dessus d'une façade verte. Reconnaissable dès la première capture et directement issue de l'illustration existante.
2. **Le panneau de verdict à chiffres d'affiche** : la date retenue en didone gras jaune pastis, plein bord, rangée d'ampoules allumée au-dessus, trois compteurs **à arche**. C'est le seul endroit où le produit « crie ».
3. **Le ticket de vote** : chaque créneau est un ticket ivoire perforé (encoches latérales) avec calendrier-feuille à gauche et trois talons de réponse à glyphes (✓ / ~ / ✕) ; le choix poinçonne le talon.

### 3.2 Anti-patterns interdits ici
Voir aussi `references/generic-ai-design-antipatterns.md`. Spécifiquement : sur-titres en capitales espacées ; cartes translucides ; plus de 3 rayons distincts ; ombres floues ; dégradés violets/bleus ; icônes emoji ; bordures dorées décoratives ; ampoules animées sans rôle ; jaune pastis en texte sur fond clair ; deux accents saturés concurrents sur un même écran ; carte (nom de lieu) sans repli textuel.

### 3.3 Moments d'expression / zones de retenue
- **Expression** : auvent (tous écrans, statique), enseigne d'accueil, panneau de verdict, jauge d'ampoules, rosettes du palmarès, poinçon du vote, écran de chargement (carrousel d'ampoules).
- **Retenue** : champs de formulaire, listes de personnes, carnet de notifications, texte long, messages d'erreur, modales (sobres : papier + bordure + ampoules statiques).

---

## 4. Contrat de non-régression — capacités explicitement autorisées à changer
1. **Navigation** : le menu déroulant de l'accueil (4 destinations) devient une barre de navigation persistante sur les 4 écrans de premier niveau (bas d'écran sur mobile, en-tête sur large) + une puce « blaze » qui ouvre le changement de blaze. *Aucune destination n'est supprimée* ; la découverte est améliorée (F5).
2. **Fond d'écran** : la photo plein cadre fixe disparaît ; l'illustration est conservée comme fenêtre sur l'accueil.
3. **Disposition grand écran** : colonne unique de 480 px → grille 2 colonnes sur l'invitation, 2 colonnes sur l'accueil, colonne de lecture centrée ailleurs.
4. **Jauge** : curseur inchangé en accessibilité (input range natif conservé), rendu visuel remplacé par des ampoules.
5. **Thème** : ajout d'un thème sombre (préférence système) en plus du thème clair ; le produit n'avait qu'un thème sombre.
Rien d'autre.

## 5. Budget d'ornement (par zone)
| Zone | Ornement autorisé |
|---|---|
| Auvent (toutes pages) | rayures + festons, statique |
| Enseigne d'accueil | fenêtre cintrée (illustration), marque animée Lottie existante |
| Panneau de verdict | rangée d'ampoules (chasse 1,2 s tant que l'apéro a un gagnant), compteurs à arche |
| Jauge Traquenard | 10 ampoules |
| Ticket de vote | encoches, calendrier-feuille |
| Palmarès | rosette par breloque |
| Chargement | 3 ampoules séquencées |
| Tout le reste | aucun ornement |

---

## 6. Contrat fonctionnel

### 6.1 Matrice écran / rôle / capacités à préserver
| Écran | Capacités, états, données, liens à préserver |
|---|---|
| Onboarding blaze | champ (max 48), validation `validateComptoirName` + message d'erreur, dialogue de confirmation (modal, `aria-modal`), « Oui, grave ça dans le zinc », « Non, je change de blaze », autofocus |
| Onboarding notif. | liste de 4 raisons, « Activer » (état « On demande au téléphone… » désactivé), « Plus tard — garder juste le badge » ; affiché une fois seulement, si l'API est supportée |
| Accueil | titre H1 « La Confrérie du Petit Jaune », texte d'accroche, texte d'aide, lien « Organiser un apéro » → `/create`, mention « Propose · partage · le comptoir tranche », cloche + badge, accès Agenda/Palmarès/Notifications/Changer de blaze, purge d'expirés au montage |
| Création | nom (optionnel), description, créneaux (+ajouter / retirer), jour, heure, lieu avec suggestions, adresse affichée, pointage sur carte (ouvrir/fermer/retirer), validation (3 messages d'erreur), état d'envoi, redirection invitation avec clés, retour |
| Invitation | en-tête organisateur + nom cérémoniel + description + note « C'est noté… » ; verdict (3 états : gagnant/égalité/attente) ; 3 compteurs ; mini-carte + adresse (menu d'ouverture dans les apps de cartes, copie) + agrandir (modale) ; jauge récap ; formulaire : blaze, un vote par créneau (3 états), contribution (datalist), mot, jauge interactive, envoi, états (retrouvé, mis à jour, reçu, erreur API, conflit, hors-ligne) ; contre-proposition (ouvrir, champs, lieu, annuler, succès) ; registre (présents, autres repliés avec compteur, brings, citations) ; partage (natif/copie, lien masqué, copier) ; suppression (organisateur seulement) + modale |
| Invitation — lecture seule | liste des créneaux avec badge « En tête » + message sans clé d'écriture |
| Invitation — erreurs | invalide, clé manquante, introuvable, supprimé (titre « Apéro annulé »), clé erronée, erreur réseau, chargement |
| `event/:id` (legacy) | mêmes composants partagés ; états « terminé », « n'existe pas », suppression |
| Agenda | chargement, erreur, vide (+ lien « Organiser un apéro »), apéros triés avec créneaux, « En tête », « Voir l'apéro », jauge récap |
| Notifications | liste, non-lus mis en avant (point), « Vider le carnet », « Tout marquer comme lu », offre d'autorisation système, ouverture d'un apéro au clic, vide |
| Palmarès | membres avec initiales, « Toi », nombre de breloques, liste de breloques (nom, description, rareté), vide, « N autres convives sans breloque » |

### 6.2 Sécurité et confidentialité
Clés `k`/`w` uniquement en fragment ; lien affiché masqué (`?…`) ; aucune requête authentifiée GitHub ; aucun nouveau service tiers. **Polices** : le produit chargeait déjà Manrope depuis Google Fonts ; la refonte ajoute une seconde famille de la même origine (pas de nouvelle origine, CSP inchangée). Voir §7 pour l'alternative d'auto-hébergement.

### 6.3 Accessibilité à préserver ou améliorer
Labels existants (`aria-label`, rôles `dialog`, `menu`, `radiogroup`, `status`, `alert`) ; navigation clavier (Échap ferme les panneaux) ; `prefers-reduced-motion` : toutes animations d'ornement coupées ; cibles ≥ 44 px ; contraste texte ≥ 4,5:1 et contrôles ≥ 3:1 ; état du vote jamais porté par la couleur seule (glyphe + libellé) ; jauge exprimée en `aria-valuetext`.
Textes testés inchangés (liste dans `tests/functional/run.mjs`) ; classes de repère conservées : `.notif-badge`, `.notif-bell`, `.notif-list`, `.vote-form .slot`, `form .slot`, `.field--wide input`, `.share code`, `.person__name`.

### 6.4 Responsive
Ordre de lecture mobile = ordre DOM ; 320 px : aucune coupure de contenu, aucun défilement horizontal ; ≥ 960 px : grille 2 colonnes sur l'invitation ; zones tactiles ≥ 44 px ; marges de sécurité (`env(safe-area-inset-*)`) sur la barre du bas.

---

## 7. Plan de migration
Ordre : **tokens + coque** (typo, couleurs, auvent, barre de navigation, `MobilePage`) → **accueil** (rendu, critique, correction) → **formulaires** (création, onboarding, champs, lieu) → **invitation** (verdict, jauge, ticket de vote, registre, partage, modales) → **agenda / notifications / palmarès** (+ vides/erreurs) → **grand écran** → **thème sombre** → **mouvement réduit + performance**.
Dépendances existantes : React 19, Vite 7, Leaflet, Lottie (inchangés). **Aucun paquet ajouté.** Polices : liens Google Fonts (`Abril Fatface` en plus de `Manrope`), `display=swap`. *Risque* : la police d'affiche tombe en repli (`Georgia`) si le réseau échoue — le design système prescrit un repli à métriques proches. *Alternative non retenue ici faute d'autorisation* : auto-héberger les woff2 dans `public/fonts/` (gain vie privée/performance) ; à décider par le propriétaire.
Risques : (1) perte de repère de la navigation → compensée par barre persistante ; (2) fonds de cartes inaccessibles hors ligne (inchangé) ; (3) régression des tests fonctionnels → conservation des sélecteurs.
Critères d'achèvement : `npm test` et `npm run build` verts ; `npm run test:functional` vert (ou écarts expliqués) ; captures « après » de chaque écran/état inspectées en 320 / 390 / 1280, thème clair et sombre, mouvement réduit ; critique écrite par unité ; verdict de `ui-review-qa` fondé sur ces captures.

## 8. Preuves attendues
| Preuve | Statut |
|---|---|
| Captures avant (115) | **présentes** |
| Spécimens A/B/C | **présents** |
| Captures après, mêmes états/largeurs | à produire par unité |
| Parcours de bout en bout dans un vrai navigateur (création, vote, contre-proposition, notifications, suppression) | via `test:functional` (déjà existant) |
| Mouvement réduit (capture sous `reducedMotion: reduce`) | à produire |
| Thème sombre | à produire |
| Test sur appareil tactile réel / lecteur d'écran réel | **absent** — non réalisable sur le VPS ; signalé dans le verdict |
| Tuiles OSM réelles | **absent** (réseau du banc) |
| Performance (poids, requêtes, CLS) | mesure du build à produire ; pas de test sur réseau dégradé réel |


---

## 9. Journal de convergence (construire → rendre → inspecter → critiquer → corriger)
Captures : `…/scratchpad/shots/{before,u1…u7,after,final,final-dark,final-reduced}/`. Chaque ligne : observation réelle sur capture → correction → recapture.

| # | Unité | Observation (capture) | Correction | Recapture |
|---|---|---|---|---|
| 1 | Accueil | Bureau : le texte d'aide et la mention « Propose · partage… » avaient disparu (je les avais masqués en CSS). Mobile : l'ombre de la fenêtre cintrée faisait une barre grise. | Corps d'accueil rétabli et centré ; ombre de la fenêtre supprimée (ce n'est pas un empilement réel). Badge de notification repositionné dans la nav large. | `u1/d-home`, `final/d-10-home` |
| 2 | Formulaires | **Défaut bloquant** : les modales étaient tronquées au cadre de la page (voile non plein écran). Cause : l'animation d'entrée en `fill-mode: both` laisse un `transform` actif, qui devient le bloc conteneur des éléments `position: fixed`. | `fill-mode: backwards` (aucun transform résiduel). | `after/m-03`, `m-34` |
| 3 | Formulaires | La liste de suggestions de lieu s'ouvrait sous le lien « Introuvable ? » et chevauchait le bouton suivant. | Liste ancrée au champ (enveloppe `.locfield__box`). | `final/m-22` |
| 4 | Invitation | Le verdict occupait tout le premier écran mobile : le formulaire de réponse (tâche la plus fréquente) était à ~900 px. | Bouton « Je réponds » (défilement + focus) sous le titre ; carte 128 px ; compteurs plus compacts. | `u3/m-invite-bottom` |
| 5 | Invitation, bureau | Colonne gauche de l'enseigne vide sous le titre ; jauge à dix ampoules de 50 px. | Verdict recomposé en deux groupes (texte / mesures), pleine largeur sous le titre ; ampoules plafonnées ; 24 ampoules sur la rangée large. | `u5/d-invite` |
| 6 | Chargement | CLS 0,89 sur l'invitation (le contenu poussait un `main` vide). | Le chargement vit dans l'enseigne ; `main` non rendu tant qu'il n'a pas de contenu. CLS ≈ 0. | `cls.mjs` : 0 |
| 7 | Chargement | Deux `h1` sur agenda/palmarès pendant le chargement. | `LoadingScreen` en `h2` sauf quand il est seul (invitation). | build + audit |
| 8 | Thème sombre | Façade `forest-700` plus claire que le fond : hiérarchie inversée, vert « émeraude » plat. | Façade `forest-800`, fond `#071b14`. | `final-dark/*` |
| 9 | Très étroit | À 320 px la marque passait sur deux lignes et le nom du blaze était tronqué. | Libellé de marque masqué sous 360 px (le lien garde son `aria-label`). | `u7/s-home` |
| 10 | Billet | Le ticket sans en-tête du formulaire de contre-proposition affichait une perforation sur son bord supérieur. | Perforation supprimée quand `.slot__fields` est le premier enfant. | `final/m-32` |
| 11 | Spécimen | L'enseigne du spécimen A (cadre doré + sur-titre espacé + titre serif + bouton) tombait dans l'« échec révélateur ». | Cadre et sur-titre supprimés avant même l'implémentation. | `spec/a.png` → `u1` |

Direction artistique : **non rouverte**. Elle a tenu sur les écrans testés ; aucun cycle de correction n'a dépassé deux itérations sans effet.

## 10. Écarts par rapport au contrat initial (as-built)
- **Ajout non listé au §4 : bouton « Je réponds »** (sous le titre de l'invitation, mobile seulement, caché ≥ 960 px). Il ne supprime rien ; il répond au fait F6. Il fait défiler jusqu'au formulaire et y met le focus. Libellé choisi pour ne pas entrer en collision avec le bouton « Répondre à l'invitation » (sélecteurs de test).
- **Composant `Dialog`** (focus initial, piège à Tab, Échap, retour du focus) ajouté et appliqué aux 4 modales (blaze, suppression ×2, carte agrandie) : promis au design system §5.
- **Rosette** : la rareté est écrite (« Légendaire », « Rare », « Commune », « Honteuse »), ce qui n'existait pas.
- **Constat hors périmètre** : en mode `api-vps`, `readRewardsLedger` renvoie toujours un grand livre vide et `listActiveEvents` ne liste rien : le Palmarès affiche donc toujours « aucune breloque » en production. Ce n'est pas introduit par la refonte (comportement d'avant) ; l'état « avec breloques » n'a été vu qu'avec un grand livre simulé (`h/badges.mjs`).
- Mention : « 1 réponses » (accord) corrigé en « 1 réponse » dans l'agenda — seul changement de texte.

## 11. Preuves au terme de la mission
| Preuve | Statut |
|---|---|
| Captures avant (115) et après (115 × 3 jeux : clair, sombre mobile, mouvement réduit) | **présentes et inspectées** (≈ 45 images ouvertes et critiquées) |
| `npm test` | 106/106 |
| `npm run build` | ✓ (CSS 46,9 ko / 13,1 ko gzip ; JS principal 105,5 ko gzip) |
| `npm run test:functional` (E2E Chromium, API réelle) | **71/71** |
| Débordement horizontal 320 / 390 / 1280, 7 écrans | aucun |
| Cibles tactiles ≥ 44 px | 1 écart corrigé (lien d'adresse du ticket) ; contrôle à rejouer à chaque modification |
| Mouvement réduit : `document.getAnimations()` | aucune animation active sur invitation, accueil, agenda |
| Mouvement normal : ampoules du verdict | 12 animations, **terminées après ~6 s** (0 en cours à 7,8 s) |
| Modale : focus initial / Tab ×5 / Maj+Tab / Échap / retour du focus | ✓ |
| Polices bloquées (Google Fonts coupé) | rendu avec repli Georgia/système, pas de débordement ; CLS 0 sur l'accueil |
| Appareil tactile réel, lecteur d'écran réel, Safari/Firefox | **absents** (VPS sans ces environnements) |
| Tuiles OpenStreetMap réelles | **absentes** (réseau du banc) |
| Revue humaine du goût | **absente** : le choix du style a été signé par l'agent (carte blanche) |

### Verdict `ui-review-qa`
**PASS sous réserves** — preuves d'exécution et captures effectivement inspectées pour Chromium (Linux), 320/390/1280, thème clair, thème sombre (mobile) et mouvement réduit ; parcours fonctionnels verts. **Non couvert, à ne pas lire comme validé** : appareils tactiles réels, lecteurs d'écran, autres moteurs de rendu, thème sombre sur grand écran (non capturé), cartes avec fonds de plan réels, rendu des champs date/heure natifs sur téléphone. La CI verte est une preuve technique ; le jugement artistique ci-dessus est celui de l'agent signataire.


---

## 12. Preuves sur l'arbre intégré (PR #48 après fusion de `main`)
Base de comparaison : `origin/main` `0fc1fbe` exécuté tel quel dans un worktree séparé. Captures : `…/scratchpad/shots/{main-base,new-a,new-b,new-dark}/`.

| Contrôle | `main` seul | Branche intégrée |
|---|---|---|
| `npm test` | 236/236 | **236/236** (dont `navigationTree.test.ts` : navigation par un seul point, arbre complet) |
| `npm run build` | ✓ | ✓ |
| `npm run test:functional` | 71/71 | **71/71** |
| `npm run test:nav` | 23/23 | **23/23** |
| `npm run test:functional:sqlite` | **échoue** (étape 2 : le voile de recherche de lieu intercepte le clic « Créer l'apéro » ; puis `no such table: aperos`) | **échoue au même endroit**. Une copie temporaire corrigée de l'étape 1 donne le même résultat sur les deux arbres : la création d'un apéro en stockage sqlite aboutit (✅) puis le banc bute sur le schéma. Le banc est périmé sur `main` ; il n'a **pas** été modifié |
| Contraste calculé (texte vs fond effectif), 11 écrans + 10 états (menu, dialogues, feuille, vote vierge/refusé/choisi, création refusée, recherche de lieu), clair et sombre | — | **0 écart** (un défaut trouvé et corrigé : compteurs jaunes sur ivoire dans la rétrospective) |
| Débordement horizontal 320 / 390 / 1280 | — | aucun |
