import type { AperitifEvent, AperitifOption, ParticipantResponse, VoteStatus } from "../types/apero";
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

// Les invités = les participants autres que l'organisateur (qui est désormais
// compté présent par défaut). Les badges « a attiré du monde / personne n'est
// venu / consensus du premier coup » se jugent sur ces invités.
export function getGuestParticipants(event: AperitifEvent): ParticipantResponse[] {
  const organizerKey = normalizeMemberName(event.organizerName);
  return event.participants.filter(
    (participant) => normalizeMemberName(participant.participantName) !== organizerKey,
  );
}

// Un invité « présent » = un invité ayant voté oui sur au moins un créneau.
export function hasAnyGuestPresent(event: AperitifEvent): boolean {
  return getGuestParticipants(event).some((guest) =>
    Object.values(guest.votes).some((vote) => vote === "yes"),
  );
}

export function hasFirstShotConsensus(event: AperitifEvent): boolean {
  const guests = getGuestParticipants(event);

  if (guests.length === 0) {
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
    guests.every((participant) => participant.votes[option.id] === "yes"),
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
    const guestCount = getGuestParticipants(event).length;
    stats.organizedEventCount += 1;
    stats.organizedRealEventCount += guestCount > 0 ? 1 : 0;
    // Le badge « loose » se juge à la purge (date dépassée) : un apéro actif,
    // donc encore à venir, n'est jamais considéré comme déserté ici.
    stats.organizedPopularEventCount += guestCount > 10 ? 1 : 0;
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

// Lecture sûre d'un index membre : les noms de comptoir sont des données libres,
// donc « constructor » ou « __proto__ » ne doivent jamais renvoyer une propriété
// héritée d'Object.prototype (sinon stats fantômes copiées en NaN).
function readMemberStats(
  members: Record<string, MemberRewardStats>,
  memberKey: string,
): MemberRewardStats | undefined {
  return Object.prototype.hasOwnProperty.call(members, memberKey) ? members[memberKey] : undefined;
}

// « L'Affranchi » : a été convive chez quelqu'un d'autre AVANT d'organiser sa
// première assemblée. C'est le badge de la boucle vertueuse : invité un jour,
// organisateur le lendemain. Les dates viennent des apéros actifs (createdAt
// précis) et du grand livre des purges (date de l'apéro en approximation).
export function hasEarnedAffranchi({ activeEvents, ledger, memberName }: MemberBadgeContext): boolean {
  const memberKey = normalizeMemberName(memberName);
  let firstOrganizedAt = Number.POSITIVE_INFINITY;
  let firstGuestAt = Number.POSITIVE_INFINITY;

  function parseMs(value?: string): number {
    const ms = value ? Date.parse(value) : Number.NaN;
    return Number.isNaN(ms) ? Number.POSITIVE_INFINITY : ms;
  }

  for (const event of activeEvents) {
    const isOrganizer = normalizeMemberName(event.organizerName) === memberKey;
    if (isOrganizer) {
      firstOrganizedAt = Math.min(firstOrganizedAt, parseMs(event.createdAt));
      continue;
    }
    for (const participant of event.participants) {
      if (normalizeMemberName(participant.participantName) === memberKey) {
        firstGuestAt = Math.min(firstGuestAt, parseMs(participant.createdAt));
      }
    }
  }

  for (const record of ledger.purgedEvents) {
    const recordMs = parseMs(record.eventDateTime ?? record.purgedAt);
    if (record.organizerKey === memberKey) {
      firstOrganizedAt = Math.min(firstOrganizedAt, recordMs);
      continue;
    }
    if (record.participants.some((participant) => participant.participantKey === memberKey)) {
      firstGuestAt = Math.min(firstGuestAt, recordMs);
    }
  }

  return Number.isFinite(firstOrganizedAt) && firstGuestAt < firstOrganizedAt;
}

export function getMemberRewardStats({
  activeEvents,
  ledger,
  memberName,
}: MemberBadgeContext): MemberRewardStats {
  const memberKey = normalizeMemberName(memberName);
  const ledgerStats = readMemberStats(ledger.members, memberKey);
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

  if (stats.maybeVoteCount >= 3) {
    badgeIds.push("LAST_MINUTE_MINISTER");
  }

  if (stats.participatedEventCount >= 3 && stats.noVoteCount === 0) {
    badgeIds.push("ZINC_DIPLOMAT");
  }

  if (hasEarnedAffranchi(context)) {
    badgeIds.push("AFFRANCHI");
  }

  return badgeIds;
}