import { describe, expect, it } from "vitest";
import { VERRERIE } from "./Verrerie";

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
