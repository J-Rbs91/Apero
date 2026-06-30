import { useEffect, useMemo, useState } from "react";
import type { AperitifEvent, ParticipantResponse, VoteStatus } from "../types/apero";
import { createId } from "../utils/createId";
import { formatOption } from "../utils/formatOption";
import { TicketCard } from "./TicketCard";

const bringOptions = [
  "Chips",
  "Saucisson",
  "Cacahuetes",
  "Un pack",
  "Du soft",
  "Des glacons, parce que quelqu'un doit etre adulte",
];

const voteOptions: Array<{ value: VoteStatus; label: string }> = [
  { value: "yes", label: "Chaud patate" },
  { value: "maybe", label: "Je vais voir avec le ministre" },
  { value: "no", label: "J'ai poney" },
];

type DraftVotes = Record<string, VoteStatus | "">;

type VoteFormProps = {
  event: AperitifEvent;
  isSaving: boolean;
  onSubmit: (response: ParticipantResponse) => Promise<void>;
};

export function VoteForm({ event, isSaving, onSubmit }: VoteFormProps) {
  const emptyVotes = useMemo(
    () =>
      event.options.reduce<DraftVotes>((votes, option) => {
        votes[option.id] = "";
        return votes;
      }, {}),
    [event.options],
  );
  const [participantName, setParticipantName] = useState("");
  const [votes, setVotes] = useState<DraftVotes>(emptyVotes);
  const [brings, setBrings] = useState("");
  const [comment, setComment] = useState("");
  const [feedback, setFeedback] = useState("");

  const existingParticipant = useMemo(() => {
    const normalizedName = participantName.trim().toLowerCase();

    if (!normalizedName) {
      return null;
    }

    return (
      event.participants.find(
        (participant) =>
          participant.participantName.trim().toLowerCase() === normalizedName,
      ) ?? null
    );
  }, [event.participants, participantName]);

  useEffect(() => {
    setVotes(emptyVotes);
  }, [emptyVotes]);

  useEffect(() => {
    if (!existingParticipant) {
      return;
    }

    setVotes({ ...emptyVotes, ...existingParticipant.votes });
    setBrings(existingParticipant.brings ?? "");
    setComment(existingParticipant.comment ?? "");
    setFeedback("Vote retrouve. Tu peux retourner ta veste proprement.");
  }, [emptyVotes, existingParticipant]);

  function updateVote(optionId: string, status: VoteStatus) {
    setVotes((currentVotes) => ({
      ...currentVotes,
      [optionId]: status,
    }));
    setFeedback("");
  }

  async function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();

    const trimmedName = participantName.trim();

    if (!trimmedName) {
      setFeedback("Il faut un pseudo, meme un pseudo de comptoir.");
      return;
    }

    const missingVote = event.options.some((option) => !votes[option.id]);

    if (missingVote) {
      setFeedback("Un avis par option, sinon le scrutin part en cacahuete.");
      return;
    }

    const now = new Date().toISOString();
    const response: ParticipantResponse = {
      id: existingParticipant?.id ?? createId("participant"),
      participantName: trimmedName,
      votes: votes as Record<string, VoteStatus>,
      brings: brings.trim() || undefined,
      comment: comment.trim() || undefined,
      createdAt: existingParticipant?.createdAt ?? now,
      updatedAt: now,
    };

    await onSubmit(response);
    setFeedback(
      existingParticipant
        ? "Vote mis a jour. Le retournement de veste est valide."
        : "Bulletin depose. Le zinc applaudit discretement.",
    );
  }

  return (
    <TicketCard className="vote-panel">
      <div className="section-heading">
        <p className="eyebrow">Deposer son bulletin de soif</p>
        <h2>{existingParticipant ? "Modifier mon vote" : "A toi de jouer"}</h2>
      </div>

      <form className="vote-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Prenom ou pseudo</span>
          <input
            value={participantName}
            onChange={(eventChange) => setParticipantName(eventChange.target.value)}
            placeholder="Jojo, Nadine, Captain Chips..."
          />
        </label>

        <div className="vote-stack">
          {event.options.map((option) => (
            <fieldset className="vote-card" key={option.id}>
              <legend>{formatOption(option)}</legend>
              <div className="segments">
                {voteOptions.map((voteOption) => (
                  <label
                    className={
                      votes[option.id] === voteOption.value
                        ? "segment segment--selected"
                        : "segment"
                    }
                    key={voteOption.value}
                  >
                    <input
                      type="radio"
                      name={`vote-${option.id}`}
                      checked={votes[option.id] === voteOption.value}
                      onChange={() => updateVote(option.id, voteOption.value)}
                    />
                    <span>{voteOption.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        <label className="field">
          <span>Tu ramenes quoi ?</span>
          <input
            list="bring-options"
            value={brings}
            onChange={(eventChange) => setBrings(eventChange.target.value)}
            placeholder="Olives, soft, bonne humeur..."
          />
          <datalist id="bring-options">
            {bringOptions.map((option) => (
              <option value={option} key={option} />
            ))}
          </datalist>
        </label>

        <label className="field">
          <span>Commentaire optionnel</span>
          <textarea
            value={comment}
            onChange={(eventChange) => setComment(eventChange.target.value)}
            rows={3}
            placeholder="Je viens si la reunion finit avant la fin du monde."
          />
        </label>

        <button className="button button--primary" type="submit" disabled={isSaving}>
          {isSaving ? "Depot du bulletin..." : "Enregistrer mon vote"}
        </button>
        {feedback && (
          <p className="feedback" role="status">
            {feedback}
          </p>
        )}
      </form>
    </TicketCard>
  );
}
