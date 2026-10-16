import type { ReactNode } from "react";
import type { AperitifOption } from "../types/apero";
import { SlotLeaf, slotDateLabel } from "./SlotLeaf";

type SlotHeadProps = {
  option: Pick<AperitifOption, "date" | "time">;
  /** Ce qui vient sous l'heure : le troquet, le lien carte, la note. */
  children?: ReactNode;
  /** Étiquette d'état à droite (« En tête », « À voter »…). */
  badge?: ReactNode;
};

// En-tête d'un ticket de créneau : calendrier-feuille, heure en chiffres
// d'affiche, puis le troquet. La date complète reste dite en toutes lettres
// aux lecteurs d'écran (« dim. 18 oct. · 19:00 »).
export function SlotHead({ option, children, badge }: SlotHeadProps) {
  return (
    <div className="slot__top">
      <SlotLeaf option={option} />
      <div className="slot__body">
        <div className="slot__d">
          <span className="sr-only">{slotDateLabel(option)} · </span>
          {option.time || "Sans heure"}
        </div>
        {children}
      </div>
      {badge}
    </div>
  );
}
