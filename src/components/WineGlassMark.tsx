import { useEffect, useRef } from "react";
import type { AnimationItem } from "lottie-web";

type WineGlassMarkProps = {
  size?: number;
  className?: string;
  // Appelé à chaque fois que l'animation boucle (fin d'un tour du SVG).
  onLoopComplete?: () => void;
};

export function WineGlassMark({ size = 28, className = "", onLoopComplete }: WineGlassMarkProps) {
  const ref = useRef<HTMLSpanElement>(null);
  // Ref sur le dernier callback : évite de recharger l'animation quand il change.
  const onLoopRef = useRef(onLoopComplete);
  onLoopRef.current = onLoopComplete;

  useEffect(() => {
    let animation: AnimationItem | undefined;
    let cancelled = false;
    let settleTimer: number | undefined;

    // Chargement paresseux : le moteur Lottie (build léger SVG) et l'animation
    // partent dans un chunk séparé, hors du bundle initial.
    Promise.all([
      import("lottie-web/build/player/lottie_light"),
      import("../assets/wine-glass.json"),
    ]).then(([lottieModule, animationModule]) => {
      if (cancelled || !ref.current) {
        return;
      }

      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      animation = lottieModule.default.loadAnimation({
        container: ref.current,
        renderer: "svg",
        loop: !reducedMotion,
        autoplay: !reducedMotion,
        animationData: animationModule.default,
      });

      animation.addEventListener("loopComplete", () => {
        onLoopRef.current?.();
      });

      // Mouvement réduit : le verre reste sur sa première image et ne boucle
      // jamais, donc « loopComplete » n'arrive jamais. L'écran d'ouverture
      // compte sur ce signal pour se retirer : on le donne après un court
      // instant plutôt que de le laisser attendre son filet de sécurité de 4 s.
      if (reducedMotion) {
        settleTimer = window.setTimeout(() => onLoopRef.current?.(), 700);
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(settleTimer);
      animation?.destroy();
    };
  }, []);

  return (
    <span
      ref={ref}
      className={`wine-glass-mark ${className}`.trim()}
      style={{ width: size, height: size, display: "block" }}
      aria-hidden
    />
  );
}
