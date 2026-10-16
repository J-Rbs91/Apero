import { describe, expect, it } from "vitest";
import { slotDateLabel, slotDateParts } from "./SlotLeaf";

// Le calendrier-feuille décompose la date d'un créneau ; le libellé complet
// reste dit en toutes lettres aux lecteurs d'écran.
describe("slotDateParts", () => {
  it("décompose un jour en jour de semaine, quantième et mois courts", () => {
    expect(slotDateParts({ date: "2026-10-18" })).toEqual({
      weekday: "dim.",
      day: "18",
      month: "oct.",
    });
  });

  it("ne décompose rien quand la date manque ou est illisible", () => {
    expect(slotDateParts({ date: "" })).toBeNull();
    expect(slotDateParts({ date: "pas-une-date" })).toBeNull();
  });
});

describe("slotDateLabel", () => {
  it("compose le libellé lu par les lecteurs d'écran", () => {
    expect(slotDateLabel({ date: "2026-10-18" })).toBe("dim. 18 oct.");
  });

  it("garde la formule de repli quand la date manque", () => {
    expect(slotDateLabel({ date: "" })).toBe("Sans date");
  });
});
