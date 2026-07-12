import { useEffect, useMemo, useRef, useState } from "react";
import type { AperitifEvent, ParticipantResponse, VoteStatus } from "../types/apero";
import { useComptoirName } from "../hooks/useComptoirName";
import { createId } from "../utils/createId";
import { CompanionsField } from "./CompanionsField";
import { EventOptionMobileCard } from "./EventOptionMobileCard";

type DraftVotes = Record<string, VoteStatus | "">;

type VoteFormProps = {
  event: AperitifEvent;
  isSaving: boolean;
  onSubmit: (response: ParticipantResponse) => Promise<void>;
  /**
   * Champs additionnels insérés juste après les créneaux, avant le mot libre
   * (ex. pronostic ludique du Traquenard-O-mètre). Regroupés avec les votes
   * (même geste, même famille « mon ressenti sur cet apéro »), ils laissent le
   * commentaire fermer le formulaire juste avant le bouton d'envoi.
   */
  extraFields?: React.ReactNode;
  /** Créneau actuellement en tête, mis en évidence dans la liste des cartes. */
  leadingOptionId?: string;
  /**
   * Ouvre le formulaire de contre-proposition. Fourni → un bouton « Proposer un
   * autre créneau » s'affiche à côté du bouton d'envoi, sur la même ligne.
   */
  onProposeSlot?: () => void;
  /** Politique mioches de l'apéro, relayée au bloc « renforts ». */
  childrenAllowed?: boolean;
  /**
   * Trinquer à un créneau (micro-approbation immédiate, hors vote). Fourni →
   * chaque carte de créneau affiche son bouton « Trinquer ».
   */
  onToggleCheer?: (optionId: string) => void;
  /** Vrai si le convive courant a trinqué à ce créneau. */
  hasCheeredOption?: (optionId: string) => boolean;
  /** Désactive les boutons trinquer pendant un envoi. */
  isCheerSaving?: boolean;
};

