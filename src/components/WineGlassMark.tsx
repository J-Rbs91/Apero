import { useEffect, useRef } from "react";
import lottie from "lottie-web";
import animationData from "../assets/wine-glass.json";

type WineGlassMarkProps = {
  size?: number;
  className?: string;
};

export function WineGlassMark({ size = 28, className = "" }: WineGlassMarkProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const anim = lottie.loadAnimation({
      container: ref.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData,
    });

    return () => anim.destroy();
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
