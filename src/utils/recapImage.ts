// Les Comptes du Comptoir en image : le bilan annuel d'un membre, rendu dans
// la même direction artistique que le Tableau de Chasse, prêt à être posé
// dans la conversation. Aucune clé, aucun lien — que des chiffres et du blaze.

import type { YearRecap } from "./yearRecap";
import { shareOrDownloadPng, type ImageShareOutcome } from "./imageShare";
import { CANVAS_COLORS, CANVAS_FONT, wrapCanvasText } from "./verdictImage";

const WIDTH = 1080;

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
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  const margin = 84;
  const maxTextWidth = WIDTH - margin * 2;

  // Passe de mesure : chaque bloc « libellé + valeur » consomme une hauteur
  // qui dépend de l'enveloppement de sa valeur. Le canvas est taillé après,
  // pour que le flux n'écrase jamais le pied de page.
  context.font = `800 72px ${CANVAS_FONT}`;
  const nameLines = wrapCanvasText(context, memberName, maxTextWidth).slice(0, 2);

  const plural = (count: number) => (count > 1 ? "s" : "");
  const lineBlocks: Array<{ label: string; value: string }> = [
    {
      label: "Au registre",
      value:
        `${recap.yesCount} présence${plural(recap.yesCount)}, ` +
        `${recap.maybeCount} hésitation${plural(recap.maybeCount)}, ` +
        `${recap.noCount} désertion${plural(recap.noCount)}`,
    },
  ];
  if (recap.favoriteLocation) {
    lineBlocks.push({ label: "Quartier général", value: recap.favoriteLocation });
  }
  if (recap.biggestTableName) {
    lineBlocks.push({
      label: "La plus grande tablée",
      value: `${recap.biggestTableName} (${recap.biggestTableSize} convives)`,
    });
  }
  lineBlocks.push({
    label: "Traquenard-O-mètre personnel",
    value:
      recap.averageTraquenard != null
        ? `${recap.averageTraquenard.toFixed(1)} / 10 de pronostic moyen`
        : "Aucun pronostic déposé, prudence de sioux",
  });

  context.font = `700 40px ${CANVAS_FONT}`;
  const blockHeights = lineBlocks.map(
    (block) => 52 + wrapCanvasText(context, block.value, maxTextWidth).slice(0, 2).length * 50 + 34,
  );

  const panelHeight = 210;
  const fluxHeight =
    170 + // première ligne (enseigne)
    46 + 100 + // sous-titre + respiration
    nameLines.length * 84 +
    10 + 6 + 90 + // trait pastis
    panelHeight + 92 + // panneau des trois grands chiffres
    blockHeights.reduce((total, blockHeight) => total + blockHeight, 0) +
    92; // pied de page
  const height = Math.max(1350, fluxHeight);

  // Changer la hauteur réinitialise l'état du contexte : à faire avant tout.
  canvas.height = height;

  const background = context.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, CANVAS_COLORS.backgroundTop);
  background.addColorStop(1, CANVAS_COLORS.backgroundBottom);
  context.fillStyle = background;
  context.fillRect(0, 0, WIDTH, height);

  context.fillStyle = CANVAS_COLORS.barRed;
  context.fillRect(0, 0, WIDTH, 14);

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
  for (const line of nameLines) {
    context.fillText(line, margin, y);
    y += 84;
  }
  y += 10;

  context.fillStyle = CANVAS_COLORS.pastis;
  context.fillRect(margin, y, 180, 6);
  y += 90;

  // Panneau des trois grands chiffres.
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

  for (const block of lineBlocks) {
    y = drawLine(context, margin, y, block.label, block.value);
  }

  context.textAlign = "left";
  context.fillStyle = CANVAS_COLORS.muted;
  context.font = `600 26px ${CANVAS_FONT}`;
  context.fillText("Le registre fait foi. Le reste est légende.", margin, height - 52);

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
