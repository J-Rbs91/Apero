import { describe, expect, it } from "vitest";
import type { AperitifEvent } from "../types/apero";
import { buildShareText } from "./shareMessage";

function baseEvent(overrides: Partial<AperitifEvent> = {}): AperitifEvent {
  return {
    id: "apero_test1",
    ceremonialName: "Le Concile du Saucisson",
    organizerName: "Jojo",
    beaufLevel: "medium",
    status: "active",
    options: [
      { id: "option_1", date: "2026-07-10", time: "19:00", location: "Bar des Sports" },
    ],
    participants: [],
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildShareText", () => {
  it("annonce que les mioches sont conviés", () => {
    const text = buildShareText(baseEvent({ childrenAllowed: true }));
    expect(text).toContain("Les chiards sont de la partie");
    expect(text).not.toContain("Pas de mioches");
  });

  it("annonce que les mioches restent au bercail", () => {
    const text = buildShareText(baseEvent({ childrenAllowed: false }));
    expect(text).toContain("Pas de mioches ce coup-ci");
    expect(text).not.toContain("Les chiards sont de la partie");
  });

  it("n’évoque pas les mioches quand la politique n’est pas définie", () => {
    const text = buildShareText(baseEvent());
    expect(text).not.toContain("mioches");
    expect(text).not.toContain("chiards");
  });
});
