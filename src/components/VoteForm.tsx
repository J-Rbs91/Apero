import { useEffect, useMemo, useRef, useState } from "react";
import type { AperitifEvent, ParticipantResponse, VoteStatus } from "../types/apero";
import { useComptoirName } from "../hooks/useComptoirName";
import { useShakeInvalid } from "../hooks/useShakeInvalid";
import { createId } from "../utils/createId";
import { hapticError, hapticSuccess } from "../utils/haptics";
import { normalizeMemberName } from "../utils/memberName";
import { CompanionsField } from "./CompanionsField";
import { EventOptionMobileCard } from "./EventOptionMobileCard";
import { ActionBar, Disclosure, FormSection, TextAreaField, TextField } from "./ui";

type DraftVotes = Record<string, VoteStatus | "">;

type VoteFormProps = {
  event: AperitifEvent;
  isSaving: boolean;
  onSubmit: (response: ParticipantResponse) => Promise<void>;
  /**
   * Champs additionnels rangés avec les détails facultatifs (ex. pronostic du
   * Traquenard-O-mètre) : le geste obligatoire reste en tête, le reste se
   * déplie pour qui veut.
   */
  extraFields?: React.ReactNode;
  /** Créneau actuellement en tête, mis en évidence dans la liste des cartes. */
  leadingOptionId?: string;
  /**
   * Ouvre le formulaire de contre-proposition. Fourni → une action secondaire
   * « Proposer un autre créneau » apparaît, nettement en second plan.
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
  /** Créneau dont le trinquer est en cours d'envoi (les autres restent vifs). */
  cheerPendingOptionId?: string | null;
};

const voteLabel: Record<VoteStatus, string> = {
  yes: "J’y serai",
  maybe: "J’me tâte",
  no: "Sans moi",
};

