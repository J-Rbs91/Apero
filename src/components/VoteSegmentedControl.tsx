import type { VoteStatus } from "../types/apero";

const voteOptions: Array<{ value: VoteStatus; label: string }> = [
  { value: "yes", label: "Present, coude leve" },
  { value: "maybe", label: "Sous reserve du ministre" },
  { value: "no", label: "Retenu par affaire grave" },
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
    <div className="vote-segmented-control" role="radiogroup" aria-label={name}>
      {voteOptions.map((option) => (
        <label
          className={
            value === option.value
              ? "vote-segmented-control__option vote-segmented-control__option--selected"
              : "vote-segmented-control__option"
          }
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
