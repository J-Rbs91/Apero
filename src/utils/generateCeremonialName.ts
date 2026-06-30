import type { AperitifEvent } from "../types/apero";

export const APERO_CEREMONIAL_NAMES = [
  "La Grande Tablée des Olives",
  "Le Concile du Saucisson",
  "Le Sommet des Glaçons",
  "L’Assemblée du Zinc",
  "Le Conseil des Cacahuètes",
  "La Sainte Tournée",
  "Le Banquet des Gobelets",
  "Le Cercle du Petit Jaune",
  "La Réunion des Verres Qui Collent",
  "Le Haut Comité de la Chips",
  "La Chambre des Tire-Bouchons",
  "Le Synode du Comptoir",
  "La Commission des Nappes Collantes",
  "Le Tribunal de l’Olive Verte",
  "Le Grand Ordre du Sauciflard",
  "La Session Extraordinaire du Bar-Tabac",
  "Le Bureau des Affaires Apéritives",
  "La Table Ronde des Coudes Posés",
  "Le Ministère du Fond de Verre",
  "L’Académie du Dernier Pour la Route",
  "Le Directoire des Glaçons Fondus",
  "La Loge des Cacahuètes Salées",
  "Le Conseil Constitutionnel du Pastaga",
  "La Conférence des Chaises en Plastique",
  "Le Sénat du Paquet de Chips",
  "La Cour Suprême du Tire-Bouchon",
  "Le Cercle Diplomatique du Comptoir",
  "La Brigade d’Honneur du Saucisson",
  "Le Symposium des Olives Molles",
  "La Grande Chancellerie du Verre Ballon",
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

export function generateUniqueCeremonialName(activeEvents: AperitifEvent[]): string {
  const availableNames = getAvailableCeremonialNames(activeEvents);

  if (availableNames.length === 0) {
    throw new Error("NO_CEREMONIAL_NAME_AVAILABLE");
  }

  const randomIndex = Math.floor(Math.random() * availableNames.length);
  return availableNames[randomIndex];
}