function formatSlotShort(date: string | undefined, time: string | undefined): string {
  const dateLabel = date
    ? new Intl.DateTimeFormat("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }).format(new Date(`${date}T00:00:00`))
    : "Date mystère";

  return `${dateLabel} · ${time || "heure mystère"}`;
}

/**
 * Le geste central de l'app : dire si on vient. Un seul bouton l'enregistre,
 * il est collé en bas de l'écran, et la barre au-dessus dit toujours ce qui
 * manque encore pour pouvoir appuyer dessus.
 */
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
  cheerPendingOptionId,
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
  // Vrai après une tentative d'envoi : tant qu'on n'a pas essayé, on ne
  // souligne rien en rouge — on annonce seulement ce qui reste à faire.
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  // Réponse déjà au registre → le formulaire se replie en récapitulatif.
  // « Modifier ma réponse » le rouvre ; un envoi réussi le replie.
  const [isEditing, setIsEditing] = useState(false);
  // Évite qu'une soumission qu'on vient de faire soi-même ne déclenche le
  // message « réponse retrouvée » quand l'event mis à jour redescend en prop.
  const justSubmittedRef = useRef(false);
  // Le blaze mémorisé pré-remplit le champ tant que le convive n'y a pas
  // touché ; après une première frappe, le champ lui appartient (il doit
  // pouvoir le vider pour répondre sous un autre nom).
  const nameEditedRef = useRef(false);
  // Renvoie le regard sur le bloc qui coince quand on tente d'émarger.
  const { registerNode, shake, shakingId } = useShakeInvalid();

  const existingParticipant = useMemo(() => {
    // Même clé de normalisation que la fusion au registre (upsertParticipant) :
    // « José  Pastaga » et « jose pastaga » sont la même personne, la détection
    // de réponse existante doit le savoir avant que l'envoi ne l'écrase.
    const normalizedName = normalizeMemberName(participantName);

    if (!normalizedName) {
      return null;
    }

    return (
      event.participants.find(
        (participant) =>
          normalizeMemberName(participant.participantName) === normalizedName,
      ) ?? null
    );
  }, [event.participants, participantName]);

  useEffect(() => {
    // L'événement est remplacé en entier à chaque action (trinquer optimiste,
    // mot au mur, contre-proposition…) : on réconcilie au lieu de repartir de
    // zéro, sinon le brouillon de vote en cours de saisie serait effacé.
    setVotes((currentVotes) =>
      Object.keys(emptyVotes).reduce<DraftVotes>((votes, optionId) => {
        votes[optionId] = currentVotes[optionId] ?? "";
        return votes;
      }, {}),
    );
  }, [emptyVotes]);

  useEffect(() => {
    if (!nameEditedRef.current && !participantName && comptoirName) {
      setParticipantName(comptoirName);
    }
  }, [comptoirName, participantName]);

  // Réhydratation de la réponse existante : uniquement quand la réponse
  // elle-même change (nouvelle personne reconnue, ou modification arrivée
  // d'un autre appareil) — pas à chaque remplacement d'identité de l'event,
  // qui écraserait la retouche en cours.
  const loadedParticipantRef = useRef<string | null>(null);
  useEffect(() => {
    if (!existingParticipant) {
      loadedParticipantRef.current = null;
      return;
    }

    const participantKey = `${existingParticipant.id}:${existingParticipant.updatedAt}`;
    if (loadedParticipantRef.current === participantKey) {
      return;
    }
    loadedParticipantRef.current = participantKey;

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

  const missingSlots = event.options.filter((option) => !votes[option.id]);
  const trimmedName = participantName.trim();
  const isNameMissing = !trimmedName;
  const isComplete = missingSlots.length === 0 && !isNameMissing;

  // Ce que dit la barre d'action : jamais « erreur », toujours « il manque
  // ceci ». Le convive sait quoi faire sans avoir à deviner.
  const actionStatus = isNameMissing
    ? "Il manque ton blaze en haut du formulaire."
    : missingSlots.length > 0
      ? `Encore ${missingSlots.length} créneau${missingSlots.length > 1 ? "x" : ""} à trancher.`
      : existingParticipant
        ? "Tout est rempli. Plus qu’à corriger le registre."
        : "Tout est rempli. Plus qu’à émarger.";

  async function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setHasTriedSubmit(true);

    // Pas de message en pied de formulaire : on remonte sur le bloc fautif,
    // il passe au rouge, il tremble, et le focus s'y pose.
    if (isNameMissing) {
      hapticError();
      shake("name");
      return;
    }

    if (missingSlots.length > 0) {
      hapticError();
      shake(missingSlots[0].id);
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
      hapticSuccess();
      setFeedbackTone("ok");
      setFeedback(
        existingParticipant
          ? "Le registre est corrigé. On ne dira rien."
          : "C’est émargé. Le registre te remercie.",
      );
      // Le geste est accompli : le formulaire se replie, le récapitulatif prend
      // le relais.
      setHasTriedSubmit(false);
      setIsEditing(false);
    } catch (submitError) {
      // Jamais de « merci » sur un envoi raté : la saisie reste en place,
      // l'explication s'affiche ici, sous le pouce.
      justSubmittedRef.current = false;
      hapticError();
      setFeedbackTone("error");
      setFeedback(
        submitError instanceof Error && submitError.message
          ? submitError.message
          : "L’envoi a raté. Ta réponse reste sous le coude, réessaie.",
      );
    }
  }

  // Formulaire replié : la réponse est au registre, le récapitulatif rappelle
  // ce qui a été dit et la prochaine action reste à un tap.
  if (existingParticipant && !isEditing) {
    const votesByOption = existingParticipant.votes ?? {};
    const overall = Object.values(votesByOption).some((vote) => vote === "yes")
      ? "J’y serai"
      : Object.values(votesByOption).some((vote) => vote === "maybe")
        ? "J’me tâte"
        : "Sans moi";

    return (
      <section className="sheet">
        <p className="eyebrow">Ta réponse est au registre</p>

        <div className="recap">
          <div className="recap__head">
            <span className="recap__check" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path
                  d="M5 12.5l4.2 4.3L19 7.5"
                  stroke="currentColor"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div className="recap__body">
              <div className="recap__name">{existingParticipant.participantName}</div>
              <div className="recap__vote">
                {overall}
                {existingParticipant.companions
                  ? ` · ${existingParticipant.companions} renfort${existingParticipant.companions > 1 ? "s" : ""}`
                  : ""}
              </div>
            </div>
          </div>

          {event.options.length > 1 && (
            <div className="recap__rows">
              {event.options.map((option) => {
                const vote = votesByOption[option.id];
                return (
                  <div className="recap__row" key={option.id}>
                    <span className="recap__slot">
                      {formatSlotShort(option.date, option.time)}
                    </span>
                    <span className={`recap__answer${vote ? ` recap__answer--${vote}` : ""}`}>
                      {vote ? voteLabel[vote] : "Pas de réponse"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          className="button button--ghost button--block"
          onClick={() => {
            setFeedback("");
            setIsEditing(true);
          }}
        >
          Modifier ma réponse
        </button>

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
      <form className="vote-form" onSubmit={handleSubmit}>
        <FormSection
          step={1}
          title="Qui répond ?"
          lead="Le blaze qui apparaîtra au registre de la tablée."
          isDone={!isNameMissing}
        >
          <div ref={registerNode("name")} className={shakingId === "name" ? "is-shaking" : ""}>
            <TextField
              label="Ton prénom (ou blaze)"
              requirement="required"
              value={participantName}
              maxLength={80}
              placeholder="Jojo, Nadine, Éminence Chips…"
              error={hasTriedSubmit && isNameMissing ? "Indique un blaze pour émarger." : undefined}
              onChange={(value) => {
                nameEditedRef.current = true;
                setParticipantName(value);
              }}
            />
          </div>
        </FormSection>

        <FormSection
          step={2}
          title={event.options.length > 1 ? "Tranche chaque créneau" : "Tranche le créneau"}
          lead="Une réponse par créneau proposé, même un « Sans moi »."
          status={`${event.options.length - missingSlots.length}/${event.options.length}`}
          isDone={missingSlots.length === 0}
        >
          <div className="slot-stack">
            {event.options.map((option) => (
              <EventOptionMobileCard
                key={option.id}
                option={option}
                value={votes[option.id]}
                onChange={(status) => updateVote(option.id, status)}
                error={
                  hasTriedSubmit && !votes[option.id]
                    ? "Ce créneau attend encore ta réponse."
                    : undefined
                }
                containerRef={registerNode(option.id)}
                isShaking={shakingId === option.id}
                isLeading={option.id === leadingOptionId}
                hasCheered={hasCheeredOption?.(option.id)}
                onToggleCheer={onToggleCheer ? () => onToggleCheer(option.id) : undefined}
                isCheerSaving={cheerPendingOptionId === option.id}
              />
            ))}
          </div>

          {onProposeSlot && (
            <button type="button" className="addline" onClick={onProposeSlot}>
              + Aucun ne va : proposer un autre créneau
            </button>
          )}
        </FormSection>

        <Disclosure
          title="Ajouter des détails"
          summary="Renforts, pronostic, petit mot. Rien d’obligatoire."
        >
          <CompanionsField
            companions={companions}
            onChange={setCompanions}
            childrenAllowed={childrenAllowed}
          />

          {extraFields}

          <TextAreaField
            label="Un petit mot pour la troupe"
            requirement="optional"
            value={comment}
            maxLength={500}
            rows={3}
            placeholder="Je viendrai si le monde ne s’est pas arrêté de tourner d’ici là."
            onChange={setComment}
          />
        </Disclosure>

        {feedback && (
          <p
            className={`feedback${feedbackTone === "ok" ? " feedback--ok" : ""}${feedbackTone === "info" ? " feedback--info" : ""}`}
            role={feedbackTone === "error" ? "alert" : "status"}
          >
            {feedback}
          </p>
        )}

        <ActionBar
          status={actionStatus}
          tone={isComplete ? "ready" : hasTriedSubmit ? "blocked" : "neutral"}
          secondary={
            existingParticipant ? (
              <button
                type="button"
                className="ghost-link"
                onClick={() => {
                  setFeedback("");
                  setHasTriedSubmit(false);
                  setIsEditing(false);
                }}
              >
                Laisser ma réponse telle quelle
              </button>
            ) : undefined
          }
        >
          <button className="button button--primary" type="submit" disabled={isSaving}>
            {isSaving
              ? "On émarge…"
              : existingParticipant
                ? "Enregistrer ma réponse"
                : "Envoyer ma réponse"}
          </button>
        </ActionBar>
      </form>
    </section>
  );
}
