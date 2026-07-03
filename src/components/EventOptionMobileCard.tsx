import type { AperitifOption, VoteStatus } from "../types/apero";
import { OpenInMapsButton } from "./OpenInMapsButton";
import { VoteSegmentedControl } from "./VoteSegmentedControl";

type EventOptionMobileCardProps = {
  option: AperitifOption;
  value: VoteStatus | "";
  onChange: (status: VoteStatus) => void;
  /** Créneau actuellement en tête (le plus de présences confirmées). */
  isLeading?: boolean;
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
  isLeading,
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
          {(option.locationAddress || (option.locationLat != null && option.locationLng != null)) && (
            <OpenInMapsButton
              className="slot__maplink"
              label={option.location}
              address={option.locationAddress}
              lat={option.locationLat}
              lng={option.locationLng}
            />
          )}
          {option.note && <div className="slot__p">{option.note}</div>}
        </div>
        {isLeading && <span className="agenda-lead">En tête</span>}
      </div>
      <VoteSegmentedControl
        name={`vote-${option.id}`}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
