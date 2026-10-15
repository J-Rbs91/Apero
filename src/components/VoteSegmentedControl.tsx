import type { VoteStatus } from "../types/apero";
import { Icon, type IconName } from "./Icon";

const voteOptions: Array<{ value: VoteStatus; label: string; tone: "y" | "m" | "n"; icon: IconName }> = [
  { value: "yes", label: "J’y serai", tone: "y", icon: "check" },
  { value: "maybe", label: "J’me tâte", tone: "m", icon: "maybe" },
  { value: "no", label: "Sans moi", tone: "n", icon: "close" },
];

type VoteSegmentedControlProps = {
  name: string;
  value: VoteStatus | "";
  onChange: (status: VoteStatus) => void;
};

// Trois talons à poinçonner. Le choix n'est jamais porté par la couleur seule :
// chaque talon a son glyphe (✓ / ? / ✕) et son libellé.
export function VoteSegmentedControl({
  name,
  value,
  onChange,
}: VoteSegmentedControlProps) {
  return (
    <div className="seg" role="radiogroup" aria-label={name}>
      {voteOptions.map((option) => (
        <label
          className={value === option.value ? `seg__opt on-${option.tone}` : "seg__opt"}
          key={option.value}
        >
          <input
            type="radio"
            name={name}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <Icon name={option.icon} size={20} />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
