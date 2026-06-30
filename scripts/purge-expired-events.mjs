import fs from "node:fs/promises";
import path from "node:path";

const eventsDir = path.join(process.cwd(), "data", "events");
const ledgerPath = path.join(process.cwd(), "data", "rewards", "ledger.json");
const LEDGER_VERSION = 1;

function normalizeDisplayName(name) {
  return String(name ?? "").trim().replace(/\s+/g, " ");
}

function normalizeMemberName(name) {
  return normalizeDisplayName(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function normalizeEvent(rawEvent) {
  const now = new Date().toISOString();
  const participants = rawEvent.participants ?? rawEvent.responses ?? [];
  const title = rawEvent.title?.trim() || undefined;
  const createdAt = rawEvent.createdAt ?? now;
  const organizerName = rawEvent.organizerName ?? rawEvent.createdBy ?? "Grand Convoqueur mystère";
  const options =
    rawEvent.options?.map((option) => ({
      ...option,
      createdByRole: option.createdByRole ?? "organizer",
      createdByName: option.createdByName ?? organizerName,
      createdAt: option.createdAt ?? createdAt,
    })) ??
    rawEvent.slots?.map((slot) => ({
      id: slot.id,
      date: slot.dateTime?.slice(0, 10) ?? "",
      time: slot.dateTime?.slice(11, 16) ?? "",
      location: rawEvent.location ?? "Établissement à confirmer",
      note: slot.label,
      createdByRole: "organizer",
      createdByName: organizerName,
      createdAt,
    })) ??
    [];

  return {
    id: rawEvent.id ?? "apero_inconnu",
    ceremonialName: rawEvent.ceremonialName ?? title ?? "Assemblée sans registre",
    title,
    organizerName,
    description: rawEvent.description || undefined,
    beaufLevel: rawEvent.beaufLevel ?? "medium",
    status: rawEvent.status ?? "active",
    options,
    participants: participants.map((participant) => ({
      ...participant,
      participantName: participant.participantName ?? participant.name ?? "Membre anonyme",
      createdAt: participant.createdAt ?? participant.updatedAt ?? now,
      updatedAt: participant.updatedAt ?? now,
    })),
    createdAt,
    updatedAt: rawEvent.updatedAt ?? now,
    closedAt: rawEvent.closedAt,
    selectedOptionId: rawEvent.selectedOptionId,
  };
}

function parseOptionDateTime(option) {
  if (!option.date || !option.time) {
    return null;
  }

  const parsedDate = new Date(option.date + "T" + option.time + ":00");
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function getEventReferenceDateTime(event) {
  if (event.selectedOptionId) {
    const selectedOption = event.options.find((option) => option.id === event.selectedOptionId);
    const selectedDate = selectedOption ? parseOptionDateTime(selectedOption) : null;

    if (selectedDate) {
      return selectedDate;
    }
  }

  return event.options.reduce((latestDate, option) => {
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

function isEventExpired(event, now) {
  const referenceDate = getEventReferenceDateTime(event);
  return !referenceDate || referenceDate.getTime() < now.getTime();
}

function getGuests(event) {
  const organizerKey = normalizeMemberName(event.organizerName);
  return event.participants.filter(
    (participant) => normalizeMemberName(participant.participantName) !== organizerKey,
  );
}

function hasAnyGuestPresent(event) {
  return getGuests(event).some((guest) =>
    Object.values(guest.votes ?? {}).some((vote) => vote === "yes"),
  );
}

function hasFirstShotConsensus(event) {
  const guests = getGuests(event);

  if (guests.length === 0) {
    return false;
  }

  const organizerOptions = event.options.filter((option) => option.createdByRole !== "participant");

  if (organizerOptions.length === 0) {
    return false;
  }

  if (event.options.some((option) => option.createdByRole === "participant")) {
    return false;
  }

  return organizerOptions.some((option) =>
    guests.every((participant) => participant.votes?.[option.id] === "yes"),
  );
}

function countVotes(votes = {}) {
  const voteValues = Object.values(votes);

  return {
    voteCount: voteValues.length,
    yesCount: voteValues.filter((vote) => vote === "yes").length,
    maybeCount: voteValues.filter((vote) => vote === "maybe").length,
    noCount: voteValues.filter((vote) => vote === "no").length,
  };
}

function getParticipantProposedOptionCount(event, participantName) {
  const participantKey = normalizeMemberName(participantName);

  return event.options.filter(
    (option) =>
      option.createdByRole === "participant" &&
      normalizeMemberName(option.createdByName ?? "") === participantKey,
  ).length;
}

function createEmptyLedger(now) {
  return {
    version: LEDGER_VERSION,
    updatedAt: now.toISOString(),
    purgedEvents: [],
    members: {},
  };
}

async function readLedger(now) {
  try {
    const ledger = JSON.parse(await fs.readFile(ledgerPath, "utf8"));
    return {
      version: ledger.version ?? LEDGER_VERSION,
      updatedAt: ledger.updatedAt ?? now.toISOString(),
      purgedEvents: ledger.purgedEvents ?? [],
      members: ledger.members ?? {},
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return createEmptyLedger(now);
    }

    throw error;
  }
}

function buildPurgedRecord(event, now) {
  const participantOptionCount = event.options.filter((option) => option.createdByRole === "participant").length;
  const referenceDate = getEventReferenceDateTime(event);

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
    guestCount: getGuests(event).length,
    hadPresentGuest: hasAnyGuestPresent(event),
    optionCount: event.options.length,
    participantOptionCount,
    hadParticipantAlternative: participantOptionCount > 0,
    hadFirstShotConsensus: hasFirstShotConsensus(event),
    participants: event.participants.map((participant) => ({
      participantName: participant.participantName,
      participantKey: normalizeMemberName(participant.participantName),
      ...countVotes(participant.votes),
      bringsProvided: Boolean(participant.brings?.trim()),
      commentProvided: Boolean(participant.comment?.trim()),
      proposedOptionCount: getParticipantProposedOptionCount(event, participant.participantName),
    })),
  };
}

function emptyMemberStats(displayName, memberKey, lastSeenAt) {
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

function getMemberStats(members, displayName, memberKey, lastSeenAt) {
  return members[memberKey]
    ? { ...members[memberKey], displayName: members[memberKey].displayName || displayName, lastSeenAt }
    : emptyMemberStats(displayName, memberKey, lastSeenAt);
}

function updateLedger(ledger, event, record) {
  if (ledger.purgedEvents.some((purgedEvent) => purgedEvent.eventId === event.id)) {
    return ledger;
  }

  const members = { ...ledger.members };
  const organizerStats = getMemberStats(members, record.organizerName, record.organizerKey, record.purgedAt);

  members[record.organizerKey] = {
    ...organizerStats,
    organizedEventCount: organizerStats.organizedEventCount + 1,
    organizedRealEventCount: organizerStats.organizedRealEventCount + (record.guestCount > 0 ? 1 : 0),
    organizedLonelyEventCount: organizerStats.organizedLonelyEventCount + (record.hadPresentGuest ? 0 : 1),
    organizedPopularEventCount: organizerStats.organizedPopularEventCount + (record.guestCount > 10 ? 1 : 0),
    firstShotConsensusCount: organizerStats.firstShotConsensusCount + (record.hadFirstShotConsensus ? 1 : 0),
  };

  record.participants.forEach((participant) => {
    const participantStats = getMemberStats(members, participant.participantName, participant.participantKey, record.purgedAt);

    members[participant.participantKey] = {
      ...participantStats,
      participatedEventCount: participantStats.participatedEventCount + 1,
      totalVoteCount: participantStats.totalVoteCount + participant.voteCount,
      yesVoteCount: participantStats.yesVoteCount + participant.yesCount,
      maybeVoteCount: participantStats.maybeVoteCount + participant.maybeCount,
      noVoteCount: participantStats.noVoteCount + participant.noCount,
      contributionCount: participantStats.contributionCount + (participant.bringsProvided ? 1 : 0),
      commentCount: participantStats.commentCount + (participant.commentProvided ? 1 : 0),
      proposedOptionCount: participantStats.proposedOptionCount + participant.proposedOptionCount,
    };
  });

  return {
    ...ledger,
    version: LEDGER_VERSION,
    updatedAt: record.purgedAt,
    purgedEvents: [...ledger.purgedEvents, record],
    members,
  };
}

async function writeLedger(ledger) {
  await fs.mkdir(path.dirname(ledgerPath), { recursive: true });
  await fs.writeFile(ledgerPath, JSON.stringify(ledger, null, 2) + "\n", "utf8");
}

async function main() {
  const now = new Date();
  await fs.mkdir(eventsDir, { recursive: true });
  let ledger = await readLedger(now);
  const files = (await fs.readdir(eventsDir)).filter((file) => file.endsWith(".json"));
  let purgedCount = 0;

  for (const file of files) {
    const filePath = path.join(eventsDir, file);
    const event = normalizeEvent(JSON.parse(await fs.readFile(filePath, "utf8")));

    if (!isEventExpired(event, now)) {
      continue;
    }

    const alreadyPurged = ledger.purgedEvents.some((record) => record.eventId === event.id);

    if (!alreadyPurged) {
      const record = buildPurgedRecord(event, now);
      ledger = updateLedger(ledger, event, record);
      await writeLedger(ledger);
      const verifiedLedger = await readLedger(now);

      if (!verifiedLedger.purgedEvents.some((record) => record.eventId === event.id)) {
        throw new Error(`Ledger verification failed before deleting ${event.id}`);
      }
    }

    await fs.unlink(filePath);
    purgedCount += 1;
  }

  if (purgedCount === 0) {
    console.log("Aucun apéro expiré à purger.");
  } else {
    console.log(`${purgedCount} apéro(s) expiré(s) purgé(s).`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});