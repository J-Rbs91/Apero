import type { AperitifEvent, AperitifOption, ResultState } from "../types/apero";
import { calculateAverageTraquenardLevel } from "../utils/calculateResults";
import { MiniMap } from "./MiniMap";
import { TraquenardGauge } from "./TraquenardGauge";

type MobileResultsPanelProps = {
  event: AperitifEvent;
  result: ResultState;
  /**
   * Vrai tant que seul l'organisateur figure au registre : son auto-vote ne
   * fait pas un verdict. Le panneau attend la tablée au lieu de proclamer.
   */
  awaitingGuests?: boolean;
  /** Apéro passé : le verdict se grise et porte le tampon « Servi ». */
  isPast?: boolean;
};

function formatWinner(option: AperitifOption): string {
  const dateLabel = option.date
    ? new Intl.DateTimeFormat("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }).format(new Date(`${option.date}T00:00:00`))
    : "Date mystère";

  return `${dateLabel} · ${option.time || "heure mystère"} — ${option.location}`;
}

function describeEyebrow(result: ResultState): string {
  switch (result.type) {
    case "winner":
      return "Le rendez-vous retenu";
    case "tie":
      return "Plusieurs options en lice";
    default:
      return "En attente de réponses";
  }
}

export function MobileResultsPanel({
  event,
  result,
  awaitingGuests,
  isPast,
}: MobileResultsPanelProps) {
  const highlightedId = awaitingGuests
    ? undefined
    : result.type === "winner"
      ? result.optionId
      : result.type === "tie"
        ? result.optionIds[0]
        : undefined;

  const highlightedOption = highlightedId
    ? event.options.find((option) => option.id === highlightedId)
    : undefined;
  const highlightedResult = highlightedId
    ? result.results.find((item) => item.optionId === highlightedId)
    : undefined;

  const averageTraquenardLevel = calculateAverageTraquenardLevel(event);
  const traquenardVoteCount = event.participants.filter(
    (participant) => typeof participant.traquenardLevel === "number",
  ).length;

  // Créneau à cartographier : celui en tête s'il est localisé, sinon l'unique
  // créneau localisé de l'apéro (pas encore de votes ≠ pas de carte). Avec
  // plusieurs lieux distincts et aucun vainqueur, on s'abstient : afficher un
  // lieu arbitraire serait trompeur.
  const optionsWithCoords = event.options.filter(
    (option) => option.locationLat != null && option.locationLng != null,
  );
  const mapOption =
    highlightedOption?.locationLat != null && highlightedOption.locationLng != null
      ? highlightedOption
      : optionsWithCoords.length === 1
        ? optionsWithCoords[0]
        : undefined;

  return (
    <div className={`verdict${isPast ? " verdict--past" : ""}`}>
      {isPast && (
        <span className="verdict__stamp" aria-label="Apéro passé">
          Servi
        </span>
      )}
      <p className="eyebrow">{awaitingGuests ? "Le comptoir délibère" : describeEyebrow(result)}</p>
      <div className="verdict__title">
        {awaitingGuests
          ? "La tablée n’a pas encore émargé — le zinc réserve son verdict."
          : highlightedOption
            ? formatWinner(highlightedOption)
            : result.message}
      </div>
      {!awaitingGuests && highlightedOption && <p className="meta">{result.message}</p>}
      {!awaitingGuests && highlightedResult && (
        <div className="counts">
          <div className="cnt">
            <b>{highlightedResult.yesCount}</b>
            <span>Présences</span>
          </div>
          <div className="cnt">
            <b>{highlightedResult.maybeCount}</b>
            <span>Hésitations</span>
          </div>
          <div className="cnt">
            <b>{highlightedResult.noCount}</b>
            <span>Désertions</span>
          </div>
        </div>
      )}
      {mapOption && mapOption.locationLat != null && mapOption.locationLng != null && (
        <MiniMap
          lat={mapOption.locationLat}
          lng={mapOption.locationLng}
          label={mapOption.location}
          address={mapOption.locationAddress}
        />
      )}
      <TraquenardGauge level={averageTraquenardLevel} voteCount={traquenardVoteCount} />
    </div>
  );
}
