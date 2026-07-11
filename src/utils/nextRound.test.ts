import { describe, expect, it } from "vitest";
import type { AperitifEvent } from "../types/apero";
import {
  addRecurrenceInterval,
  buildNextRoundPrefill,
  describeRecurrence,
  pickReferenceOption,
} from "./nextRound";

function baseEvent(overrides: Partial<AperitifEvent> = {}): AperitifEvent {
  return {
    id: "apero_test",
    ceremonialName: "Le Concile du Saucisson",
    title: "Apéro fin de chantier",
    organizerName: "Jojo",
    beaufLevel: "medium",
    status: "active",
    childrenAllowed: false,
    options: [
      {
        id: "option_1",
        date: "2026-07-02",
        time: "19:00",
        location: "Bar des Sports",
        locationAddress: "3 rue des Olives, Marseille",
        locationLat: 43.29,
        locationLng: 5.37,
      },
    ],
    participants: [],
    createdAt: "2026-06-20T00:00:00.000Z",
    updatedAt: "2026-06-20T00:00:00.000Z",
    ...overrides,
  };
}

describe("addRecurrenceInterval", () => {
  it("décale d'une semaine par défaut et selon la cadence", () => {
    const start = new Date("2026-07-02T19:00:00");
    expect(addRecurrenceInterval(start).getDate()).toBe(9);
    expect(addRecurrenceInterval(start, "weekly").getDate()).toBe(9);
    expect(addRecurrenceInterval(start, "biweekly").getDate()).toBe(16);
  });

  it("gère le mois suivant, débordement compris", () => {
    const endOfJanuary = new Date("2026-01-31T19:00:00");
    const next = addRecurrenceInterval(endOfJanuary, "monthly");
    // Février n'a pas de 31 : on retombe sur le dernier jour du mois.
    expect(next.getMonth()).toBe(1);
    expect(next.getDate()).toBe(28);
  });
});

describe("pickReferenceOption", () => {
  it("préfère le créneau confirmé", () => {
    const event = baseEvent({
      options: [
        { id: "option_1", date: "2026-07-02", time: "19:00", location: "Bar des Sports" },
        { id: "option_2", date: "2026-07-03", time: "20:00", location: "Chez Dédé" },
      ],
      selectedOptionId: "option_2",
    });
    expect(pickReferenceOption(event)?.id).toBe("option_2");
  });

  it("retombe sur le créneau en tête des votes", () => {
    const event = baseEvent({
      options: [
        { id: "option_1", date: "2026-07-02", time: "19:00", location: "Bar des Sports" },
        { id: "option_2", date: "2026-07-03", time: "20:00", location: "Chez Dédé" },
      ],
      participants: [
        {
          id: "participant_1",
          participantName: "Nadine",
          votes: { option_1: "no", option_2: "yes" },
          createdAt: "2026-06-21T00:00:00.000Z",
          updatedAt: "2026-06-21T00:00:00.000Z",
        },
      ],
    });
    expect(pickReferenceOption(event)?.id).toBe("option_2");
  });
});

describe("buildNextRoundPrefill", () => {
  it("reporte lieu, heure et politique mioches vers la prochaine date future", () => {
    const prefill = buildNextRoundPrefill(baseEvent(), new Date("2026-07-03T10:00:00"));

    expect(prefill.ceremonialName).toBe("Le Concile du Saucisson");
    expect(prefill.title).toBe("Apéro fin de chantier");
    expect(prefill.childrenAllowed).toBe(false);
    expect(prefill.options).toHaveLength(1);
    // Sans cadence : remise à la semaine suivante.
    expect(prefill.options[0].date).toBe("2026-07-09");
    expect(prefill.options[0].time).toBe("19:00");
    expect(prefill.options[0].location).toBe("Bar des Sports");
    expect(prefill.options[0].locationLat).toBe(43.29);
  });

  it("saute autant d'intervalles que nécessaire pour un apéro passé de longue date", () => {
    const prefill = buildNextRoundPrefill(
      baseEvent({ recurrence: "weekly" }),
      new Date("2026-07-31T10:00:00"),
    );
    // 2, 9, 16, 23, 30 juillet sont passés : prochaine tournée le 6 août.
    expect(prefill.recurrence).toBe("weekly");
    expect(prefill.options[0].date).toBe("2026-08-06");
  });

  it("laisse la date vide quand le créneau de référence n'est pas daté", () => {
    const prefill = buildNextRoundPrefill(
      baseEvent({ options: [{ id: "option_1", date: "", time: "", location: "Chez Dédé" }] }),
      new Date("2026-07-03T10:00:00"),
    );
    expect(prefill.options[0].date).toBe("");
    expect(prefill.options[0].location).toBe("Chez Dédé");
  });
});

describe("describeRecurrence", () => {
  it("décrit chaque cadence en français de comptoir", () => {
    expect(describeRecurrence("weekly")).toBe("chaque semaine");
    expect(describeRecurrence("biweekly")).toBe("toutes les deux semaines");
    expect(describeRecurrence("monthly")).toBe("chaque mois");
  });
});
