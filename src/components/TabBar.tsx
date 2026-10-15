import { NavLink } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import { Icon, type IconName } from "./Icon";
import { NotificationBadge } from "./NotificationBadge";

type TabItem = { to: string; label: string; icon: IconName; end?: boolean };

const TABS: TabItem[] = [
  { to: "/", label: "Comptoir", icon: "home", end: true },
  { to: "/agenda", label: "Agenda", icon: "calendar" },
  { to: "/notifications", label: "Carnet", icon: "bell" },
  { to: "/palmares", label: "Palmarès", icon: "rosette" },
];

// Navigation de premier niveau : barre fixe en bas sur mobile, ligne de l'en-tête
// sur grand écran (design-system.md §5). Remplace l'ancien menu déroulant de
// l'accueil : Notifications, Agenda et Palmarès restent atteignables, partout.
export function TabBar() {
  const { unreadCount } = useNotifications();

  return (
    <nav className="tabbar" aria-label="Navigation de la Confrérie">
      {TABS.map((tab) => {
        const isCarnet = tab.to === "/notifications";
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              ["tabbar__item", isCarnet ? "notif-bell" : "", isActive ? "is-active" : ""]
                .filter(Boolean)
                .join(" ")
            }
            aria-label={
              isCarnet && unreadCount > 0
                ? `Notifications (${unreadCount} non lue${unreadCount > 1 ? "s" : ""})`
                : tab.label
            }
          >
            <span className="tabbar__icon">
              <Icon name={tab.icon} size={22} />
              {isCarnet && <NotificationBadge count={unreadCount} />}
            </span>
            <span className="tabbar__label" aria-hidden="true">
              {tab.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
