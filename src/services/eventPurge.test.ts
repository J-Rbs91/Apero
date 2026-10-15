import { describe, expect, it } from "vitest";
import type { AperitifEvent } from "../types/apero";
import {
  buildPurgedEventRecord,
  createEmptyRewardsLedger,
  getEventReferenceDateTime,
  isEventExpired,
  updateRewardsLedger,
} from "./eventPurge";

function createEvent(overrides: Partial<AperitifEvent> = {}): AperitifEvent {
  return {
    id: "apero_test",
    ceremonialName: "Le Concile du Saucisson",
    organizerName: "Jérémy",
    beaufLevel: "medium",
    status: "active",
    options: [
      {
        id: "option_1",
        date: "2026-06-29",
        time: "19:00",
        location: "Le Bar du Coin",
        createdByRole: "organizer",
        createdByName: "Jérémy",
      },
      {
        id: "option_2",
        date: "2026-07-04",
        time: "18:30",
        location: "Chez Dédé",
        createdByRole: "participant",
        createdByName: "Jojo",
      },
    ],
    participants: [
      {
        id: "participant_1",
        participantName: "Jojo",
        votes: { option_1: "yes", option_2: "maybe" },
        brings: "Saucisson",
        comment: "Je viens si le jaune est frais",
        createdAt: "2026-06-30T18:00:00.000Z",
        updatedAt: "2026-06-30T18:00:00.000Z",
      },
    ],
    createdAt: "2026-06-30T18:00:00.000Z",
    updatedAt: "2026-06-30T18:00:00.000Z",
    ...overrides,
  };
}

describe("event purge", () => {
  it("uses the selected option as reference date when present", () => {
    const event = createEvent({ status: "closed", selectedOptionId: "option_1" });
    const referenceDate = getEventReferenceDateTime(event);

    expect(referenceDate?.getFullYear()).toBe(2026);
    expect(referenceDate?.getMonth()).toBe(5);
    expect(referenceDate?.getDate()).toBe(29);
    expect(referenceDate?.getHours()).toBe(19);
  });

  it("uses the latest valid option when no selected option exists", () => {
    const event = createEvent();
    const referenceDate = getEventReferenceDateTime(event);

    expect(referenceDate?.getFullYear()).toBe(2026);
    expect(referenceDate?.getMonth()).toBe(6);
    expect(referenceDate?.getDate()).toBe(4);
    expect(referenceDate?.getHours()).toBe(18);
    expect(referenceDate?.getMinutes()).toBe(30);
  });

  it("expires events with no valid option", () => {
    const event = createEvent({ options: [] });

    expect(isEventExpired(event, new Date("2026-06-30T12:00:00.000Z"))).toBe(true);
  });

  it("keeps participant and organizer reward stats before purge", () => {
    const now = new Date("2026-07-05T10:00:00.000Z");
    const event = createEvent();
    const record = buildPurgedEventRecord(event, now);
    const ledger = updateRewardsLedger(createEmptyRewardsLedger(now), event, record);

    expect(ledger.purgedEvents).toHaveLength(1);
    expect(ledger.purgedEvents[0]).toMatchObject({
      eventId: "apero_test",
      participantCount: 1,
      optionCount: 2,
      participantOptionCount: 1,
      hadParticipantAlternative: true,
    });
    expect(ledger.members.jeremy.organizedRealEventCount).toBe(1);
    expect(ledger.members.jojo.participatedEventCount).toBe(1);
    expect(ledger.members.jojo.totalVoteCount).toBe(2);
    expect(ledger.members.jojo.maybeVoteCount).toBe(1);
    expect(ledger.members.jojo.contributionCount).toBe(1);
    expect(ledger.members.jojo.commentCount).toBe(1);
    expect(ledger.members.jojo.proposedOptionCount).toBe(1);
  });

  it("awards the loose badge only when no guest said present", () => {
    const now = new Date("2026-07-05T10:00:00.000Z");

    const lonelyEvent = createEvent({
      options: [
        {
          id: "option_1",
          date: "2026-06-29",
          time: "19:00",
          location: "Le Bar du Coin",
          createdByRole: "organizer",
          createdByName: "Jérémy",
        },
      ],
      participants: [
        {
          id: "participant_org",
          participantName: "Jérémy",
          votes: { option_1: "yes" },
          createdAt: "2026-06-30T18:00:00.000Z",
          updatedAt: "2026-06-30T18:00:00.000Z",
        },
      ],
    });
    const lonelyRecord = buildPurgedEventRecord(lonelyEvent, now);
    expect(lonelyRecord.hadPresentGuest).toBe(false);
    const lonelyLedger = updateRewardsLedger(createEmptyRewardsLedger(now), lonelyEvent, lonelyRecord);
    expect(lonelyLedger.members.jeremy.organizedLonelyEventCount).toBe(1);
    expect(lonelyLedger.members.jeremy.organizedRealEventCount).toBe(0);

    const livelyEvent = createEvent();
    const livelyRecord = buildPurgedEventRecord(livelyEvent, now);
    expect(livelyRecord.hadPresentGuest).toBe(true);
    const livelyLedger = updateRewardsLedger(createEmptyRewardsLedger(now), livelyEvent, livelyRecord);
    expect(livelyLedger.members.jeremy.organizedLonelyEventCount).toBe(0);
    expect(livelyLedger.members.jeremy.organizedRealEventCount).toBe(1);
  });

  it("does not double count an already purged event", () => {
    const now = new Date("2026-07-05T10:00:00.000Z");
    const event = createEvent();
    const record = buildPurgedEventRecord(event, now);
    const ledger = updateRewardsLedger(createEmptyRewardsLedger(now), event, record);
    const secondLedger = updateRewardsLedger(ledger, event, record);

    expect(secondLedger.purgedEvents).toHaveLength(1);
    expect(secondLedger.members.jojo.participatedEventCount).toBe(1);
  });

  it("handles member names colliding with Object prototype keys without NaN or pollution", () => {
    const now = new Date("2026-07-05T10:00:00.000Z");
    const event = createEvent({
      organizerName: "constructor",
      participants: [
        {
          id: "participant_proto",
          participantName: "__proto__",
          votes: { option_1: "yes", option_2: "no" },
          createdAt: "2026-06-30T18:00:00.000Z",
          updatedAt: "2026-06-30T18:00:00.000Z",
        },
      ],
    });
    const record = buildPurgedEventRecord(event, now);
    const ledger = updateRewardsLedger(createEmptyRewardsLedger(now), event, record);

    const organizer = ledger.members["constructor"];
    expect(organizer.organizedEventCount).toBe(1);
    expect(Number.isNaN(organizer.organizedEventCount)).toBe(false);

    const guest = ledger.members["__proto__"];
    expect(guest.participatedEventCount).toBe(1);
    expect(guest.totalVoteCount).toBe(2);
    expect(Number.isNaN(guest.totalVoteCount)).toBe(false);

    // Aucune fuite vers le prototype des objets ordinaires.
    expect(({} as Record<string, unknown>).participatedEventCount).toBeUndefined();
  });
});