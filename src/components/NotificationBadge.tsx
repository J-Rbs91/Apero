// Badge de notification façon Facebook : rond rouge, nombre en blanc.
// Visible dès qu'il y a au moins une notification non lue, indépendamment de
// toute autorisation système (section 5.A / 6).

type NotificationBadgeProps = {
  count: number;
  className?: string;
};

export function NotificationBadge({ count, className }: NotificationBadgeProps) {
  if (count <= 0) {
    return null;
  }

  const label = count > 99 ? "99+" : String(count);

  return (
    <span
      className={`notif-badge${className ? ` ${className}` : ""}`}
      role="status"
      aria-label={`${count} notification${count > 1 ? "s" : ""} non lue${count > 1 ? "s" : ""}`}
    >
      {label}
    </span>
  );
}
