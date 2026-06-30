import { Icon } from "./Icon";
import type { BadgeDefinition } from "../types/badges";

type BadgeMedalProps = {
  badge: BadgeDefinition;
};

export function BadgeMedal({ badge }: BadgeMedalProps) {
  return (
    <article className={`badge-medal badge-medal--${badge.rarity}`}>
      <span className="badge-medal__icon">
        <Icon name={badge.iconName} label={badge.name} size={28} />
      </span>
      <div>
        <h3>{badge.name}</h3>
        <p>{badge.description}</p>
      </div>
    </article>
  );
}
