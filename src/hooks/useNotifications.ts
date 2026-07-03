import { useCallback, useEffect, useState } from "react";
import type { AppNotification } from "../types/notifications";
import {
  NOTIFICATIONS_CHANGE_EVENT,
  NOTIFICATIONS_STORAGE_KEY,
  clearNotifications,
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
} from "../services/notificationStore";

// Hook du badge et du centre de notifications : reste synchronisé avec le
// store via l'événement de changement (même onglet) et l'événement storage
// (autres onglets).
export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => getNotifications());
  const [unreadCount, setUnreadCount] = useState<number>(() => getUnreadCount());

  const refresh = useCallback(() => {
    setNotifications(getNotifications());
    setUnreadCount(getUnreadCount());
  }, []);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === NOTIFICATIONS_STORAGE_KEY) {
        refresh();
      }
    }

    window.addEventListener(NOTIFICATIONS_CHANGE_EVENT, refresh);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGE_EVENT, refresh);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refresh]);

  return {
    notifications,
    unreadCount,
    refresh,
    markAllRead,
    markRead,
    clearNotifications,
  };
}
