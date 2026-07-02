import { describe, expect, it } from "vitest";
import type { AperitifEvent, VoteStatus } from "../types/apero";
import { getOrganizerBadgeAwards, hasFirstShotConsensus } from "./badgeRules";

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
