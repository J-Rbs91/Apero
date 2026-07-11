import { describe, expect, it } from "vitest";
import type { AperitifEvent, AperitifOption } from "../types/apero";
import { buildAperoIcs, buildIcsFileName, escapeIcsText } from "./calendarExport";

const option: AperitifOption = {
  id: "option_1",
  date: "2026-07-04",
  time: "19:30",
  location: "Le Bar du Coin",
  locationAddress: "3 rue des Olives, Marseille",
};

const event: AperitifEvent = {
  id: "apero_test",
  ceremonialName: "Le Concile du Saucisson",
  title: "Apéro fin de chantier",
  organizerName: "Jérémy",
  beaufLevel: "medium",
  status: "active",
  options: [option],
  participants: [],
  createdAt: "2026-06-30T18:00:00.000Z",
  updatedAt: "2026-06-30T18:00:00.000Z",
};

describe("buildAperoIcs", () => {
  it("génère un VEVENT complet avec heure locale flottante", () => {
    const ics = buildAperoIcs({
      event,
      option,
      now: new Date("2026-07-01T10:00:00.000Z"),
    });

    expect(ics).toBeTruthy();
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("UID:apero_test-option_1@confrerie-du-petit-jaune");
    expect(ics).toContain("DTSTART:20260704T193000");
    // Deux heures plus tard, le mensonge socialement acceptable.
    expect(ics).toContain("DTEND:20260704T213000");
    expect(ics).toContain("DTSTAMP:20260701T100000Z");
    expect(ics).toContain("SUMMARY:Apéro — Le Concile du Saucisson");
    expect(ics).toContain("END:VCALENDAR");
    // Les lignes sont terminées par CRLF.
    expect(ics).toContain("\r\n");
  });

  it("échappe l'adresse (virgules) dans LOCATION", () => {
    const ics = buildAperoIcs({ event, option, now: new Date("2026-07-01T10:00:00.000Z") });
    expect(ics).toContain("Le Bar du Coin — 3 rue des Olives\\, Marseille");
  });

  it("glisse le lien d'invitation dans la description", () => {
    const ics = buildAperoIcs({
      event,
      option,
      inviteUrl: "https://example.test/#/invite/apero_test?k=xxx",
      now: new Date("2026-07-01T10:00:00.000Z"),
    });
    // Les lignes longues sont pliées (RFC 5545) : on déplie avant de vérifier.
    const unfolded = (ics ?? "").replaceAll("\r\n ", "");
    expect(unfolded).toContain("Invitation : https://example.test/#/invite/apero_test?k=xxx");
  });

  it("refuse un créneau sans date ou sans heure", () => {
    expect(
      buildAperoIcs({ event, option: { ...option, date: "" } }),
    ).toBeNull();
    expect(
      buildAperoIcs({ event, option: { ...option, time: "" } }),
    ).toBeNull();
  });

  it("plie les lignes longues à moins de 76 caractères", () => {
    const verboseEvent = {
      ...event,
      title: "Un programme interminable qui déborde largement de la limite des soixante-quinze octets imposée par la RFC 5545",
    };
    const ics = buildAperoIcs({ event: verboseEvent, option, now: new Date() });
    for (const line of (ics ?? "").split("\r\n")) {
      expect(line.length).toBeLessThanOrEqual(75);
    }
  });
});

describe("escapeIcsText", () => {
  it("échappe antislash, point-virgule, virgule et retours à la ligne", () => {
    expect(escapeIcsText("a\\b;c,d\ne")).toBe("a\\\\b\\;c\\,d\\ne");
  });
});

describe("buildIcsFileName", () => {
  it("produit un nom de fichier sans accents ni espaces", () => {
    expect(buildIcsFileName(event)).toBe("le-concile-du-saucisson.ics");
  });

  it("retombe sur apero.ics quand le nom ne laisse rien d'utilisable", () => {
    expect(buildIcsFileName({ ...event, ceremonialName: "" })).toBe("apero.ics");
  });
});
