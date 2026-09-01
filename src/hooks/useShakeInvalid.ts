import { useCallback, useEffect, useRef, useState } from "react";

// Durée de la secousse : assez pour être vue, assez courte pour ne pas
// retarder la correction. Doit rester alignée sur l'animation `slot-shake`
// de global.css.
const SHAKE_MS = 560;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Ramène le regard sur le bloc qui coince quand on tente d'enregistrer :
 * défilement jusqu'à lui, secousse, et focus sur son premier champ en faute.
 *
 * Le geste est déclenché depuis le gestionnaire d'envoi, mais exécuté dans un
 * effet : au moment du clic, React n'a pas encore posé les `aria-invalid` que
 * l'on cherche. Passer par un état garantit qu'on agit sur le DOM à jour.
 *
 * Deux portes d'entrée, un seul mécanisme :
 * - `shake(id)` quand un champ précis est en faute — secousse comprise ;
 * - `bringIntoView(id)` quand le refus est global (créneaux passés, nom déjà
 *   pris, échec réseau) et que le bloc à montrer est le message qui
 *   l'explique. Rien à secouer : il n'y a pas de champ à corriger, seulement
 *   quelque chose à lire.
 *
 * Les deux ne se déclenchent jamais pour un même refus : deux défilements
 * concurrents choisiraient l'un pour l'autre où l'utilisateur doit regarder.
 */
export function useShakeInvalid() {
  const nodes = useRef(new Map<string, HTMLElement>());
  const [target, setTarget] = useState<{ id: string; withShake: boolean } | null>(null);
  const [shakingId, setShakingId] = useState<string | null>(null);

  /** Callback de ref à poser sur chaque bloc secouable. */
  const registerNode = useCallback(
    (id: string) => (node: HTMLElement | null) => {
      if (node) {
        nodes.current.set(id, node);
      } else {
        nodes.current.delete(id);
      }
    },
    [],
  );

  /** À appeler au refus d'envoi, avec l'identifiant du bloc fautif. */
  const shake = useCallback((id: string) => {
    // Objet neuf à chaque appel : deux refus d'affilée sur le même bloc
    // doivent rejouer la secousse.
    setTarget({ id, withShake: true });
  }, []);

  /**
   * Même remontée du regard, sans secousse : pour un bloc qu'il faut lire, pas
   * corriger. Objet neuf à chaque appel, pour la même raison que `shake`.
   */
  const bringIntoView = useCallback((id: string) => {
    setTarget({ id, withShake: false });
  }, []);

  useEffect(() => {
    if (!target) {
      return;
    }

    const node = nodes.current.get(target.id);
    if (!node) {
      return;
    }

    const reduced = prefersReducedMotion();
    node.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
    // Le focus part sur le premier champ effectivement refusé, pas sur le
    // premier champ du bloc : on atterrit là où il y a quelque chose à taper.
    node.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus({ preventScroll: true });

    if (!target.withShake) {
      // Un message d'explication ne tremble pas : on l'amène sous les yeux et
      // on le laisse se lire.
      setShakingId(null);
      return;
    }

    setShakingId(target.id);
    const timer = window.setTimeout(() => setShakingId(null), SHAKE_MS);
    return () => window.clearTimeout(timer);
  }, [target]);

  return { registerNode, shake, bringIntoView, shakingId };
}
