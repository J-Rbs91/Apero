// Orchestration des notifications : le point où l'on décide quoi notifier.
//
// Enchaîne : chargement + déchiffrement des apéros connus localement →
// détermination du « viewer » (rôle + réponse) → moteur de diff → écriture du
// badge interne → notification système best-effort pour les nouveautés.
// C'est le seul module qui a des effets de bord (localStorage, API Notification)
// en s'appuyant sur le moteur pur.

import type { AperitifEvent } from "../types/apero";
import type { AppNotification, NotificationViewer } from "../types/notifications";
import { getMyAperos, type MyAperoItem } from "./encryptedAperoRepository";
import { findLocalApero } from "./localAperoRegistry";
import { diffAperoNotifications } from "./notificationEngine";
import { getSnapshot, saveSnapshot } from "./notificationSnapshots";
import { addNotifications } from "./notificationStore";
import { showSystemNotifications } from "./systemNotifications";
import { getStoredComptoirName } from "../hooks/useComptoirName";
import { normalizeMemberName } from "../utils/memberName";
import { createId } from "../utils/createId";
import { deriveVote } from "./notificationEngine";

// Construit le « viewer » pour un apéro : rôle depuis le registre local,
// réponse depuis le participant qui porte le nom de comptoir de l'appareil.
function resolveViewer(
  event: AperitifEvent,
  role: "creator" | "participant",
  comptoirName: string,
): NotificationViewer {
  const normalizedName = normalizeMemberName(comptoirName);
  const me = event.participants.find(
    (participant) => normalizeMemberName(participant.participantName) === normalizedName,
  );
  return { role, vote: deriveVote(me), normalizedName };
}

/**
 * Synchronise les notifications d'un apéro déjà déchiffré. Idempotent :
 * s'appuie sur l'instantané persistant et la déduplication du store, donc
 * peut être appelé à chaque affichage sans créer de doublons.
 * Renvoie les notifications réellement ajoutées.
 */
export function syncAperoNotifications(
  event: AperitifEvent,
  role: "creator" | "participant",
): AppNotification[] {
  const comptoirName = getStoredComptoirName();
  const viewer = resolveViewer(event, role, comptoirName);

  const previous = getSnapshot(event.id);
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  const { notifications, snapshot } = diffAperoNotifications(
    event,
    previous,
    viewer,
    nowMs,
    () => createId("notif"),
    nowIso,
  );

  // Toujours mémoriser l'instantané (même sans notification) pour ne pas
  // rejouer l'historique au prochain passage.
  saveSnapshot(event.id, snapshot);

  const fresh = addNotifications(notifications);

  // Notifications système best-effort, uniquement sur les vraies nouveautés.
  if (fresh.length > 0) {
    void showSystemNotifications(fresh);
  }

  return fresh;
}

/**
 * Variante pratique pour les pages qui viennent de charger un apéro : retrouve
 * le rôle dans le registre local (créateur/participant) et synchronise.
 */
export function syncAperoNotificationsFromRegistry(event: AperitifEvent): AppNotification[] {
  const entry = findLocalApero(event.id);
  if (!entry) {
    // Apéro consulté sans être dans « Mes apéros » (lien en lecture seule) :
    // on ne suit pas ses notifications sur cet appareil.
    return [];
  }
  return syncAperoNotifications(event, entry.role ?? "participant");
}

/**
 * Passe en revue tous les apéros connus localement, les déchiffre et
 * synchronise leurs notifications. C'est le « poll » naturel appelé au
 * démarrage de l'app et lors de l'ouverture de l'agenda.
 */
export async function syncAllMyAperos(): Promise<AppNotification[]> {
  let mine: MyAperoItem[];
  try {
    mine = await getMyAperos();
  } catch {
    return [];
  }

  const added: AppNotification[] = [];
  for (const item of mine) {
    if (!item.event || item.event.status !== "active") {
      continue;
    }
    const role = item.entry.role ?? "participant";
    added.push(...syncAperoNotifications(item.event, role));
  }
  return added;
}
