// Pont vers les notifications système du téléphone (section 5.B / 6).
//
// Rappel d'architecture : les apéros sont chiffrés de bout en bout, le serveur
// ne peut donc pas déclencher de push serveur pertinent. On fait donc du
// « best-effort » côté client via l'API Notification et un service worker :
// - quand l'app / le SW est vivant, on affiche de vraies notifications OS ;
// - le badge interne reste la garantie universelle si l'autorisation est
//   refusée ou l'API absente (section 6, dernier paragraphe).
//
// Le push serveur en tâche de fond (app totalement fermée) nécessiterait Web
// Push + VAPID + un store d'abonnements côté serveur, incompatible avec le
// modèle zero-knowledge actuel. C'est documenté dans le README.

import type { AppNotification } from "../types/notifications";

export type SystemPermission = "unsupported" | "default" | "granted" | "denied";

const SERVICE_WORKER_URL = `${import.meta.env.BASE_URL}notifications-sw.js`;

export function isSystemNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getSystemPermission(): SystemPermission {
  if (!isSystemNotificationSupported()) {
    return "unsupported";
  }
  return Notification.permission as SystemPermission;
}

/**
 * Enregistre le service worker qui permet d'afficher des notifications même
 * quand l'onglet n'est pas au premier plan, et de rouvrir l'app au clic.
 * Échoue silencieusement là où le SW n'est pas disponible.
 */
export async function registerNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  try {
    return await navigator.serviceWorker.register(SERVICE_WORKER_URL);
  } catch {
    return null;
  }
}

/**
 * Demande l'autorisation système. À appeler depuis un geste utilisateur
 * (bouton d'onboarding). Enregistre le SW si l'autorisation est accordée.
 */
export async function requestSystemPermission(): Promise<SystemPermission> {
  if (!isSystemNotificationSupported()) {
    return "unsupported";
  }
  try {
    const result = (await Notification.requestPermission()) as SystemPermission;
    if (result === "granted") {
      await registerNotificationServiceWorker();
    }
    return result;
  } catch {
    return getSystemPermission();
  }
}

/**
 * Affiche une notification OS pour une notification interne, si et seulement si
 * l'autorisation est accordée. Passe par le service worker quand il est prêt
 * (meilleure compatibilité mobile), sinon par le constructeur Notification.
 */
export async function showSystemNotification(notification: AppNotification): Promise<void> {
  if (getSystemPermission() !== "granted") {
    return;
  }

  const options: NotificationOptions = {
    body: notification.body,
    tag: notification.dedupeKey,
    icon: `${import.meta.env.BASE_URL}favicon-32.png`,
    badge: `${import.meta.env.BASE_URL}favicon-32.png`,
    data: { aperoId: notification.aperoId },
  };

  try {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(notification.title, options);
        return;
      }
    }
    // eslint-disable-next-line no-new
    new Notification(notification.title, options);
  } catch {
    // Ne jamais laisser une notification système casser le flux : le badge
    // interne a déjà été mis à jour en amont.
  }
}

export async function showSystemNotifications(notifications: AppNotification[]): Promise<void> {
  // On limite le bruit : au-delà de quelques nouveautés d'un coup, une seule
  // notification système récapitulative aurait plus de sens, mais on reste
  // simple ici et on affiche les nouveautés une à une.
  for (const notification of notifications) {
    // eslint-disable-next-line no-await-in-loop
    await showSystemNotification(notification);
  }
}
