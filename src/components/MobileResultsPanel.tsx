import type { AperitifEvent, AperitifOption, ResultState } from "../types/apero";

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

  return (
    <div className="verdict">
      <p className="eyebrow">Verdict provisoire</p>
      <div className="verdict__title">
        {highlightedOption ? formatWinner(highlightedOption) : result.message}
      </div>
      {highlightedOption && <p className="meta">{result.message}</p>}
      {highlightedResult && (
        <div className="counts">
          <div className="cnt">
            <b>{highlightedResult.yesCount}</b>
            <span>Présent</span>
          </div>
          <div className="cnt">
            <b>{highlightedResult.maybeCount}</b>
            <span>Réserve</span>
          </div>
          <div className="cnt">
            <b>{highlightedResult.noCount}</b>
            <span>Absent</span>
          </div>
        </div>
      )}
    </div>
  );
}
