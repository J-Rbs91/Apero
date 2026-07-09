type BinaryChoiceProps = {
  /** Sert de nom du groupe radio et de libellé accessible. */
  name: string;
  /** `null` tant que rien n'est tranché (aucune pastille allumée). */
  value: boolean | null;
  onChange: (value: boolean) => void;
  yesLabel: string;
  noLabel: string;
};

/**
 * Bascule oui/non façon comptoir : deux pastilles côte à côte, même famille
 * visuelle que le contrôle de vote (`.seg`). Réutilisée pour « les mioches sont
 * conviés ? » à la création et « tu débarques seul ou en escadron ? » à la
 * réponse.
 */
export function BinaryChoice({
  name,
  value,
  onChange,
  yesLabel,
  noLabel,
}: BinaryChoiceProps) {
  return (
    <div className="seg seg--duo" role="radiogroup" aria-label={name}>
      <label className={value === true ? "seg__opt on-y" : "seg__opt"}>
        <input
          type="radio"
          name={name}
          checked={value === true}
          onChange={() => onChange(true)}
        />
        <span>{yesLabel}</span>
      </label>
      <label className={value === false ? "seg__opt on-y" : "seg__opt"}>
        <input
          type="radio"
          name={name}
          checked={value === false}
          onChange={() => onChange(false)}
        />
        <span>{noLabel}</span>
      </label>
    </div>
  );
}
