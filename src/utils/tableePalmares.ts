// Palmarès de tablée : les titres honorifiques de la bande, calculés sur les
// apéros rattachés à la tablée (ceux encore lisibles). Compétition douce entre
// gens de confiance — le zinc ne juge pas, il note.

import type { AperitifEvent } from "../types/apero";
import { normalizeMemberName } from "./memberName";

export type TableeMemberStats = {
  key: string;
  displayName: string;
  organizedCount: number;
  presentCount: number;
  maybeCount: number;
  messageCount: number;
  cheerCount: number;
};

export type TableeTitle = {
  id: "pilier" | "convocateur" | "ministre" | "plume";
  title: string;
  description: string;
  memberName: string;
  score: number;
};

export function buildTableeMemberStats(events: AperitifEvent[]): TableeMemberStats[] {
  const byKey = new Map<string, TableeMemberStats>();

  function getStats(rawName: string): TableeMemberStats | null {
    const key = normalizeMemberName(rawName);
    if (!key) {
      return null;
    }
    let stats = byKey.get(key);
    if (!stats) {
      stats = {
        key,
        displayName: rawName.trim(),
        organizedCount: 0,
        presentCount: 0,
        maybeCount: 0,
        messageCount: 0,
        cheerCount: 0,
      };
      byKey.set(key, stats);
    }
    return stats;
  }

  for (const event of events) {
    const organizer = getStats(event.organizerName);
    if (organizer) {
      organizer.organizedCount += 1;
    }

    for (const participant of event.participants) {
      const stats = getStats(participant.participantName);
      if (!stats) {
        continue;
      }
      const votes = Object.values(participant.votes ?? {});
      if (votes.some((vote) => vote === "yes")) {
        stats.presentCount += 1;
      } else if (votes.some((vote) => vote === "maybe")) {
        stats.maybeCount += 1;
      }
    }

    for (const message of event.messages ?? []) {
      const stats = getStats(message.authorName);
      if (stats) {
        stats.messageCount += 1;
      }
    }

    for (const option of event.options) {
      for (const cheerName of option.cheers ?? []) {
        const stats = getStats(cheerName);
        if (stats) {
          stats.cheerCount += 1;
        }
      }
    }
  }

  return Array.from(byKey.values()).sort(
    (a, b) =>
      b.presentCount + b.organizedCount - (a.presentCount + a.organizedCount) ||
      a.displayName.localeCompare(b.displayName, "fr"),
  );
}

function topOf(
  stats: TableeMemberStats[],
  metric: (member: TableeMemberStats) => number,
): TableeMemberStats | undefined {
  let best: TableeMemberStats | undefined;
  for (const member of stats) {
    const score = metric(member);
    if (score > 0 && (!best || score > metric(best))) {
      best = member;
    }
  }
  return best;
}

/** Les titres honorifiques de la tablée. Seuls les titres mérités apparaissent. */
export function buildTableeTitles(stats: TableeMemberStats[]): TableeTitle[] {
  const titles: TableeTitle[] = [];

  const pilier = topOf(stats, (member) => member.presentCount);
  if (pilier) {
    titles.push({
      id: "pilier",
      title: "Pilier de la Tablée",
      description: "Présence la plus assidue au registre. Le tabouret porte son nom.",
      memberName: pilier.displayName,
      score: pilier.presentCount,
    });
  }

  const convocateur = topOf(stats, (member) => member.organizedCount);
  if (convocateur) {
    titles.push({
      id: "convocateur",
      title: "Grand Convocateur",
      description: "A convoqué le plus d'assemblées. La bande lui doit ses meilleures excuses du lendemain.",
      memberName: convocateur.displayName,
      score: convocateur.organizedCount,
    });
  }

  const ministre = topOf(stats, (member) => member.maybeCount);
  if (ministre) {
    titles.push({
      id: "ministre",
      title: "Ministre du Peut-être",
      description: "Champion du « j'me tâte ». Un jour il tranchera, mais pas aujourd'hui.",
      memberName: ministre.displayName,
      score: ministre.maybeCount,
    });
  }

  const plume = topOf(stats, (member) => member.messageCount);
  if (plume) {
    titles.push({
      id: "plume",
      title: "Plume du Comptoir",
      description: "Le mur du comptoir lui doit ses plus belles lignes.",
      memberName: plume.displayName,
      score: plume.messageCount,
    });
  }

  return titles;
}
