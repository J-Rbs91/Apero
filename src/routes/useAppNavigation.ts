import { useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { PROFONDEUR_COUCHE, parentDe, profondeurDe } from "./navigationTree";

/* Le point de passage unique de toute navigation interne.
 *
 * C'est lui qui compare les profondeurs et choisit le geste à poser sur la pile
 * d'historique. Un lien qui le contournerait — un `navigate()` ou un `<Link>`
 * brut — est le seul endroit où le défaut peut réapparaître, et il se cherche
 * en une recherche textuelle. Le raisonnement complet est en tête de
 * navigationTree.ts.
 *
 *     descendre  → empiler        (cible plus profonde)
 *     frère      → remplacer      (même profondeur : une entrée de menu, un
 *                                  apéro voisin, un filtre ne consomment
 *                                  aucune profondeur)
 *     remonter   → dépiler        (cible moins profonde)
 *
 * Rien n'est intercepté : c'est le navigateur qui dépile. On se contente de
 * choisir, au moment du clic, ce qu'on écrit dans la pile.
 */

/* Nombre d'entrées que NOUS avons empilées sous l'entrée courante. React Router
   le tient déjà dans l'état de l'historique : c'est la seule chose qui dise si
   une remontée resterait dans l'application ou en sortirait. */
function entreesSousNous(): number {
  const index = (window.history.state as { idx?: number } | null)?.idx;
  return typeof index === "number" ? index : 0;
}

/* Navigation demandée pendant qu'une couche était ouverte, en attente que la
   couche soit sortie de la pile. Elle vit au niveau du module et non dans un
   composant : la couche qui se referme démonte justement l'élément d'où le clic
   est parti. */
let enAttente: { destination: string; state?: unknown } | null = null;

export type EtatDeCouche = { couche?: string } | null;

export function coucheOuverte(etat: unknown): string | null {
  const couche = (etat as EtatDeCouche)?.couche;
  return typeof couche === "string" ? couche : null;
}

export function useAppNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const couche = coucheOuverte(location.state);
  const profondeurCourante =
    profondeurDe(location.pathname) + (couche ? PROFONDEUR_COUCHE : 0);

  /* Aller à un écran. `options.state` voyage avec l'entrée, comme avec
     react-router — les pages s'en servent pour passer un préremplissage. */
  const aller = useCallback(
    (destination: string, options?: { state?: unknown }) => {
      /* Une couche est ouverte : on la fait D'ABORD sortir de la pile, puis on
         rejoue la navigation depuis l'écran qu'elle recouvrait. Écrire par-dessus
         son entrée transformerait la couche en profondeur, et chaque passage par
         le menu coûterait un appui de plus pour sortir — c'est-à-dire
         exactement le défaut que tout ceci existe pour empêcher. */
      if (couche) {
        enAttente = { destination, state: options?.state };
        navigate(-1);
        return;
      }

      const cible = profondeurDe(destination);
      const ecart = cible - profondeurCourante;

      if (ecart > 0) {
        navigate(destination, { state: options?.state });
        return;
      }

      if (ecart === 0) {
        navigate(destination, { state: options?.state, replace: true });
        return;
      }

      /* Remontée. On ne dépile que ce que la pile contient réellement : s'il en
         manque — arrivée directe par un lien d'invitation, rechargement — on
         REMPLACE l'entrée courante par la destination. La pile ne grandit pas,
         ce qui est le point important, et le retour suivant sort proprement.
         Retenir quelqu'un sur le premier écran serait un défaut, pas une
         protection.

         Un état à transmettre force aussi le remplacement : une traversée
         d'historique restitue l'entrée telle qu'elle a été empilée, et
         n'emporte rien de neuf. */
      const niveaux = -ecart;

      if (options?.state !== undefined || entreesSousNous() < niveaux) {
        navigate(destination, { state: options?.state, replace: true });
        return;
      }

      navigate(-niveaux);
    },
    [couche, navigate, profondeurCourante],
  );

  /* Remonter d'un niveau, ce que demande un bouton retour dans l'interface. Il
     fait exactement ce que fait le bouton du système — c'est la seule façon que
     les deux aboutissent au même écran depuis le même point. */
  const remonter = useCallback(() => {
    if (couche) {
      navigate(-1);
      return;
    }

    aller(parentDe(location.pathname));
  }, [aller, couche, location.pathname, navigate]);

  /* Ouvrir une couche — un panneau posé sur l'écran, pas un écran. Elle empile
     une entrée, et le geste retour la referme au lieu de quitter la page. */
  const ouvrirCouche = useCallback(
    (nom: string) => {
      navigate(location.pathname + location.search, {
        state: { ...(location.state as object | null), couche: nom },
      });
    },
    [location.pathname, location.search, location.state, navigate],
  );

  const fermerCouche = useCallback(() => {
    if (!couche) {
      return;
    }

    navigate(-1);
  }, [couche, navigate]);

  return { aller, remonter, ouvrirCouche, fermerCouche, coucheCourante: couche };
}

/* Rejoue la navigation mise en attente, une fois la couche sortie de la pile.
   Monté une seule fois sous le routeur : un effet posé dans chaque lien ferait
   le même travail des dizaines de fois par rendu. */
export function RelaisDeNavigation() {
  const { aller, coucheCourante } = useAppNavigation();
  const location = useLocation();

  useEffect(() => {
    if (!enAttente || coucheCourante) {
      return;
    }

    const cible = enAttente;
    enAttente = null;
    aller(cible.destination, cible.state === undefined ? undefined : { state: cible.state });
  }, [aller, coucheCourante, location.key]);

  return null;
}
