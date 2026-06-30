import { useEffect, useMemo, useState } from "react";
import type { AperitifEvent, ParticipantResponse, VoteStatus } from "../types/apero";
import { createId } from "../utils/createId";
import { EventOptionMobileCard } from "./EventOptionMobileCard";
import { StickyActionBar } from "./StickyActionBar";
import { TicketCard } from "./TicketCard";

const bringOptions = [
  "Chips",
  "Saucisson",
  "Cacahuetes",
  "Un pack",
  "Du soft",
  "Des glacons, parce que quelqu'un doit etre adulte",
  "Changer l'eau des olives",
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
    setFeedback("Vote retrouve. Le retournement de veste reste administrativement possible.");
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
      setFeedback("Il faut inscrire un membre au registre, meme sous pseudo douteux.");
      return;
    }

    const missingVote = event.options.some((option) => !votes[option.id]);

    if (missingVote) {
      setFeedback("Un suffrage par proposition, sinon l'institution vacille.");
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
        : "Suffrage depose. Le zinc en prend acte.",
    );
  }

  return (
    <TicketCard className="vote-panel">
      <div className="section-heading">
        <p className="eyebrow">Deposer son suffrage au zinc</p>
        <h2>{existingParticipant ? "Amender mon bulletin" : "Le registre t'attend"}</h2>
      </div>

      <form className="vote-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Ton nom dans le registre</span>
          <input
            value={participantName}
            onChange={(eventChange) => setParticipantName(eventChange.target.value)}
            placeholder="Jojo, Nadine, Grand Maitre Chips..."
          />
        </label>

        <div className="vote-stack">
          {event.options.map((option) => (
            <EventOptionMobileCard
              key={option.id}
              option={option}
              value={votes[option.id]}
              onChange={(status) => updateVote(option.id, status)}
            />
          ))}
        </div>

        <label className="field">
          <span>Contribution au banquet</span>
          <input
            list="bring-options"
            value={brings}
            onChange={(eventChange) => setBrings(eventChange.target.value)}
            placeholder="Olives, soft, pain, dignite approximative..."
          />
          <datalist id="bring-options">
            {bringOptions.map((option) => (
              <option value={option} key={option} />
            ))}
          </datalist>
        </label>

        <label className="field">
          <span>Declaration au comptoir</span>
          <textarea
            value={comment}
            onChange={(eventChange) => setComment(eventChange.target.value)}
            rows={3}
            placeholder="Je comparais si la reunion finit avant la fin du monde."
          />
        </label>

        <StickyActionBar>
          <button className="button button--primary button--block" type="submit" disabled={isSaving}>
            {isSaving ? "Depot du suffrage..." : "Deposer mon suffrage"}
          </button>
        </StickyActionBar>
        {feedback && (
          <p className="feedback" role="status">
            {feedback}
          </p>
        )}
      </form>
    </TicketCard>
  );
}
