// « Remettre ça » et tournées récurrentes.
//
// Une fois l'apéro passé, n'importe quel membre de la tablée peut convoquer
// le suivant : on pré-remplit le formulaire de création avec le lieu, l'heure
// et la cadence de l'assemblée écoulée, décalés vers la prochaine date utile.
// C'est ainsi qu'un invité devient organisateur, et qu'un apéro devient un
// rituel.

import type { AperitifEvent, AperitifOption, AperoRecurrence } from "../types/apero";
import { calculateBestOptions } from "./calculateResults";

// Pré-remplissage du formulaire de création (transmis via location.state).
export type CreateEventPrefill = {
  ceremonialName?: string;
  title?: string;
  childrenAllowed?: boolean;
  recurrence?: AperoRecurrence;
  options: Array<
    Pick<
      AperitifOption,
      "date" | "time" | "location" | "locationAddress" | "locationLat" | "locationLng"
    >
  >;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function describeRecurrence(recurrence: AperoRecurrence): string {
  switch (recurrence) {
    case "weekly":
      return "chaque semaine";
    case "biweekly":
      return "toutes les deux semaines";
    case "monthly":
      return "chaque mois";
  }
}

function parseOptionStart(option: AperitifOption): Date | null {
  if (!option.date || !option.time) {
    return null;
  }
  const parsed = new Date(`${option.date}T${option.time}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// Prochain rendez-vous à partir d'une date : + 7 jours, + 14 jours, ou même
// jour le mois suivant. Sans cadence déclarée, on remet ça à la semaine
// prochaine — le réflexe naturel du comptoir.
export function addRecurrenceInterval(date: Date, recurrence?: AperoRecurrence): Date {
  if (recurrence === "monthly") {
    const next = new Date(date);
    const dayOfMonth = next.getDate();
    next.setMonth(next.getMonth() + 1);
    // Débordement (ex. 31 janvier + 1 mois → 2/3 mars) : on retombe sur le
    // dernier jour du mois visé plutôt que de glisser au mois d'après.
    if (next.getDate() !== dayOfMonth) {
      next.setDate(0);
    }
    return next;
  }
  const days = recurrence === "biweekly" ? 14 : 7;
  return new Date(date.getTime() + days * DAY_MS);
}

// Créneau de référence de l'apéro écoulé : le créneau confirmé, sinon celui en
// tête des votes, sinon le premier créneau daté.
export function pickReferenceOption(event: AperitifEvent): AperitifOption | undefined {
  if (event.selectedOptionId) {
    const selected = event.options.find((option) => option.id === event.selectedOptionId);
    if (selected) {
      return selected;
    }
  }

  const result = calculateBestOptions(event);
  if (result.type === "winner") {
    const winner = event.options.find((option) => option.id === result.optionId);
    if (winner) {
      return winner;
    }
  }

  return event.options.find((option) => Boolean(option.date && option.time)) ?? event.options[0];
}

function toDateInputValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Pré-remplissage de la prochaine tournée : mêmes lieu, heure, politique
 * mioches et cadence, avec une date décalée d'autant d'intervalles qu'il faut
 * pour retomber dans le futur.
 */
export function buildNextRoundPrefill(event: AperitifEvent, now = new Date()): CreateEventPrefill {
  const reference = pickReferenceOption(event);

  let nextDate = "";
  const start = reference ? parseOptionStart(reference) : null;
  if (start) {
    let candidate = start;
    // Garde-fou : jamais plus de 400 sauts, même sur un apéro préhistorique.
    for (let hop = 0; hop < 400 && candidate.getTime() <= now.getTime(); hop += 1) {
      candidate = addRecurrenceInterval(candidate, event.recurrence);
    }
    if (candidate.getTime() > now.getTime()) {
      nextDate = toDateInputValue(candidate);
    }
  }

  return {
    ceremonialName: event.ceremonialName,
    title: event.title,
    childrenAllowed: event.childrenAllowed,
    recurrence: event.recurrence,
    options: [
      {
        date: nextDate,
        time: reference?.time ?? "",
        location: reference?.location ?? "",
        locationAddress: reference?.locationAddress,
        locationLat: reference?.locationLat,
        locationLng: reference?.locationLng,
      },
    ],
  };
}
