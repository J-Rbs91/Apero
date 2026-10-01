# IDENTITE : le registre de zinc

> Noyau d'identité de la refonte visuelle. **Jetable avec la refonte**, comme
> `PO-VISION.md`, qui reste le garde-fou opposable : en cas de conflit, c'est lui
> qui gagne. Ce fichier dit **pourquoi** les surfaces sont ainsi ; les valeurs
> (espacements, rayons, ombres, filets, fonds, voile) vivent **uniquement** dans
> `src/styles/global.css`, bloc de jetons « le registre de zinc » en tête de
> `:root` et bloc « Rôles de surface » en fin de feuille. Ne recopier aucune
> valeur ici.

Mise à jour : 01/10/2026 · Statut : en vigueur sur toutes les pages (le
registre est le défaut ; seul le rideau d'ouverture garde son verre).

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
| Formulaires (vote, création, feuilles) | Registre, marge d'état, filet franc des réponses et des champs | Verre dépoli, blocs encadrés, aplats teintés d'état |
| Page d'apéro | En-tête de registre (double filet) ; verdict, seul objet teinté pastis | Cartes de section |
| Listes (ardoise, carnet, tablées) | Une section par entrée, ouverte par le filet du surtitre | Une carte par apéro autour de ses créneaux |
| Moments rares (palmarès, verdict passé) | Intensité maximale **de la même matière** : double filet par lauréat, breloques en tampon, tampon « Servi » frappé sur le bord du verdict | Aucune autre dimension (ni police, ni mouvement) |
| Feuilles, modales, menus | Overlay : panneau opaque + ombre ; voile sombre sans flou | Bordure doublant l'ombre, verre |
| Accueil et onboarding | Même plan, même voile ; le décor reparaît en bord d'écran large | Verre du bloc d'accueil |
| Rideau d'ouverture | Inchangé (son verre est le seul conservé : moment unique, hors page) | — |

**Tranché en migration (01/10/2026).**
- Un mot du mur est un objet posé (fond champ, **filet fin**) et non un objet à
  filet franc : le filet franc promettrait un clic que le mur n'offre pas.
- Le passé se dit par la forme (contour pointillé, surtitre non pastis, tampon),
  jamais par l'opacité, qui faisait tomber tout le texte sous 4,5:1.
- Le bouton plein garde l'élévation 1 (ombre sombre) au lieu de son halo pastis :
  il reste le seul aplat pastis de l'écran, ce qui suffit à le distinguer.
- Mesure de profondeur : un filet séparateur entre deux blocs frères (posé en
  pseudo-élément) et le voile d'une modale ne sont pas des surfaces
  enveloppantes ; ils ne comptent pas. Les cartes Leaflet sont des images de
  donnée et sont exclues, comme les jauges `role="img"`.

## 8. Interdits

- Une carte dans une carte ; un fond ou une ombre sur une section.
- Du texte posé sur la photo hors du voile calibré, ou sous le plancher de
  texte secondaire.
- Le pastis en filet décoratif, en fond de section ou en titre de section.
  **Tranché (01/10/2026)** : la marge pointillée pastis d'un créneau « à
  remplir » n'est pas un filet décoratif, c'est l'état « incomplet », porté par
  un bord pastis avant la refonte (`PO-VISION.md` §5.1, dérive D-3). Elle ne
  sert à rien d'autre ; le même pastis sur un séparateur ou un titre reste
  interdit. Même règle pour le contour pastis des pastilles d'état (« À voter »,
  « J'y serai »).
- Une seconde police, un nouveau flou, une animation d'entrée : hors budget
  d'écart (une seule dimension : matière et surface).
- Retirer une classe historique du DOM pour « nettoyer » (accroches des tests,
  `PO-VISION.md` §5.1).
- Dérives génériques : voir `UXER/references/generic-ai-design-antipatterns.md`.

## 9. Ajouter un écran ou un composant

Les rôles vivent dans les règles de base de `src/styles/global.css` (la classe
d'adhésion `.registre` de la migration a disparu). Pour un nouvel écran :

1. `MobilePage` pose le voile du plan ; ne pas ajouter de fond ni de carte de
   section. Une section est un `.sheet` (à plat), un objet manipulable prend
   le filet franc, ce qui flotte prend `--bg-panel` et `--elev-2`.
2. Toute valeur passe par un jeton (taille, rayon, ombre, espacement, filet,
   fond) ; aucune taille sous `--t-micro`.
3. Mesurer : profondeur ≤ 2, contraste texte ≥ 4,5:1 et filets fonctionnels
   ≥ 3:1 sur pixels décodés à plusieurs positions de défilement, cibles
   ≥ 44 px, `innerText` inchangé, un seul bouton plein, CSS livré ≤ R13.
