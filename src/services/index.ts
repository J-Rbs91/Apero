import type { AperitifEvent, AperitifOption, ParticipantResponse } from "../types/apero";
import type { RewardsLedger } from "../types/rewards";
import type { EventStorage } from "./EventStorage";

function createEmptyLedger(): RewardsLedger {
  return {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    purgedEvents: [],
    members: {},
  };
}

function rejectLegacyWrite(): never {
  throw new Error(
    "Le stockage GitHub direct depuis le navigateur est desactive : utilise le lien d'invitation du nouveau flux API VPS.",
  );
}

export const eventStorage: EventStorage = {
  async getEvent() {
    return null;
  },

  async isEventPurged() {
    return false;
  },

  async listActiveEvents() {
    return [];
  },

  async createEvent(_event: AperitifEvent) {
    rejectLegacyWrite();
  },

  async updateEvent(_event: AperitifEvent) {
    rejectLegacyWrite();
  },

  async addEventOption(_eventId: string, _option: AperitifOption): Promise<AperitifEvent> {
    rejectLegacyWrite();
  },

  async saveParticipantResponse(
    _eventId: string,
    _response: ParticipantResponse,
  ): Promise<AperitifEvent> {
    rejectLegacyWrite();
  },

  async deleteEvent() {
    rejectLegacyWrite();
  },

  async readRewardsLedger() {
    return createEmptyLedger();
  },

  async purgeExpiredEvents() {
    // No-op: les aperos du nouveau flux sont chiffres et geres via l'API VPS.
  },
};