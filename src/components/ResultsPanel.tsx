import type { AperitifEvent, ResultState } from "../types/apero";
import { formatOption } from "../utils/formatOption";
import { EventOptionCard } from "./EventOptionCard";
import { TicketCard } from "./TicketCard";

type ResultsPanelProps = {
  event: AperitifEvent;
  result: ResultState;
};

export function ResultsPanel({ event, result }: ResultsPanelProps) {
  const winningIds =
    result.type === "winner"
      ? [result.optionId]
      : result.type === "tie"
        ? result.optionIds
        : [];
  const contributions = event.participants.filter((participant) => participant.brings);

  return (
    <TicketCard className="results-panel">
      <div className="section-heading">
        <p className="eyebrow">Verdict du zinc</p>
        <h2>{result.message}</h2>
      </div>

      {winningIds.length > 0 && (
        <div className="winner-list">
          {winningIds.map((optionId) => {
            const option = event.options.find((candidate) => candidate.id === optionId);
            return option ? <strong key={option.id}>{formatOption(option)}</strong> : null;
          })}
        </div>
      )}

      <div className="option-grid">
        {event.options.map((option) => (
          <EventOptionCard
            key={option.id}
            option={option}
            result={result.results.find((optionResult) => optionResult.optionId === option.id)}
            participants={event.participants.filter(
              (participant) => participant.votes[option.id] !== undefined,
            )}
            highlighted={winningIds.includes(option.id)}
          />
        ))}
      </div>

      <div className="bring-list">
        <h3>Qui ramene quoi ?</h3>
        {contributions.length === 0 ? (
          <p>Aucune offrande declaree. Les cacahuetes tremblent.</p>
        ) : (
          <ul>
            {contributions.map((participant) => (
              <li key={participant.id}>
                <strong>{participant.participantName}</strong> : {participant.brings}
              </li>
            ))}
          </ul>
        )}
      </div>
    </TicketCard>
  );
}
