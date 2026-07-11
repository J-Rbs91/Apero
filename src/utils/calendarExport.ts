// Export d'un créneau d'apéro au format iCalendar (.ics).
//
// « Graver au registre » : une fois le verdict tombé, l'apéro mérite mieux
// qu'un coin de mémoire — il entre dans le calendrier du convive, comme les
// rendez-vous sérieux. L'heure est volontairement « flottante » (sans fuseau) :
// un apéro à 19h30 est à 19h30 là où se trouve le zinc, pas en UTC.

import type { AperitifEvent, AperitifOption } from "../types/apero";

// Personne ne sait quand un apéro se termine, mais deux heures restent le
// mensonge socialement acceptable qu'attend un calendrier.
const DEFAULT_DURATION_MINUTES = 120;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

// Texte iCalendar : échappement RFC 5545 (antislash, point-virgule, virgule,
// retours à la ligne).
export function escapeIcsText(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Repli des lignes à 74 octets (RFC 5545 § 3.1) : la suite d'une ligne longue
// commence par un espace. On plie par caractères, ce qui reste sous la limite
// d'octets pour nos contenus essentiellement latins.
function foldIcsLine(line: string): string {
  if (line.length <= 74) {
    return line;
  }
  const parts: string[] = [line.slice(0, 74)];
  for (let index = 74; index < line.length; index += 73) {
    parts.push(` ${line.slice(index, index + 73)}`);
  }
  return parts.join("\r\n");
}

function parseOptionStart(option: AperitifOption): Date | null {
  if (!option.date || !option.time) {
    return null;
  }
  const parsed = new Date(`${option.date}T${option.time}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// Date-heure locale « flottante » : YYYYMMDDTHHMMSS, sans suffixe de fuseau.
function toIcsLocalDateTime(date: Date): string {
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

function toIcsUtcDateTime(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

export type BuildAperoIcsInput = {
  event: AperitifEvent;
  option: AperitifOption;
  /** Lien d'invitation complet, glissé dans la description si fourni. */
  inviteUrl?: string;
  /** Injectable pour des tests déterministes. */
  now?: Date;
};

/**
 * Contenu .ics d'un créneau d'apéro, ou null si le créneau n'a pas de
 * date/heure exploitable.
 */
export function buildAperoIcs({ event, option, inviteUrl, now }: BuildAperoIcsInput): string | null {
  const start = parseOptionStart(option);
  if (!start) {
    return null;
  }

  const end = new Date(start.getTime() + DEFAULT_DURATION_MINUTES * 60 * 1000);
  const stamp = now ?? new Date();

  const summary = `Apéro — ${event.ceremonialName}`;
  const descriptionParts = [
    `Convocation de ${event.organizerName} pour « ${event.ceremonialName} ».`,
  ];
  if (event.title) {
    descriptionParts.push(`Au programme : ${event.title}`);
  }
  if (inviteUrl) {
    descriptionParts.push(`Invitation : ${inviteUrl}`);
  }

  const location = option.locationAddress
    ? `${option.location} — ${option.locationAddress}`
    : option.location;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//La Confrerie du Petit Jaune//Apero//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}-${option.id}@confrerie-du-petit-jaune`,
    `DTSTAMP:${toIcsUtcDateTime(stamp)}`,
    `DTSTART:${toIcsLocalDateTime(start)}`,
    `DTEND:${toIcsLocalDateTime(end)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(descriptionParts.join("\n"))}`,
    `LOCATION:${escapeIcsText(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}

// Nom de fichier sans accents ni caractères réservés, pour voyager partout.
export function buildIcsFileName(event: AperitifEvent): string {
  const slug = event.ceremonialName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${slug || "apero"}.ics`;
}

/** Déclenche le téléchargement du fichier .ics dans le navigateur. */
export function downloadAperoIcs(input: BuildAperoIcsInput): boolean {
  const content = buildAperoIcs(input);
  if (!content || typeof document === "undefined") {
    return false;
  }

  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = buildIcsFileName(input.event);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return true;
}
