import type { AperitifOption, VoteStatus } from "../types/apero";
import { VoteSegmentedControl } from "./VoteSegmentedControl";

type EventOptionMobileCardProps = {
  option: AperitifOption;
  value: VoteStatus | "";
  onChange: (status: VoteStatus) => void;
};

function formatDateTime(option: AperitifOption): string {
  const dateLabel = option.date
    ? new Intl.DateTimeFormat("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }).format(new Date(`${option.date}T00:00:00`))
    : "Date mystère";

  return `${dateLabel} · ${option.time || "heure mystère"}`;
}

export function EventOptionMobileCard({
  option,
  value,
  onChange,
}: EventOptionMobileCardProps) {
  const subtitle =
    option.createdByRole === "participant" && option.createdByName
      ? `${option.location} · proposé par ${option.createdByName}`
      : option.location;

  return (
    <div className="slot">
      <div className="slot__top">
        <div>
          <div className="slot__d">{formatDateTime(option)}</div>
          <div className="slot__p">{subtitle}</div>
          {option.locationAddress && <div className="slot__p">{option.locationAddress}</div>}
          {option.note && <div className="slot__p">{option.note}</div>}
        </div>
      </div>
      <VoteSegmentedControl
        name={`vote-${option.id}`}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
