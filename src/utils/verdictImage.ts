// Le Tableau de Chasse : le verdict d'un apéro rendu en image partageable.
//
// Dessiné au canvas dans la direction artistique de l'app (mur vert profond,
// jaune pastis, crème — jamais d'emoji), au format portrait 4:5 qui passe bien
// dans les conversations. L'image ne contient AUCUNE clé ni lien : juste le
// verdict, les comptes et le Traquenard-O-mètre. Le lien, lui, se partage à
// côté, en texte.

import type { AperitifEvent, AperitifOption } from "../types/apero";

const WIDTH = 1080;
const HEIGHT = 1350;

// Palette miroir de src/styles/global.css.
const COLORS = {
  backgroundTop: "#11342a",
  backgroundBottom: "#0a241b",
  pastis: "#f4c542",
  pastisSoft: "#ffe39a",
  cream: "#fff7e6",
  muted: "rgba(255, 247, 230, 0.62)",
  barRed: "#b8322b",
  panel: "rgba(255, 247, 230, 0.07)",
  panelBorder: "rgba(255, 247, 230, 0.2)",
};

const FONT = '"Manrope", system-ui, "Segoe UI", Arial, sans-serif';

export type VerdictImageInput = {
  event: AperitifEvent;
  option: AperitifOption;
  counts: { yes: number; maybe: number; no: number };
  traquenardAverage: number | null;
};

