import { describe, expect, it } from "vitest";
import type { AperitifEvent } from "../types/apero";
import type { PurgedEventRecord } from "../types/rewards";
import { buildYearRecap } from "./yearRecap";

function makeEvent(input: {
  id: string;
  organizerName: string;
  date: string;
  location?: string;
  participants?: Array<{
    name: string;
    votes?: Record<string, "yes" | "maybe" | "no">;
    traquenardLevel?: number;
  }>;
}): AperitifEvent {
  return {
    id: input.id,
    ceremonialName: `Assemblée ${input.id}`,
    organizerName: input.organizerName,
    beaufLevel: "medium",
    status: "active",
    options: [
      {
        id: "option_1",
        date: input.date,
        time: "19:00",
        location: input.location ?? "Bar des Sports",
      },
    ],
    participants: (input.participants ?? []).map((participant, index) => ({
      id: `participant_${input.id}_${index}`,
      participantName: participant.name,
      votes: participant.votes ?? { option_1: "yes" },
      traquenardLevel: participant.traquenardLevel,
      createdAt: `${input.date}T10:00:00.000Z`,
      updatedAt: `${input.date}T10:00:00.000Z`,
    })),
    createdAt: `${input.date}T00:00:00.000Z`,
    updatedAt: `${input.date}T00:00:00.000Z`,
  };
}

describe("buildYearRecap", () => {
  it("compte convocations, émargements, votes et blazes croisés sur l'année", () => {
    const events = [
      makeEvent({
        id: "apero_1",
        organizerName: "Nadine",
        date: "2026-03-10",
        participants: [
          { name: "Nadine", votes: { option_1: "yes" }, traquenardLevel: 8 },
          { name: "Jojo" },
          { name: "Dédé" },
        ],
      }),
      makeEvent({
        id: "apero_2",
        organizerName: "Jojo",
        date: "2026-05-02",
        location: "Chez Dédé",
        participants: [
          { name: "Nadine", votes: { option_1: "maybe" }, traquenardLevel: 4 },
          { name: "Jojo" },
        ],
      }),
      // Hors année : ignoré.
      makeEvent({
        id: "apero_3",
        organizerName: "Nadine",
        date: "2025-12-31",
        participants: [{ name: "Nadine" }],
      }),
    ];

    const recap = buildYearRecap({ events, memberName: "nadine", year: 2026 });

    expect(recap.organizedCount).toBe(1);
    expect(recap.participatedCount).toBe(1);
    expect(recap.yesCount).toBe(1);
    expect(recap.maybeCount).toBe(1);
    expect(recap.fellowCount).toBe(2); // Jojo et Dédé
    expect(recap.averageTraquenard).toBe(6);
    expect(recap.biggestTableName).toBe("Assemblée apero_1");
    expect(recap.biggestTableSize).toBe(3);
  });

  it("choisit le lieu le plus fréquenté comme quartier général", () => {
    const events = [
      makeEvent({ id: "apero_1", organizerName: "Nadine", date: "2026-03-10", location: "Le Zinc" }),
      makeEvent({ id: "apero_2", organizerName: "Nadine", date: "2026-04-10", location: "Le Zinc" }),
      makeEvent({ id: "apero_3", organizerName: "Nadine", date: "2026-05-10", location: "Chez Dédé" }),
    ];

    const recap = buildYearRecap({ events, memberName: "Nadine", year: 2026 });
    expect(recap.favoriteLocation).toBe("Le Zinc");
    expect(recap.organizedCount).toBe(3);
  });

  it("complète avec le grand livre des purges sans doubler les apéros lisibles", () => {
    const purged: PurgedEventRecord = {
      eventId: "apero_purge",
      ceremonialName: "Le Sommet des Glaçons",
      organizerName: "Jojo",
      organizerKey: "jojo",
      status: "active",
      eventDateTime: "2026-02-01T19:00:00.000Z",
      purgedAt: "2026-02-02T08:00:00.000Z",
      participantCount: 5,
      guestCount: 4,
      hadPresentGuest: true,
      optionCount: 1,
      participantOptionCount: 0,
      hadParticipantAlternative: false,
      hadFirstShotConsensus: false,
      participants: [
        {
          participantName: "Nadine",
          participantKey: "nadine",
          voteCount: 1,
          yesCount: 1,
          maybeCount: 0,
          noCount: 0,
          bringsProvided: false,
          commentProvided: false,
          proposedOptionCount: 0,
        },
        {
          participantName: "Momo",
          participantKey: "momo",
          voteCount: 1,
          yesCount: 1,
          maybeCount: 0,
          noCount: 0,
          bringsProvided: false,
          commentProvided: false,
          proposedOptionCount: 0,
        },
      ],
    };

    const stillReadable = makeEvent({
      id: "apero_purge",
      organizerName: "Jojo",
      date: "2026-02-01",
      participants: [{ name: "Nadine" }],
    });

    const withDouble = buildYearRecap({
      events: [stillReadable],
      purgedEvents: [purged],
      memberName: "Nadine",
      year: 2026,
    });
    // L'apéro encore lisible prime : pas de double comptage.
    expect(withDouble.participatedCount).toBe(1);

    const archivesOnly = buildYearRecap({
      events: [],
      purgedEvents: [purged],
      memberName: "Nadine",
      year: 2026,
    });
    expect(archivesOnly.participatedCount).toBe(1);
    expect(archivesOnly.yesCount).toBe(1);
    expect(archivesOnly.fellowCount).toBe(1); // Momo
    expect(archivesOnly.biggestTableSize).toBe(5);
  });

  it("rend un bilan vide sans blaze ou sans activité", () => {
    const recap = buildYearRecap({ events: [], memberName: "  ", year: 2026 });
    expect(recap.organizedCount).toBe(0);
    expect(recap.participatedCount).toBe(0);
    expect(recap.averageTraquenard).toBeNull();
  });
});
