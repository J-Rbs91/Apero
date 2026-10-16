import type { AperitifOption } from "../types/apero";

// Calendrier-feuille du ticket (design-system §4) : jour de la semaine, quantième
// en chiffres d'affiche, mois. Décoratif : le texte complet de la date est lu
// par `slotDateLabel` (classe sr-only) à côté de l'heure.
export function slotDateParts(option: Pick<AperitifOption, "date">) {
  if (!option.date) {
    return null;
  }

  const date = new Date(`${option.date}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    weekday: new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(date),
    day: new Intl.DateTimeFormat("fr-FR", { day: "numeric" }).format(date),
    month: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(date),
  };
}

export function slotDateLabel(option: Pick<AperitifOption, "date">): string {
  const parts = slotDateParts(option);
  return parts ? `${parts.weekday} ${parts.day} ${parts.month}` : "Sans date";
}

export function SlotLeaf({ option }: { option: Pick<AperitifOption, "date"> }) {
  const parts = slotDateParts(option);

  return (
    <div className="leaf" aria-hidden="true">
      {parts && <span className="leaf__wd">{parts.weekday}</span>}
      <span className="leaf__day">{parts ? parts.day : "?"}</span>
      {parts && <span className="leaf__mo">{parts.month}</span>}
    </div>
  );
}
