import { describe, expect, it } from "vitest";
import {
  clampTraquenardRatio,
  describeTraquenardLevel,
  traquenardColor,
  traquenardRatioFromLevel,
} from "./traquenardScale";

describe("traquenardScale", () => {
  it("ancre les couleurs froid → chaud aux extrémités", () => {
    expect(traquenardColor(0)).toBe("rgb(47, 111, 176)"); // bleu froid
    expect(traquenardColor(0.5)).toBe("rgb(244, 197, 66)"); // pastis neutre
    expect(traquenardColor(1)).toBe("rgb(184, 50, 43)"); // rouge chaud
  });

  it("interpole sans palier entre les ancrages", () => {
    const low = traquenardColor(0.25);
    const high = traquenardColor(0.75);
    expect(low).not.toBe(traquenardColor(0));
    expect(low).not.toBe(traquenardColor(0.5));
    expect(high).not.toBe(traquenardColor(0.5));
    expect(high).not.toBe(traquenardColor(1));
  });

  it("borne le ratio hors de [0, 1]", () => {
    expect(clampTraquenardRatio(-2)).toBe(0);
    expect(clampTraquenardRatio(5)).toBe(1);
    expect(clampTraquenardRatio(Number.NaN)).toBe(0);
  });

  it("convertit un niveau 0→10 en ratio 0→1", () => {
    expect(traquenardRatioFromLevel(0)).toBe(0);
    expect(traquenardRatioFromLevel(5)).toBe(0.5);
    expect(traquenardRatioFromLevel(10)).toBe(1);
  });

  it("décrit le niveau par paliers", () => {
    expect(describeTraquenardLevel(0)).toBe("Petite soirée sage");
    expect(describeTraquenardLevel(3)).toBe("Ambiance correcte");
    expect(describeTraquenardLevel(6)).toBe("Ça sent le traquenard");
    expect(describeTraquenardLevel(9)).toBe("Traquenard total");
  });
});
