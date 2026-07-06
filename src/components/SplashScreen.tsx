import { useEffect, useState } from "react";
import { WineGlassMark } from "./WineGlassMark";

type SplashScreenProps = {
  onDone: () => void;
};

// Combien de temps le rideau reste levé avant de s'effacer, et durée du fondu.
const HOLD_MS = 2600;
const FADE_MS = 560;

// La punchline de l'écran d'ouverture. Modifiable d'un mot.
const TAGLINE = "Ici, l’indécision collective finit toujours par accoucher d’une date. C’est laborieux, c’est glorieux.";

// Taille du verre : ~1/5 de la longueur de l'écran (le grand côté), bornée
// pour rester élégante sur les très petits comme sur les très grands écrans.
function glassSize(): number {
  if (typeof window === "undefined") {
    return 160;
  }
  const longSide = Math.max(window.innerWidth, window.innerHeight);
  return Math.round(Math.min(Math.max(longSide / 5, 120), 220));
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [leaving, setLeaving] = useState(false);
  const [size] = useState(glassSize);

  useEffect(() => {
    const toLeave = window.setTimeout(() => setLeaving(true), HOLD_MS);
    const toDone = window.setTimeout(onDone, HOLD_MS + FADE_MS);
    return () => {
      window.clearTimeout(toLeave);
      window.clearTimeout(toDone);
    };
  }, [onDone]);

  function skip() {
    if (leaving) {
      return;
    }
    setLeaving(true);
    window.setTimeout(onDone, FADE_MS);
  }

  return (
    <div
      className={`splash ${leaving ? "splash--leaving" : ""}`.trim()}
      role="presentation"
      onClick={skip}
    >
      <div className="screen-overlay screen-overlay--deep" aria-hidden />
      <div className="splash__inner">
        <span className="splash__glass">
          <WineGlassMark size={size} />
        </span>
        <p className="splash__eyebrow">Institution officieuse du comptoir</p>
        <h1 className="splash__name">La Confrérie du Petit Jaune</h1>
        <p className="splash__tagline">{TAGLINE}</p>
      </div>
    </div>
  );
}
