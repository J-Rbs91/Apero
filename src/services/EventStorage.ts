import type { AperitifEvent, AperitifOption, ParticipantResponse } from "../types/apero";

export type EventStorage = {
  getEvent(id: string): Promise<AperitifEvent | null>;
  listActiveEvents(): Promise<AperitifEvent[]>;
  createEvent(event: AperitifEvent): Promise<void>;
  updateEvent(event: AperitifEvent): Promise<void>;
  addEventOption(eventId: string, option: AperitifOption): Promise<AperitifEvent>;
  saveParticipantResponse(
    eventId: string,
    response: ParticipantResponse,
  ): Promise<AperitifEvent>;
};
