import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";
import { getAperoStorageMode } from "../config/aperoApiConfig";
import { useNotifications } from "../hooks/useNotifications";
import { useNotificationPermission } from "../hooks/useNotificationPermission";
import type { AppNotification } from "../types/notifications";

const storageMode = getAperoStorageMode();

function aperoPath(aperoId: string): string {
  return storageMode === "api-vps" ? `/invite/${aperoId}` : `/event/${aperoId}`;
}

function formatWhen(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return "";
  }
  const diffMinutes = Math.round((Date.now() - then) / 60000);
  if (diffMinutes < 1) {
    return "à l’instant";
  }
  if (diffMinutes < 60) {
    return `il y a ${diffMinutes} min`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `il y a ${diffHours} h`;
  }
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(iso));
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead, clearNotifications } = useNotifications();
  const { permission, isSupported, request } = useNotificationPermission();

  // On fige les non-lues à l'ouverture pour continuer à les mettre en avant
  // visuellement, puis on solde le compteur (comportement d'un centre de notifs).
  const initiallyUnread = useRef<Set<string>>(new Set());
  const [captured, setCaptured] = useState(false);

  useEffect(() => {
    if (captured) {
      return;
    }
    initiallyUnread.current = new Set(
      notifications.filter((notification) => !notification.read).map((notification) => notification.id),
    );
    setCaptured(true);
    markAllRead();
  }, [captured, notifications, markAllRead]);

  const hasNotifications = notifications.length > 0;

  const canOfferSystem = isSupported && permission !== "granted" && permission !== "denied";

  const sorted = useMemo(() => notifications, [notifications]);

  function handleOpen(notification: AppNotification) {
    navigate(aperoPath(notification.aperoId));
  }

  return (
    <MobilePage className="agenda-mobile" overlay="deep">
      <MobileHeader eyebrow="Le carnet du comptoir" />

      <section className="sheet">
        <h1 className="h1 h1--sm">Ce que le zinc a noté</h1>
        <p className="lede">
          Réponses, propositions, confirmations et rappels : tout ce que le zinc a noté pour toi
          depuis ton dernier passage.
        </p>
        {hasNotifications && (
          <button
            type="button"
            className="ghost-link"
            onClick={() => clearNotifications()}
          >
            Vider le carnet
          </button>
        )}
      </section>

      {canOfferSystem && (
        <section className="sheet">
          <p className="lbl">Notifications du téléphone</p>
          <p className="lede">
            Pour être prévenu même quand l’app est fermée, autorise les notifications système. Sinon,
            pas de panique : le badge rouge reste là dès que tu ouvres la Confrérie.
          </p>
          <button
            type="button"
            className="button button--primary button--block"
            onClick={() => {
              void request();
            }}
          >
            Autoriser les notifications système
          </button>
        </section>
      )}

      {!hasNotifications ? (
        <section className="sheet">
          <p className="lede">
            Le carnet est vide, silencieux, presque zen. Dès qu’un convive bouge une olive, tu le
            sauras ici.
          </p>
          <Link className="button button--ghost button--block" to="/agenda">
            Voir l’ardoise du comptoir
          </Link>
        </section>
      ) : (
        <div className="notif-list">
          {sorted.map((notification) => {
            const wasUnread = initiallyUnread.current.has(notification.id);
            return (
              <button
                type="button"
                key={notification.id}
                className={`sheet notif-item${wasUnread ? " notif-item--unread" : ""}`}
                onClick={() => handleOpen(notification)}
              >
                <div className="notif-item__head">
                  <span className="notif-item__title">{notification.title}</span>
                  {wasUnread && <span className="notif-item__dot" aria-hidden="true" />}
                </div>
                <p className="notif-item__body">{notification.body}</p>
                <p className="meta">{formatWhen(notification.createdAt)}</p>
              </button>
            );
          })}
        </div>
      )}

      {unreadCount > 0 && (
        <section className="sheet">
          <button type="button" className="ghost-link" onClick={() => markAllRead()}>
            Tout marquer comme lu
          </button>
        </section>
      )}
    </MobilePage>
  );
}
