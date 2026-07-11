// Les Comptes du Comptoir : le bilan d'une année de Confrérie, calculé sur
// l'appareil à partir des apéros connus localement (registre chiffré) et du
// grand livre des purges quand il existe. Rien ne part vers un serveur.

import type { AperitifEvent } from "../types/apero";
import type { PurgedEventRecord } from "../types/rewards";
import { getEventReferenceDateTime } from "../services/eventPurge";
import { normalizeMemberName } from "./memberName";

export type YearRecap = {
  year: number;
  // Assemblées convoquées par le membre.
  organizedCount: number;
  // Apéros d'autrui où le membre a émargé.
  participatedCount: number;
  yesCount: number;
  maybeCount: number;
  noCount: number;
  // Le lieu qui revient le plus dans les apéros du membre.
  favoriteLocation?: string;
  // L'assemblée la plus peuplée (nom + nombre de convives).
  biggestTableName?: string;
  biggestTableSize: number;
  // Moyenne des pronostics Traquenard-O-mètre déposés par le membre.
  averageTraquenard: number | null;
  // Blazes distincts croisés autour des mêmes tables.
  fellowCount: number;
};

export type YearRecapInput = {
  events: AperitifEvent[];
  purgedEvents?: PurgedEventRecord[];
  memberName: string;
  year: number;
};

function eventYear(event: AperitifEvent): number | null {
  const reference = getEventReferenceDateTime(event) ?? new Date(event.createdAt);
  const year = reference.getFullYear();
  return Number.isNaN(year) ? null : year;
}

function recordYear(record: PurgedEventRecord): number | null {
  const raw = record.eventDateTime ?? record.purgedAt;
  const year = new Date(raw).getFullYear();
  return Number.isNaN(year) ? null : year;
}

export function buildYearRecap({ events, purgedEvents = [], memberName, year }: YearRecapInput): YearRecap {
  const memberKey = normalizeMemberName(memberName);

  const recap: YearRecap = {
    year,
    organizedCount: 0,
    participatedCount: 0,
    yesCount: 0,
    maybeCount: 0,
    noCount: 0,
    biggestTableSize: 0,
    averageTraquenard: null,
    fellowCount: 0,
  };

  if (!memberKey) {
    return recap;
  }

  const locationCounts = new Map<string, number>();
  const fellows = new Set<string>();
  const traquenardLevels: number[] = [];
  // Les apéros encore lisibles priment sur leur éventuelle trace de purge.
  const seenEventIds = new Set<string>();

  for (const event of events) {
    if (eventYear(event) !== year) {
      continue;
    }

    const me = event.participants.find(
      (participant) => normalizeMemberName(participant.participantName) === memberKey,
    );
    const isOrganizer = normalizeMemberName(event.organizerName) === memberKey;

    if (!me && !isOrganizer) {
      continue;
    }
    seenEventIds.add(event.id);

    if (isOrganizer) {
      recap.organizedCount += 1;
    } else if (me) {
      recap.participatedCount += 1;
    }

    if (me) {
      for (const vote of Object.values(me.votes ?? {})) {
        if (vote === "yes") recap.yesCount += 1;
        if (vote === "maybe") recap.maybeCount += 1;
        if (vote === "no") recap.noCount += 1;
      }
      if (typeof me.traquenardLevel === "number") {
        traquenardLevels.push(me.traquenardLevel);
      }
    }

    for (const option of event.options) {
      const location = option.location.trim();
      if (location) {
        locationCounts.set(location, (locationCounts.get(location) ?? 0) + 1);
      }
    }

    for (const participant of event.participants) {
      const key = normalizeMemberName(participant.participantName);
      if (key && key !== memberKey) {
        fellows.add(key);
      }
    }

    if (event.participants.length > recap.biggestTableSize) {
      recap.biggestTableSize = event.participants.length;
      recap.biggestTableName = event.ceremonialName;
    }
  }

  for (const record of purgedEvents) {
    if (seenEventIds.has(record.eventId) || recordYear(record) !== year) {
      continue;
    }

    const mine = record.participants.find((participant) => participant.participantKey === memberKey);
    const isOrganizer = record.organizerKey === memberKey;

    if (!mine && !isOrganizer) {
      continue;
    }

    if (isOrganizer) {
      recap.organizedCount += 1;
    } else if (mine) {
      recap.participatedCount += 1;
    }

    if (mine) {
      recap.yesCount += mine.yesCount;
      recap.maybeCount += mine.maybeCount;
      recap.noCount += mine.noCount;
    }

    for (const participant of record.participants) {
      if (participant.participantKey && participant.participantKey !== memberKey) {
        fellows.add(participant.participantKey);
      }
    }

    if (record.participantCount > recap.biggestTableSize) {
      recap.biggestTableSize = record.participantCount;
      recap.biggestTableName = record.ceremonialName;
    }
  }

  let favoriteLocation: string | undefined;
  let favoriteCount = 0;
  for (const [location, count] of locationCounts) {
    if (count > favoriteCount) {
      favoriteCount = count;
      favoriteLocation = location;
    }
  }
  recap.favoriteLocation = favoriteLocation;

  recap.averageTraquenard = traquenardLevels.length
    ? traquenardLevels.reduce((total, level) => total + level, 0) / traquenardLevels.length
    : null;

  recap.fellowCount = fellows.size;

  return recap;
}
