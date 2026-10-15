// Rangée d'ampoules de baraque foraine : purement décorative (aria-hidden).
// `chase` déclenche la chasse du verdict gagnant (5 cycles puis fixe, voir
// design-system.md §6.1) ; sans `chase` ou en mouvement réduit, tout est allumé.

import type { CSSProperties } from "react";

type BulbsProps = {
  count?: number;
  chase?: boolean;
  /** Ampoules éteintes (verdict en attente). */
  off?: boolean;
  className?: string;
};

export function Bulbs({ count = 12, chase = false, off = false, className }: BulbsProps) {
  const classes = ["bulbs", chase ? "bulbs--chase" : "", off ? "bulbs--off" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <i key={index} style={{ "--i": index } as CSSProperties} />
      ))}
    </div>
  );
}
