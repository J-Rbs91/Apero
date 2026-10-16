import { useCallback } from "react";
import { clamp, easeOutExpo, fnv1a } from "../../utils/signalMath";
import { type FieldDraw, useFieldCanvas } from "./useFieldCanvas";

export type ConstellationPoint = {
  /** Identifiant public de l'apéro (graine de la hauteur). */
  id: string;
  /** Premier créneau, en ms. */
  at: number;
  /** Nombre de réponses au registre. */
  responses: number;
  /** Le prochain rendez-vous : le seul point jaune. */
  isNext: boolean;
};

type ComptoirFieldProps = {
  points: ConstellationPoint[];
  /** Instant présent (ms), figé au rendu de l'accueil. */
  now: number;
};

const DURATION = 1200;
const GOLDEN = 0.618;

// La constellation de l'accueil (UXER_DESIGN_SYSTEM.md §8) : les apéros que
// cet appareil connaît. Abscisse = le temps, du plus ancien au plus lointain ;
// le trait vertical = maintenant ; hauteur = signature de l'apéro ; taille =
// racine du nombre de réponses ; le prochain rendez-vous en jaune, le passé en
// retrait. Sans aucun apéro : un seul point jaune dans le vide, le récipient
// qui attend d'être rempli. Purement visuelle : l'accueil dit le reste en texte.
export function ComptoirField({ points, now }: ComptoirFieldProps) {
  const dataKey = points.map((point) => `${point.id}:${point.responses}:${point.isNext ? 1 : 0}`).join("|");

  const draw = useCallback<FieldDraw>(
    (context, { width, height }, progress, palette) => {
      const pitch = 16;
      // Trame : le silence est structuré, pas vide.
      context.fillStyle = palette.line;
      for (let y = pitch / 2; y < height; y += pitch) {
        for (let x = pitch / 2; x < width; x += pitch) {
          context.fillRect(Math.round(x), Math.round(y), 1, 1);
        }
      }

      const eased = easeOutExpo(progress);

      if (points.length === 0) {
        const radius = 7 * eased;
        context.fillStyle = palette.signal;
        context.beginPath();
        context.arc(width * GOLDEN, height * (1 - GOLDEN), radius, 0, Math.PI * 2);
        context.fill();
        return;
      }

      const times = points.map((point) => point.at).concat(now);
      const min = Math.min(...times);
      const max = Math.max(...times);
      const span = Math.max(max - min, 86_400_000);
      const padX = 24;
      const toX = (ms: number) => padX + ((ms - min) / span) * (width - padX * 2);
      const nowX = toX(now);

      // Maintenant : un trait vertical qui se dessine de haut en bas.
      context.fillStyle = palette.dim;
      context.fillRect(Math.round(nowX), 0, 1, height * eased);

      points.forEach((point, index) => {
        const local = easeOutExpo(clamp((progress * DURATION - index * 70) / (DURATION * 0.75), 0, 1));
        const targetX = toX(point.at);
        const x = nowX + (targetX - nowX) * local;
        const y = height * (0.18 + 0.64 * ((fnv1a(point.id) % 1000) / 1000));
        const radius = (2.5 + Math.sqrt(point.responses) * 2.2) * (0.4 + 0.6 * local);
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        if (point.isNext) {
          context.fillStyle = palette.signal;
          context.fill();
        } else if (point.at < now) {
          context.strokeStyle = palette.dim;
          context.lineWidth = 1;
          context.stroke();
        } else {
          context.fillStyle = palette.ink;
          context.fill();
        }
      });
    },
    [now, points],
  );

  const canvasRef = useFieldCanvas(draw, { duration: DURATION, dataKey });

  return <canvas ref={canvasRef} className="constellation" aria-hidden="true" />;
}