function formatVerdictDate(option: AperitifOption): string {
  if (!option.date) {
    return "Date mystère";
  }
  const label = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${option.date}T00:00:00`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// Découpe un texte en lignes qui tiennent dans maxWidth (mesure canvas).
function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) {
    lines.push(current);
  }
  return lines;
}

function drawCount(
  context: CanvasRenderingContext2D,
  centerX: number,
  y: number,
  value: number,
  label: string,
) {
  context.textAlign = "center";
  context.fillStyle = COLORS.cream;
  context.font = `800 92px ${FONT}`;
  context.fillText(String(value), centerX, y);
  context.fillStyle = COLORS.muted;
  context.font = `700 30px ${FONT}`;
  context.fillText(label, centerX, y + 52);
}

/** Rend le tableau de chasse en PNG. Null hors navigateur ou canvas indisponible. */
export async function renderVerdictImage(input: VerdictImageInput): Promise<Blob | null> {
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

  // Fond : dégradé du mur vert.
  const background = context.createLinearGradient(0, 0, 0, HEIGHT);
  background.addColorStop(0, COLORS.backgroundTop);
  background.addColorStop(1, COLORS.backgroundBottom);
  context.fillStyle = background;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  // Liseré rouge de comptoir en haut.
  context.fillStyle = COLORS.barRed;
  context.fillRect(0, 0, WIDTH, 14);

  const margin = 84;
  let y = 170;

  // Enseigne.
  context.textAlign = "left";
  context.fillStyle = COLORS.pastis;
  context.font = `800 34px ${FONT}`;
  const brand = "LA CONFRÉRIE DU PETIT JAUNE";
  context.fillText(brand.split("").join(" "), margin, y);
  y += 46;
  context.fillStyle = COLORS.muted;
  context.font = `600 28px ${FONT}`;
  context.fillText("Tableau de chasse — le registre fait foi", margin, y);
  y += 96;

  // Nom cérémoniel.
  context.fillStyle = COLORS.cream;
  context.font = `800 76px ${FONT}`;
  for (const line of wrapText(context, input.event.ceremonialName, WIDTH - margin * 2).slice(0, 3)) {
    context.fillText(line, margin, y);
    y += 88;
  }
  if (input.event.title) {
    context.fillStyle = COLORS.pastisSoft;
    context.font = `italic 600 36px ${FONT}`;
    for (const line of wrapText(context, `« ${input.event.title} »`, WIDTH - margin * 2).slice(0, 2)) {
      context.fillText(line, margin, y);
      y += 48;
    }
  }
  y += 30;

  // Trait pastis.
  context.fillStyle = COLORS.pastis;
  context.fillRect(margin, y, 180, 6);
  y += 84;

  // Le verdict.
  context.fillStyle = COLORS.pastis;
  context.font = `800 30px ${FONT}`;
  context.fillText("LE VERDICT", margin, y);
  y += 62;
  context.fillStyle = COLORS.cream;
  context.font = `800 52px ${FONT}`;
  context.fillText(formatVerdictDate(input.option), margin, y);
  y += 66;
  context.font = `700 44px ${FONT}`;
  context.fillText(`${input.option.time || "Heure mystère"} — ${input.option.location}`, margin, y);
  y += 54;
  if (input.option.locationAddress) {
    context.fillStyle = COLORS.muted;
    context.font = `600 30px ${FONT}`;
    for (const line of wrapText(context, input.option.locationAddress, WIDTH - margin * 2).slice(0, 2)) {
      context.fillText(line, margin, y);
      y += 40;
    }
  }
  y += 46;

  // Panneau des comptes.
  const panelHeight = 220;
  context.fillStyle = COLORS.panel;
  context.strokeStyle = COLORS.panelBorder;
  context.lineWidth = 2;
  context.beginPath();
  context.roundRect(margin, y, WIDTH - margin * 2, panelHeight, 26);
  context.fill();
  context.stroke();

  const columnWidth = (WIDTH - margin * 2) / 3;
  const countsY = y + 118;
  drawCount(context, margin + columnWidth * 0.5, countsY, input.counts.yes, "Présences");
  drawCount(context, margin + columnWidth * 1.5, countsY, input.counts.maybe, "Hésitations");
  drawCount(context, margin + columnWidth * 2.5, countsY, input.counts.no, "Désertions");
  y += panelHeight + 92;

  // Traquenard-O-mètre.
  context.textAlign = "left";
  context.fillStyle = COLORS.pastis;
  context.font = `800 30px ${FONT}`;
  context.fillText("TRAQUENARD-O-MÈTRE", margin, y);
  y += 44;

  const gaugeWidth = WIDTH - margin * 2;
  const gaugeHeight = 26;
  context.fillStyle = COLORS.panel;
  context.beginPath();
  context.roundRect(margin, y, gaugeWidth, gaugeHeight, 13);
  context.fill();

  if (input.traquenardAverage != null) {
    const ratio = Math.max(0, Math.min(1, input.traquenardAverage / 10));
    context.fillStyle = ratio >= 0.7 ? COLORS.barRed : COLORS.pastis;
    context.beginPath();
    context.roundRect(margin, y, Math.max(gaugeHeight, gaugeWidth * ratio), gaugeHeight, 13);
    context.fill();
  }
  y += gaugeHeight + 48;
  context.fillStyle = COLORS.muted;
  context.font = `600 30px ${FONT}`;
  context.fillText(
    input.traquenardAverage != null
      ? `Pronostic de la tablée : ${input.traquenardAverage.toFixed(1)} / 10`
      : "Pronostic de la tablée : aucun avis, méfiance.",
    margin,
    y,
  );

  // Pied : l'organisateur signe.
  context.fillStyle = COLORS.cream;
  context.font = `700 32px ${FONT}`;
  context.fillText(`Assemblée convoquée par ${input.event.organizerName}`, margin, HEIGHT - 96);
  context.fillStyle = COLORS.muted;
  context.font = `600 26px ${FONT}`;
  context.fillText("Chacun s’abreuve selon sa conscience et sa constitution.", margin, HEIGHT - 52);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

export type VerdictImageOutcome = "shared" | "downloaded" | "failed";

/**
 * Partage l'image via la feuille de partage native quand elle accepte les
 * fichiers, sinon la télécharge. L'appelant affiche le retour à l'utilisateur.
 */
export async function shareOrDownloadVerdictImage(
  input: VerdictImageInput,
  fileName: string,
): Promise<VerdictImageOutcome> {
  const blob = await renderVerdictImage(input);
  if (!blob) {
    return "failed";
  }

  const file = new File([blob], fileName, { type: "image/png" });

  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return "shared";
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") {
        return "shared";
      }
      // Feuille de partage indisponible : on retombe sur le téléchargement.
    }
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return "downloaded";
}
