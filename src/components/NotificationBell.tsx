import { Link } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import { NotificationBadge } from "./NotificationBadge";

// Cloche + badge rouge, à poser dans les en-têtes. Un lien vers le centre de
// notifications ; le badge se met à jour en direct via le store.
export function NotificationBell({ className }: { className?: string }) {
  const { unreadCount } = useNotifications();

  return (
    <Link
      to="/notifications"
      className={`notif-bell${className ? ` ${className}` : ""}`}
      aria-label={
        unreadCount > 0
          ? `Notifications (${unreadCount} non lue${unreadCount > 1 ? "s" : ""})`
          : "Notifications"
      }
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
        <path
          d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.7 21a2 2 0 0 1-3.4 0"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <NotificationBadge count={unreadCount} />
    </Link>
  );
}
