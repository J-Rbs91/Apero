import type { AperitifOption, VoteStatus } from "../types/apero";
import { OpenInMapsButton } from "./OpenInMapsButton";
import { ChoiceGroup, type ChoiceOption } from "./ui";

type EventOptionMobileCardProps = {
  option: AperitifOption;
  value: VoteStatus | "";
  onChange: (status: VoteStatus) => void;
  /** Message d'erreur du créneau : « il manque ta réponse ici ». */
  error?: string;
  /** Créneau actuellement en tête (le plus de présences confirmées). */
  isLeading?: boolean;
  /** Vrai si le convive courant a déjà trinqué à ce créneau. */
  hasCheered?: boolean;
  /** Lève/repose le verre du convive courant. Absent = pas de trinquette ici. */
  onToggleCheer?: () => void;
  /** Désactive le bouton pendant l'envoi. */
  isCheerSaving?: boolean;
};

const voteChoices: ChoiceOption<VoteStatus>[] = [
  { value: "yes", label: "J’y serai", tone: "accent" },
  { value: "maybe", label: "J’me tâte", tone: "warn" },
  { value: "no", label: "Sans moi", tone: "danger" },
];

function formatCheerCount(count: number): string {
  return `${count} verre${count > 1 ? "s" : ""} levé${count > 1 ? "s" : ""}`;
}

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

/**
 * Un créneau proposé, avec le choix qui va avec. La carte porte son propre
 * état (« à trancher » tant que rien n'est coché) : on voit du premier coup
 * d'œil ce qui reste à faire dans la liste.
 */
export function EventOptionMobileCard({
  option,
  value,
  onChange,
  error,
  isLeading,
  hasCheered,
  onToggleCheer,
  isCheerSaving,
}: EventOptionMobileCardProps) {
  const cheerCount = option.cheers?.length ?? 0;
  const slotLabel = `${formatDateTime(option)}, ${option.location || "lieu mystère"}`;
  const subtitle =
    option.createdByRole === "participant" && option.createdByName
      ? `${option.location} · proposé par ${option.createdByName}`
      : option.location;

  return (
    <div className={`slot${value ? "" : " slot--incomplete"}`}>
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
        {isLeading ? (
          <span className="agenda-lead">En tête</span>
        ) : (
          <span className={`slot__state slot__state--${value ? "done" : "todo"}`}>
            {value ? "Répondu" : "À voter"}
          </span>
        )}
      </div>

      <ChoiceGroup
        name={`vote-${option.id}`}
        legend="Ta réponse"
        legendDetail={slotLabel}
        layout="row"
        options={voteChoices}
        value={value}
        onChange={onChange}
        error={error}
      />

      {(onToggleCheer || cheerCount > 0) && (
        <div className="cheer-row">
          {onToggleCheer && (
            <button
              type="button"
              className={`cheer-btn${hasCheered ? " cheer-btn--on" : ""}`}
              onClick={onToggleCheer}
              disabled={isCheerSaving}
              title={option.cheers?.join(", ")}
            >
              {hasCheered ? "Verre levé" : "Trinquer à ce créneau"}
            </button>
          )}
          {cheerCount > 0 && <span className="cheer-count">{formatCheerCount(cheerCount)}</span>}
        </div>
      )}
    </div>
  );
}
