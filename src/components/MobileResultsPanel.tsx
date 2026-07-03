import type { AperitifEvent, AperitifOption, ResultState } from "../types/apero";
import { calculateAverageTraquenardLevel } from "../utils/calculateResults";
import { MiniMap } from "./MiniMap";
import { TraquenardGauge } from "./TraquenardGauge";

type MobileResultsPanelProps = {
  event: AperitifEvent;
  result: ResultState;
};

function formatWinner(option: AperitifOption): string {
  const dateLabel = option.date
    ? new Intl.DateTimeFormat("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }).format(new Date(`${option.date}T00:00:00`))
    : "Date mystère";

  return `${dateLabel} · ${option.time || "?"} — ${option.location}`;
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

export function MobileResultsPanel({ event, result }: MobileResultsPanelProps) {
  const highlightedId =
    result.type === "winner"
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

  return (
    <div className="verdict">
      <p className="eyebrow">{describeEyebrow(result)}</p>
      <div className="verdict__title">
        {highlightedOption ? formatWinner(highlightedOption) : result.message}
      </div>
      {highlightedOption && <p className="meta">{result.message}</p>}
      {highlightedResult && (
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
      {highlightedOption &&
        highlightedOption.locationLat != null &&
        highlightedOption.locationLng != null && (
          <MiniMap
            lat={highlightedOption.locationLat}
            lng={highlightedOption.locationLng}
            label={highlightedOption.location}
            address={highlightedOption.locationAddress}
          />
        )}
      <TraquenardGauge
        level={averageTraquenardLevel}
        voteCount={traquenardVoteCount}
        orientation="horizontal"
      />
    </div>
  );
}
