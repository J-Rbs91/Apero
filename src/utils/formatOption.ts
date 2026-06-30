import type { AperitifOption } from "../types/apero";

export function formatOption(option: AperitifOption): string {
  const dateLabel = option.date
    ? new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date(`${option.date}T00:00:00`))
    : "Date mystere";

  return `${dateLabel} - ${option.time || "heure mystere"} - ${option.location}`;
}
