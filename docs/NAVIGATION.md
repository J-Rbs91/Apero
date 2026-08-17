# Navigation arrière — ce que fait le geste retour

Ce document dit ce que doit faire le bouton retour d'Android, le bouton retour
de l'en-tête et le glissement latéral d'iOS, comment c'est tenu dans le code, et
comment le vérifier.

Il applique à la Confrérie le contrat de navigation arrière de la méthode UXER
(`references/back-navigation-contract.md`).

---

## 1. Le défaut

Le geste retour de toutes les plateformes rejoue la **pile d'historique** : la
chronologie des écrans visités, à l'envers. Personne ne se représente une
application comme une chronologie. On se la représente comme un **arbre**, et
« retour » veut dire **remonter d'un niveau**.

Les deux coïncident tant qu'on ne fait que descendre. Ils divergent au premier
pas de côté — une entrée de menu, un apéro voisin, un filtre.

Ce que ça donnait ici :

| Ce qu'on faisait | Ce qui se passait |
|---|---|
| Passer du programme aux Tablées, puis au Palmarès, par le menu | Chaque passage empilait une entrée : quatre passages, quatre appuis à payer pour sortir |
| Appuyer sur le bouton retour de l'en-tête | `navigate(-1)` ramenait à l'**écran précédemment vu**, qui n'est le parent qu'au premier pas — après trois apéros consultés à la file, trois appuis pour revenir au programme |
| Ouvrir le menu de la Confrérie puis appuyer sur retour | Le menu n'était pas dans l'historique : l'appui quittait l'écran au lieu de refermer le menu |
| Créer un apéro puis appuyer sur retour | Le formulaire de création se rouvrait — un parcours terminé qui ressuscite |

Aucun de ces défauts ne se voit sur un ordinateur, où personne n'appuie sur
retour. Tous se constatent en trente secondes sur un téléphone.

## 2. Le contrat

Un seul invariant, et tout en découle :

> **La pile d'historique est toujours le chemin de la racine à l'écran courant.**

Sous cet invariant, le geste retour du système remonte l'arbre **de lui-même**,
sans une ligne d'interception. Et il ne faut surtout pas intercepter : sur iOS le
retour est un glissement continu et réversible qu'une interception transforme en
saut sec, sur Android il entre en concurrence avec les gestes du système, et
partout il casserait le retour du navigateur.

Trois gestes seulement, et l'intention se **déduit** de la position des deux
écrans dans l'arbre — elle ne se déclare jamais à la main :

| Intention | Position de la cible | Geste sur la pile |
|---|---|---|
| Descendre | plus profonde | empiler |
| Frère | même profondeur | **remplacer** |
| Remonter | moins profonde | **dépiler** |

C'est la ligne du milieu qu'on oublie, et c'est elle qui produisait le défaut.

### L'arbre

```
Le Comptoir  (racine)
├── Au programme
│   ├── un apéro  (/invite/:id, /event/:id)
│   └── Organiser un apéro  (/create)
├── Tablées
│   └── une tablée  (/tablee/:id)
├── Palmarès
├── Rétrospective
├── Notifications
├── Sauvegarde  (/coffre)
└── Registre légal
```

`src/routes/navigationTree.ts` est **le seul endroit** où cette structure est
écrite. Ajouter un écran, c'est y ajouter une ligne — et
`src/routes/navigationTree.test.ts` échoue si une route du routeur n'y figure
pas, ou si la profondeur déclarée ne correspond pas à la distance réelle à la
racine.

`src/routes/useAppNavigation.ts` est le **point de passage unique** : c'est lui
qui compare les profondeurs et choisit le geste. `AppLink` l'appelle au clic
tout en restant un vrai lien dans le document — préchargeable, ouvrable dans un
nouvel onglet, annoncé aux technologies d'assistance. Seul le clic ordinaire est
détourné.

### Le tunnel de création

`/create` est au **même niveau** que l'apéro qu'il produit. Arriver sur l'apéro
créé remplace donc le formulaire : un parcours terminé ne se rouvre pas au geste
retour. Et comme la création se lance depuis le programme, depuis une tablée ou
depuis le comptoir, le retour ramène à chaque fois là d'où l'on venait.

