import type { AperitifOption, VoteStatus } from "../types/apero";
import { OpenInMapsButton } from "./OpenInMapsButton";
import { SlotLeaf, slotDateLabel } from "./SlotLeaf";
import { VoteSegmentedControl } from "./VoteSegmentedControl";

type EventOptionMobileCardProps = {
  option: AperitifOption;
  value: VoteStatus | "";
  onChange: (status: VoteStatus) => void;
  /** Créneau actuellement en tête (le plus de présences confirmées). */
  isLeading?: boolean;
};

// Le ticket de vote : calendrier-feuille, heure, lieu, puis trois talons à
// poinçonner (design-system §5).
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
        <SlotLeaf option={option} />
        <div className="slot__body">
          <div className="slot__d">
            <span className="sr-only">{slotDateLabel(option)} · </span>
            {option.time || "heure mystère"}
          </div>
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
