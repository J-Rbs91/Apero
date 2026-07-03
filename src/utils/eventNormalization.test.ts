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
});
