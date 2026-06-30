import type { AperitifEvent, AperitifOption, VoteStatus } from "../types/apero";
import type { BadgeId } from "../types/badges";
import type { MemberRewardStats, RewardsLedger } from "../types/rewards";
import { normalizeMemberName } from "./memberName";

export type OrganizerBadgeAward = {
  badgeId: BadgeId;
  memberName: string;
  eventId: string;
};

export type MemberBadgeContext = {
  activeEvents: AperitifEvent[];
  ledger: RewardsLedger;
  memberName: string;
};

function isOrganizerOption(option: AperitifOption): boolean {
  return option.createdByRole !== "participant";
}

export function hasFirstShotConsensus(event: AperitifEvent): boolean {
  if (event.participants.length === 0) {
    return false;
  }

  const organizerOptions = event.options.filter(isOrganizerOption);

  if (organizerOptions.length === 0) {
    return false;
  }

  const hasParticipantAlternative = event.options.some(
    (option) => option.createdByRole === "participant",
  );

  if (hasParticipantAlternative) {
    return false;
  }

  return organizerOptions.some((option) =>
    event.participants.every((participant) => participant.votes[option.id] === "yes"),
  );
}

export function getOrganizerBadgeAwards(event: AperitifEvent): OrganizerBadgeAward[] {
  if (!hasFirstShotConsensus(event)) {
    return [];
  }

  return [
    {
      badgeId: "FIRST_SHOT_CONSENSUS",
      memberName: event.organizerName,
      eventId: event.id,
    },
  ];
}

function createEmptyStats(displayName: string, memberKey: string): MemberRewardStats {
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
    lastSeenAt: "",
  };
}

function addVotesToStats(stats: MemberRewardStats, votes: Record<string, VoteStatus>) {
  Object.values(votes).forEach((vote) => {
    stats.totalVoteCount += 1;

    if (vote === "yes") {
      stats.yesVoteCount += 1;
    }

    if (vote === "maybe") {
      stats.maybeVoteCount += 1;
    }

    if (vote === "no") {
      stats.noVoteCount += 1;
    }
  });
}

function addActiveEventToStats(stats: MemberRewardStats, event: AperitifEvent, memberKey: string) {
  if (normalizeMemberName(event.organizerName) === memberKey) {
    stats.organizedEventCount += 1;
    stats.organizedRealEventCount += event.participants.length > 0 ? 1 : 0;
    stats.organizedLonelyEventCount += event.participants.length === 0 ? 1 : 0;
    stats.organizedPopularEventCount += event.participants.length > 10 ? 1 : 0;
    stats.firstShotConsensusCount += hasFirstShotConsensus(event) ? 1 : 0;
  }

  event.participants.forEach((participant) => {
    if (normalizeMemberName(participant.participantName) !== memberKey) {
      return;
    }

    stats.participatedEventCount += 1;
    addVotesToStats(stats, participant.votes);
    stats.contributionCount += participant.brings?.trim() ? 1 : 0;
    stats.commentCount += participant.comment?.trim() ? 1 : 0;
  });

  stats.proposedOptionCount += event.options.filter(
    (option) =>
      option.createdByRole === "participant" &&
      normalizeMemberName(option.createdByName ?? "") === memberKey,
  ).length;
}

export function getMemberRewardStats({
  activeEvents,
  ledger,
  memberName,
}: MemberBadgeContext): MemberRewardStats {
  const memberKey = normalizeMemberName(memberName);
  const ledgerStats = ledger.members[memberKey];
  const stats: MemberRewardStats = ledgerStats
    ? { ...ledgerStats }
    : createEmptyStats(memberName, memberKey);
  const purgedEventIds = new Set(ledger.purgedEvents.map((record) => record.eventId));

  activeEvents
    .filter((event) => !purgedEventIds.has(event.id))
    .forEach((event) => addActiveEventToStats(stats, event, memberKey));

  return stats;
}

export function getMemberBadgeIds(context: MemberBadgeContext): BadgeId[] {
  const stats = getMemberRewardStats(context);
  const badgeIds: BadgeId[] = [];

  if (stats.organizedRealEventCount > 0) {
    badgeIds.push("FIRST_REAL_ORGANIZER");
  }

  if (stats.organizedPopularEventCount > 0) {
    badgeIds.push("POPULAR_TABLE");
  }

  if (stats.organizedLonelyEventCount > 0) {
    badgeIds.push("LONELY_CONVOKER");
  }

  if (stats.organizedRealEventCount > 10) {
    badgeIds.push("SUPER_ORGANIZER");
  }

  if (stats.firstShotConsensusCount > 0) {
    badgeIds.push("FIRST_SHOT_CONSENSUS");
  }

  if (stats.participatedEventCount >= 5) {
    badgeIds.push("FAITHFUL_MEMBER");
  }

  if (stats.totalVoteCount >= 10) {
    badgeIds.push("SERIAL_VOTER");
  }

  if (stats.contributionCount >= 3) {
    badgeIds.push("BANQUET_PROVIDER");
  }

  if (stats.maybeVoteCount >= 3) {
    badgeIds.push("LAST_MINUTE_MINISTER");
  }

  if (stats.participatedEventCount >= 3 && stats.noVoteCount === 0) {
    badgeIds.push("ZINC_DIPLOMAT");
  }

  return badgeIds;
}