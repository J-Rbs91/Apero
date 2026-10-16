# UXER_VOICE — la voix « Point Jaune » : minimalisme extrême

Décision du propriétaire (16/10/2026) : **tout** le texte de l'application est réécrit
dans une voix minimaliste poussée à l'extrême, y compris les libellés de vote, le
vocabulaire propre à l'app et les noms d'écrans. Cette charte remplace le corpus de ton
gelé de `docs/refonte-saisie/TON.md` (désormais historique).

La voix suit la direction visuelle : le vide parle, le texte ne remplit pas. Un mot
qui ne transmet ni une information ni une action est retiré.

---

## 1. Règles

| # | Règle | Exemple |
|---|---|---|
| V1 | **Un mot si un mot suffit.** Un bouton est un verbe à l'infinitif seul, ou un nom seul | « Envoyer ma réponse » → **Envoyer** |
| V2 | **Titre d'écran : un ou deux mots**, nom commun | « Organiser un apéro » → **Nouvel apéro** |
| V3 | **Pas de chapô**, sauf si l'écran est incompréhensible sans lui ; alors 6 mots au plus | |
| V4 | **Aucun humour, aucune métaphore, aucun aparté, aucun adjectif décoratif, aucune exclamation** | |
| V5 | **Un état = sujet + participe**, avec point final | **Réponse enregistrée.** |
| V6 | **Une erreur dit ce qui manque ou ce qui échoue, et quoi faire si ce n'est pas évident** ; 6 mots au plus, jamais vague (WCAG 3.3.1, 3.3.3) | **Date requise.** · **Réseau indisponible. Réessayer.** |
| V7 | **Aides de champ supprimées**, sauf si elles évitent une erreur réelle ou disent une conséquence (sécurité, irréversibilité) | |
| V8 | **Placeholders supprimés** : le libellé suffit | |
| V9 | **Chiffres en chiffres**, unités abrégées | « trois créneaux » → **3 créneaux** |
| V10 | **Pas de tutoiement ni de vouvoiement explicites** : infinitif ou forme nominale | « Indique ton blaze » → **Nom requis.** |
| V11 | **Ni tiret cadratin, ni emoji, ni point d'exclamation, ni guillemets décoratifs** | |
| V12 | **Les noms accessibles restent explicites** : bref, mais jamais ambigu hors contexte | `aria-label` **Retour**, **Menu**, **Notifications, 3 non lues** |
| V13 | **Les obligations ne se raccourcissent pas en fait** : mentions légales, information RGPD, attribution OpenStreetMap restent complètes, formulées en listes nominales | |
| V14 | **Casse de phrase partout**, pas de capitales de titre | |
| V15 | **Libellé sans ponctuation finale ; phrase avec point final** | **Créneau** · **Lien copié.** |

## 2. Lexique (ancien → nouveau)