### Le menu de la Confrérie

Le menu est une **couche** posée sur l'écran, pas un écran : son ouverture
empile une entrée, et le geste retour la referme au lieu de quitter la page.
L'état ouvert se **lit dans l'historique** plutôt que de vivre à côté — deux
sources qui divergent, c'est un menu resté affiché sur un écran qu'on a quitté.

Choisir une entrée de menu fait d'abord **sortir la couche de la pile**, puis
rejoue la navigation depuis l'écran qu'elle recouvrait. Écrire par-dessus son
entrée transformerait le menu en profondeur, et chaque passage par le menu
coûterait un appui de plus pour sortir.

### Quand la trace est vide

Un lien d'invitation partagé est le **premier écran** que voit un primo-invité :
la pile ne contient rien sous lui. Dépiler sortirait de l'application — et
retenir quelqu'un sur le premier écran parce qu'on n'a pas su gérer la pile
serait un défaut, pas une protection.

Le repli est donc de **remplacer** l'entrée courante par le parent déclaré : la
pile ne grandit pas, ce qui est le point important, et le retour suivant sort
proprement. Chaque écran a pour cela un parent de repli, distinct du parent
réellement parcouru.

## 3. Le bouton retour de l'en-tête

Il est sur toutes les pages intérieures, et il ne s'agit pas d'un ornement :
l'iPhone n'a pas de bouton retour matériel, et une application ajoutée à l'écran
d'accueil n'a pas de barre de navigateur. Sans lui, l'écran est **sans issue**.

Il appelle `remonter()`, qui **dépile**. Il ne navigue pas vers le parent :
naviguer empilerait une entrée de plus, et éloignerait la sortie à chaque
remontée. C'est aussi la seule façon que ce bouton et celui du téléphone
aboutissent au même écran depuis le même point.

Son libellé est une flèche seule, annoncée « Retour ». C'est volontaire :
plusieurs chemins mènent à un apéro — le programme, le comptoir, un lien
partagé — et un libellé figé mentirait deux fois sur trois. Un libellé faux est
pire qu'un libellé générique, parce qu'il détruit la confiance dans tous les
autres.

## 4. Comment le vérifier

Six vérifications, sur un téléphone, dans cet ordre. Le défaut ne se lit pas
dans du code : il se constate, et il se compte.

1. **Compter les appuis.** Comptoir → Au programme → un apéro, puis retour
   jusqu'à sortir. Deux appuis, pas trois.
2. **Faire des pas de côté.** Passer par le menu vers Tablées, Palmarès,
   Rétrospective, Au programme. Le nombre d'appuis pour sortir ne doit pas avoir
   changé — il reste à un.
3. **Fermer une couche puis appuyer sur retour.** Le menu ne doit pas revenir.
4. **Terminer un parcours puis appuyer sur retour.** L'apéro créé ne doit pas
   ramener au formulaire.
5. **Comparer les deux retours.** Depuis une tablée, le bouton de l'en-tête et
   celui du système doivent mener au même écran.
6. **Arriver directement en profondeur** par un lien d'invitation, puis appuyer
   sur retour. On doit monter dans l'arbre, pas sortir au premier appui.

`npm test` ne vérifie pas ce comportement — il ne le pourrait pas sans
navigateur. Il protège les deux conditions structurelles sans lesquelles le
défaut revient au prochain écran ajouté : la profondeur déclarée en un seul
endroit, et la navigation qui passe par un seul point (aucun `<Link>` ni
`useNavigate` hors de `AppLink` et `useAppNavigation`).

## 5. En ajoutant un écran

1. Le déclarer dans `AppRouter`.
2. **Lui donner une ligne dans `navigationTree.ts`** — profondeur et parent de
   repli. Sans cela, `npm test` échoue, et c'est voulu.
3. Y aller par `AppLink` ou `aller()`, jamais par `<Link>` ni `useNavigate`.
4. Si c'est une page intérieure, lui donner l'en-tête `MobileHeader`, qui porte
   le bouton retour.
5. Refaire les six vérifications ci-dessus.
