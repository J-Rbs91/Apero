import type { AperitifEvent, AperitifOption, ParticipantResponse } from "../types/apero";
import { sanitizeAperoEvent } from "./aperoValidation";
import { createId } from "./createId";

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
  const event = rawEvent as LegacyEvent;
  const now = new Date().toISOString();
  const participants = event.participants ?? event.responses ?? [];
  const title = event.title?.trim() || undefined;
  const createdAt = event.createdAt ?? now;
  const organizerName = event.organizerName ?? event.createdBy ?? "Quelqu\u2019un du comptoir";
  const options =
    event.options?.map((option) => normalizeOrganizerOption(option, organizerName, createdAt)) ??
    event.slots?.map((slot) =>
      normalizeOrganizerOption(
        {
          id: slot.id,
          date: slot.dateTime?.slice(0, 10) ?? "",
          time: slot.dateTime?.slice(11, 16) ?? "",
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
      options,
      participants: participants.map((participant) => ({
        ...participant,
        participantName: participant.participantName ?? participant.name ?? "Convive anonyme",
        createdAt: participant.createdAt ?? participant.updatedAt ?? now,
        updatedAt: participant.updatedAt ?? now,
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
  const normalizedName = response.participantName.trim().toLowerCase();
  const existingParticipantIndex = event.participants.findIndex(
    (participant) =>
      participant.participantName.trim().toLowerCase() === normalizedName,
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
  const withOption: AperitifEvent = {
    ...event,
    options: [...event.options, option],
    updatedAt: new Date().toISOString(),
  };

  // Proposer un créneau, c'est déjà s'engager à y être : celui qui le crée est
  // automatiquement noté partant (« oui ») sur son propre créneau.
  const proposerName = option.createdByName?.trim().replace(/\s+/g, " ");
  if (!proposerName) {
    return withOption;
  }

  return markProposerAvailableForOption(withOption, proposerName, option.id);
}

/**
 * Note le proposeur d'un créneau comme partant (« oui ») sur ce créneau.
 * S'il vote déjà sur l'apéro, on complète ses votes sans écraser les autres ;
 * sinon on crée sa réponse de participant.
 */
function markProposerAvailableForOption(
  event: AperitifEvent,
  proposerName: string,
  optionId: string,
): AperitifEvent {
  const normalizedName = proposerName.toLowerCase();
  const existingIndex = event.participants.findIndex(
    (participant) =>
      participant.participantName.trim().toLowerCase() === normalizedName,
  );
  const now = new Date().toISOString();
  const participants = [...event.participants];

  if (existingIndex >= 0) {
    const existing = participants[existingIndex];
    participants[existingIndex] = {
      ...existing,
      votes: { ...existing.votes, [optionId]: "yes" },
      updatedAt: now,
    };
  } else {
    participants.push({
      id: createId("participant"),
      participantName: proposerName,
      votes: { [optionId]: "yes" },
      createdAt: now,
      updatedAt: now,
    });
  }

  return { ...event, participants };
}