import type { AperitifEvent } from "../types/apero";
import { formatOption } from "./formatOption";

export function buildShareTitle(event: AperitifEvent): string {
  return `La Confrérie du Petit Jaune — ${event.ceremonialName}`;
}

export function buildShareText(event: AperitifEvent): string {
  const lines: string[] = [];

  lines.push(`${event.organizerName} t’invite à « ${event.ceremonialName} » !`);
  if (event.title) {
    lines.push(`Au programme : ${event.title}`);
  }
  lines.push("");
  lines.push(event.options.length > 1 ? "Créneaux proposés :" : "Créneau proposé :");
  for (const option of event.options) {
    lines.push(`• ${formatOption(option)}`);
  }
  lines.push("");
  lines.push(
    "Petite mousse, pinard, soft ou cacahuètes : chaque convive vient avec son carburant, mais personne, sous aucun prétexte, ne répond à sa place.",
  );
  lines.push("Réponds ici :");

  return lines.join("\n");
}
