import { describe, expect, it } from "vitest";
import type { AperitifEvent, VoteStatus } from "../types/apero";
import { calculateBestOptions } from "./calculateResults";

function createEvent(votes: Array<Record<string, VoteStatus>>): AperitifEvent {
  return {
    id: "apero_test",
    title: "Apero test",
    organizerName: "Jojo",
    beaufLevel: "medium",
    options: [
      { id: "option_1", date: "2026-07-03", time: "19:00", location: "Bar des Sports" },
      { id: "option_2", date: "2026-07-04", time: "18:30", location: "Chez Dede" },
    ],
    participants: votes.map((participantVotes, index) => ({
      id: `participant_${index}`,
      participantName: `Copain ${index}`,
      votes: participantVotes,
      createdAt: "2026-06-30T18:00:00.000Z",
      updatedAt: "2026-06-30T18:00:00.000Z",
    })),
    createdAt: "2026-06-30T18:00:00.000Z",
    updatedAt: "2026-06-30T18:00:00.000Z",
  };
}

describe("calculateBestOptions", () => {
  it("selects the option with the most yes votes", () => {
    const result = calculateBestOptions(
      createEvent([
        { option_1: "yes", option_2: "no" },
        { option_1: "yes", option_2: "yes" },
        { option_1: "maybe", option_2: "no" },
      ]),
    );

    expect(result.type).toBe("winner");
    expect(result.type === "winner" ? result.optionId : null).toBe("option_1");
  });

  it("uses maybe votes to break yes ties", () => {
    const result = calculateBestOptions(
      createEvent([
        { option_1: "yes", option_2: "yes" },
        { option_1: "maybe", option_2: "no" },
      ]),
    );

    expect(result.type).toBe("winner");
    expect(result.type === "winner" ? result.optionId : null).toBe("option_1");
  });

  it("keeps multiple winners when scores are perfectly tied", () => {
    const result = calculateBestOptions(
      createEvent([
        { option_1: "yes", option_2: "yes" },
        { option_1: "maybe", option_2: "maybe" },
      ]),
    );

    expect(result.type).toBe("tie");
    expect(result.type === "tie" ? result.optionIds : []).toEqual([
      "option_1",
      "option_2",
    ]);
  });

  it("returns no availability when every vote is no", () => {
    const result = calculateBestOptions(
      createEvent([
        { option_1: "no", option_2: "no" },
        { option_1: "no", option_2: "no" },
      ]),
    );

    expect(result.type).toBe("no-availability");
  });
});
