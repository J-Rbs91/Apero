import { useEffect, useMemo, useRef, useState } from "react";
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
  /** Champs additionnels affichés avant le bouton d'envoi (ex. pronostic ludique). */
  extraFields?: React.ReactNode;
  /** Créneau actuellement en tête, mis en évidence dans la liste des cartes. */
  leadingOptionId?: string;
};

export function VoteForm({ event, isSaving, onSubmit, extraFields, leadingOptionId }: VoteFormProps) {
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
  // Évite qu'une soumission qu'on vient de faire soi-même ne déclenche le
  // message « réponse retrouvée » quand l'event mis à jour redescend en prop.
  const justSubmittedRef = useRef(false);

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

    if (justSubmittedRef.current) {
      // C'est notre propre envoi qui vient de faire apparaître cette entrée :
      // le message de succès de handleSubmit prime, pas celui-ci.
      justSubmittedRef.current = false;
    } else {
      setFeedback("On a retrouvé ta réponse, tu peux la modifier.");
    }
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
      setFeedback("Il faut un petit nom pour savoir qui vient — même un pseudo fera l’affaire.");
      return;
    }

    const missingVote = event.options.some((option) => !votes[option.id]);

    if (missingVote) {
      setFeedback(
        "Réponds à chaque créneau proposé (dispo, pas dispo, ou pas sûr), histoire d’y voir clair.",
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

    justSubmittedRef.current = true;
    await onSubmit(response);
    setFeedback(existingParticipant ? "Réponse mise à jour, merci !" : "Réponse bien reçue, merci d’avoir répondu !");
  }

  return (
    <section className="sheet">
      <p className="eyebrow">{existingParticipant ? "Modifier ma réponse" : "Répondre à l’invitation"}</p>

      <form className="vote-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Ton prénom (ou blaze)</span>
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
              isLeading={option.id === leadingOptionId}
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
          <span>Un petit mot pour la troupe</span>
          <textarea
            value={comment}
            onChange={(eventChange) => setComment(eventChange.target.value)}
            rows={3}
            placeholder="Je viendrai si le monde ne s’est pas arrêté de tourner d’ici là."
          />
        </label>

        {extraFields}

        <button className="button button--primary button--block" type="submit" disabled={isSaving}>
          {isSaving ? "Envoi de ta réponse…" : "Répondre à l’invitation"}
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
