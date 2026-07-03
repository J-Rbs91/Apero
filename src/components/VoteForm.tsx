import { useEffect, useMemo, useState } from "react";
import type { AperitifEvent, ParticipantResponse, VoteStatus } from "../types/apero";
import { useComptoirName } from "../hooks/useComptoirName";
import { createId } from "../utils/createId";
import { EventOptionMobileCard } from "./EventOptionMobileCard";

const bringOptions = [
  "Chips",
  "Saucisson",
  "Cacahuètes",
  "Un pack",
  "Du soft de compétition",
  "Un Perrier, par conviction personnelle",
  "Des glaçons, parce que quelqu’un doit être adulte",
  "Changer l’eau des olives",
];

type DraftVotes = Record<string, VoteStatus | "">;

type VoteFormProps = {
  event: AperitifEvent;
  isSaving: boolean;
  onSubmit: (response: ParticipantResponse) => Promise<void>;
};

export function VoteForm({ event, isSaving, onSubmit }: VoteFormProps) {
  const { comptoirName } = useComptoirName();
  const emptyVotes = useMemo(
    () =>
      event.options.reduce<DraftVotes>((votes, option) => {
        votes[option.id] = "";
        return votes;
      }, {}),
    [event.options],
  );
  const [participantName, setParticipantName] = useState(comptoirName);
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
    if (!participantName && comptoirName) {
      setParticipantName(comptoirName);
    }
  }, [comptoirName, participantName]);

  useEffect(() => {
    if (!existingParticipant) {
      return;
    }

    setVotes({ ...emptyVotes, ...existingParticipant.votes });
    setBrings(existingParticipant.brings ?? "");
    setComment(existingParticipant.comment ?? "");
    setFeedback("Vote retrouvé. Le retournement de veste reste administrativement possible.");
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
      setFeedback(
        "Il faut inscrire un convive au registre, même sous un pseudo douteux, parce qu’un fantôme, ça ne répond pas, en tout cas pas ici.",
      );
      return;
    }

    const missingVote = event.options.some((option) => !votes[option.id]);

    if (missingVote) {
      setFeedback(
        "Une réponse par créneau, pas une de moins, sinon c’est l’institution tout entière qui vacille sur ses fondations.",
      );
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
        ? "Réponse mise à jour. Le retournement de veste est validé."
        : "Réponse déposée, dûment enregistrée. Le zinc en prend acte, solennellement.",
    );
  }

  return (
    <section className="sheet">
      <p className="eyebrow">{existingParticipant ? "Amender ma déclaration" : "Déposer ma réponse"}</p>

      <form className="vote-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Ton nom dans le registre</span>
          <input
            value={participantName}
            onChange={(eventChange) => setParticipantName(eventChange.target.value)}
            placeholder="Jojo, Nadine, Éminence Chips…"
          />
        </label>

        <div className="slot-stack">
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
          <span>Ce que tu ramènes</span>
          <input
            list="bring-options"
            value={brings}
            onChange={(eventChange) => setBrings(eventChange.target.value)}
            placeholder="Olives, soft, pain, dignité approximative…"
          />
          <datalist id="bring-options">
            {bringOptions.map((option) => (
              <option value={option} key={option} />
            ))}
          </datalist>
        </label>

        <label className="field">
          <span>Déclaration au comptoir</span>
          <textarea
            value={comment}
            onChange={(eventChange) => setComment(eventChange.target.value)}
            rows={3}
            placeholder="Je comparais si la réunion finit avant la fin du monde."
          />
        </label>

        <button className="button button--primary button--block" type="submit" disabled={isSaving}>
          {isSaving ? "Dépôt de la réponse…" : "Déposer ma réponse"}
        </button>
        {feedback && (
          <p className="feedback" role="status">
            {feedback}
          </p>
        )}
      </form>
    </section>
  );
}
