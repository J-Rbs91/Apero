/* L'arbre des écrans — profondeur et parent de repli, en un seul endroit.
 *
 * Le geste retour d'Android, le bouton du navigateur et le glissement latéral
 * d'iOS rejouent la PILE D'HISTORIQUE : la chronologie des écrans visités, à
 * l'envers. Personne ne se représente une application comme une chronologie —
 * on se la représente comme un arbre, et « retour » veut dire remonter d'un
 * niveau. Les deux coïncident tant qu'on ne fait que descendre, et divergent au
 * premier pas de côté.
 *
 * Un seul invariant tient tout le contrat :
 *
 *     la pile d'historique est toujours le chemin de la racine à l'écran
 *     courant.
 *
 * Sous cet invariant, le geste retour du système remonte l'arbre de lui-même,
 * sans une ligne d'interception — et il ne faut surtout pas intercepter : sur
 * iOS le retour est un glissement continu et réversible qu'une interception
 * transforme en saut sec, et sur Android il entre en concurrence avec les
 * gestes du système.
 *
 * Ce fichier est la seule déclaration de la structure. Ajouter un écran, c'est
 * y ajouter une ligne ; les liens qui y mènent se comportent alors
 * correctement sans que personne ait à y penser. src/routes/navigationTree.test.ts
 * échoue si une route du routeur n'y figure pas.
 *
 * Le geste à poser sur la pile se déduit ensuite de la comparaison des deux
 * profondeurs, jamais d'une déclaration à la main : voir useAppNavigation.ts.
 */

export type Ecran = {
  /* Motif de chemin, tel qu'il est écrit dans AppRouter. */
  motif: string;
  /* Distance à la racine. Le Comptoir vaut 0. */
  profondeur: number;
  /* Parent de REPLI, distinct du parent réellement parcouru : il sert quand la
     pile ne contient rien sous l'écran courant — arrivée par un lien
     d'invitation partagé, rechargement, reprise d'une application mise en
     veille. Dépiler sortirait alors de l'application ; on remplace. */
  parent: string | null;
};

export const ARBRE: Ecran[] = [
  { motif: "/", profondeur: 0, parent: null },

  /* Les entrées du menu de la Confrérie sont des FRÈRES : passer de « Au
     programme » à « Tablées » ne descend nulle part et ne doit donc rien
     empiler. C'est la ligne qu'on oublie, et c'est elle qui fait qu'une
     application demande huit appuis pour sortir. */
  { motif: "/agenda", profondeur: 1, parent: "/" },
  { motif: "/tablees", profondeur: 1, parent: "/" },
  { motif: "/palmares", profondeur: 1, parent: "/" },
  { motif: "/comptes", profondeur: 1, parent: "/" },
  { motif: "/coffre", profondeur: 1, parent: "/" },
  { motif: "/notifications", profondeur: 1, parent: "/" },
  { motif: "/registre-legal", profondeur: 1, parent: "/" },

  /* Un apéro se lit depuis le programme, depuis le comptoir ou depuis un lien
     partagé : plusieurs chemins y mènent, une seule profondeur. Le parent de
     repli est le programme — c'est aussi là que la page renvoie d'elle-même
     quand le lien ne porte pas de clé lisible. */
  { motif: "/invite/:aperoId", profondeur: 2, parent: "/agenda" },
  { motif: "/event/:eventId", profondeur: 2, parent: "/agenda" },
  { motif: "/tablee/:tableeId", profondeur: 2, parent: "/tablees" },

  /* La création est un tunnel. Elle est au même niveau que l'apéro qu'elle
     produit, ce qui fait qu'arriver sur l'apéro créé REMPLACE le formulaire :
     un parcours terminé ne doit pas se rouvrir au geste retour. */
  { motif: "/create", profondeur: 2, parent: "/agenda" },
];

/* Profondeur d'une couche posée par-dessus l'arbre — le menu de la Confrérie.
   Elle compte pour un niveau de plus, ce qui fait qu'en sortir est toujours une
   remontée : une couche fermée quitte la pile et ne peut plus être ressuscitée
   par un appui sur retour. */
export const PROFONDEUR_COUCHE = 1;

function segments(chemin: string): string[] {
  return chemin.split("?")[0].split("#")[0].split("/").filter(Boolean);
}

function correspond(motif: string, chemin: string): boolean {
  const attendus = segments(motif);
  const recus = segments(chemin);

  if (attendus.length !== recus.length) {
    return false;
  }

  return attendus.every(
    (segment, index) => segment.startsWith(":") || segment === recus[index],
  );
}

export function ecranDe(chemin: string): Ecran | null {
  return ARBRE.find((ecran) => correspond(ecran.motif, chemin)) ?? null;
}

/* Une adresse inconnue — lien tronqué, ancienne route — est traitée comme une
   feuille de premier niveau : on peut en remonter, on n'y est pas piégé. C'est
   le repli le moins mauvais, et il est le même que celui de la page « ce lien
   coince ». */
export function profondeurDe(chemin: string): number {
  return ecranDe(chemin)?.profondeur ?? 1;
}

export function parentDe(chemin: string): string {
  return ecranDe(chemin)?.parent ?? "/";
}
