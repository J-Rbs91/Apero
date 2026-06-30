import type { AperitifEvent, AperitifOption, ParticipantResponse } from "../types/apero";

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

export function normalizeEvent(rawEvent: unknown): AperitifEvent {
  const event = rawEvent as LegacyEvent;
  const now = new Date().toISOString();
  const participants = event.participants ?? event.responses ?? [];
  const options =
    event.options ??
    event.slots?.map((slot) => ({
      id: slot.id,
      date: slot.dateTime?.slice(0, 10) ?? "",
      time: slot.dateTime?.slice(11, 16) ?? "",
      location: event.location ?? "Lieu a confirmer",
      note: slot.label,
    })) ??
    [];

  return {
    id: event.id ?? "apero_inconnu",
    title: event.title ?? "Apero sans etiquette",
    organizerName: event.organizerName ?? event.createdBy ?? "Organisateur mystere",
    description: event.description || undefined,
    beaufLevel: event.beaufLevel ?? "medium",
    options,
    participants: participants.map((participant) => ({
      ...participant,
      participantName: participant.participantName ?? participant.name ?? "Anonyme",
      createdAt: participant.createdAt ?? participant.updatedAt ?? now,
      updatedAt: participant.updatedAt ?? now,
    })),
    createdAt: event.createdAt ?? now,
    updatedAt: event.updatedAt ?? now,
  };
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
