// Les Comptes du Comptoir en image : le bilan annuel d'un membre, rendu dans
// la même direction artistique que le Tableau de Chasse, prêt à être posé
// dans la conversation. Aucune clé, aucun lien — que des chiffres et du blaze.

import type { YearRecap } from "./yearRecap";
import { shareOrDownloadPng, type ImageShareOutcome } from "./imageShare";
import { CANVAS_COLORS, CANVAS_FONT, wrapCanvasText } from "./verdictImage";

const WIDTH = 1080;
const HEIGHT = 1350;

export type RecapImageInput = {
  recap: YearRecap;
  memberName: string;
};

function drawStat(
  context: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  value: string,
  label: string,
) {
  context.textAlign = "center";
  context.fillStyle = CANVAS_COLORS.cream;
  context.font = `800 88px ${CANVAS_FONT}`;
  context.fillText(value, centerX, y);
  context.fillStyle = CANVAS_COLORS.muted;
  context.font = `700 28px ${CANVAS_FONT}`;
  context.fillText(label, centerX, y + 46);
}

function drawLine(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  value: string,
): number {
  context.textAlign = "left";
  context.fillStyle = CANVAS_COLORS.pastis;
  context.font = `800 28px ${CANVAS_FONT}`;
  context.fillText(label.toUpperCase(), x, y);
  context.fillStyle = CANVAS_COLORS.cream;
  context.font = `700 40px ${CANVAS_FONT}`;
  let lineY = y + 52;
  for (const line of wrapCanvasText(context, value, WIDTH - x * 2).slice(0, 2)) {
    context.fillText(line, x, lineY);
    lineY += 50;
  }
  return lineY + 34;
}

export async function renderRecapImage({ recap, memberName }: RecapImageInput): Promise<Blob | null> {
  if (typeof document === "undefined") {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  const background = context.createLinearGradient(0, 0, 0, HEIGHT);
  background.addColorStop(0, CANVAS_COLORS.backgroundTop);
  background.addColorStop(1, CANVAS_COLORS.backgroundBottom);
  context.fillStyle = background;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.fillStyle = CANVAS_COLORS.barRed;
  context.fillRect(0, 0, WIDTH, 14);

  const margin = 84;
  let y = 170;

  context.textAlign = "left";
  context.fillStyle = CANVAS_COLORS.pastis;
  context.font = `800 34px ${CANVAS_FONT}`;
  context.fillText("LA CONFRÉRIE DU PETIT JAUNE".split("").join(" "), margin, y);
  y += 46;
  context.fillStyle = CANVAS_COLORS.muted;
  context.font = `600 28px ${CANVAS_FONT}`;
  context.fillText(`Les Comptes du Comptoir — exercice ${recap.year}`, margin, y);
  y += 100;

  context.fillStyle = CANVAS_COLORS.cream;
  context.font = `800 72px ${CANVAS_FONT}`;
  for (const line of wrapCanvasText(context, memberName, WIDTH - margin * 2).slice(0, 2)) {
    context.fillText(line, margin, y);
    y += 84;
  }
  y += 10;

  context.fillStyle = CANVAS_COLORS.pastis;
  context.fillRect(margin, y, 180, 6);
  y += 90;

  // Panneau des trois grands chiffres.
  const panelHeight = 210;
  context.fillStyle = CANVAS_COLORS.panel;
  context.strokeStyle = CANVAS_COLORS.panelBorder;
  context.lineWidth = 2;
  context.beginPath();
  context.roundRect(margin, y, WIDTH - margin * 2, panelHeight, 26);
  context.fill();
  context.stroke();

  const columnWidth = (WIDTH - margin * 2) / 3;
  const statsY = y + 112;
  drawStat(context, margin + columnWidth * 0.5, statsY, String(recap.organizedCount), "Convoquées");
  drawStat(context, margin + columnWidth * 1.5, statsY, String(recap.participatedCount), "Émargées");
  drawStat(context, margin + columnWidth * 2.5, statsY, String(recap.fellowCount), "Blazes croisés");
  y += panelHeight + 92;

  y = drawLine(
    context,
    margin,
    y,
    "Au registre",
    `${recap.yesCount} présences, ${recap.maybeCount} hésitations, ${recap.noCount} désertions`,
  );

  if (recap.favoriteLocation) {
    y = drawLine(context, margin, y, "Quartier général", recap.favoriteLocation);
  }

  if (recap.biggestTableName) {
    y = drawLine(
      context,
      margin,
      y,
      "La plus grande tablée",
      `${recap.biggestTableName} (${recap.biggestTableSize} convives)`,
    );
  }

  y = drawLine(
    context,
    margin,
    y,
    "Traquenard-O-mètre personnel",
    recap.averageTraquenard != null
      ? `${recap.averageTraquenard.toFixed(1)} / 10 de pronostic moyen`
      : "Aucun pronostic déposé, prudence de sioux",
  );

  context.textAlign = "left";
  context.fillStyle = CANVAS_COLORS.muted;
  context.font = `600 26px ${CANVAS_FONT}`;
  context.fillText("Le registre fait foi. Le reste est légende.", margin, HEIGHT - 52);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

export async function shareOrDownloadRecapImage(
  input: RecapImageInput,
  fileName: string,
): Promise<ImageShareOutcome> {
  return shareOrDownloadPng(await renderRecapImage(input), fileName);
}
