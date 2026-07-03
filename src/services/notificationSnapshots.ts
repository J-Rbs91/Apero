// Persistance des instantanés « déjà vu » par apéro (localStorage).
// Sépare la persistance de la logique pure du moteur (notificationEngine).

import type { AperoSnapshot } from "./notificationEngine";
import { createEmptySnapshot } from "./notificationEngine";

export const NOTIFICATION_SNAPSHOTS_STORAGE_KEY = "apero_notif_snapshots_v1";

function getStorage(): Storage | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  return window.localStorage;
}

function readAll(): Record<string, AperoSnapshot> {
  const storage = getStorage();
  if (!storage) {
    return {};
  }
  try {
    const raw = storage.getItem(NOTIFICATION_SNAPSHOTS_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, AperoSnapshot>) : {};
  } catch {
    return {};
  }
}

function writeAll(snapshots: Record<string, AperoSnapshot>): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.setItem(NOTIFICATION_SNAPSHOTS_STORAGE_KEY, JSON.stringify(snapshots));
  } catch {
    // localStorage plein ou bloqué : sans instantané persistant, le pire cas
    // est de ne pas notifier — jamais de crash.
  }
}

export function getSnapshot(aperoId: string): AperoSnapshot {
  return readAll()[aperoId] ?? createEmptySnapshot();
}

export function saveSnapshot(aperoId: string, snapshot: AperoSnapshot): void {
  const all = readAll();
  all[aperoId] = snapshot;
  writeAll(all);
}

export function removeSnapshot(aperoId: string): void {
  const all = readAll();
  if (aperoId in all) {
    delete all[aperoId];
    writeAll(all);
  }
}
