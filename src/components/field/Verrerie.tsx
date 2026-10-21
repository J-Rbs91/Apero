// La Verrerie : une silhouette de verre, monumentale, posée derrière le texte
// d'un écran d'identité. Le texte neutre qui la traverse s'inverse
// (UXER_REDESIGN_CONTRACT.md §17, UXER_DESIGN_SYSTEM.md §10).
//
// Tracés originaux, dessinés en millimètres réels : une seule échelle pour
// toute la verrerie. La bouteille (300 mm) fait la hauteur du premier écran,
// les autres objets suivent leurs proportions (--verrerie-mm, §10.2).
// Purement visuelle : aria-hidden, aucune donnée, une seule silhouette.

import type { CSSProperties } from "react";
import { fnv1a } from "../../utils/signalMath";

export type VerrerieObjet = "bouteille" | "verre" | "flute" | "nonic";

type Silhouette = {
  /** Hauteur réelle de l'objet, en millimètres. */
  hauteurMm: number;
  /** Boîte du tracé, en millimètres. */
  viewBox: string;
  trace: string;
};

export const VERRERIE: Record<VerrerieObjet, Silhouette> = {
  // Bouteille de vin 75 cl : 300 × 75 mm.
  bouteille: {
    hauteurMm: 300,
    viewBox: "0 0 75 300",
    trace:
      "M0 300 L0 124 C0 92 21 88 21 69 L21 17 L18.5 17 L18.5 0 L56.5 0 L56.5 17 L54 17 L54 69 C54 88 75 92 75 124 L75 300 Z",
  },
  // Verre à pied : 210 × 85 mm, pied de 75 mm.
  verre: {
    hauteurMm: 210,
    viewBox: "0 0 85 210",
    trace:
      "M8 0 L77 0 C81 46 72 92 45.5 101 L45.5 190 L80 205 L80 210 L5 210 L5 205 L39.5 190 L39.5 101 C13 92 4 46 8 0 Z",
  },
  // Flûte : 230 × 60 mm, pied de 70 mm.
  flute: {
    hauteurMm: 230,
    viewBox: "-5 0 70 230",
    trace:
      "M5 0 L55 0 C58 70 52 125 33 142 L33 216 L65 226 L65 230 L-5 230 L-5 226 L27 216 L27 142 C8 125 2 70 5 0 Z",
  },
  // Pinte nonic : 155 × 90 mm, renflement sous le buvant.
  nonic: {
    hauteurMm: 155,
    viewBox: "0 0 90 155",
    trace: "M5.4 0 L84.6 0 L81 22 L87.3 36.5 L77.4 155 L12.6 155 L2.7 36.5 L9 22 Z",
  },
};

export type VerrerieAncre = "gauche" | "centre" | "droite";

/** Composition d'un écran : l'objet, son angle, son ancrage. Jamais sa taille. */
export type VerrerieComposition = {
  objet: VerrerieObjet;
  /** Inclinaison en degrés : de −35 à +35, ou de 145 à 215 pour un verre à
   *  pied retourné, pied en haut, comme sur un porte-verres (contrat §17.5). */
  angle: number;
  ancre: VerrerieAncre;
};

const OBJETS: VerrerieObjet[] = ["bouteille", "verre", "flute", "nonic"];
const ANCRES: VerrerieAncre[] = ["gauche", "centre", "droite"];

// Un apéro ou un groupe tire sa verrerie de son identifiant public, comme sa
// signature : même identifiant, même verre, sur tous les appareils.
export function composerVerrerie(seed: string): VerrerieComposition {
  const hash = fnv1a(seed);
  return {
    objet: OBJETS[hash % OBJETS.length],
    angle: -35 + 5 * ((hash >>> 2) % 15),
    ancre: ANCRES[(hash >>> 6) % ANCRES.length],
  };
}

type VerrerieProps = {
  objet: VerrerieObjet;
  /** Composition propre à l'écran : position et angle, jamais la taille. */
  className?: string;
  angle?: number;
  ancre?: VerrerieAncre;
};

export function Verrerie({ objet, className, angle, ancre }: VerrerieProps) {
  const { hauteurMm, viewBox, trace } = VERRERIE[objet];
  const style = angle == null ? undefined : ({ "--verrerie-angle": `${angle}deg` } as CSSProperties);

  return (
    <div
      className={className ? `verrerie ${className}` : "verrerie"}
      data-ancre={ancre}
      data-retourne={angle != null && Math.abs(angle) > 90 ? "" : undefined}
      style={style}
      aria-hidden="true"
    >
      <svg
        className={`verrerie__${objet}`}
        viewBox={viewBox}
        style={{ height: `calc(${hauteurMm} * var(--verrerie-mm))` }}
        focusable="false"
      >
        <path d={trace} />
      </svg>
    </div>
  );
}
