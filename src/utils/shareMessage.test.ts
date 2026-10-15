import { describe, expect, it } from "vitest";
import type { AperitifEvent } from "../types/apero";
import { buildReminderText, buildShareText } from "./shareMessage";

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

describe("buildReminderText", () => {
  it("récapitule l'état du registre, créneau en tête compris", () => {
    const event = baseEvent({
      participants: [
        {
          id: "participant_1",
          participantName: "Jojo",
          votes: { option_1: "yes" },
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
        {
          id: "participant_2",
          participantName: "Nadine",
          votes: { option_1: "maybe" },
          createdAt: "2026-07-02T00:00:00.000Z",
          updatedAt: "2026-07-02T00:00:00.000Z",
        },
        {
          id: "participant_3",
          participantName: "Dédé",
          votes: { option_1: "no" },
          createdAt: "2026-07-02T00:00:00.000Z",
          updatedAt: "2026-07-02T00:00:00.000Z",
        },
      ],
    });

    const text = buildReminderText(event);
    expect(text).toContain("Jojo sonne le rappel pour « Le Concile du Saucisson » !");
    expect(text).toContain("1 présence, 1 hésitation, 1 désertion.");
    expect(text).toContain("Créneau en tête :");
    expect(text).toContain("Bar des Sports");
    expect(text).toContain("Réponds ici :");
  });

  it("accorde les pluriels et se passe de créneau en tête sans vainqueur", () => {
    const event = baseEvent({
      options: [
        { id: "option_1", date: "2026-07-10", time: "19:00", location: "Bar des Sports" },
        { id: "option_2", date: "2026-07-11", time: "19:00", location: "Chez Dédé" },
      ],
      participants: [
        {
          id: "participant_1",
          participantName: "Jojo",
          votes: { option_1: "yes", option_2: "no" },
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
        {
          id: "participant_2",
          participantName: "Nadine",
          votes: { option_1: "no", option_2: "yes" },
          createdAt: "2026-07-02T00:00:00.000Z",
          updatedAt: "2026-07-02T00:00:00.000Z",
        },
      ],
    });

    const text = buildReminderText(event);
    expect(text).toContain("2 présences, 0 hésitation, 0 désertion.");
    // Égalité parfaite entre les deux créneaux : pas de vainqueur à annoncer.
    expect(text).not.toContain("Créneau en tête :");
  });
});
