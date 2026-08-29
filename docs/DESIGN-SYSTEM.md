# Le kit d'interface de la Confrérie

Ce document décrit les règles de l'interface après la refonte. Elles ne sont pas
des préférences esthétiques : chacune répond à un reproche précis fait à
l'ancienne version, où l'on ne savait ni quoi remplir, ni où appuyer pour
enregistrer, ni quels champs permettaient de choisir quelque chose.

Les principes sont dérivés du guide de conception Higgsfield embarqué dans
`.claude/skills/higgsfield-websites/` (voir `references/design-recipe.md` §7 sur
les formulaires et les états, `references/app-layouts.md` sur la divulgation
progressive et l'action épinglée, `references/review-rubric.md` pour la revue
mécanique avant livraison).

## Les quatre règles

### 1. Un champ dit ce qu'on attend de lui avant qu'on le touche

Tout champ passe par `Field` / `TextField` / `TextAreaField`
(`src/components/ui/Field.tsx`) et porte :

- un **libellé au-dessus** du contrôle, jamais un placeholder en guise de
  libellé ;
- une **mention explicite** `Obligatoire` ou `Facultatif` ;
- une **phrase d'aide** quand le libellé seul ne suffit pas ;
- une **erreur sous le contrôle**, propre à ce champ, avec le contour du
  contrôle qui vire au rouge.

Le composant fabrique lui-même les identifiants et le câblage
`aria-describedby` / `aria-invalid` : impossible d'oublier le lien entre le
libellé, l'aide et l'erreur.

```tsx
<TextField
  label="Le troquet"
  requirement="required"
  hint="Tape deux lettres, la liste te propose les rades du coin."
  error={showErrors ? "Indique où on se retrouve." : undefined}
  value={location}
  onChange={setLocation}
/>
```

### 2. Ce qui se sélectionne ressemble à quelque chose qui se sélectionne

Les menus déroulants natifs ressemblaient à des zones de texte. Ils sont
remplacés par `ChoiceGroup` (`src/components/ui/ChoiceGroup.tsx`) : des cartes
cochables, avec une pastille vide quand rien n'est choisi et une carte remplie
quand un choix est fait.

- `layout="stack"` pour une liste de possibilités (cadence d'une assemblée) ;
- `layout="row"` pour trois réponses courtes (le vote d'un créneau) ;
- `legendDetail` porte la précision réservée aux lecteurs d'écran, quand dix
  groupes « Ta réponse » se suivent sur la page.

Les `<select>` natifs restants (aucun dans le parcours principal) gardent un
chevron visible pour ne pas se confondre avec un champ de saisie.

Un réglage oui/non passe par `SwitchRow` : la ligne entière est cliquable et
annonce son état en toutes lettres (« Marmaille admise » / « Ce soir c'est sans
les mômes »).

### 3. Le bouton qui enregistre reste sous le pouce

`ActionBar` (`src/components/ui/ActionBar.tsx`) épingle l'action principale en
bas de la zone qui défile, avec une ligne de statut au-dessus. Le statut ne dit
jamais « erreur » : il dit la prochaine chose à faire.

- `Encore 2 créneaux à trancher.`
- `Remplis jour, heure et troquet du créneau 1.`
- `Tout est rempli. Plus qu'à émarger.`

Une saisie secondaire (contre-proposition, retouche des réglages) passe en
`FormSheet` : une feuille plein écran, un titre, ses champs, un seul bouton
d'enregistrement dans un pied fixe. Elle ne peut plus être confondue avec le
formulaire qui vit derrière.

### 4. Un seul bouton plein par écran

`.button--primary` (jaune pastis, ombre portée) est réservé à l'action attendue
sur l'écran courant. Tout le reste :

| Classe | Usage |
|---|---|
| `.button--primary` | Enregistre. Un seul visible à la fois. |
| `.button--ghost` | Action secondaire assumée (modifier, ouvrir). |
| `.button--quiet` | Service (copier, rappel). |
| `.button--danger` | Destruction, uniquement dans un volet replié. |
| `.ghost-link` | Sortie discrète (annuler, laisser tomber). |

Corollaire : trinquer à un créneau, copier un lien ou lever son verre ne se
peignent plus en jaune.

## Structure d'un écran

1. **Une carte de tête** (`.sheet--hero`) : de quoi il s'agit, en chiffres
   (`.factline`) et en étiquettes (`.tagrow`).
2. **Le geste attendu**, découpé en blocs numérotés (`FormSection`), avec la
   barre d'action épinglée.
3. **Le verdict** ou le résultat.
4. **Tout le second plan replié** (`Disclosure`) : qui vient, le mur du
   comptoir, la tablée, les coulisses de l'organisation.

La divulgation progressive est la règle : un panneau qui exposerait plus de six
contrôles garde les principaux visibles et range le reste dans un volet.

## Jetons

Définis en tête de `src/styles/global.css` :

- **Accent unique** : `--pastis`. Le rouge (`--danger`) et le vert (`--ok`) sont
  des états, pas des couleurs de marque.
- **Une seule échelle d'arrondis** : `--r-xs` … `--r-pill`.
- **Trois niveaux de traits et de fonds** : `--line-soft` / `--line` /
  `--line-strong`, `--fill-soft` / `--fill`.
- **Texte** : plus rien sous 12 px. Les libellés de champ sont à 13,5 px, le
  corps à 15 px. L'ancienne interface descendait à 9,5 px.

## Règles d'écriture

- **Pas de tiret cadratin** (`—`) dans un texte visible : point, virgule,
  deux-points ou parenthèses. La revue mécanique le vérifie
  (`grep -rn "—" src/`, hors commentaires).
- Un libellé d'action, une intention : « Enregistrer ma réponse » ne cohabite
  pas avec « Valider » ailleurs dans la même page.
- Les messages d'erreur nomment le champ concerné et disent quoi faire.

## Avant de livrer

Passe mentalement la grille de `.claude/skills/higgsfield-websites/references/review-rubric.md`
§A, en retenant ce qui s'applique à une app installée plutôt qu'à un site
vitrine :

1. aucun texte de remplacement, aucun `lorem` ;
2. aucun tiret cadratin visible ;
3. cibles tactiles à 44 px minimum ;
4. `prefers-reduced-motion` couvert (bloc en fin de feuille de style) ;
5. un seul bouton plein par écran ;
6. tout état d'un formulaire traité : vide, en cours, en faute, en envoi,
   enregistré.
