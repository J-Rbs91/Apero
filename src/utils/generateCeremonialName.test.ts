import { describe, expect, it, vi } from "vitest";
import type { AperitifEvent } from "../types/apero";
import {
  APERO_CEREMONIAL_NAMES,
  generateUniqueCeremonialName,
  getAvailableCeremonialNames,
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
    expect(availableNames).toHaveLength(29);
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
});
