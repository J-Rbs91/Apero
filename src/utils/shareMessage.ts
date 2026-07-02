import type { AperitifEvent } from "../types/apero";
import { formatOption } from "./formatOption";

export function buildShareTitle(event: AperitifEvent): string {
  return `La Confrérie du Petit Jaune — ${event.ceremonialName}`;
}

export function buildShareText(event: AperitifEvent): string {
  const lines: string[] = [];

  lines.push(`La Confrérie du Petit Jaune te convoque : « ${event.ceremonialName} »`);
  if (event.title) {
    lines.push(`Objet : ${event.title}`);
  }
  lines.push(`Convocation en bonne et due forme, signée ${event.organizerName}.`);
  lines.push("");
  lines.push(event.options.length > 1 ? "Créneaux proposés :" : "Créneau proposé :");
  for (const option of event.options) {
    lines.push(`• ${formatOption(option)}`);
  }
  lines.push("");
  lines.push(
    "Petite mousse, pinard, soft ou cacahuètes : chaque convive vient avec son carburant, mais personne, sous aucun prétexte, ne répond à sa place.",
  );
  lines.push("Dépose ta réponse :");

  return lines.join("\n");
}
