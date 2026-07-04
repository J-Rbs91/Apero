import { describe, expect, it } from "vitest";
import type { AperitifEvent, AperitifOption } from "../types/apero";
import { appendEventOption, normalizeEvent } from "./eventNormalization";

function createEvent(id: string, option: AperitifOption): AperitifEvent {
  return {
    id,
    ceremonialName: "Assembl?e " + id,
    organizerName: "Jojo",
    beaufLevel: "medium",
    status: "active",
    options: [option],
    participants: [],
    createdAt: "2026-06-30T18:00:00.000Z",
    updatedAt: "2026-06-30T18:00:00.000Z",
  };
}

describe("event normalization", () => {
  it("marks legacy options as organizer options", () => {
    const event = normalizeEvent({
      id: "apero_test1",
      ceremonialName: "Le Concile du Saucisson",
      organizerName: "Jojo",
      options: [
        { id: "option_1", date: "2026-07-03", time: "19:00", location: "Bar des Sports" },
      ],
      participants: [],
      createdAt: "2026-06-30T18:00:00.000Z",
      updatedAt: "2026-06-30T18:00:00.000Z",
    });

    expect(event.options[0].createdByRole).toBe("organizer");
    expect(event.options[0].createdByName).toBe("Jojo");
  });

  it("adds a participant option only to the current event", () => {
    const firstEvent = createEvent("apero_test_1", {
      id: "option_a",
      date: "2026-07-03",
      time: "19:00",
      location: "Bar A",
    });
    const secondEvent = createEvent("apero_test_2", {
      id: "option_b",
      date: "2026-07-04",
      time: "18:30",
      location: "Bar B",
    });

    const updatedFirstEvent = appendEventOption(firstEvent, {
      id: "option_c",
      date: "2026-07-05",
      time: "20:00",
      location: "Bar C",
      createdByRole: "participant",
      createdByName: "Nadine",
      createdAt: "2026-06-30T19:00:00.000Z",
    });

    expect(updatedFirstEvent.options.map((option) => option.id)).toEqual([
      "option_a",
      "option_c",
    ]);
    expect(secondEvent.options.map((option) => option.id)).toEqual(["option_b"]);
  });

  it("marks the proposer as available on the slot they created", () => {
    const event = createEvent("apero_test_3", {
      id: "option_a",
      date: "2026-07-03",
      time: "19:00",
      location: "Bar A",
    });

    const updated = appendEventOption(event, {
      id: "option_c",
      date: "2026-07-05",
      time: "20:00",
      location: "Bar C",
      createdByRole: "participant",
      createdByName: "  Nadine   Diabolo ",
      createdAt: "2026-06-30T19:00:00.000Z",
    });

    expect(updated.participants).toHaveLength(1);
    expect(updated.participants[0].participantName).toBe("Nadine Diabolo");
    expect(updated.participants[0].votes).toEqual({ option_c: "yes" });
  });

  it("adds the yes vote to an existing participant without erasing prior votes", () => {
    const event = createEvent("apero_test_4", {
      id: "option_a",
      date: "2026-07-03",
      time: "19:00",
      location: "Bar A",
    });
    event.participants = [
      {
        id: "participant_1",
        participantName: "Nadine",
        votes: { option_a: "no" },
        createdAt: "2026-06-30T18:30:00.000Z",
        updatedAt: "2026-06-30T18:30:00.000Z",
      },
    ];

    const updated = appendEventOption(event, {
      id: "option_c",
      date: "2026-07-05",
      time: "20:00",
      location: "Bar C",
      createdByRole: "participant",
      createdByName: "nadine",
      createdAt: "2026-06-30T19:00:00.000Z",
    });

    expect(updated.participants).toHaveLength(1);
    expect(updated.participants[0].id).toBe("participant_1");
    expect(updated.participants[0].votes).toEqual({
      option_a: "no",
      option_c: "yes",
    });
  });

  it("leaves participants untouched when the option has no proposer name", () => {
    const event = createEvent("apero_test_5", {
      id: "option_a",
      date: "2026-07-03",
      time: "19:00",
      location: "Bar A",
    });

    const updated = appendEventOption(event, {
      id: "option_c",
      date: "2026-07-05",
      time: "20:00",
      location: "Bar C",
    });

    expect(updated.participants).toEqual([]);
  });
});
