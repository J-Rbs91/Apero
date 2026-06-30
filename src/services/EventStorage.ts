import type { AperitifEvent, AperitifOption, ParticipantResponse } from "../types/apero";
import type { RewardsLedger } from "../types/rewards";

export type EventStorage = {
  getEvent(id: string): Promise<AperitifEvent | null>;
  isEventPurged(id: string): Promise<boolean>;
  listActiveEvents(): Promise<AperitifEvent[]>;
  createEvent(event: AperitifEvent): Promise<void>;
  updateEvent(event: AperitifEvent): Promise<void>;
  addEventOption(eventId: string, option: AperitifOption): Promise<AperitifEvent>;
  saveParticipantResponse(
    eventId: string,
    response: ParticipantResponse,
  ): Promise<AperitifEvent>;
  readRewardsLedger(): Promise<RewardsLedger>;
  purgeExpiredEvents(): Promise<void>;
};