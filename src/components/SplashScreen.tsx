import { useCallback, useEffect, useRef, useState } from "react";
import { GlassField } from "./field/GlassField";
import { SignalField } from "./field/SignalField";

type SplashScreenProps = {
  onDone: () => void;
};

// Le rideau s'efface quand le verre est rempli : le rituel se goûte, il ne
// se subit pas. Un tap n'importe où l'écourte encore.
const FADE_MS = 560;
// Le verre plein reste un instant à l'écran avant le fondu.
const HOLD_MS = 600;
// Filet de sécurité : si le dessin n'aboutit pas (canvas indisponible), on
// s'efface quand même, vite : le contenu prime sur le spectacle.
const SAFETY_MS = 4000;

// Largeur du verre : ~1/5,5 de la longueur de l'écran (le grand côté), bornée.
// Le verre est l'unique objet figuratif de l'univers « Point Jaune » : il se
// pose dans le vide, à l'échelle d'un objet, pas d'une affiche.
function glassSize(): number {
  if (typeof window === "undefined") {
    return 150;
  }
  const longSide = Math.max(window.innerWidth, window.innerHeight);
  return Math.round(Math.min(Math.max(longSide / 5.5, 120), 220));
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const [leaving, setLeaving] = useState(false);
  const [size] = useState(glassSize);
  const dismissedRef = useRef(false);
  const holdRef = useRef<number | undefined>(undefined);

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
    return () => {
      window.clearTimeout(safety);
      window.clearTimeout(holdRef.current);
    };
  }, [dismiss]);

  // Verre rempli (ou dessiné plein d'emblée en mouvement réduit) : on le
  // laisse se voir, puis on se retire.
  const handleFilled = useCallback(() => {
    holdRef.current = window.setTimeout(dismiss, HOLD_MS);
  }, [dismiss]);

  return (
    <div
      className={`splash ${leaving ? "splash--leaving" : ""}`.trim()}
      role="presentation"
      onClick={dismiss}
    >
      <SignalField />
      <div className="splash__inner">
        <span className="splash__glass">
          <GlassField size={size} onComplete={handleFilled} />
        </span>
        <h1 className="splash__name">La Confrérie du Petit Jaune</h1>
      </div>
    </div>
  );
}
