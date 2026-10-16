// Bande de signal du verdict : purement décorative (aria-hidden).
// 24 traits ; sous 640 px seuls les 12 premiers sont affichés (CSS).
// `chase` lance une impulsion unique quand un créneau l’emporte (voir
// UXER_MOTION_SYSTEM.md §2) ; sans `chase` ou en mouvement réduit, tout est fixe.

import type { CSSProperties } from "react";

type BulbsProps = {
  count?: number;
  chase?: boolean;
  /** Ampoules éteintes (verdict en attente). */
  off?: boolean;
  className?: string;
};

export function Bulbs({ count = 24, chase = false, off = false, className }: BulbsProps) {
  const classes = ["bulbs", chase ? "bulbs--chase" : "", off ? "bulbs--off" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <i key={index} style={{ "--i": index, "--ph": index % 3 } as CSSProperties} />
      ))}
    </div>
  );
}
