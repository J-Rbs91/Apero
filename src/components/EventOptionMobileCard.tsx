import type { AperitifOption, VoteStatus } from "../types/apero";
import { formatOption } from "../utils/formatOption";
import { VoteSegmentedControl } from "./VoteSegmentedControl";

type EventOptionMobileCardProps = {
  option: AperitifOption;
  value: VoteStatus | "";
  onChange: (status: VoteStatus) => void;
};

export function EventOptionMobileCard({
  option,
  value,
  onChange,
}: EventOptionMobileCardProps) {
  return (
    <article className="event-option-mobile-card">
      <div className="event-option-mobile-card__header">
        <p className="eyebrow">Proposition</p>
        <h3>{formatOption(option)}</h3>
        {option.note && <p className="event-option-mobile-card__note">{option.note}</p>}
      </div>
      <VoteSegmentedControl
        name={`vote-${option.id}`}
        value={value}
        onChange={onChange}
      />
    </article>
  );
}
