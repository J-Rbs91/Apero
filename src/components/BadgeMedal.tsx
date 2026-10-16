import type { BadgeDefinition } from "../types/badges";

type BadgeMedalProps = {
  badge: BadgeDefinition;
};

const RARITY_LABEL: Record<BadgeDefinition["rarity"], string> = {
  common: "Commune",
  rare: "Rare",
  legendary: "Légendaire",
  shame: "Honteuse",
};

// Rosette de tombola : disque + deux rubans. La rareté est écrite en toutes
// lettres (pas seulement portée par la couleur).
export function BadgeMedal({ badge }: BadgeMedalProps) {
  return (
    <div className={`badge-medal badge-medal--${badge.rarity}`}>
      <svg className="badge-medal__disc" viewBox="0 0 56 64" aria-hidden="true">
        <path d="M17 38l-7 22 12-6 6 8 6-26z" fill="currentColor" opacity="0.72" />
        <path d="M39 38l7 22-12-6-6 8-6-26z" fill="currentColor" opacity="0.72" />
        <circle cx="28" cy="26" r="20" fill="currentColor" />
        <circle cx="28" cy="26" r="14.5" fill="none" stroke="var(--rosette-ink)" strokeWidth="2" opacity="0.55" />
        <path
          d="M28 14.5l3.3 7.1 7.7.8-5.8 5.3 1.8 7.6-7-4.4-7 4.4 1.8-7.6-5.8-5.3 7.7-.8z"
          fill="var(--rosette-ink)"
        />
      </svg>
      <div className="badge-medal__body">
        <div className="badge-medal__name">
          {badge.name}
          <span className="badge-medal__rarity">{RARITY_LABEL[badge.rarity]}</span>
        </div>
        <p className="badge-medal__desc">{badge.description}</p>
      </div>
    </div>
  );
}
