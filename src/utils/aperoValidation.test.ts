import { describe, expect, it } from "vitest";
import type { AperitifEvent } from "../types/apero";
import { AperoValidationError, sanitizeAperoEvent } from "./aperoValidation";

function validEvent(overrides: Partial<AperitifEvent> = {}): AperitifEvent {
  return {
    id: "apero_test1",
    ceremonialName: "  Le Concile du Saucisson  ",
    organizerName: "  Jojo  ",
    beaufLevel: "medium",
    status: "active",
    options: [
      {
        id: "option_1",
        date: "2026-07-10",
        time: "19:00",
        location: "  Bar des Sports  ",
      },
    ],
    participants: [
      {
        id: "participant_1",
        participantName: "  Nadine  ",
        votes: { option_1: "yes" },
        comment: "  Present sans HTML <script>alert(1)</script>  ",
        createdAt: "2026-07-01T00:00:00.000Z",
        updatedAt: "2026-07-01T00:00:00.000Z",
      },
    ],
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("sanitizeAperoEvent", () => {
  it("normalise les espaces et conserve les champs attendus", () => {
    const event = sanitizeAperoEvent(validEvent(), "apero_test1");

    expect(event.ceremonialName).toBe("Le Concile du Saucisson");
    expect(event.organizerName).toBe("Jojo");
    expect(event.options[0].location).toBe("Bar des Sports");
    expect(event.participants[0].participantName).toBe("Nadine");
  });

  it("rejette un vote sur un creneau inconnu", () => {
    const event = validEvent({
      participants: [
        {
          id: "participant_1",
          participantName: "Nadine",
          votes: { option_intruse: "yes" },
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
    });

    expect(() => sanitizeAperoEvent(event)).toThrow(AperoValidationError);
  });

  it("rejette les textes trop longs", () => {
    const event = validEvent({ organizerName: "x".repeat(81) });
    expect(() => sanitizeAperoEvent(event)).toThrow(AperoValidationError);
  });

  it("conserve la politique mioches (true comme false)", () => {
    const admise = sanitizeAperoEvent(validEvent({ childrenAllowed: true }));
    expect(admise.childrenAllowed).toBe(true);

    const sansMioches = sanitizeAperoEvent(validEvent({ childrenAllowed: false }));
    expect(sansMioches.childrenAllowed).toBe(false);

    const nonPrecise = sanitizeAperoEvent(validEvent());
    expect(nonPrecise.childrenAllowed).toBeUndefined();
  });

  it("rejette une politique mioches non booleenne", () => {
    const event = validEvent({ childrenAllowed: "oui" as unknown as boolean });
    expect(() => sanitizeAperoEvent(event)).toThrow(AperoValidationError);
  });

  it("conserve le nombre de renforts d'un convive", () => {
    const event = sanitizeAperoEvent(
      validEvent({
        participants: [
          {
            id: "participant_1",
            participantName: "Nadine",
            votes: { option_1: "yes" },
            companions: 3,
            createdAt: "2026-07-01T00:00:00.000Z",
            updatedAt: "2026-07-01T00:00:00.000Z",
          },
        ],
      }),
    );

    expect(event.participants[0].companions).toBe(3);
  });

  it("rejette un nombre de renforts hors bornes ou non entier", () => {
    const tropDeMonde = validEvent({
      participants: [
        {
          id: "participant_1",
          participantName: "Nadine",
          votes: { option_1: "yes" },
          companions: 999,
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
    });
    expect(() => sanitizeAperoEvent(tropDeMonde)).toThrow(AperoValidationError);

    const demiConvive = validEvent({
      participants: [
        {
          id: "participant_1",
          participantName: "Nadine",
          votes: { option_1: "yes" },
          companions: 1.5,
          createdAt: "2026-07-01T00:00:00.000Z",
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
      ],
    });
    expect(() => sanitizeAperoEvent(demiConvive)).toThrow(AperoValidationError);
  });
});
