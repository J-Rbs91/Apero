import type { AperitifEvent } from "../types/apero";
import { calculateBestOptions } from "./calculateResults";
import { formatOption } from "./formatOption";

export function buildShareTitle(event: AperitifEvent): string {
  return `La Confrérie du Petit Jaune : ${event.ceremonialName}`;
}

export function buildShareText(event: AperitifEvent): string {
  const lines: string[] = [];

  lines.push(`Apéro : ${event.ceremonialName}`);
  lines.push(`Hôte : ${event.organizerName}`);
  if (event.title) {
    lines.push(event.title);
  }
  lines.push("");
  lines.push(event.options.length > 1 ? "Créneaux :" : "Créneau :");
  for (const option of event.options) {
    lines.push(`• ${formatOption(option)}`);
  }
  lines.push("");
  if (event.childrenAllowed != null) {
    lines.push(event.childrenAllowed ? "Enfants bienvenus" : "Sans enfants");
    lines.push("");
  }
  lines.push("Répondre :");

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
  lines.push(`Relance : ${event.ceremonialName}`);
  lines.push("");
  lines.push(`${counts.yes} oui, ${counts.maybe} peut-être, ${counts.no} non.`);
  if (winnerOption) {
    lines.push(`En tête : ${formatOption(winnerOption)}`);
  }
  lines.push("");
  lines.push("Répondre :");

  return lines.join("\n");
}
