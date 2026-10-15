import { afterEach, describe, expect, it, vi } from "vitest";
import { hapticError, hapticSuccess, hapticTap } from "./haptics";

// Le vocabulaire haptique est un contrat : trois motifs, toujours les mêmes,
// pour que la main reconnaisse « parti », « validé » et « KO » sans regarder.

describe("haptics", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubVibrate() {
    const vibrate = vi.fn().mockReturnValue(true);
    vi.stubGlobal("navigator", { vibrate });
    return vibrate;
  }

  it("hapticTap envoie un tic bref", () => {
    const vibrate = stubVibrate();
    hapticTap();
    expect(vibrate).toHaveBeenCalledWith(10);
  });

  it("hapticSuccess envoie un double tic léger", () => {
    const vibrate = stubVibrate();
    hapticSuccess();
    expect(vibrate).toHaveBeenCalledWith([12, 60, 18]);
  });

  it("hapticError envoie une secousse plus ferme que le succès", () => {
    const vibrate = stubVibrate();
    hapticError();
    const pattern = vibrate.mock.calls[0][0] as number[];
    expect(pattern.length).toBeGreaterThan(1);
    // Plus long et plus appuyé que le motif de succès : impossible à confondre.
    expect(Math.max(...pattern)).toBeGreaterThan(18);
  });

  it("reste silencieux quand l'API Vibration n'existe pas (Safari iOS)", () => {
    vi.stubGlobal("navigator", {});
    expect(() => {
      hapticTap();
      hapticSuccess();
      hapticError();
    }).not.toThrow();
  });

  it("avale l'exception d'un navigateur qui refuse de vibrer", () => {
    vi.stubGlobal("navigator", {
      vibrate: vi.fn(() => {
        throw new Error("blocked");
      }),
    });
    expect(() => hapticSuccess()).not.toThrow();
  });
});
