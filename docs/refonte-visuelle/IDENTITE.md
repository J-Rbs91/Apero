# IDENTITE : le registre de zinc

> Noyau d'identité de la refonte visuelle. **Jetable avec la refonte**, comme
> `PO-VISION.md`, qui reste le garde-fou opposable : en cas de conflit, c'est lui
> qui gagne. Ce fichier dit **pourquoi** les surfaces sont ainsi ; les valeurs
> (espacements, rayons, ombres, filets, fonds, voile) vivent **uniquement** dans
> `src/styles/global.css`, bloc de jetons « le registre de zinc » en tête de
> `:root` et bloc « Rôles de surface » en fin de feuille. Ne recopier aucune
> valeur ici.

Mise à jour : 01/10/2026 · Statut : en vigueur pour l'écran pilote (formulaire
de vote de `/invite`), à étendre écran par écran.

## 1. Essence

- **Idée centrale.** Une tablée émarge au registre d'une institution qui n'existe
  pas : on coche sa ligne, on signe, le comptoir tranche.
- **Personnalité.** Cérémonieuse plutôt que solennelle, gouailleuse plutôt que
  potache, sobre à l'écran plutôt que décorée.
- **Doit faire ressentir.** Qu'on remplit une ligne d'un registre posé sur le zinc,
  pas qu'on navigue dans un empilement de fenêtres.
- **Ne doit pas devenir.** Un formulaire générique en cartes grises arrondies
  sur fond uni (dérives D-6, D-7 du PO), ni un décor qui mange la lecture (D-9).

## 2. Matière retenue

- **Le zinc** (photo du comptoir, décor fixe) : la page est **posée dessus**, sous
  un voile ; on voit le comptoir à travers la page, jamais à travers trois couches.
- **Le registre** (vocabulaire protégé : émarger, registre, convocation) : une
  section se lit comme une page de registre : titre en petites capitales, filet
  fin, lignes alignées.
- **La marge du registre** : une ligne qu'on émarge porte son état dans la marge.
  En pointillés tant qu'elle reste à remplir, en trait plein une fois remplie,
  en rouge si elle a été refusée.
- **Le pastis** : accent unique, inchangé ; il ne sert ni de décor ni de filet.

## 3. Territoire

**Retenu : le registre de zinc.** Dimension d'écart unique : **matière et
surface**. La voix (déjà en place, gelée par `TON.md`) reste l'autre pilier
d'identité, mais elle n'est pas un écart visuel. Typographie (Manrope seule),
couleur (palette inchangée), mouvement (aucun ajout) restent conventionnels.

Écartés :
- **Verre dépoli généralisé** : c'est lui qui produisait la carte dans la carte ;
  le flou rend le contraste dépendant de ce qui passe dessous.
- **Ardoise / craie** (typographie manuscrite) : seconde police, second écart,
  hors budget et hors règle « Manrope seule ».

## 4. Principes (chacun avec son coût)

1. **La page est un plan continu ; seul un objet manipulable est une carte.**
   Coût : la délimitation passe par l'espace et les filets, ce qui demande une
   discipline d'espacement plus stricte qu'une carte qui « délimite toute seule ».
2. **Profondeur de surface 2 au plus, sur tout écran** (règle des niveaux,
   section 6). Coût : un composant réutilisé dans un autre contexte doit perdre
   sa surface, pas en ajouter une.
3. **Séparer dans l'ordre : espace, titre de section, filet, bordure, ombre.**
   On ne descend d'une marche qu'avec une raison nommée. Coût : plus de
   réflexion par écran ; c'est le prix d'une hiérarchie lisible.
