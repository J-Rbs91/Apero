import { describe, expect, it } from "vitest";
import type { Tablee } from "../types/tablee";
import {
  addTableeAperoRef,
  addTableeMember,
  sanitizeTablee,
  TableeValidationError,
} from "./tableeValidation";

function rawTablee(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    kind: "tablee",
    id: "apero_tablee1",
    name: "  Les Piliers du Jeudi  ",
    motto: "On ne présume rien, on trinque.",
    founderName: "Jojo",
    members: [
      { name: "Jojo", joinedAt: "2026-06-01T10:00:00.000Z" },
      { name: "Nadine", joinedAt: "2026-06-02T10:00:00.000Z" },
      // Doublon par nom normalisé : ignoré.
      { name: "  jojo ", joinedAt: "2026-06-03T10:00:00.000Z" },
    ],
    aperoRefs: [
      {
        aperoId: "apero_abc12",
        encryptionKey: "k".repeat(43),
        writeKey: "w".repeat(32),
        ceremonialName: "Le Concile du Saucisson",
        addedAt: "2026-06-05T10:00:00.000Z",
        addedBy: "Jojo",
      },
    ],
    createdAt: "2026-06-01T10:00:00.000Z",
    updatedAt: "2026-06-05T10:00:00.000Z",
    ...overrides,
  };
}

describe("sanitizeTablee", () => {
  it("nettoie et déduplique les membres", () => {
    const tablee = sanitizeTablee(rawTablee(), "apero_tablee1");

    expect(tablee.name).toBe("Les Piliers du Jeudi");
    expect(tablee.members.map((member) => member.name)).toEqual(["Jojo", "Nadine"]);
    expect(tablee.aperoRefs).toHaveLength(1);
    expect(tablee.aperoRefs[0].writeKey).toBe("w".repeat(32));
  });

  it("rejette ce qui n'est pas une tablée (ex. un apéro)", () => {
    expect(() => sanitizeTablee(rawTablee({ kind: undefined }))).toThrowError(
      TableeValidationError,
    );
    expect(() => sanitizeTablee({ ceremonialName: "Un apéro" })).toThrowError(
      TableeValidationError,
    );
  });

  it("rejette un identifiant qui ne correspond pas au fichier demandé", () => {
    expect(() => sanitizeTablee(rawTablee(), "apero_autre1")).toThrowError(
      TableeValidationError,
    );
  });

  it("rejette une référence d'apéro sans clé de lecture", () => {
    expect(() =>
      sanitizeTablee(
        rawTablee({
          aperoRefs: [
            {
              aperoId: "apero_abc12",
              ceremonialName: "Sans clé",
              addedAt: "2026-06-05T10:00:00.000Z",
            },
          ],
        }),
      ),
    ).toThrowError(TableeValidationError);
  });
});

describe("addTableeMember / addTableeAperoRef", () => {
  const tablee: Tablee = sanitizeTablee(rawTablee()) as Tablee;

  it("attable un nouveau blaze, jamais deux fois", () => {
    const withDede = addTableeMember(tablee, "Dédé", new Date("2026-06-10T10:00:00Z"));
    expect(withDede.members.map((member) => member.name)).toContain("Dédé");

    const again = addTableeMember(withDede, "  dede ", new Date("2026-06-11T10:00:00Z"));
    expect(again).toBe(withDede);
  });

  it("rattache un apéro, idempotent par identifiant", () => {
    const ref = {
      aperoId: "apero_xyz99",
      encryptionKey: "k".repeat(43),
      ceremonialName: "Le Sommet des Glaçons",
      addedAt: "2026-06-12T10:00:00.000Z",
    };
    const withRef = addTableeAperoRef(tablee, ref);
    expect(withRef.aperoRefs).toHaveLength(2);

    const again = addTableeAperoRef(withRef, ref);
    expect(again).toBe(withRef);
  });
});
