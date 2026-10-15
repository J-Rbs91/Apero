# UXER : La Gazette des Copains

Statut : proposition de refonte, non qualifiée visuellement en navigateur.
Mandat : refondre intégralement Apéro, carte blanche sur la direction artistique.
Date : 15 octobre 2026.

## 1. Produit et mission

La Confrérie du Petit Jaune sert à trouver une date et un lieu entre amis.
La personne qui organise propose des créneaux, partage une invitation chiffrée,
la tablée vote, un verdict indique les meilleurs choix. L'application sert
également de mémoire des rendez-vous et des groupes réguliers.

Ce que la forme doit faire ressentir : un rendez-vous entre amis mérite la
solennité comique d'une grande institution. Le produit ne vend pas une boisson
ni un bar : il rend possible un moment ensemble.

Usage prioritaire : mobile, parfois une main occupée, écran petit, nouvel
invité arrivant directement sur son invitation. La lecture et l'action priment
sur les artifices visuels.

## 2. Invariants fonctionnels

- Aucun changement d'API, données, chiffrement ou stockage.
- Aucune modification de la hiérarchie des routes ni de l'historique mobile.
- Aucun formulaire, bouton, vote, lien de partage ou mode invité supprimé.
- Aucun texte essentiel masqué et aucun champ sans libellé ni état d'erreur.
- Une action principale par écran, barre d'action visible dans les formulaires.
- Carte, notifications, coffre, tablées et bilans restent accessibles.
- Aucun nouveau paquet, police externe, image distante ou serveur.
- Création, invitation, vote, modification et verdict couverts par les tests.

## 3. Territoires examinés

1. **Le zinc photographique**, identité précédente : immersion immédiate,
   mais saturation du fond et hiérarchie étroite sur les écrans très denses.
2. **Le tableau de bord convivial** : efficace, mais interchangeable avec
   n'importe quel outil d'organisation. La marque perd sa gouaille.
3. **La Gazette des Copains**, retenu : institution fictive, typographie de
   bulletin, mise en page éditoriale et contraste entre ton pompeux et mission
   triviale. La gravité de la composition laisse la place à l'humour du texte.

Critique adverse : un style éditorial peut évoquer un restaurant premium et
éloigner l'ambiance amicale. Il peut aussi occuper trop de place sur mobile.
Contrepoids : langue accessible, champs sans-serif, actions franches, cibles
tactiles de 44 px, prochain rendez-vous prioritaire. Pas de luxe plaqué.

## 4. Noyau d'identité

**Essence** : la gazette officielle d'une institution qui n'existe pas,
consacrée aux rendez-vous qui comptent.

**Personnalité** : cérémonieuse, chaleureuse, ironique, accessible.

**Langage**
- Grande typographie serif système (Georgia) pour titres et verdict.
  Manrope déjà embarquée pour les saisies, sans téléchargement de police.
- Palette soirée imprimée : bordeaux-noir, ivoire, pêche cuivré.
- Filets éditoriaux, numérotation, pas de carte dans la carte.
- Rythme ample sur accueil, compact et utilitaire sur vote/formulaires,
  plus expressif pour verdict, tablées et palmarès.
- Aucun mouvement d'ambiance. Les retours d'action restent fonctionnels.

**Signatures**
1. Masthead avec ponctuation cuivrée.
2. Rubrique À LA UNE pour le prochain apéro.
3. Titres serif et filets partagés sur toutes les routes.
4. Verdict comme une proclamation, en gardant ses compteurs.

## 5. Application par surface

| Surface | Signature | Priorité produit |
| --- | --- | --- |
| Accueil | Gazette avec masthead, manifeste, étapes et accès rapides | Reprendre le prochain apéro, puis créer |
| Invitation | Titre serif et rubriques | Créneaux, votes et états clairs |
| Création | Formulaire guidé, sections typographiées | Erreurs et enregistrement sous le pouce |
| Agenda, tablées | Notices séparées par filets | Navigation et accès aux événements |
| Verdict | Bandeau cuivré de proclamation | Jour, heure, lieu et compteurs |
| Notifications | Registre sobre | Badge et état non lu |
| Palmarès, comptes | Ton éditorial | Lisibilité des données |
| Coffre, légal | Typographie retenue | Instructions et actions sensibles |
| Onboarding | Palette commune | Compréhension des permissions |

## 6. Fichiers et compromis

- CSS historique conservé pour les états détaillés. Nouveau territoire dans
  src/styles/gazette.css, importé en dernier.
- Accueil restructuré sans modifier cache, clé d'invitation ou routes.
- Photo de fond de l'application retirée, sans supprimer les assets utiles
  à l'écran d'ouverture et aux exports.
- Pages métiers rénovées transversalement par les tokens, surfaces,
  contrôles et typographie. Comportements et composants sont conservés.

## 7. Qualification encore requise

La CI doit couvrir le build, les tests unitaires, serveur et parcours
fonctionnels Playwright. Vérifications visuelles restantes :

1. Captures réellement ouvertes et examinées à 320, 390 et 740 px.
2. Accueil vide et accueil avec prochain apéro.
3. Invitation vierge, trois votes, vote existant, lecture seule et verdict.
4. Création, erreurs, actionbar, menu et bouton retour.
5. Recherche de lieu, mini-carte, modales, coffre et notifications.
6. Contraste, texte long, zoom, état interactif et mouvement réduit.
7. Corriger après observation, puis recapturer les mêmes états.

Une CI verte ne constitue pas une qualification artistique. Aucun rendu
n'a été vu dans une session navigateur depuis le présent environnement.
