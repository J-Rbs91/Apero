import { useCallback } from "react";
import { clamp, easeOutExpo, fnv1a, seededRandom } from "../../utils/signalMath";
import { type FieldDraw, useFieldCanvas } from "./useFieldCanvas";

type GlassFieldProps = {
  /** Largeur du verre en pixels CSS ; la hauteur suit (proportion 1 : 1,5). */
  size: number;
  /** Appelé une fois le verre rempli : l'écran d'ouverture peut se retirer. */
  onComplete?: () => void;
};

const DURATION = 1800;
/** Colonnes de la trame sur la largeur du verre. */
const COLUMNS = 19;
/** Niveau final du liquide, en part de la hauteur de la coupe (0 = fond). */
const LEVEL = 0.48;

// Proportions du verre dans sa boîte (largeur 1, hauteur 1,5) : une coupe en
// tulipe (ellipse tronquée au col, col à 70 % du ventre), une jambe, un pied.
const BOWL_CY = 0.55;
const BOWL_RY = 0.5;
const BOWL_RX = 0.46;
const RIM_Y = 0.2;
const BOWL_BOTTOM = 1.02;
const FOOT_Y = 1.44;
const FOOT_RX = 0.3;

/** Demi-largeur intérieure de la coupe à la hauteur y (unités de largeur). */
function bowlHalfWidth(y: number): number {
  if (y < RIM_Y || y > BOWL_BOTTOM) {
    return -1;
  }
  const t = (y - BOWL_CY) / BOWL_RY;
  return BOWL_RX * Math.sqrt(Math.max(0, 1 - t * t));
}

type Cell = { x: number; y: number; kind: "edge" | "inside" | "stem" | "foot"; order: number };

// Le verre de l'écran d'ouverture, redessiné dans la grammaire « Point Jaune »
// (UXER_MOTION_SYSTEM.md §2, Signal Emergence) : une silhouette faite de la
// même trame de points que le reste de l'application. Le contour apparaît du
// pied vers le col, puis le liquide monte, et c'est le Petit Jaune : le verre
// contient enfin ce que le nom promet. Purement visuel (aria-hidden), dessiné
// directement plein en mouvement réduit.
export function GlassField({ size, onComplete }: GlassFieldProps) {
  const draw = useCallback<FieldDraw>((context, { width, height }, progress, palette) => {
    const unit = width;
    const pitch = unit / COLUMNS;
    const cx = width / 2;
    const dot = Math.max(1.5, pitch * 0.42);
    const random = seededRandom(fnv1a("petit-jaune"));

    // Construction de la trame : chaque nœud reçoit son rôle et son ordre
    // d'apparition (du pied vers le col, avec un léger désordre déterministe).
    const cells: Cell[] = [];
    for (let row = 0; row * pitch <= height; row += 1) {
      const y = row * pitch + pitch / 2;
      const yu = y / unit;
      const half = bowlHalfWidth(yu);
      for (let column = 0; column < COLUMNS; column += 1) {
        const x = column * pitch + pitch / 2;
        const dx = Math.abs(x - cx) / unit;
        const order = 1 - yu / 1.5 + random() * 0.12;
        if (half >= 0 && dx <= half) {
          const edge = half - dx < 1.05 / COLUMNS || yu - RIM_Y < 0.8 / COLUMNS;
          cells.push({ x, y, kind: edge ? "edge" : "inside", order });
        } else if (yu > BOWL_BOTTOM && yu < FOOT_Y - 0.5 / COLUMNS && dx < 0.6 / COLUMNS) {
          cells.push({ x, y, kind: "stem", order });
        } else if (Math.abs(yu - FOOT_Y) < 0.5 / COLUMNS && dx <= FOOT_RX) {
          cells.push({ x, y, kind: "foot", order });
        }
      }
    }

    // Chronologie : contour 0 → 0,4 ; liquide 0,3 → 0,85 ; calme 0,85 → 1.
    const outline = clamp(progress / 0.4, 0, 1);
    const fill = easeOutExpo(clamp((progress - 0.3) / 0.55, 0, 1));
    const wave = (1 - clamp((progress - 0.6) / 0.4, 0, 1)) * pitch * 0.55;
    const bowlHeight = (BOWL_BOTTOM - RIM_Y) * unit;
    const surface = BOWL_BOTTOM * unit - bowlHeight * LEVEL * fill;

    for (const cell of cells) {
      if (cell.order > outline * 1.15) {
        continue;
      }
      const liquidTop = surface + Math.sin(cell.x / (pitch * 2.2) + progress * 14) * wave;
      // Les parois restent ivoire : seul l'intérieur se remplit.
      const inLiquid = cell.kind === "inside" && fill > 0 && cell.y >= liquidTop;
      let color: string;
      let side = dot;
      if (inLiquid) {
        color = palette.signal;
        side = dot * 1.1;
      } else if (cell.kind === "inside") {
        color = palette.line;
        side = dot * 0.7;
      } else {
        color = palette.ink;
      }
      context.fillStyle = color;
      context.fillRect(Math.round(cell.x - side / 2), Math.round(cell.y - side / 2), side, side);
    }
  }, []);

  const canvasRef = useFieldCanvas(draw, { duration: DURATION, dataKey: "glass", onComplete });

  return (
    <canvas
      ref={canvasRef}
      className="glassfield"
      style={{ width: `${size}px`, height: `${Math.round(size * 1.5)}px` }}
      aria-hidden="true"
    />
  );
}