| Ancien | Nouveau | Note |
|---|---|---|
| La Confrérie du Petit Jaune | **La Confrérie du Petit Jaune** | nom propre de la marque, conservé ; « La Confrérie » en forme courte |
| apéro, assemblée, convocation | **apéro** | un seul mot pour l'objet |
| organiser, convoquer | **créer** | |
| organisateur·rice | **hôte** | |
| invité·e, convive, tablée (les invités d'un apéro) | **convive(s)** | |
| créneau, proposition | **créneau** | |
| troquet, comptoir, rade, établissement | **lieu** | |
| blaze, nom de comptoir | **nom** | |
| émarger, répondre | **répondre** | |
| registre | **réponses** | |
| J'y serai · J'me tâte · Sans moi | **Oui · Peut-être · Non** | |
| verdict, le rendez-vous retenu | **retenu** | |
| en tête | **en tête** | |
| trinquer, verre levé | **+1** (`aria-label` : **Soutenir ce créneau**) | |
| Traquenard-O-mètre, pronostic | **intensité** (0 à 10) | niveaux : **calme · modérée · forte · extrême** |
| le mur du comptoir, mot | **messages**, **message** | |
| sonner le rappel | **relancer** | |
| graver au registre, tableau de chasse | **exporter** : **calendrier**, **image** | |
| remettre ça, tournée suivante | **refaire** | |
| servi (apéro passé) | **passé** | |
| mioches, marmaille, mômes | **enfants** | |
| renforts, pièces rapportées | **accompagnants** | |
| les Tablées (bandes persistantes) | **groupes** | |
| s'attabler | **rejoindre** | |
| breloques | **badges** | |
| Le Comptoir (accueil) | **Accueil** | |
| Au programme, L'ardoise | **À venir** | |
| Le carnet du comptoir | **Notifications** | |
| Palmarès, Tableau d'honneur | **Palmarès** | |
| Rétrospective, Comptes du Comptoir | **Bilan** | |
| Coffre, Sauvegarde | **Sauvegarde** | |
| Le registre légal | **Mentions légales** | |
| Coulisses de l'organisation | **Gestion** | |
| Qui vient ? | **Réponses** | |
| Réglages de l'assemblée | **Réglages** | |
| cadence : une fois, chaque semaine, toutes les deux semaines, chaque mois | **une fois · hebdomadaire · bimensuel · mensuel** | |
| obligatoire, facultatif | **requis · facultatif** | |
| annuler l'apéro, tout rayer | **supprimer** | « annuler » reste réservé à « renoncer à l'action en cours » |
| laisser tomber | **annuler** | |

## 3. Formes récurrentes

| Situation | Forme |
|---|---|
| Écran de chargement | **Chargement** (aucune phrase de patience) |
| État vide | un nom + l'action : **Aucun apéro.** + **Nouvel apéro** |
| Succès | **Réponse enregistrée.** · **Lien copié.** · **Apéro créé.** |
| Conflit / réseau | **Réseau indisponible. Réessayer.** · **Conflit. Recharger.** |
| Lien invalide | **Lien incomplet.** · **Lien invalide.** · **Apéro introuvable.** · **Apéro supprimé.** |
| Confirmation destructive | titre **Supprimer ?**, corps une ligne de conséquence (**Irréversible.**), boutons **Supprimer** / **Annuler** |
| Compteurs | **3 créneaux** · **5 réponses** · **1 réponse** |
| Nom par défaut d'un apéro sans nom | tiré d'une liste de noms d'un seul mot (§4) |

## 4. Noms par défaut

La liste des 20 noms cérémoniels est remplacée par douze noms d'un mot, neutres :
**Assemblée · Réunion · Tournée · Séance · Cercle · Conseil · Comité · Rencontre ·
Soirée · Table · Session · Rendez-vous.**

## 5. Décisions d'intégration

- **Nom accessible et texte visible** (WCAG 2.5.3) : le bouton de marque affiche « La
  Confrérie » et s'annonce « La Confrérie, menu » ; le bouton icône des pages
  intérieures s'annonce « Menu ».
- **Lien cassé** : « Lien invalide » + « Demander le lien complet à l'hôte. » (V6 : une
  erreur dit quoi faire quand ce n'est pas évident).
- **Titres** sans point final (V15) ; états et erreurs avec point final.
- **Conservés pour une raison de fond** : l'avertissement sanitaire sur l'alcool
  (registre légal) ; « Irrécupérable si oublié. » (mot de passe de sauvegarde) ;
  l'information de confidentialité de la géolocalisation, corrigée pour être exacte
  (la position est transmise à OpenStreetMap, pas conservée sur le téléphone) ;
  l'attribution OpenStreetMap ; les noms propres des applications de cartes.
- **Distinctions gardées** : « Commentaire » (réponse) et « Message » (mur) ; « Publier »
  (mur) et « Envoyer » (réponse) ; « Intensité moyenne » (synthèse) et « Intensité »
  (curseur) ; « + Créneau » s'annonce « Proposer un créneau ».

## 6. Contrôle

`docs/uxer/manifesto-void/verifier-voix.py` (bibliothèque standard) remplace
`verifier-ton.py` : il refuse, dans les chaînes visibles de `src/`, le point
d'exclamation, le tiret cadratin, les emoji, et les mots retirés du lexique (blaze,
troquet, émarger, mioches, traquenard…). Il sort en 1 à la première dérive.

## 7. Qualification de la réécriture (16/10/2026)

| Contrôle | Résultat |
|---|---|
| Textes réécrits | 753 entrées consignées (ancien → nouveau → fichier) : [`UXER_VOICE_MAP.tsv`](UXER_VOICE_MAP.tsv) |
| `verifier-voix.py` | **0 écart** (avant réécriture : 262) |
| `npm test` | 248/248 ; seules des valeurs attendues ont changé, aucune assertion retirée |
| `npm run build` | ✓ |
| `npm run test:functional` | **71/71** ; sélecteurs mis à jour sur les nouveaux libellés, nombre de vérifications identique (77 appels) |
| `npm run test:nav` | **23/23** ; le menu est désigné par son rôle (`aria-haspopup="menu"`) |
| Rendus | 27 états × 390 / 1440 regardés ou mesurés : 0 débordement, 0 erreur console |

Défauts trouvés et corrigés pendant l'intégration :

- deux boutons « Fermer » visibles en même temps (feuille de contre-proposition et
  recherche de lieu) : nom accessible ambigu, rendu explicite « Fermer la recherche » ;
  même traitement pour « Fermer la carte » ;
- bouton de marque nommé « Menu » sous un texte visible « La Confrérie » (WCAG 2.5.3) :
  « La Confrérie, menu » ;
- message de géolocalisation qui affirmait que la position restait sur le téléphone,
  alors qu'elle est transmise à OpenStreetMap : corrigé pour être exact.

Points laissés au propriétaire :

- ~~l'écran d'ouverture garde le verre animé~~ : tranché, le verre est redessiné en
  trame de points et se remplit du Petit Jaune (`GlassField`) ;
- quelques répétitions assumées par le minimalisme : titre et champ « Nom » à
  l'onboarding, titre « Confirmer ? » et bouton « Confirmer » ;
- les images exportées (image du résultat, bilan) suivent le lexique, pas encore une
  composition minimale.
