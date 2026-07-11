import { describe, expect, it } from "vitest";
import type { AperitifEvent } from "../types/apero";
import { buildTableeMemberStats, buildTableeTitles } from "./tableePalmares";

function makeEvent(input: {
  id: string;
  organizerName: string;
  participants: Array<{ name: string; vote: "yes" | "maybe" | "no" }>;
  messages?: Array<{ author: string; body: string }>;
}): AperitifEvent {
  return {
    id: input.id,
    ceremonialName: `Assemblée ${input.id}`,
    organizerName: input.organizerName,
    beaufLevel: "medium",
    status: "active",
    options: [{ id: "option_1", date: "2026-07-10", time: "19:00", location: "Bar" }],
    participants: input.participants.map((participant, index) => ({
      id: `participant_${input.id}_${index}`,
      participantName: participant.name,
      votes: { option_1: participant.vote },
      createdAt: "2026-07-01T00:00:00.000Z",
      updatedAt: "2026-07-01T00:00:00.000Z",
    })),
    messages: (input.messages ?? []).map((message, index) => ({
      id: `message_${input.id}_${index}`,
      authorName: message.author,
      body: message.body,
      createdAt: "2026-07-01T00:00:00.000Z",
    })),
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  };
}

const events = [
  makeEvent({
    id: "apero_1",
    organizerName: "Jojo",
    participants: [
      { name: "Jojo", vote: "yes" },
      { name: "Nadine", vote: "yes" },
      { name: "Dédé", vote: "maybe" },
    ],
    messages: [{ author: "Nadine", body: "J'amène les olives." }],
  }),
  makeEvent({
    id: "apero_2",
    organizerName: "Jojo",
    participants: [
      { name: "Jojo", vote: "yes" },
      { name: "Nadine", vote: "yes" },
      { name: "Dédé", vote: "maybe" },
    ],
    messages: [{ author: "Nadine", body: "Encore moi." }],
  }),
];

describe("buildTableeMemberStats", () => {
  it("agrège présences, convocations, hésitations et mots par blaze normalisé", () => {
    const stats = buildTableeMemberStats(events);
    const byName = new Map(stats.map((member) => [member.displayName, member]));

    expect(byName.get("Jojo")?.organizedCount).toBe(2);
    expect(byName.get("Jojo")?.presentCount).toBe(2);
    expect(byName.get("Nadine")?.presentCount).toBe(2);
    expect(byName.get("Nadine")?.messageCount).toBe(2);
    expect(byName.get("Dédé")?.maybeCount).toBe(2);
  });
});

describe("buildTableeTitles", () => {
  it("décerne les titres mérités et seulement ceux-là", () => {
    const titles = buildTableeTitles(buildTableeMemberStats(events));
    const byId = new Map(titles.map((title) => [title.id, title]));

    expect(byId.get("convocateur")?.memberName).toBe("Jojo");
    expect(byId.get("ministre")?.memberName).toBe("Dédé");
    expect(byId.get("plume")?.memberName).toBe("Nadine");
    expect(byId.get("pilier")).toBeTruthy();
  });

  it("ne décerne rien sur une tablée sans histoire", () => {
    expect(buildTableeTitles(buildTableeMemberStats([]))).toEqual([]);
  });
});
