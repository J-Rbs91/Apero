import type { VoteStatus } from "../types/apero";

const voteOptions: Array<{ value: VoteStatus; label: string; tone: "y" | "m" | "n" }> = [
  { value: "yes", label: "J’y serai", tone: "y" },
  { value: "maybe", label: "J’me tâte", tone: "m" },
  { value: "no", label: "Sans moi", tone: "n" },
];

type VoteSegmentedControlProps = {
  /** Attribut name des radios (unicité technique du groupe). */
  name: string;
  /** Libellé humain du groupe (date, heure, lieu du créneau) annoncé par les
   * lecteurs d'écran — sans lui, le groupe serait nommé par son id technique. */
  label?: string;
  value: VoteStatus | "";
  onChange: (status: VoteStatus) => void;
};

export function VoteSegmentedControl({
  name,
  label,
  value,
  onChange,
}: VoteSegmentedControlProps) {
  return (
    <div className="seg" role="radiogroup" aria-label={label ?? name}>
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
