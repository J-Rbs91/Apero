import { useEffect, useRef } from "react";

// Moteur commun des matières computationnelles « Point Jaune »
// (docs/uxer/manifesto-void/UXER_MOTION_SYSTEM.md §2-4).
//
// Une figure est une RÉVÉLATION, pas un fond animé : elle se joue une fois,
// quand elle entre dans le champ visible, puis reste posée. Elle se suspend
// hors champ et onglet masqué, reprend où elle était, et se dessine
// directement dans son état final en mouvement réduit.

export type FieldPalette = {
  /** Signes principaux (texte du contexte). */
  ink: string;
  /** Signes secondaires (texte tertiaire). */
  dim: string;
  /** Trame et filets. */
  line: string;
  /** Le Petit Jaune. */
  signal: string;
};

export type FieldDraw = (
  context: CanvasRenderingContext2D,
  size: { width: number; height: number },
  /** Avancement de la révélation, de 0 à 1. */
  progress: number,
  palette: FieldPalette,
) => void;

type Options = {
  /** Durée de la révélation (ms). */
  duration: number;
  /**
   * Change quand les données changent : la figure se redessine dans son état
   * final, sans rejouer la révélation (on ne refait pas le spectacle à chaque
   * vote reçu).
   */
  dataKey: string;
};

function readPalette(element: Element): FieldPalette {
  const style = getComputedStyle(element);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    ink: read("--text", "#F3F1EA"),
    dim: read("--text-3", "#8E8D88"),
    line: read("--line", "#3A3D40"),
    signal: read("--jaune", "#D7AB42"),
  };
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useFieldCanvas(draw: FieldDraw, { duration, dataKey }: Options) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  // L'avancement survit aux changements de données : une figure déjà
  // révélée reste révélée.
  const progressRef = useRef(prefersReducedMotion() ? 1 : 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    let frame = 0;
    let visible = false;
    let startedAt = 0;
    let startProgress = progressRef.current;

    function paint() {
      if (!canvas || !context) {
        return;
      }
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (width === 0 || height === 0) {
        return;
      }
      if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
      }
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);
      drawRef.current(context, { width, height }, progressRef.current, readPalette(canvas));
    }

    function tick(now: number) {
      if (!startedAt) {
        startedAt = now;
      }
      const elapsed = now - startedAt;
      progressRef.current = Math.min(1, startProgress + elapsed / duration);
      paint();
      if (progressRef.current < 1 && visible && document.visibilityState === "visible") {
        frame = requestAnimationFrame(tick);
      } else {
        frame = 0;
      }
    }

    function play() {
      if (frame || progressRef.current >= 1) {
        return;
      }
      startedAt = 0;
      startProgress = progressRef.current;
      frame = requestAnimationFrame(tick);
    }

    function pause() {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }

    paint();

    const resize = new ResizeObserver(() => paint());
    resize.observe(canvas);

    const intersection = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        if (visible) {
          play();
        } else {
          pause();
        }
      },
      { threshold: 0.25 },
    );
    intersection.observe(canvas);

    function handleVisibility() {
      if (document.visibilityState === "visible" && visible) {
        play();
      } else {
        pause();
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      pause();
      resize.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [dataKey, duration]);

  return canvasRef;
}
