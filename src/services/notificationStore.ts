// Stockage local des notifications internes + compteur de non-lues.
// C'est la source du badge rouge et du centre de notifications. Le badge doit
// rester visible même sans autorisation système : ce store est donc toujours
// alimenté, indépendamment de l'API Notification.

import type { AppNotification } from "../types/notifications";

export const NOTIFICATIONS_STORAGE_KEY = "apero_notifications_v1";
export const NOTIFICATIONS_CHANGE_EVENT = "apero:notifications-change";

// Plafond pour ne pas laisser gonfler le localStorage indéfiniment.
const MAX_NOTIFICATIONS = 100;

function getStorage(): Storage | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  return window.localStorage;
}

function isValid(value: unknown): value is AppNotification {
  const notification = value as AppNotification | null;
  return Boolean(
    notification &&
      typeof notification === "object" &&
      typeof notification.id === "string" &&
      typeof notification.aperoId === "string" &&
      typeof notification.dedupeKey === "string" &&
      typeof notification.createdAt === "string" &&
      typeof notification.read === "boolean",
  );
}

function read(): AppNotification[] {
  const storage = getStorage();
  if (!storage) {
    return [];
  }
  try {
    const raw = storage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isValid) : [];
  } catch {
    return [];
  }
}

function emitChange(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGE_EVENT));
}

function write(notifications: AppNotification[]): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch {
    // localStorage plein ou bloqué : on ne casse pas le flux appelant.
  }
  emitChange();
}

/** Notifications, de la plus récente à la plus ancienne. */
export function getNotifications(): AppNotification[] {
  return read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getUnreadCount(): number {
  return read().reduce((count, notification) => count + (notification.read ? 0 : 1), 0);
}

/**
 * Ajoute des notifications en dédupliquant par `dedupeKey` : un fait déjà
 * notifié n'est jamais recréé. Renvoie celles réellement ajoutées (utile pour
 * ne déclencher les notifications système que sur du nouveau).
 */
export function addNotifications(incoming: AppNotification[]): AppNotification[] {
  if (incoming.length === 0) {
    return [];
  }
  const existing = read();
  const knownKeys = new Set(existing.map((notification) => notification.dedupeKey));
  const fresh = incoming.filter((notification) => !knownKeys.has(notification.dedupeKey));

  if (fresh.length === 0) {
    return [];
  }

  const merged = [...fresh, ...existing]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, MAX_NOTIFICATIONS);

  write(merged);
  return fresh;
}

export function markAllRead(): void {
  const notifications = read();
  if (notifications.every((notification) => notification.read)) {
    return;
  }
  write(notifications.map((notification) => ({ ...notification, read: true })));
}

export function markRead(id: string): void {
  const notifications = read();
  let changed = false;
  const next = notifications.map((notification) => {
    if (notification.id === id && !notification.read) {
      changed = true;
      return { ...notification, read: true };
    }
    return notification;
  });
  if (changed) {
    write(next);
  }
}

export function clearNotifications(): void {
  write([]);
}

/** Retire les notifications d'un apéro (ex. apéro supprimé / quitté). */
export function removeNotificationsForApero(aperoId: string): void {
  const notifications = read();
  const next = notifications.filter((notification) => notification.aperoId !== aperoId);
  if (next.length !== notifications.length) {
    write(next);
  }
}

/**
 * Vrai si cet appareil garde la trace d'une annulation pour cet apéro.
 * Permet d'afficher « annulé par l'organisateur » plutôt qu'« introuvable »
 * même une fois le registre local purgé (relecture du lien mort, effets
 * React rejoués en StrictMode…).
 */
export function hasAperoDeletedNotification(aperoId: string): boolean {
  return read().some(
    (notification) => notification.aperoId === aperoId && notification.type === "apero-deleted",
  );
}
