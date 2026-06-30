import type { VoteStatus } from "../types/apero";

const voteOptions: Array<{ value: VoteStatus; label: string; tone: "y" | "m" | "n" }> = [
  { value: "yes", label: "Présent", tone: "y" },
  { value: "maybe", label: "Réserve", tone: "m" },
  { value: "no", label: "Absent", tone: "n" },
];

type VoteSegmentedControlProps = {
  name: string;
  value: VoteStatus | "";
  onChange: (status: VoteStatus) => void;
};

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
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
