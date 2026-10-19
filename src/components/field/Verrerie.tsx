// La Verrerie : une silhouette de verre, monumentale, posée derrière le texte
// d'un écran d'identité. Le texte neutre qui la traverse s'inverse
// (UXER_REDESIGN_CONTRACT.md §17, UXER_DESIGN_SYSTEM.md §10).
//
// Tracés originaux, dessinés en millimètres réels : une seule échelle pour
// toute la verrerie. La bouteille (300 mm) fait la hauteur du premier écran,
// les autres objets suivent leurs proportions (--verrerie-mm, §10.2).
// Purement visuelle : aria-hidden, aucune donnée, une seule silhouette.

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

type VerrerieProps = {
  objet: VerrerieObjet;
  /** Composition propre à l'écran : position et angle, jamais la taille. */
  className?: string;
};

export function Verrerie({ objet, className }: VerrerieProps) {
  const { hauteurMm, viewBox, trace } = VERRERIE[objet];

  return (
    <div className={className ? `verrerie ${className}` : "verrerie"} aria-hidden="true">
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
