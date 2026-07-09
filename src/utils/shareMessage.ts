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
  if (event.childrenAllowed != null) {
    lines.push(
      event.childrenAllowed
        ? "Les chiards sont de la partie — ramène la portée, y’a du sirop pour tout le monde."
        : "Pas de mioches ce coup-ci : on trinque entre adultes vaccinés.",
    );
    lines.push("");
  }
  lines.push(
    "Nous ne présumons rien, ni l’endroit, ni le contenu du verre. Qu’il s’agisse d’une terrasse, d’un zinc ou d’un trottoir, chacun s’abreuve selon sa conscience et sa constitution. La nature exacte de ton breuvage relève d’une intimité que nous nous garderons bien de sonder. L’essentiel se résume à ceci : ta présence n’engage que toi, et il serait fort malvenu qu’un tiers en dispose à ta place.",
  );
  lines.push("Réponds ici :");

  return lines.join("\n");
}
