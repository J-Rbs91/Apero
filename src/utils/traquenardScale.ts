import { TRAQUENARD_LEVEL_MAX } from "./calculateResults";

// Échelle partagée du Traquenard-O-mètre : une même valeur (0 → 10) doit
// produire partout la même couleur et le même intitulé, que la jauge soit
// interactive (carte de réponse) ou récapitulative (cartes de synthèse).

type Rgb = { r: number; g: number; b: number };

// Ancrages de couleur : froid/peu engagé en bas, chaud/très motivé en haut.
const COLD: Rgb = { r: 0x2f, g: 0x6f, b: 0xb0 }; // --calm-blue
const WARM: Rgb = { r: 0xf4, g: 0xc5, b: 0x42 }; // --pastis
const HOT: Rgb = { r: 0xb8, g: 0x32, b: 0x2b }; // --bar-red

function mix(from: Rgb, to: Rgb, amount: number): Rgb {
  const blend = (start: number, end: number) => Math.round(start + (end - start) * amount);
  return { r: blend(from.r, to.r), g: blend(from.g, to.g), b: blend(from.b, to.b) };
}

export function clampTraquenardRatio(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

// Couleur reflétant réellement la valeur choisie : bleu froid → jaune pastis →
// rouge chaud, interpolée sans palier brutal.
export function traquenardColor(ratio: number): string {
  const clamped = clampTraquenardRatio(ratio);
  const color =
    clamped <= 0.5 ? mix(COLD, WARM, clamped / 0.5) : mix(WARM, HOT, (clamped - 0.5) / 0.5);
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

export function describeTraquenardLevel(level: number): string {
  if (level >= 8) {
    return "Traquenard total";
  }

  if (level >= 5) {
    return "Ça sent le traquenard";
  }

  if (level >= 2) {
    return "Ambiance correcte";
  }

  return "Petite soirée sage";
}

export function traquenardRatioFromLevel(level: number): number {
  return clampTraquenardRatio(level / TRAQUENARD_LEVEL_MAX);
}
