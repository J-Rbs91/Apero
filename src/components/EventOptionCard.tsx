import type { AperitifOption, EventResults, ParticipantResponse } from "../types/apero";
import { formatOption } from "../utils/formatOption";

type EventOptionCardProps = {
  option: AperitifOption;
  result?: EventResults;
  participants?: ParticipantResponse[];
  highlighted?: boolean;
};

const voteLabels = {
  yes: "Chaud patate",
  maybe: "Je vais voir",
  no: "J'ai poney",
} as const;

export function EventOptionCard({
  option,
  result,
  participants = [],
  highlighted = false,
}: EventOptionCardProps) {
  return (
    <article className={highlighted ? "option-card option-card--hot" : "option-card"}>
      <div className="option-card__main">
        <p className="eyebrow">Combinaison comptoir</p>
        <h3>{formatOption(option)}</h3>
        {option.note && <p>{option.note}</p>}
      </div>

      <div className="option-score">
        <span>
          Oui <strong>{result?.yesCount ?? 0}</strong>
        </span>
        <span>
          Peut-etre <strong>{result?.maybeCount ?? 0}</strong>
        </span>
        <span>
          Non <strong>{result?.noCount ?? 0}</strong>
        </span>
      </div>

      {participants.length > 0 && (
        <div className="option-voters">
          {participants.map((participant) => (
            <span key={participant.id}>
              {participant.participantName}: {voteLabels[participant.votes[option.id]]}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
