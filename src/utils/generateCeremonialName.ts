import type { AperitifEvent } from "../types/apero";

export const APERO_CEREMONIAL_NAMES = [
  "Assemblée",
  "Réunion",
  "Tournée",
  "Séance",
  "Cercle",
  "Conseil",
  "Comité",
  "Rencontre",
  "Soirée",
  "Table",
  "Session",
  "Rendez-vous",
];

function isActiveEvent(event: AperitifEvent): boolean {
  return event.status === "active";
}

// Même clé de comparaison pour la disponibilité et l'unicité : sans elle, un
// apéro nommé « séance » ne retirerait pas « Séance » du tirage, et l'app générerait un nom qu'elle juge déjà pris.
function normalizeCeremonialName(name: string): string {
  return name.trim().toLowerCase();
}

export function getAvailableCeremonialNames(activeEvents: AperitifEvent[]): string[] {
  const usedNames = new Set(
    activeEvents
      .filter(isActiveEvent)
      .map((event) => normalizeCeremonialName(event.ceremonialName)),
  );

  return APERO_CEREMONIAL_NAMES.filter(
    (name) => !usedNames.has(normalizeCeremonialName(name)),
  );
}

export function isCeremonialNameTaken(name: string, activeEvents: AperitifEvent[]): boolean {
  const normalizedName = normalizeCeremonialName(name);

  return activeEvents
    .filter(isActiveEvent)
    .some((event) => normalizeCeremonialName(event.ceremonialName) === normalizedName);
}

// Variante pour le flux chiffré (mode api-vps) : impossible de lister les
// apéros existants (ils sont chiffrés), donc pas de garantie
// d'unicité — l'identifiant unique reste l'aperoId, le nom n'est que décorum.
export function pickRandomCeremonialName(): string {
  const randomIndex = Math.floor(Math.random() * APERO_CEREMONIAL_NAMES.length);
  return APERO_CEREMONIAL_NAMES[randomIndex];
}

export function generateUniqueCeremonialName(activeEvents: AperitifEvent[]): string {
  const availableNames = getAvailableCeremonialNames(activeEvents);

  if (availableNames.length === 0) {
    throw new Error("NO_CEREMONIAL_NAME_AVAILABLE");
  }

  const randomIndex = Math.floor(Math.random() * availableNames.length);
  return availableNames[randomIndex];
}
