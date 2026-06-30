import type { AperitifEvent, AperitifOption } from "../types/apero";
import type { BadgeId } from "../types/badges";

export type OrganizerBadgeAward = {
  badgeId: BadgeId;
  memberName: string;
  eventId: string;
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
