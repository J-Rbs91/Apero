import { useCallback, useEffect, useRef, useState } from "react";
import { WineGlassMark } from "./WineGlassMark";

type SplashScreenProps = {
  onDone: () => void;
};

// Le rideau s'efface après un seul tour du verre : le rituel se goûte, il ne
// se subit pas. Un tap n'importe où l'écourte encore.
const MAX_LOOPS = 1;
const FADE_MS = 560;
// Filet de sécurité : si le Lottie ne charge pas (donc jamais de boucle), on
// s'efface quand même, vite — le contenu prime sur le spectacle.
const SAFETY_MS = 4000;

// La punchline de l'écran d'ouverture. Modifiable d'un mot.
const TAGLINE = "Nul n’est tenu d’avoir soif pour venir perdre son temps avec panache.";
// Le clin d'œil excédé : oui, le verre est rouge et le nom parle de jaune.
const ASIDE = "Le rouge, le jaune… oui, la cohérence de la charte graphique a le cul entre deux chaises.";

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
  const loopsRef = useRef(0);
  const dismissedRef = useRef(false);

  // Lance le fondu de sortie puis rend la main (une seule fois).
  const dismiss = useCallback(() => {
    if (dismissedRef.current) {
      return;
    }
    dismissedRef.current = true;
    setLeaving(true);
    window.setTimeout(onDone, FADE_MS);
  }, [onDone]);

  useEffect(() => {
    const safety = window.setTimeout(dismiss, SAFETY_MS);
    return () => window.clearTimeout(safety);
  }, [dismiss]);

  function handleLoopComplete() {
    loopsRef.current += 1;
    if (loopsRef.current >= MAX_LOOPS) {
      dismiss();
    }
  }

  return (
    <div
      className={`splash ${leaving ? "splash--leaving" : ""}`.trim()}
      role="presentation"
      onClick={dismiss}
    >
      <div className="screen-overlay screen-overlay--deep" aria-hidden />
      <div className="splash__inner">
        <span className="splash__glass">
          <WineGlassMark size={size} onLoopComplete={handleLoopComplete} />
        </span>
        <p className="splash__eyebrow">Institution officieuse du comptoir</p>
        <h1 className="splash__name">La Confrérie du Petit Jaune</h1>
        <p className="splash__tagline">{TAGLINE}</p>
        <p className="splash__aside">{ASIDE}</p>
      </div>
    </div>
  );
}
