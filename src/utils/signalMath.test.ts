import { describe, expect, it } from "vitest";
import { clamp, easeOutExpo, fnv1a, seededRandom, signatureBars } from "./signalMath";

describe("fnv1a", () => {
  it("rend la valeur de référence FNV-1a 32 bits", () => {
    expect(fnv1a("")).toBe(0x811c9dc5);
    expect(fnv1a("a")).toBe(0xe40c292c);
    expect(fnv1a("foobar")).toBe(0xbf9cf968);
  });
});

describe("seededRandom", () => {
  it("est reproductible et reste dans [0, 1)", () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    for (let index = 0; index < 200; index += 1) {
      const value = a();
      expect(value).toBe(b());
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("ne se bloque pas sur une graine nulle", () => {
    const random = seededRandom(0);
    expect(random()).not.toBe(random());
  });
});

describe("signatureBars", () => {
  it("donne la même signature pour le même identifiant", () => {
    expect(signatureBars("apero_abc123")).toEqual(signatureBars("apero_abc123"));
  });

  it("distingue deux assemblées", () => {
    expect(signatureBars("apero_abc123")).not.toEqual(signatureBars("apero_abc124"));
  });

  it("produit des barres de 1 à 4 unités, sans chevauchement, dans la longueur annoncée", () => {
    const { bars, length } = signatureBars("tablee_xyz", 48);
    expect(bars.length).toBeGreaterThan(0);
    let previousEnd = -1;
    for (const bar of bars) {
      expect(bar.width).toBeGreaterThanOrEqual(1);
      expect(bar.width).toBeLessThanOrEqual(4);
      expect(bar.x).toBeGreaterThan(previousEnd);
      previousEnd = bar.x + bar.width - 1;
    }
    expect(previousEnd).toBeLessThanOrEqual(length);
  });
});

describe("easeOutExpo", () => {
  it("part de 0, arrive à 1, ne dépasse jamais 1 et croît", () => {
    expect(easeOutExpo(0)).toBe(0);
    expect(easeOutExpo(1)).toBe(1);
    let previous = 0;
    for (let t = 0.05; t < 1; t += 0.05) {
      const value = easeOutExpo(t);
      expect(value).toBeGreaterThan(previous);
      expect(value).toBeLessThanOrEqual(1);
      previous = value;
    }
  });
});

describe("clamp", () => {
  it("borne", () => {
    expect(clamp(-1, 0, 1)).toBe(0);
    expect(clamp(2, 0, 1)).toBe(1);
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });
});
