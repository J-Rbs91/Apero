import type { AperitifEvent, AperitifOption, ParticipantResponse } from "../types/apero";
import { sanitizeAperoEvent } from "./aperoValidation";
import { normalizeMemberName } from "./memberName";

type LegacyParticipant = ParticipantResponse & {
  name?: string;
};

type LegacyEvent = Partial<Omit<AperitifEvent, "participants" | "options">> & {
  location?: string;
  options?: AperitifOption[];
  slots?: Array<{ id: string; label: string; dateTime?: string }>;
  participants?: LegacyParticipant[];
  responses?: LegacyParticipant[];
  createdBy?: string;
};

function normalizeOrganizerOption(
  option: AperitifOption,
  organizerName: string,
  createdAt: string,
): AperitifOption {
  return {
    ...option,
    createdByRole: option.createdByRole ?? "organizer",
    createdByName: option.createdByName ?? organizerName,
    createdAt: option.createdAt ?? createdAt,
  };
}

export function normalizeEvent(rawEvent: unknown, expectedId?: string): AperitifEvent {
  // Contenu d\u00e9chiffr\u00e9 = donn\u00e9es contr\u00f4l\u00e9es par un porteur de cl\u00e9 : un objet
  // hostile (champs du mauvais type, tableaux qui n'en sont pas) ne doit pas
  // faire remonter une TypeError brute. On laisse sanitizeAperoEvent rejeter
  // proprement tout ce qui n'est pas un objet, et on garde chaque acc\u00e8s typ\u00e9.
  if (!rawEvent || typeof rawEvent !== "object" || Array.isArray(rawEvent)) {
    return sanitizeAperoEvent(rawEvent, expectedId);
  }

  const event = rawEvent as LegacyEvent;
  const now = new Date().toISOString();
  const rawParticipants = Array.isArray(event.participants)
    ? event.participants
    : Array.isArray(event.responses)
      ? event.responses
      : [];
  const title = typeof event.title === "string" ? event.title.trim() || undefined : undefined;
  const createdAt = event.createdAt ?? now;
  const organizerName = event.organizerName ?? event.createdBy ?? "Quelqu\u2019un du comptoir";
  const rawOptions = Array.isArray(event.options) ? event.options : undefined;
  const rawSlots = Array.isArray(event.slots) ? event.slots : undefined;
  const options =
    rawOptions?.map((option) => normalizeOrganizerOption(option, organizerName, createdAt)) ??
    rawSlots?.map((slot) =>
      normalizeOrganizerOption(
        {
          id: slot.id,
          date: typeof slot.dateTime === "string" ? slot.dateTime.slice(0, 10) : "",
          time: typeof slot.dateTime === "string" ? slot.dateTime.slice(11, 16) : "",
          location: event.location ?? "\u00c9tablissement \u00e0 confirmer",
          note: slot.label,
        },
        organizerName,
        createdAt,
      ),
    ) ??
    [];

  return sanitizeAperoEvent(
    {
      id: event.id ?? "apero_inconnu",
      ceremonialName: event.ceremonialName ?? title ?? "Ap\u00e9ro sans nom",
      title,
      organizerName,
      description: event.description || undefined,
      beaufLevel: event.beaufLevel ?? "medium",
      status: event.status ?? "active",
      childrenAllowed: event.childrenAllowed,
      recurrence: event.recurrence,
      options,
      participants: rawParticipants.map((participant) => ({
        ...participant,
        participantName: participant?.participantName ?? participant?.name ?? "Convive anonyme",
        createdAt: participant?.createdAt ?? participant?.updatedAt ?? now,
        updatedAt: participant?.updatedAt ?? now,
      })),
      createdAt,
      updatedAt: event.updatedAt ?? now,
      closedAt: event.closedAt,
      selectedOptionId: event.selectedOptionId,
    },
    expectedId,
  );
}

export function upsertParticipant(
  event: AperitifEvent,
  response: ParticipantResponse,
): AperitifEvent {
  // Même clé de normalisation que le reste de l'app (récompenses, badges,
  // invités) : sans quoi un revote sous une variante accentuée ou espacée
  // (« José » vs « jose ») créerait un participant en double.
  const normalizedName = normalizeMemberName(response.participantName);
  const existingParticipantIndex = event.participants.findIndex(
    (participant) =>
      normalizeMemberName(participant.participantName) === normalizedName,
  );
  const participants = [...event.participants];

  if (existingParticipantIndex >= 0) {
    participants[existingParticipantIndex] = {
      ...response,
      id: participants[existingParticipantIndex].id,
      createdAt: participants[existingParticipantIndex].createdAt,
    };
  } else {
    participants.push(response);
  }

  return {
    ...event,
    participants,
    updatedAt: new Date().toISOString(),
  };
}

export function appendEventOption(
  event: AperitifEvent,
  option: AperitifOption,
): AperitifEvent {
  return {
    ...event,
    options: [...event.options, option],
    updatedAt: new Date().toISOString(),
  };
}