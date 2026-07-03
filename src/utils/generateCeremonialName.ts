import type { AperitifEvent } from "../types/apero";

export const APERO_CEREMONIAL_NAMES = [
  "La Grande Tablée des Olives",
  "Le Concile du Saucisson",
  "Le Sommet des Glaçons",
  "La Bande à Zinc",
  "La Sainte Tournée",
  "Le Banquet des Gobelets",
  "Le Cercle du Petit Jaune",
  "La Réunion des Verres Qui Collent",
  "La Fine Équipe de la Chips",
  "Le Club des Tire-Bouchons",
  "La Tablée du Comptoir",
  "Le Grand Ordre du Sauciflard",
  "La Sortie Improvisée du Bar-Tabac",
  "La Table Ronde des Coudes Posés",
  "L’Académie du Dernier Pour la Route",
  "La Bande des Glaçons Fondus",
  "La Loge des Cacahuètes Salées",
  "La Fête des Chaises en Plastique",
  "La Brigade d’Honneur du Saucisson",
  "Le Symposium des Olives Molles",
];

function isActiveEvent(event: AperitifEvent): boolean {
  return event.status === "active";
}

export function getAvailableCeremonialNames(activeEvents: AperitifEvent[]): string[] {
  const usedNames = new Set(
    activeEvents.filter(isActiveEvent).map((event) => event.ceremonialName),
  );

  return APERO_CEREMONIAL_NAMES.filter((name) => !usedNames.has(name));
}

export function isCeremonialNameTaken(name: string, activeEvents: AperitifEvent[]): boolean {
  const normalizedName = name.trim().toLowerCase();

  return activeEvents
    .filter(isActiveEvent)
    .some((event) => event.ceremonialName.trim().toLowerCase() === normalizedName);
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