4. **Bordure OU ombre pour un même rôle ; l'ombre est réservée à ce qui flotte**
   (barre d'action, feuille, menu, modale). Coût : les objets posés se
   distinguent par un filet franc, plus « graphique » qu'une ombre douce.
5. **Le texte posé à même le plan n'existe que sous le voile calibré**, et
   jamais sous le plancher de texte secondaire du CSS. Coût : le décor est plus
   sombre sous la colonne de lecture qu'auparavant ; il reparaît en bord
   d'écran large.
6. **Sans carte, tout ce qui se clique garde un signifiant visible** : chevron
   (volet), contour franc (réponse, champ, bouton), soulignement (lien). Coût :
   aucun élément cliquable ne peut être « juste du texte ».

## 5. Signatures

| Signature | Nature | Où | Absence visible à |
|---|---|---|---|
| Section en registre : petites capitales + filet fin | Principale (matière) | Tête de chaque section migrée | Un titre de section dans une boîte, ou sans filet |
| Marge d'état (pointillés / plein / rouge) | Secondaire | Créneau de vote, récapitulatif émargé | Un créneau dont l'état ne se lit qu'à la couleur d'un fond |
| Filet franc des objets manipulables | Secondaire | Réponses cochables, champs, boutons de service | Un objet cliquable délimité par une ombre, ou sans contour |
| États en tampon (contour, sans aplat) | Secondaire | Pastilles « À voter » / « Répondu », réponses du récapitulatif | Une pastille teintée qui fait chuter le contraste sur le décor |

## 6. Règle des niveaux

| Niveau | Rôle | Porte | Ne porte jamais |
|---|---|---|---|
| 0 | **Plan** (voile sur le zinc) | Sections, titres, texte courant | Fond, bordure enveloppante, ombre |
| 1 | **Item** : objet manipulable | Filet franc, fond « champ » | Ombre ; un autre Item |
| 1 | **Overlay** : ce qui flotte | Fond « panneau » opaque, ombre de niveau 2 | Bordure en plus de l'ombre ; flou |
| 2 | Contrôle dans un Item ou un Overlay | Le bouton plein dans la barre d'action | Rien en dessous |

Mesure : pour chaque élément visible, compter ses ancêtres (lui compris) qui ont
un fond non transparent, une bordure visible ou une ombre ; les marques
décoratives `aria-hidden` sont exclues. Maximum 2.

## 7. Application par surface

| Surface | Ce qui porte l'identité | Ce qui est relâché |
|---|---|---|
| Formulaire de vote (pilote) | Registre, marge d'état, filet franc des réponses | Verre dépoli, blocs encadrés, aplats teintés d'état |
| Carte de tête, verdict | Restent les deux zones dominantes (PO P1, P2) ; à migrer : en-tête de registre pour la tête, unique Item teinté pastis pour le verdict | Rien avant validation |
| Feuilles et modales | Overlay : panneau opaque + ombre | Bordure doublant l'ombre |
| Création `/create` | Mêmes rôles que le vote (prochain écran) | Carte de créneau éditable : devient ligne de registre ; le bouton « Retirer » reste un Item |

## 8. Interdits

- Une carte dans une carte ; un fond ou une ombre sur une section.
- Du texte posé sur la photo hors du voile calibré, ou sous le plancher de
  texte secondaire.
- Le pastis en filet, en fond de section ou en titre de section.
- Une seconde police, un nouveau flou, une animation d'entrée : hors budget
  d'écart (une seule dimension : matière et surface).
- Retirer une classe historique du DOM pour « nettoyer » (accroches des tests,
  `PO-VISION.md` §5.1).
- Dérives génériques : voir `UXER/references/generic-ai-design-antipatterns.md`.

## 9. Migrer un écran

1. Poser `registre` sur la section racine de l'écran (à côté de `sheet`), et
   `overlay="registre"` sur sa `MobilePage` si du texte se pose sur le plan.
2. Vérifier que les classes de l'écran ont leur rôle dans le bloc « Rôles de
   surface » ; ajouter le rôle manquant **là**, jamais en surcharge locale.
3. Mesurer : profondeur ≤ 2, contraste texte ≥ 4,5:1 et filets fonctionnels
   ≥ 3:1 sur pixels décodés à trois positions de défilement, cibles ≥ 44 px,
   `innerText` inchangé, un seul bouton plein.
4. Quand tous les écrans sont migrés : faire de `.registre` le défaut et
   supprimer les règles de surface historiques (c'est là que le poids CSS se
   récupère).
