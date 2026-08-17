import { describe, expect, it } from "vitest";
import { ARBRE, ecranDe, parentDe, profondeurDe } from "./navigationTree";

/* Garde-fous du contrat de navigation arrière.
 *
 * ⚠️ PORTÉE. Le geste retour ne se lit pas dans du code : il se constate sur un
 * téléphone, et il se compte. Ces tests ne prouvent donc pas le comportement —
 * ils protègent les deux conditions STRUCTURELLES sans lesquelles il se défait
 * au prochain écran ajouté :
 *
 *   1. la profondeur de chaque écran est déclarée en un seul endroit ;
 *   2. toute navigation interne passe par ce seul point.
 *
 * Une route ajoutée à AppRouter sans ligne dans l'arbre, ou un `<Link>` brut
 * glissé dans une page, rétablissent le défaut sans qu'aucun test fonctionnel ne
 * bronche. Ce sont exactement les deux choses qu'on attrape ici.
 *
 * Les six vérifications qui demandent un vrai navigateur sont dans
 * docs/NAVIGATION.md.
 */

/* Les sources sont lues par le graphe de modules plutôt que par le système de
   fichiers : le test reste indépendant du répertoire depuis lequel on le
   lance, et n'a besoin d'aucun type Node. */
const SOURCES = import.meta.glob("../**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

describe("l'arbre des écrans", () => {
  it("déclare toutes les routes du routeur, et rien de plus", () => {
    const [, routeur] = Object.entries(SOURCES).find(([chemin]) =>
      chemin.endsWith("AppRouter.tsx"),
    ) as [string, string];
    const routes = [...routeur.matchAll(/<Route path="([^"]+)"/g)]
      .map((correspondance) => correspondance[1])
      .filter((chemin) => chemin !== "*");

    const declares = ARBRE.map((ecran) => ecran.motif);

    /* Un écran sans profondeur déclarée est un écran où le geste retour rejouera
       la chronologie des visites au lieu de remonter l'arbre. */
    expect(routes.filter((route) => !declares.includes(route))).toEqual([]);
    expect(declares.filter((motif) => !routes.includes(motif))).toEqual([]);
  });

  it("n'a qu'une racine, et tout écran remonte jusqu'à elle", () => {
    expect(ARBRE.filter((ecran) => ecran.parent === null)).toHaveLength(1);

    for (const ecran of ARBRE) {
      let courant = ecran;
      let niveaux = 0;

      while (courant.parent !== null) {
        const parent = ecranDe(courant.parent);
        expect(parent, `parent inconnu pour ${courant.motif}`).not.toBeNull();
        courant = parent as typeof courant;
        niveaux += 1;
        expect(niveaux, `cycle de parents depuis ${ecran.motif}`).toBeLessThan(ARBRE.length);
      }

      /* La profondeur déclarée doit être la distance réelle à la racine :
         deux chiffres qui divergent, et le geste choisi devient arbitraire. */
      expect(niveaux, `profondeur incohérente pour ${ecran.motif}`).toBe(ecran.profondeur);
    }
  });

  it("reconnaît les chemins réels, paramètres compris", () => {
    expect(profondeurDe("/")).toBe(0);
    expect(profondeurDe("/agenda")).toBe(1);
    expect(profondeurDe("/invite/apero_7F92Kx91")).toBe(2);
    expect(profondeurDe("/tablee/tab_12")).toBe(2);
    expect(parentDe("/invite/apero_7F92Kx91")).toBe("/agenda");
    expect(parentDe("/tablee/tab_12")).toBe("/tablees");
  });

  it("ignore la chaîne de requête, où voyagent les clés de déchiffrement", () => {
    expect(profondeurDe("/invite/apero_7F92Kx91?k=CLE&w=ECRIT")).toBe(2);
    expect(parentDe("/tablee/tab_12?k=CLE")).toBe("/tablees");
  });

  it("traite une adresse inconnue comme une feuille dont on peut remonter", () => {
    /* Un lien tronqué ne doit pas produire un écran sans issue : on peut en
       remonter, et le retour suivant sort proprement. */
    expect(profondeurDe("/route-qui-nexiste-pas")).toBe(1);
    expect(parentDe("/route-qui-nexiste-pas")).toBe("/");
  });
});

describe("le bouton retour de l'interface", () => {
  it("est présent sur chaque écran intérieur", () => {
    /* L'iPhone n'a pas de bouton retour matériel, et une application ajoutée à
       l'écran d'accueil n'a pas de barre de navigateur : sans en-tête portant
       le retour, l'écran est sans issue. Seul le comptoir en est dispensé —
       c'est la racine, il n'y a rien au-dessus. */
    const sansRetour = Object.entries(SOURCES)
      .filter(([chemin]) => /\/pages\/[A-Za-z]+Page\.tsx$/.test(chemin))
      .filter(([chemin]) => !chemin.endsWith("HomePage.tsx"))
      .filter(([, source]) => !source.includes("MobileHeader"))
      .map(([chemin]) => chemin);

    expect(sansRetour).toEqual([]);
  });
});

describe("le point de passage unique", () => {
  it("est le seul à naviguer : aucune page n'utilise Link ou useNavigate", () => {
    /* Un lien qui contourne le point de passage est le seul endroit où le
       défaut peut réapparaître — d'où cette recherche textuelle, qui est
       exactement la façon dont on le retrouve. */
    const autorises = ["AppLink.tsx", "useAppNavigation.ts"];

    const fautifs = Object.entries(SOURCES)
      .filter(
        ([chemin]) =>
          !autorises.some((permis) => chemin.endsWith(permis)) &&
          !/\.test\.tsx?$/.test(chemin),
      )
      .filter(([, source]) => {
        /* On lit le code, pas ce qui en est dit : un commentaire qui cite
           `<Link>` pour l'interdire n'est pas une infraction. */
        const code = source
          .replace(/\/\*[\s\S]*?\*\//g, " ")
          .replace(/(^|[^:])\/\/[^\n]*/g, "$1");

        return /\buseNavigate\b/.test(code) || /<Link[\s>]/.test(code);
      })
      .map(([chemin]) => chemin);

    expect(fautifs).toEqual([]);
  });
});
