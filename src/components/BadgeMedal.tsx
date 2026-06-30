import type { BadgeDefinition } from "../types/badges";

type BadgeMedalProps = {
  badge: BadgeDefinition;
};

export function BadgeMedal({ badge }: BadgeMedalProps) {
  return (
    <div className={`badge-medal badge-medal--${badge.rarity}`}>
      <span className="badge-medal__disc" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20">
          <circle
            cx="12"
            cy="12"
            r="9.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            opacity="0.45"
          />
          <path
            d="M12 5.6l1.85 3.95 4.25.45-3.2 2.95 1 4.15L12 15.1l-3.9 2.45 1-4.15-3.2-2.95 4.25-.45z"
            fill="currentColor"
          />
        </svg>
      </span>
      <div className="badge-medal__body">
        <div className="badge-medal__name">{badge.name}</div>
        <p className="badge-medal__desc">{badge.description}</p>
      </div>
    </div>
  );
}
