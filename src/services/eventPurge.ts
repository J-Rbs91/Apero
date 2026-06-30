import type { AperitifEvent, AperitifOption, VoteStatus } from "../types/apero";
import type {
  MemberRewardStats,
  PurgedEventRecord,
  PurgedParticipantRecord,
  RewardsLedger,
} from "../types/rewards";
import { getGuestParticipants, hasFirstShotConsensus } from "../utils/badgeRules";
import { normalizeMemberName } from "../utils/memberName";

const LEDGER_VERSION = 1;

export type PurgeStorage = {
  purgeExpiredEvents(): Promise<void>;
};

function parseOptionDateTime(option: AperitifOption): Date | null {
  if (!option.date || !option.time) {
    return null;
  }

  const parsedDate = new Date(option.date + "T" + option.time + ":00");
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function getLatestValidOptionDate(options: AperitifOption[]): Date | null {
  return options.reduce<Date | null>((latestDate, option) => {
    const optionDate = parseOptionDateTime(option);

    if (!optionDate) {
      return latestDate;
    }

    if (!latestDate || optionDate.getTime() > latestDate.getTime()) {
      return optionDate;
    }

    return latestDate;
  }, null);
}

export function createEmptyRewardsLedger(now = new Date()): RewardsLedger {
  return {
    version: LEDGER_VERSION,
    updatedAt: now.toISOString(),
    purgedEvents: [],
    members: {},
  };
}

export function normalizeRewardsLedger(rawLedger: unknown, now = new Date()): RewardsLedger {
  const ledger = rawLedger as Partial<RewardsLedger> | null;

  return {
    version: ledger?.version ?? LEDGER_VERSION,
    updatedAt: ledger?.updatedAt ?? now.toISOString(),
    purgedEvents: ledger?.purgedEvents ?? [],
    members: ledger?.members ?? {},
  };
}

export function getEventReferenceDateTime(event: AperitifEvent): Date | null {
  if (event.selectedOptionId) {
    const selectedOption = event.options.find((option) => option.id === event.selectedOptionId);
    const selectedDate = selectedOption ? parseOptionDateTime(selectedOption) : null;

    if (selectedDate) {
      return selectedDate;
    }
  }

  return getLatestValidOptionDate(event.options);
}

export function isEventExpired(event: AperitifEvent, now: Date): boolean {
  const referenceDate = getEventReferenceDateTime(event);

  if (!referenceDate) {
    return true;
  }

  return referenceDate.getTime() < now.getTime();
}

function countVotes(votes: Record<string, VoteStatus>) {
  const voteValues = Object.values(votes);

  return {
    voteCount: voteValues.length,
    yesCount: voteValues.filter((vote) => vote === "yes").length,
    maybeCount: voteValues.filter((vote) => vote === "maybe").length,
    noCount: voteValues.filter((vote) => vote === "no").length,
  };
}

function getParticipantProposedOptionCount(event: AperitifEvent, participantName: string): number {
  const participantKey = normalizeMemberName(participantName);

  return event.options.filter(
    (option) =>
      option.createdByRole === "participant" &&
      normalizeMemberName(option.createdByName ?? "") === participantKey,
  ).length;
}

export function buildPurgedEventRecord(event: AperitifEvent, now: Date): PurgedEventRecord {
  const referenceDate = getEventReferenceDateTime(event);
  const participantOptionCount = event.options.filter(
    (option) => option.createdByRole === "participant",
  ).length;
  const participants: PurgedParticipantRecord[] = event.participants.map((participant) => {
    const voteCounts = countVotes(participant.votes);

    return {
      participantName: participant.participantName,
      participantKey: normalizeMemberName(participant.participantName),
      ...voteCounts,
      bringsProvided: Boolean(participant.brings?.trim()),
      commentProvided: Boolean(participant.comment?.trim()),
      proposedOptionCount: getParticipantProposedOptionCount(event, participant.participantName),
    };
  });

  return {
    eventId: event.id,
    ceremonialName: event.ceremonialName,
    title: event.title,
    organizerName: event.organizerName,
    organizerKey: normalizeMemberName(event.organizerName),
    status: event.status,
    selectedOptionId: event.selectedOptionId,
    eventDateTime: referenceDate?.toISOString(),
    purgedAt: now.toISOString(),
    participantCount: event.participants.length,
    guestCount: getGuestParticipants(event).length,
    optionCount: event.options.length,
    participantOptionCount,
    hadParticipantAlternative: participantOptionCount > 0,
    hadFirstShotConsensus: hasFirstShotConsensus(event),
    participants,
  };
}

function createEmptyMemberStats(displayName: string, memberKey: string, lastSeenAt: string): MemberRewardStats {
  return {
    displayName,
    memberKey,
    organizedEventCount: 0,
    organizedRealEventCount: 0,
    organizedLonelyEventCount: 0,
    organizedPopularEventCount: 0,
    firstShotConsensusCount: 0,
    participatedEventCount: 0,
    totalVoteCount: 0,
    yesVoteCount: 0,
    maybeVoteCount: 0,
    noVoteCount: 0,
    contributionCount: 0,
    commentCount: 0,
    proposedOptionCount: 0,
    lastSeenAt,
  };
}

function getOrCreateMemberStats(
  members: Record<string, MemberRewardStats>,
  displayName: string,
  memberKey: string,
  lastSeenAt: string,
): MemberRewardStats {
  const existingStats = members[memberKey];

  if (existingStats) {
    return {
      ...existingStats,
      displayName: existingStats.displayName || displayName,
      lastSeenAt,
    };
  }

  return createEmptyMemberStats(displayName, memberKey, lastSeenAt);
}

export function updateRewardsLedger(
  ledger: RewardsLedger,
  event: AperitifEvent,
  purgedRecord: PurgedEventRecord,
): RewardsLedger {
  if (ledger.purgedEvents.some((record) => record.eventId === event.id)) {
    return ledger;
  }

  const members = { ...ledger.members };
  const organizerStats = getOrCreateMemberStats(
    members,
    purgedRecord.organizerName,
    purgedRecord.organizerKey,
    purgedRecord.purgedAt,
  );

  members[purgedRecord.organizerKey] = {
    ...organizerStats,
    organizedEventCount: organizerStats.organizedEventCount + 1,
    organizedRealEventCount:
      organizerStats.organizedRealEventCount + (purgedRecord.guestCount > 0 ? 1 : 0),
    organizedLonelyEventCount:
      organizerStats.organizedLonelyEventCount + (purgedRecord.guestCount === 0 ? 1 : 0),
    organizedPopularEventCount:
      organizerStats.organizedPopularEventCount + (purgedRecord.guestCount > 10 ? 1 : 0),
    firstShotConsensusCount:
      organizerStats.firstShotConsensusCount + (purgedRecord.hadFirstShotConsensus ? 1 : 0),
  };

  purgedRecord.participants.forEach((participant) => {
    const participantStats = getOrCreateMemberStats(
      members,
      participant.participantName,
      participant.participantKey,
      purgedRecord.purgedAt,
    );

    members[participant.participantKey] = {
      ...participantStats,
      participatedEventCount: participantStats.participatedEventCount + 1,
      totalVoteCount: participantStats.totalVoteCount + participant.voteCount,
      yesVoteCount: participantStats.yesVoteCount + participant.yesCount,
      maybeVoteCount: participantStats.maybeVoteCount + participant.maybeCount,
      noVoteCount: participantStats.noVoteCount + participant.noCount,
      contributionCount:
        participantStats.contributionCount + (participant.bringsProvided ? 1 : 0),
      commentCount: participantStats.commentCount + (participant.commentProvided ? 1 : 0),
      proposedOptionCount: participantStats.proposedOptionCount + participant.proposedOptionCount,
    };
  });

  return {
    ...ledger,
    version: LEDGER_VERSION,
    updatedAt: purgedRecord.purgedAt,
    purgedEvents: [...ledger.purgedEvents, purgedRecord],
    members,
  };
}

export async function purgeExpiredEvents(storage: PurgeStorage): Promise<void> {
  await storage.purgeExpiredEvents();
}
