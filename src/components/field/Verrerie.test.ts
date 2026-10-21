import { describe, expect, it } from "vitest";
import { composerVerrerie, VERRERIE } from "./Verrerie";
import { VERRERIE_ECRANS } from "./verrerieEcrans";

// Une seule échelle pour toute la verrerie : la bouteille fait la hauteur de
// l'écran, les autres objets suivent leurs proportions réelles (contrat §17.5).
describe("Verrerie", () => {
  it("garde la bouteille à 300 mm, référence de l'échelle", () => {
    expect(VERRERIE.bouteille.hauteurMm).toBe(300);
  });

  it("dessine chaque tracé à sa hauteur réelle", () => {
    for (const { hauteurMm, viewBox } of Object.values(VERRERIE)) {
      const [, , , hauteurBoite] = viewBox.split(" ").map(Number);
      expect(hauteurBoite).toBe(hauteurMm);
    }
  });

  it("respecte les rapports du contrat", () => {
    const ratio = (h: number) => Math.round((h / VERRERIE.bouteille.hauteurMm) * 100);
    expect(ratio(VERRERIE.verre.hauteurMm)).toBe(70);
    expect(ratio(VERRERIE.flute.hauteurMm)).toBe(77);
    expect(ratio(VERRERIE.nonic.hauteurMm)).toBe(52);
  });
});

// Un apéro tire toujours la même verrerie de son identifiant, dans les bornes
// d'angle du contrat (§17.5), et un écran fixe ne sort pas de ces bornes non plus.
describe("composerVerrerie", () => {
  it("est déterministe", () => {
    expect(composerVerrerie("apero_abc123")).toEqual(composerVerrerie("apero_abc123"));
  });

  it("reste entre −35° et +35°", () => {
    for (const seed of ["a", "apero_abc123", "tablee_xyz", "Le Conclave du Houblon"]) {
      const { angle } = composerVerrerie(seed);
      expect(angle).toBeGreaterThanOrEqual(-35);
      expect(angle).toBeLessThanOrEqual(35);
    }
  });

  it("ne retourne que des verres à pied, et seulement de 145° à 215°", () => {
    for (const { objet, angle } of Object.values(VERRERIE_ECRANS)) {
      if (Math.abs(angle) > 90) {
        expect(["verre", "flute"]).toContain(objet);
        expect(angle).toBeGreaterThanOrEqual(145);
        expect(angle).toBeLessThanOrEqual(215);
      } else {
        expect(Math.abs(angle)).toBeLessThanOrEqual(35);
      }
    }
  });
});
