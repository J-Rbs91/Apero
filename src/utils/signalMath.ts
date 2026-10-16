// Mathématiques des matières computationnelles « Point Jaune »
// (docs/uxer/manifesto-void/UXER_DESIGN_SYSTEM.md §8).
//
// Tout est déterministe : une même graine produit toujours la même figure, sur
// tous les appareils. Les graines sont des identifiants PUBLICS (aperoId,
// tableeId) — jamais les clés de chiffrement ou d'écriture du lien.

/** Hachage FNV-1a 32 bits d'une chaîne. */
export function fnv1a(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/** Générateur xorshift32 : nombres dans [0, 1), reproductibles depuis la graine. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0 || 0x9e3779b9;
  return () => {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
}

export type SignatureBar = {
  /** Position de départ, en unités de la bande. */
  x: number;
  /** Largeur, de 1 à 4 unités. */
  width: number;
};

/**
 * Bande binaire d'une assemblée : une suite de barres de 1 à 4 unités séparées
 * d'une unité, présentes avec une probabilité d'environ 0,55. Renvoie aussi la
 * longueur totale en unités, pour que l'appelant mette la bande à l'échelle.
 */
export function signatureBars(seed: string, slots = 48): { bars: SignatureBar[]; length: number } {
  const random = seededRandom(fnv1a(seed));
  const bars: SignatureBar[] = [];
  let x = 0;
  for (let slot = 0; slot < slots; slot += 1) {
    const width = 1 + Math.floor(random() * 4);
    if (random() < 0.55) {
      bars.push({ x, width });
    }
    x += width + 1;
  }
  return { bars, length: Math.max(x - 1, 1) };
}

/** Sortie exponentielle : arrive vite, se pose doucement, ne dépasse jamais 1. */
export function easeOutExpo(t: number): number {
  if (t <= 0) {
    return 0;
  }
  if (t >= 1) {
    return 1;
  }
  return 1 - 2 ** (-10 * t);
}

/** Borne une valeur. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
