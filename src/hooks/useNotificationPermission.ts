import { useCallback, useEffect, useState } from "react";
import {
  getSystemPermission,
  registerNotificationServiceWorker,
  requestSystemPermission,
  type SystemPermission,
} from "../services/systemNotifications";

// Mémorise que l'utilisateur a déjà vu l'écran d'autorisation, pour ne pas le
// relancer à chaque ouverture s'il a choisi « plus tard » (le badge interne
// reste actif dans tous les cas).
export const NOTIFICATION_ONBOARDING_STORAGE_KEY = "apero_notif_onboarding_seen_v1";

function hasSeenOnboarding(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  return window.localStorage.getItem(NOTIFICATION_ONBOARDING_STORAGE_KEY) === "1";
}

export function markNotificationOnboardingSeen(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(NOTIFICATION_ONBOARDING_STORAGE_KEY, "1");
  } catch {
    // Sans persistance, au pire on re-propose l'écran : pas bloquant.
  }
}

export function useNotificationPermission() {
  const [permission, setPermission] = useState<SystemPermission>(() => getSystemPermission());
  const [seenOnboarding, setSeenOnboarding] = useState<boolean>(hasSeenOnboarding);

  // Ré-enregistre le SW au démarrage si l'autorisation est déjà accordée,
  // pour que les clics sur notification rouvrent bien l'app.
  useEffect(() => {
    if (getSystemPermission() === "granted") {
      void registerNotificationServiceWorker();
    }
  }, []);

  const request = useCallback(async () => {
    const result = await requestSystemPermission();
    setPermission(result);
    return result;
  }, []);

  const dismissOnboarding = useCallback(() => {
    markNotificationOnboardingSeen();
    setSeenOnboarding(true);
  }, []);

  return {
    permission,
    isSupported: permission !== "unsupported",
    seenOnboarding,
    request,
    dismissOnboarding,
  };
}
