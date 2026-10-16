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

// Glyphe de breloque : un carré dont le remplissage croît avec la rareté
// (vide, cœur plein, plein ; barré pour la honte). La rareté est écrite en
// toutes lettres : ni la forme ni la couleur ne portent le sens seules.
export function BadgeMedal({ badge }: BadgeMedalProps) {
  return (
    <div className={`badge-medal badge-medal--${badge.rarity}`}>
      <svg className="badge-medal__disc" viewBox="0 0 28 28" aria-hidden="true">
        <rect x="4.75" y="4.75" width="18.5" height="18.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        {badge.rarity === "rare" && <rect x="9" y="9" width="10" height="10" fill="currentColor" />}
        {badge.rarity === "legendary" && <rect x="4" y="4" width="20" height="20" fill="currentColor" />}
        {badge.rarity === "shame" && (
          <path d="M5 23L23 5" stroke="currentColor" strokeWidth="1.5" />
        )}
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
