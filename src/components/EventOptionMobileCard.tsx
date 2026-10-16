import type { AperitifOption, VoteStatus } from "../types/apero";
import { OpenInMapsButton } from "./OpenInMapsButton";
import { SlotHead } from "./SlotHead";
import { slotDateLabel } from "./SlotLeaf";
import { ChoiceGroup, type ChoiceOption } from "./ui";

type EventOptionMobileCardProps = {
  option: AperitifOption;
  value: VoteStatus | "";
  onChange: (status: VoteStatus) => void;
  /** Message d'erreur du créneau : « il manque ta réponse ici ». */
  error?: string;
  /** Ref posée sur la carte, pour pouvoir y ramener le regard à l'envoi. */
  containerRef?: (node: HTMLDivElement | null) => void;
  /** Vrai le temps de la secousse qui signale le créneau refusé. */
  isShaking?: boolean;
  /** Créneau actuellement en tête (le plus de présences confirmées). */
  isLeading?: boolean;
  /** Vrai si le convive courant a déjà trinqué à ce créneau. */
  hasCheered?: boolean;
  /** Lève/repose le verre du convive courant. Absent = pas de trinquette ici. */
  onToggleCheer?: () => void;
  /** Désactive le bouton pendant l'envoi. */
  isCheerSaving?: boolean;
};

// Chaque talon a son glyphe (✓ / ? / ✕) : le choix n'est jamais porté par la
// couleur seule.
const voteChoices: ChoiceOption<VoteStatus>[] = [
  { value: "yes", label: "Oui", tone: "accent", icon: "check" },
  { value: "maybe", label: "Peut-être", tone: "warn", icon: "maybe" },
  { value: "no", label: "Non", tone: "danger", icon: "close" },
];

function formatCheerCount(count: number): string {
  return `${count} soutien${count > 1 ? "s" : ""}`;
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
  containerRef,
  isShaking,
  isLeading,
  hasCheered,
  onToggleCheer,
  isCheerSaving,
}: EventOptionMobileCardProps) {
  const cheerCount = option.cheers?.length ?? 0;
  const slotLabel = `${slotDateLabel(option)} · ${option.time || "Sans heure"}, ${option.location || "Sans lieu"}`;
  const subtitle =
    option.createdByRole === "participant" && option.createdByName
      ? `${option.location} · par ${option.createdByName}`
      : option.location;

  return (
    <div
      ref={containerRef}
      className={[
        "slot",
        value ? "" : error ? "slot--error" : "slot--incomplete",
        isShaking ? "is-shaking" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <SlotHead
        option={option}
        badge={
          isLeading ? (
            <span className="agenda-lead">En tête</span>
          ) : (
            <span className={`slot__state slot__state--${value ? "done" : "todo"}`}>
              {value ? "Répondu" : "Sans réponse"}
            </span>
          )
        }
      >
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
      </SlotHead>

      <ChoiceGroup
        name={`vote-${option.id}`}
        legend="Réponse"
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
              aria-label="Soutenir ce créneau"
              aria-pressed={Boolean(hasCheered)}
            >
              +1
            </button>
          )}
          {cheerCount > 0 && <span className="cheer-count">{formatCheerCount(cheerCount)}</span>}
        </div>
      )}
    </div>
  );
}
