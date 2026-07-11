import type { AperitifEvent } from "../types/apero";
import { calculateBestOptions } from "./calculateResults";
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

// Réponse globale d'un convive, créneau par créneau : présent dès qu'un
// « oui » existe, hésitant s'il ne reste que du « peut-être », déserteur sinon.
function summarizeVotes(event: AperitifEvent): { yes: number; maybe: number; no: number } {
  return event.participants.reduce(
    (counts, participant) => {
      const votes = Object.values(participant.votes ?? {});
      if (votes.some((vote) => vote === "yes")) {
        counts.yes += 1;
      } else if (votes.some((vote) => vote === "maybe")) {
        counts.maybe += 1;
      } else if (votes.length > 0) {
        counts.no += 1;
      }
      return counts;
    },
    { yes: 0, maybe: 0, no: 0 },
  );
}

function plural(count: number, singular: string, pluralForm: string): string {
  return count > 1 ? pluralForm : singular;
}

/**
 * Message de relance envoyé par l'organisateur : l'état du registre en guise
 * d'aiguillon, pour rappeler à la tablée que le zinc attend les retardataires.
 */
export function buildReminderText(event: AperitifEvent): string {
  const counts = summarizeVotes(event);
  const result = calculateBestOptions(event);
  const winnerOption =
    result.type === "winner"
      ? event.options.find((option) => option.id === result.optionId)
      : undefined;

  const lines: string[] = [];
  lines.push(`${event.organizerName} sonne le rappel pour « ${event.ceremonialName} » !`);
  lines.push("");
  lines.push(
    `Au registre pour l’instant : ${counts.yes} ${plural(counts.yes, "présence", "présences")}, ` +
      `${counts.maybe} ${plural(counts.maybe, "hésitation", "hésitations")}, ` +
      `${counts.no} ${plural(counts.no, "désertion", "désertions")}.`,
  );
  if (winnerOption) {
    lines.push(`Créneau en tête : ${formatOption(winnerOption)}`);
  }
  lines.push("");
  lines.push(
    "Celles et ceux qui n’ont pas encore émargé se reconnaîtront. Le zinc ne juge pas, il note. Réponds ici :",
  );

  return lines.join("\n");
}
