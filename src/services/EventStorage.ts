import type { AperitifEvent, ParticipantResponse } from "../types/apero";

export type EventStorage = {
  getEvent(id: string): Promise<AperitifEvent | null>;
  createEvent(event: AperitifEvent): Promise<void>;
  updateEvent(event: AperitifEvent): Promise<void>;
  saveParticipantResponse(
    eventId: string,
    response: ParticipantResponse,
  ): Promise<AperitifEvent>;
};
