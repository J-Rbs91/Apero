import type { AperitifEvent, ResultState } from "../types/apero";
import { formatOption } from "../utils/formatOption";
import { TicketCard } from "./TicketCard";

type MobileResultsPanelProps = {
  event: AperitifEvent;
  result: ResultState;
};

export function MobileResultsPanel({ event, result }: MobileResultsPanelProps) {
  const winningIds =
    result.type === "winner"
      ? [result.optionId]
      : result.type === "tie"
        ? result.optionIds
        : [];

  return (
    <TicketCard className="mobile-results-panel ticket-card--verdict">
      <div className="section-heading section-heading--with-stamp">
        <p className="eyebrow">Verdict actuel</p>
        <h2>{result.message}</h2>
      </div>

      <div className="mobile-results-panel__list">
        {event.options.map((option) => {
          const optionResult = result.results.find((item) => item.optionId === option.id);
          const highlighted = winningIds.includes(option.id);

          return (
            <article
              className={
                highlighted
                  ? "mobile-results-panel__item mobile-results-panel__item--hot"
                  : "mobile-results-panel__item"
              }
              key={option.id}
            >
              <h3>{formatOption(option)}</h3>
              <div className="mobile-results-panel__scores">
                <span>
                  Présents <strong>{optionResult?.yesCount ?? 0}</strong>
                </span>
                <span>
                  Réserves <strong>{optionResult?.maybeCount ?? 0}</strong>
                </span>
                <span>
                  Absents <strong>{optionResult?.noCount ?? 0}</strong>
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </TicketCard>
  );
}
