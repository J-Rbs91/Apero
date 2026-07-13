import { describe, expect, it, vi } from "vitest";
import type { AperitifEvent } from "../types/apero";
import {
  APERO_CEREMONIAL_NAMES,
  generateUniqueCeremonialName,
  getAvailableCeremonialNames,
  isCeremonialNameTaken,
} from "./generateCeremonialName";

function createActiveEvent(ceremonialName: string, status: AperitifEvent["status"] = "active"): AperitifEvent {
  return {
    id: `apero_${ceremonialName}`,
    ceremonialName,
    organizerName: "Jojo",
    beaufLevel: "medium",
    status,
    options: [],
    participants: [],
    createdAt: "2026-06-30T18:00:00.000Z",
    updatedAt: "2026-06-30T18:00:00.000Z",
  };
}

describe("ceremonial name generation", () => {
  it("returns only unused names for active events", () => {
    const usedName = APERO_CEREMONIAL_NAMES[0];
    const availableNames = getAvailableCeremonialNames([
      createActiveEvent(usedName),
      createActiveEvent(APERO_CEREMONIAL_NAMES[1], "closed"),
    ]);

    expect(availableNames).not.toContain(usedName);
    expect(availableNames).toContain(APERO_CEREMONIAL_NAMES[1]);
    expect(availableNames).toHaveLength(19);
  });

  it("generates a name that is not already used", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const generatedName = generateUniqueCeremonialName([
      createActiveEvent(APERO_CEREMONIAL_NAMES[0]),
    ]);

    expect(generatedName).toBe(APERO_CEREMONIAL_NAMES[1]);
    vi.restoreAllMocks();
  });

  it("throws when every ceremonial name is already used", () => {
    const activeEvents = APERO_CEREMONIAL_NAMES.map((name) => createActiveEvent(name));

    expect(() => generateUniqueCeremonialName(activeEvents)).toThrow(
      "NO_CEREMONIAL_NAME_AVAILABLE",
    );
  });

  it("shares the same normalization as isCeremonialNameTaken (case/whitespace)", () => {
    // Un apéro actif nommé en minuscules doit retirer le nom canonique du
    // tirage : sinon l'app générerait un nom qu'elle juge elle-même déjà pris.
    const activeEvents = [createActiveEvent(`  ${APERO_CEREMONIAL_NAMES[0].toLowerCase()}  `)];
    const availableNames = getAvailableCeremonialNames(activeEvents);

    expect(availableNames).not.toContain(APERO_CEREMONIAL_NAMES[0]);
    for (const name of availableNames) {
      expect(isCeremonialNameTaken(name, activeEvents)).toBe(false);
    }
  });
});

describe("isCeremonialNameTaken", () => {
  it("returns true when an active event already uses the name (case/whitespace-insensitive)", () => {
    const activeEvents = [createActiveEvent("La Grande Tablée des Olives")];

    expect(isCeremonialNameTaken("la grande tablée des olives", activeEvents)).toBe(true);
    expect(isCeremonialNameTaken("  La Grande Tablée des Olives  ", activeEvents)).toBe(true);
  });

  it("ignores names used only by inactive events", () => {
    const activeEvents = [createActiveEvent("Le Concile du Saucisson", "closed")];

    expect(isCeremonialNameTaken("Le Concile du Saucisson", activeEvents)).toBe(false);
  });

  it("returns false for an unused name", () => {
    expect(isCeremonialNameTaken("Un nom inédit", [createActiveEvent("Autre nom")])).toBe(false);
  });
});
