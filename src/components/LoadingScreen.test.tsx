import { describe, expect, it } from "vitest";
import { loadingPhase } from "./LoadingScreen";

// L'écran de chargement est temporisé : rien avant 1 s, l'écran d'attente
// entre 1 et 5 s, puis des vannes qui tournent au delà de 5 s.
describe("loadingPhase", () => {
  it("ne montre rien avant 1 seconde", () => {
    expect(loadingPhase(0)).toBe("hidden");
    expect(loadingPhase(999)).toBe("hidden");
  });

  it("montre l'écran d'attente entre 1 et 5 secondes", () => {
    expect(loadingPhase(1000)).toBe("waiting");
    expect(loadingPhase(4999)).toBe("waiting");
  });

  it("bascule sur les vannes au delà de 5 secondes", () => {
    expect(loadingPhase(5000)).toBe("quips");
    expect(loadingPhase(30000)).toBe("quips");
  });
});
