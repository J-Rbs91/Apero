import { type CSSProperties, useCallback } from "react";
import type { VoteStatus } from "../../types/apero";
import { clamp, easeOutExpo, fnv1a, seededRandom } from "../../utils/signalMath";
import { type FieldDraw, useFieldCanvas } from "./useFieldCanvas";

export type VoteFieldRow = {
  id: string;
  /** Repère court affiché devant la rangée (« lun. 19 »). */
  label: string;
  /** Une case par convive, dans l'ordre d'émargement ; null = pas de réponse. */
  cells: (VoteStatus | null)[];
};

type VoteFieldProps = {
  rows: VoteFieldRow[];
  /** Rangée en tête (créneau retenu ou premier ex aequo), ou -1. */
  leadIndex: number;
  /** Graine publique : l'identifiant de l'apéro. */
  seed: string;
};

const DURATION = 1400;

// Le champ des votes (UXER_DESIGN_SYSTEM.md §8) : la matrice réelle créneaux ×
// convives. Plein = « J'y serai », hachuré = « J'me tâte », barré = « Sans
// moi » — le même code que les marques du formulaire de vote. La rangée en
// tête s'allume en jaune une fois la convergence achevée. Rien n'est inventé :
// chaque signe est une réponse au registre ; la trame de fond est l'espace du
// registre, vide tant que personne n'émarge. Les chiffres restent dits en
// texte à côté (compteurs du verdict) : la figure est aria-hidden.
export function VoteField({ rows, leadIndex, seed }: VoteFieldProps) {
  const columns = rows.reduce((max, row) => Math.max(max, row.cells.length), 0);
  const dataKey = `${seed}:${leadIndex}:${rows.map((row) => row.cells.map((cell) => cell?.[0] ?? "-").join("")).join("|")}`;

  const draw = useCallback<FieldDraw>(
    (context, { width, height }, progress, palette) => {
      // La hauteur de rangée vient du CSS (28 px, 40 px en large) : le dessin
      // la relit au lieu de la dupliquer.
      const rowHeight = height / Math.max(rows.length, 1);
      const pitch = clamp(width / Math.max(columns, 10), 9, rowHeight * 1.4);
      const size = Math.max(5, Math.min(pitch, rowHeight) * 0.46);
      const random = seededRandom(fnv1a(seed));

      // Trame : l'espace du registre.
      context.fillStyle = palette.line;
      for (let y = rowHeight / 2; y < height; y += rowHeight) {
        for (let x = pitch / 2; x < width; x += pitch) {
          context.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2);
        }
      }

      const lit = clamp((progress - 0.82) / 0.18, 0, 1);

      rows.forEach((row, rowIndex) => {
        row.cells.forEach((vote, column) => {
          const startX = random() * width;
          const startY = random() * height;
          if (!vote) {
            return;
          }
          const local = clamp((progress * DURATION - rowIndex * 60 - column * 14) / (DURATION * 0.72), 0, 1);
          const eased = easeOutExpo(local);
          const targetX = column * pitch + pitch / 2;
          const targetY = rowIndex * rowHeight + rowHeight / 2;
          const x = startX + (targetX - startX) * eased;
          const y = startY + (targetY - startY) * eased;
          const isLead = rowIndex === leadIndex;
          context.globalAlpha = 0.25 + 0.75 * eased;
          const color = isLead && lit > 0.5 ? palette.signal : palette.ink;
          context.fillStyle = color;
          context.strokeStyle = color;
          context.lineWidth = 1.25;
          const left = Math.round(x - size / 2);
          const top = Math.round(y - size / 2);
          if (vote === "yes") {
            context.fillRect(left, top, size, size);
          } else if (vote === "maybe") {
            const stripes = 3;
            for (let stripe = 0; stripe < stripes; stripe += 1) {
              context.fillRect(left, top + (stripe * size) / stripes, size, Math.max(1, size / 7));
            }
          } else {
            context.strokeRect(left + 0.5, top + 0.5, size - 1, size - 1);
            context.beginPath();
            context.moveTo(left, top + size);
            context.lineTo(left + size, top);
            context.stroke();
          }
        });
      });
      context.globalAlpha = 1;
    },
    [columns, leadIndex, rows, seed],
  );

  const canvasRef = useFieldCanvas(draw, { duration: DURATION, dataKey });

  return (
    <div className="votefield" aria-hidden="true">
      <ol className="votefield__labels">
        {rows.map((row, index) => (
          <li key={row.id} className={index === leadIndex ? "is-lead" : undefined}>
            {row.label}
          </li>
        ))}
      </ol>
      <canvas
        ref={canvasRef}
        className="votefield__canvas"
        style={{ "--vf-rows": Math.max(rows.length, 1) } as CSSProperties}
      />
    </div>
  );
}
