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

    // Chargement paresseux : le moteur Lottie (build léger SVG) et l'animation
    // partent dans un chunk séparé, hors du bundle initial.
    Promise.all([
      import("lottie-web/build/player/lottie_light"),
      import("../assets/wine-glass.json"),
    ]).then(([lottieModule, animationModule]) => {
      if (cancelled || !ref.current) {
        return;
      }

      animation = lottieModule.default.loadAnimation({
        container: ref.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData: animationModule.default,
      });

      animation.addEventListener("loopComplete", () => {
        onLoopRef.current?.();
      });
    });

    return () => {
      cancelled = true;
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
