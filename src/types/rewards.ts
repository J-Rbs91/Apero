import type { AperitifEventStatus } from "./apero";

export type PurgedParticipantRecord = {
  participantName: string;
  participantKey: string;
  voteCount: number;
  yesCount: number;
  maybeCount: number;
  noCount: number;
  bringsProvided: boolean;
  commentProvided: boolean;
  proposedOptionCount: number;
};

export type PurgedEventRecord = {
  eventId: string;
  ceremonialName: string;
  title?: string;
  organizerName: string;
  organizerKey: string;
  status: AperitifEventStatus;
  selectedOptionId?: string;
  eventDateTime?: string;
  purgedAt: string;
  participantCount: number;
  guestCount: number;
  optionCount: number;
  participantOptionCount: number;
  hadParticipantAlternative: boolean;
  hadFirstShotConsensus: boolean;
  participants: PurgedParticipantRecord[];
};

export type MemberRewardStats = {
  displayName: string;
  memberKey: string;
  organizedEventCount: number;
  organizedRealEventCount: number;
  organizedLonelyEventCount: number;
  organizedPopularEventCount: number;
  firstShotConsensusCount: number;
  participatedEventCount: number;
  totalVoteCount: number;
  yesVoteCount: number;
  maybeVoteCount: number;
  noVoteCount: number;
  contributionCount: number;
  commentCount: number;
  proposedOptionCount: number;
  lastSeenAt: string;
};

export type RewardsLedger = {
  version: number;
  updatedAt: string;
  purgedEvents: PurgedEventRecord[];
  members: Record<string, MemberRewardStats>;
};
