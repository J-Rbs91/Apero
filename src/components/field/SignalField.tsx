import { useCallback } from "react";
import { clamp, easeOutExpo } from "../../utils/signalMath";
import { type FieldDraw, useFieldCanvas } from "./useFieldCanvas";

const DURATION = 1400;
const GOLDEN = 0.618;

// Le champ d'émergence de l'écran d'ouverture (UXER_MOTION_SYSTEM.md §2,
// « Signal Emergence ») : une trame régulière de points apparaît en onde depuis
// l'intersection d'or, puis le Petit Jaune émerge à cet endroit. Aucune donnée
// n'est représentée : c'est le seul motif de rituel du système, et il ne vit
// que le temps de l'ouverture.
export function SignalField() {
  const draw = useCallback<FieldDraw>((context, { width, height }, progress, palette) => {
    const originX = width * GOLDEN;
    const originY = height * (1 - GOLDEN);
    const reach = Math.hypot(Math.max(originX, width - originX), Math.max(originY, height - originY));
    const front = easeOutExpo(clamp(progress / 0.75, 0, 1)) * reach;
    const pitch = width < 600 ? 18 : 24;

    context.fillStyle = palette.ink;
    for (let y = pitch / 2; y < height; y += pitch) {
      for (let x = pitch / 2; x < width; x += pitch) {
        const distance = Math.hypot(x - originX, y - originY);
        if (distance > front) {
          continue;
        }
        // Densité en onde : les points s'éteignent en anneaux réguliers autour
        // du point, ce qui donne au vide une profondeur sans rien y ajouter.
        const wave = 0.5 + 0.5 * Math.cos(distance / 46);
        context.globalAlpha = 0.08 + 0.22 * wave * (1 - distance / reach);
        context.fillRect(Math.round(x), Math.round(y), 1.5, 1.5);
      }
    }
    context.globalAlpha = 1;

    const emergence = easeOutExpo(clamp((progress - 0.4) / 0.6, 0, 1));
    if (emergence > 0) {
      context.fillStyle = palette.signal;
      context.beginPath();
      context.arc(originX, originY, 7 * emergence, 0, Math.PI * 2);
      context.fill();
    }
  }, []);

  const canvasRef = useFieldCanvas(draw, { duration: DURATION, dataKey: "splash" });

  return <canvas ref={canvasRef} className="signalfield" aria-hidden="true" />;
}
