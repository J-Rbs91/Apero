import { describe, expect, it } from "vitest";
import type { AperitifEvent, AperitifOption, ParticipantResponse } from "../types/apero";
import { appendEventMessage, appendEventOption, normalizeEvent, toggleOptionCheer, upsertParticipant } from "./eventNormalization";
import { AperoValidationError } from "./aperoValidation";

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

  it("merges a re-vote that differs only by accents or casing", () => {
    const event = createEvent("apero_test_dedup", {
      id: "option_a",
      date: "2026-07-03",
      time: "19:00",
      location: "Bar A",
    });

    const base: Omit<ParticipantResponse, "participantName"> = {
      id: "participant_1",
      votes: { option_a: "yes" },
      createdAt: "2026-06-30T19:00:00.000Z",
      updatedAt: "2026-06-30T19:00:00.000Z",
    };

    const withJose = upsertParticipant(event, { ...base, participantName: "José" });
    const withJoseAgain = upsertParticipant(withJose, {
      ...base,
      id: "participant_2",
      participantName: "jose",
      votes: { option_a: "no" },
    });

    expect(withJoseAgain.participants).toHaveLength(1);
    // L'identité d'origine est conservée, mais le vote est bien mis à jour.
    expect(withJoseAgain.participants[0].id).toBe("participant_1");
    expect(withJoseAgain.participants[0].votes.option_a).toBe("no");
  });

  it("rejects hostile decrypted content with a validation error, not a TypeError", () => {
    expect(() => normalizeEvent("not an object")).toThrow(AperoValidationError);
    expect(() => normalizeEvent(42)).toThrow(AperoValidationError);
    // options/participants qui ne sont pas des tableaux : ne doit pas lancer
    // de TypeError brute sur .map, mais une AperoValidationError propre.
    expect(() =>
      normalizeEvent({ id: "apero_hostile", options: { foo: 1 }, participants: "nope" }),
    ).toThrow(AperoValidationError);
  });
});

describe("toggleOptionCheer", () => {
  const cheerEvent = createEvent("apero_cheer", {
    id: "option_a",
    date: "2026-07-03",
    time: "19:00",
    location: "Bar A",
  });

  it("lève puis repose le verre d'un convive", () => {
    const cheered = toggleOptionCheer(cheerEvent, "option_a", "Nadine");
    expect(cheered.options[0].cheers).toEqual(["Nadine"]);

    const uncheered = toggleOptionCheer(cheered, "option_a", "Nadine");
    expect(uncheered.options[0].cheers).toBeUndefined();
  });

  it("déduplique par nom normalisé (accents, casse, espaces)", () => {
    const cheered = toggleOptionCheer(cheerEvent, "option_a", "José");
    const toggledBack = toggleOptionCheer(cheered, "option_a", "  jose ");
    expect(toggledBack.options[0].cheers).toBeUndefined();
  });

  it("ne touche pas aux autres créneaux ni aux noms vides", () => {
    const twoOptions = {
      ...cheerEvent,
      options: [
        ...cheerEvent.options,
        { id: "option_b", date: "2026-07-04", time: "20:00", location: "Bar B" },
      ],
    };
    const cheered = toggleOptionCheer(twoOptions, "option_b", "Nadine");
    expect(cheered.options[0].cheers).toBeUndefined();
    expect(cheered.options[1].cheers).toEqual(["Nadine"]);

    expect(toggleOptionCheer(twoOptions, "option_a", "   ")).toBe(twoOptions);
  });
});

describe("appendEventMessage", () => {
  const wallEvent = createEvent("apero_wall", {
    id: "option_a",
    date: "2026-07-03",
    time: "19:00",
    location: "Bar A",
  });

  it("ajoute le mot au bout du fil", () => {
    const updated = appendEventMessage(wallEvent, {
      id: "message_1",
      authorName: "Nadine",
      body: "J'amène les olives.",
      createdAt: "2026-07-01T10:00:00.000Z",
    });
    expect(updated.messages).toHaveLength(1);
    expect(updated.messages?.[0].body).toBe("J'amène les olives.");
  });

  it("fait tomber les plus vieux mots au-delà du plafond", () => {
    const crowded = {
      ...wallEvent,
      messages: Array.from({ length: 200 }, (_, index) => ({
        id: `message_${index}`,
        authorName: "Nadine",
        body: `Mot ${index}`,
        createdAt: "2026-07-01T10:00:00.000Z",
      })),
    };
    const updated = appendEventMessage(crowded, {
      id: "message_new",
      authorName: "Jojo",
      body: "Le dernier mot.",
      createdAt: "2026-07-01T11:00:00.000Z",
    });
    expect(updated.messages).toHaveLength(200);
    expect(updated.messages?.[0].id).toBe("message_1");
    expect(updated.messages?.at(-1)?.id).toBe("message_new");
  });
});
