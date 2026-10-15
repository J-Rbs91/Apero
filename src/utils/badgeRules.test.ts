import { describe, expect, it } from "vitest";
import type { AperitifEvent, VoteStatus } from "../types/apero";
import type { PurgedEventRecord, RewardsLedger } from "../types/rewards";
import { getMemberBadgeIds, getOrganizerBadgeAwards, hasEarnedAffranchi, hasFirstShotConsensus } from "./badgeRules";

function createEvent(options: AperitifEvent["options"], votes: Array<Record<string, VoteStatus>>): AperitifEvent {
  return {
    id: "apero_test",
    ceremonialName: "Le Concile du Saucisson",
    organizerName: "J\u00e9r\u00e9my",
    beaufLevel: "medium",
    status: "active",
    options,
    participants: votes.map((participantVotes, index) => ({
      id: "participant_" + index,
      participantName: "Convive " + index,
      votes: participantVotes,
      createdAt: "2026-06-30T18:00:00.000Z",
      updatedAt: "2026-06-30T18:00:00.000Z",
    })),
    createdAt: "2026-06-30T18:00:00.000Z",
    updatedAt: "2026-06-30T18:00:00.000Z",
  };
}

const organizerOption = {
  id: "option_1",
  date: "2026-07-04",
  time: "19:30",
  location: "Le Bar du Coin",
  createdByRole: "organizer" as const,
  createdByName: "J\u00e9r\u00e9my",
};

describe("badge rules", () => {
  it("awards first shot consensus to the organizer", () => {
    const event = createEvent([organizerOption], [
      { option_1: "yes" },
      { option_1: "yes" },
    ]);

    expect(hasFirstShotConsensus(event)).toBe(true);
    expect(getOrganizerBadgeAwards(event)).toEqual([
      {
        badgeId: "FIRST_SHOT_CONSENSUS",
        memberName: "J\u00e9r\u00e9my",
        eventId: "apero_test",
      },
    ]);
  });

  it("does not award it when a participant adds an alternative", () => {
    const event = createEvent(
      [
        organizerOption,
        {
          id: "option_2",
          date: "2026-07-05",
          time: "20:00",
          location: "Autre bar",
          createdByRole: "participant",
          createdByName: "Thomas",
        },
      ],
      [{ option_1: "yes" }],
    );

    expect(hasFirstShotConsensus(event)).toBe(false);
  });

  it("does not award it when a participant is reserved", () => {
    const event = createEvent([organizerOption], [
      { option_1: "yes" },
      { option_1: "maybe" },
    ]);

    expect(hasFirstShotConsensus(event)).toBe(false);
  });

  it("treats legacy options without role as organizer options", () => {
    const event = createEvent(
      [{ id: "option_1", date: "2026-07-04", time: "19:30", location: "Le Bar du Coin" }],
      [{ option_1: "yes" }],
    );

    expect(hasFirstShotConsensus(event)).toBe(true);
  });
});

function createLedger(purgedEvents: PurgedEventRecord[] = []): RewardsLedger {
  return {
    version: 1,
    updatedAt: "2026-06-30T18:00:00.000Z",
    purgedEvents,
    members: {},
  };
}

function createNamedEvent(input: {
  id: string;
  organizerName: string;
  createdAt: string;
  participants: Array<{ name: string; createdAt: string }>;
}): AperitifEvent {
  return {
    id: input.id,
    ceremonialName: "Le Sommet des Glaçons",
    organizerName: input.organizerName,
    beaufLevel: "medium",
    status: "active",
    options: [organizerOption],
    participants: input.participants.map((participant, index) => ({
      id: `participant_${input.id}_${index}`,
      participantName: participant.name,
      votes: { option_1: "yes" as VoteStatus },
      createdAt: participant.createdAt,
      updatedAt: participant.createdAt,
    })),
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
  };
}

describe("badge Affranchi", () => {
  it("récompense un convive qui organise après avoir été invité", () => {
    const activeEvents = [
      createNamedEvent({
        id: "apero_invitation",
        organizerName: "Jérémy",
        createdAt: "2026-06-01T18:00:00.000Z",
        participants: [{ name: "Nadine", createdAt: "2026-06-02T18:00:00.000Z" }],
      }),
      createNamedEvent({
        id: "apero_revanche",
        organizerName: "Nadine",
        createdAt: "2026-06-10T18:00:00.000Z",
        participants: [],
      }),
    ];

    const context = { activeEvents, ledger: createLedger(), memberName: "Nadine" };
    expect(hasEarnedAffranchi(context)).toBe(true);
    expect(getMemberBadgeIds(context)).toContain("AFFRANCHI");
  });

  it("ne récompense pas celui qui a organisé avant toute invitation", () => {
    const activeEvents = [
      createNamedEvent({
        id: "apero_pionnier",
        organizerName: "Nadine",
        createdAt: "2026-06-01T18:00:00.000Z",
        participants: [],
      }),
      createNamedEvent({
        id: "apero_retour",
        organizerName: "Jérémy",
        createdAt: "2026-06-10T18:00:00.000Z",
        participants: [{ name: "Nadine", createdAt: "2026-06-11T18:00:00.000Z" }],
      }),
    ];

    expect(
      hasEarnedAffranchi({ activeEvents, ledger: createLedger(), memberName: "Nadine" }),
    ).toBe(false);
  });

  it("ne récompense pas un simple convive qui n'a jamais organisé", () => {
    const activeEvents = [
      createNamedEvent({
        id: "apero_invitation",
        organizerName: "Jérémy",
        createdAt: "2026-06-01T18:00:00.000Z",
        participants: [{ name: "Nadine", createdAt: "2026-06-02T18:00:00.000Z" }],
      }),
    ];

    expect(
      hasEarnedAffranchi({ activeEvents, ledger: createLedger(), memberName: "Nadine" }),
    ).toBe(false);
  });

  it("retrouve l'invitation d'origine dans le grand livre des purges", () => {
    const purgedRecord: PurgedEventRecord = {
      eventId: "apero_purge",
      ceremonialName: "La Grande Tablée des Olives",
      organizerName: "Jérémy",
      organizerKey: "jeremy",
      status: "active",
      eventDateTime: "2026-05-15T19:00:00.000Z",
      purgedAt: "2026-05-16T08:00:00.000Z",
      participantCount: 2,
      guestCount: 1,
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
      ],
    };

    const activeEvents = [
      createNamedEvent({
        id: "apero_revanche",
        organizerName: "Nadine",
        createdAt: "2026-06-10T18:00:00.000Z",
        participants: [],
      }),
    ];

    expect(
      hasEarnedAffranchi({
        activeEvents,
        ledger: createLedger([purgedRecord]),
        memberName: "Nadine",
      }),
    ).toBe(true);
  });
});