export function VoteForm({
  event,
  isSaving,
  onSubmit,
  extraFields,
  leadingOptionId,
  onProposeSlot,
  childrenAllowed,
  onToggleCheer,
  hasCheeredOption,
  isCheerSaving,
}: VoteFormProps) {
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
  const [comment, setComment] = useState("");
  const [companions, setCompanions] = useState<number | undefined>(undefined);
  const [feedback, setFeedback] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<"ok" | "error" | "info">("info");
  // Réponse déjà au registre → le formulaire se replie en chip récapitulative.
  // « Modifier ma réponse » le rouvre ; un envoi réussi le replie.
  const [isEditing, setIsEditing] = useState(false);
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
    setComment(existingParticipant.comment ?? "");
    setCompanions(existingParticipant.companions);

    if (justSubmittedRef.current) {
      // C'est notre propre envoi qui vient de faire apparaître cette entrée :
      // le message de succès de handleSubmit prime, pas celui-ci.
      justSubmittedRef.current = false;
    } else {
      setFeedbackTone("info");
      setFeedback("Le registre se souvient de toi. Retouche, si le cœur t’en dit.");
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
      setFeedbackTone("error");
      setFeedback("Sans blaze, pas d’émargement. Même « Jojo » fera l’affaire.");
      return;
    }

    const missingVote = event.options.some((option) => !votes[option.id]);

    if (missingVote) {
      setFeedbackTone("error");
      setFeedback("Chaque créneau attend son verdict, même un « Sans moi ». Le registre a horreur du vide.");
      return;
    }

    const now = new Date().toISOString();
    const response: ParticipantResponse = {
      id: existingParticipant?.id ?? createId("participant"),
      participantName: trimmedName,
      votes: votes as Record<string, VoteStatus>,
      // Le champ « Ce que tu ramènes » a été retiré du formulaire : on
      // conserve tel quel ce qu'une réponse précédente avait déclaré.
      brings: existingParticipant?.brings,
      comment: comment.trim() || undefined,
      companions,
      createdAt: existingParticipant?.createdAt ?? now,
      updatedAt: now,
    };

    justSubmittedRef.current = true;
    try {
      await onSubmit(response);
      setFeedbackTone("ok");
      setFeedback(
        existingParticipant
          ? "Le registre est corrigé. On ne dira rien."
          : "C’est émargé. Le registre te remercie.",
      );
      // Le geste est accompli : le formulaire se replie, la chip prend le relais.
      setIsEditing(false);
    } catch (submitError) {
      // Jamais de « merci » sur un envoi raté : la saisie reste en place,
      // l'explication s'affiche ici, sous le pouce.
      justSubmittedRef.current = false;
      setFeedbackTone("error");
      setFeedback(
        submitError instanceof Error && submitError.message
          ? submitError.message
          : "L’envoi a raté. Ta réponse reste sous le coude, réessaie.",
      );
    }
  }

  // Formulaire replié : la réponse est au registre, la chip récapitule et
  // la prochaine action (modifier, contre-proposer) reste à un tap.
  if (existingParticipant && !isEditing) {
    const votesByOption = existingParticipant.votes ?? {};
    const overall = Object.values(votesByOption).some((vote) => vote === "yes")
      ? "J’y serai"
      : Object.values(votesByOption).some((vote) => vote === "maybe")
        ? "J’me tâte"
        : "Sans moi";
    const voteLabel: Record<VoteStatus, string> = {
      yes: "J’y serai",
      maybe: "J’me tâte",
      no: "Sans moi",
    };

    return (
      <section className="sheet">
        <p className="eyebrow">Ta réponse est au registre</p>
        <div className="vote-chip">
          <span className="vote-chip__check" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path
                d="M5 12.5l4.2 4.3L19 7.5"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="vote-chip__body">
            <div className="vote-chip__name">{existingParticipant.participantName}</div>
            <div className="vote-chip__vote">
              {overall}
              {existingParticipant.companions
                ? ` · ${existingParticipant.companions} renfort${existingParticipant.companions > 1 ? "s" : ""}`
                : ""}
            </div>
          </div>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => {
              setFeedback("");
              setIsEditing(true);
            }}
          >
            Modifier ma réponse
          </button>
        </div>

        {event.options.length > 1 && (
          <div className="vote-chip__votes">
            {event.options.map((option) => {
              const vote = votesByOption[option.id];
              return (
                <div className="vote-chip__row" key={option.id}>
                  <span className="vote-chip__slot">
                    {option.date
                      ? new Intl.DateTimeFormat("fr-FR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        }).format(new Date(`${option.date}T00:00:00`))
                      : "Date mystère"}
                    {" · "}
                    {option.time || "heure mystère"}
                  </span>
                  <span className={`vote-chip__answer${vote ? ` vote-chip__answer--${vote}` : ""}`}>
                    {vote ? voteLabel[vote] : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {onProposeSlot && (
          <button type="button" className="addline" onClick={onProposeSlot}>
            + Proposer un autre créneau
          </button>
        )}

        {feedback && (
          <p
            className={`feedback${feedbackTone === "ok" ? " feedback--ok" : ""}${feedbackTone === "info" ? " feedback--info" : ""}`}
            role="status"
          >
            {feedback}
          </p>
        )}
      </section>
    );
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
              hasCheered={hasCheeredOption?.(option.id)}
              onToggleCheer={onToggleCheer ? () => onToggleCheer(option.id) : undefined}
              isCheerSaving={isCheerSaving}
            />
          ))}
        </div>

        <CompanionsField
          companions={companions}
          onChange={setCompanions}
          childrenAllowed={childrenAllowed}
        />

        {extraFields}

        <label className="field">
          <span>Un petit mot pour la troupe</span>
          <textarea
            value={comment}
            onChange={(eventChange) => setComment(eventChange.target.value)}
            rows={3}
            placeholder="Je viendrai si le monde ne s’est pas arrêté de tourner d’ici là."
          />
        </label>

        {onProposeSlot ? (
          <div className="button-row">
            <button className="button button--primary" type="submit" disabled={isSaving}>
              {isSaving ? "Envoi…" : "Répondre à l’invitation"}
            </button>
            <button className="button button--ghost" type="button" onClick={onProposeSlot}>
              Proposer un autre créneau
            </button>
          </div>
        ) : (
          <button className="button button--primary button--block" type="submit" disabled={isSaving}>
            {isSaving ? "Envoi de ta réponse…" : "Répondre à l’invitation"}
          </button>
        )}
        {feedback && (
          <p
            className={`feedback${feedbackTone === "ok" ? " feedback--ok" : ""}${feedbackTone === "info" ? " feedback--info" : ""}`}
            role={feedbackTone === "error" ? "alert" : "status"}
          >
            {feedback}
          </p>
        )}
      </form>
    </section>
  );
}
