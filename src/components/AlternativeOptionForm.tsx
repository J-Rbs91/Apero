import { useEffect, useRef, useState } from "react";
import { useComptoirName } from "../hooks/useComptoirName";
import { useShakeInvalid } from "../hooks/useShakeInvalid";
import type { AperitifOption } from "../types/apero";
import { createId } from "../utils/createId";
import { hapticError, hapticSuccess } from "../utils/haptics";
import { LocationField, type LocationValue } from "./LocationField";
import { ActionBar, FormSheet, TextField } from "./ui";

/** Les trois blocs que `useShakeInvalid` peut ramener sous les yeux. */
const SLOT_NODE_ID = "slot";
const NAME_NODE_ID = "name";
const FEEDBACK_NODE_ID = "feedback";

type AlternativeOptionFormProps = {
  isSaving: boolean;
  /** Ouverture pilotée par le parent : le bouton déclencheur vit dans le
   * formulaire de vote, juste sous la liste des créneaux. */
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (option: AperitifOption) => Promise<void>;
};

/**
 * Contre-proposition de créneau. Elle prend tout l'écran : un titre, trois
 * champs, un bouton. Aucune confusion possible avec le formulaire de réponse
 * qui vit derrière.
 */
export function AlternativeOptionForm({
  isSaving,
  isOpen,
  onClose,
  onSubmit,
}: AlternativeOptionFormProps) {
  const { comptoirName } = useComptoirName();
  const [createdByName, setCreatedByName] = useState(comptoirName);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [locationValue, setLocationValue] = useState<LocationValue>({ location: "" });
  const [feedback, setFeedback] = useState("");
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  // Le blaze mémorisé pré-remplit le champ tant qu'il n'a pas été touché ;
  // après une première frappe, il doit pouvoir être vidé sans se re-remplir.
  const nameEditedRef = useRef(false);
  // Verrou synchrone : disabled={isSaving} ne protège pas deux clics
  // dispatchés dans la même tâche JS, qui créeraient deux créneaux jumeaux.
  const submitLockRef = useRef(false);
  // Même retour au bloc fautif que dans les deux autres formulaires de saisie :
  // c'était la dernière incohérence entre les trois (AUDIT-1.md §3.3).
  const { registerNode, shake, bringIntoView, shakingId } = useShakeInvalid();

  useEffect(() => {
    if (!nameEditedRef.current && !createdByName && comptoirName) {
      setCreatedByName(comptoirName);
    }
  }, [createdByName, comptoirName]);

  const trimmedName = createdByName.trim().replace(/\s+/g, " ");
  const trimmedLocation = locationValue.location.trim();
  const isReady = Boolean(date && time && trimmedLocation && trimmedName);

  async function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (submitLockRef.current) {
      return;
    }
    setHasTriedSubmit(true);

    // Un champ précis est en faute : le regard va au champ, pas au message.
    // Le message reste affiché — c'est lui qui dit pourquoi — mais il n'entre
    // pas en concurrence avec la secousse (DECISIONS.md D6).
    if (!date || !time || !trimmedLocation) {
      hapticError();
      setFeedback("Jour, heure et lieu requis.");
      shake(SLOT_NODE_ID);
      return;
    }

    if (!trimmedName) {
      hapticError();
      setFeedback("Nom requis.");
      shake(NAME_NODE_ID);
      return;
    }

    const now = new Date().toISOString();
    try {
      submitLockRef.current = true;
      await onSubmit({
        id: createId("option"),
        date,
        time,
        location: trimmedLocation,
        locationAddress: locationValue.locationAddress,
        locationLat: locationValue.locationLat,
        locationLng: locationValue.locationLng,
        locationPlaceId: locationValue.locationPlaceId,
        createdByRole: "participant",
        createdByName: trimmedName,
        createdAt: now,
      });
    } catch (submitError) {
      // Envoi raté : la saisie reste en place, l'explication s'affiche ici.
      // On ne vide jamais un formulaire dont le contenu n'est pas arrivé.
      hapticError();
      setFeedback(
        submitError instanceof Error && submitError.message
          ? submitError.message
          : "Envoi échoué. Réessayer.",
      );
      // Aucun champ n'est en faute ici : c'est le message qu'il faut lire.
      bringIntoView(FEEDBACK_NODE_ID);
      return;
    } finally {
      submitLockRef.current = false;
    }

    hapticSuccess();
    setDate("");
    setTime("");
    setLocationValue({ location: "" });
    setFeedback("");
    setHasTriedSubmit(false);
    onClose();
  }

  return (
    <FormSheet
      isOpen={isOpen}
      title="Nouveau créneau"
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <ActionBar
          status={
            feedback
              ? "Envoi refusé."
              : isReady
                ? "Créneau complet."
                : "Jour, heure et lieu requis."
          }
          tone={feedback ? "blocked" : isReady ? "ready" : hasTriedSubmit ? "blocked" : "neutral"}
          secondary={
            <button type="button" className="ghost-link" onClick={onClose}>
              Annuler
            </button>
          }
        >
          <button className="button button--primary" disabled={isSaving} type="submit">
            {isSaving ? "Envoi…" : "Proposer"}
          </button>
        </ActionBar>
      }
    >
      {/* Les trois champs du créneau sont obligatoires : la phrase du pied de
          feuille le dit une fois, inutile de coller une pastille sur chacun. */}
      <div
        className={`slot__fields${shakingId === SLOT_NODE_ID ? " is-shaking" : ""}`}
        ref={registerNode(SLOT_NODE_ID)}
      >
        <TextField
          label="Jour"
          type="date"
          value={date}
          error={hasTriedSubmit && !date ? "Jour requis." : undefined}
          onChange={setDate}
        />
        <TextField
          label="Heure"
          type="time"
          value={time}
          error={hasTriedSubmit && !time ? "Heure requise." : undefined}
          onChange={setTime}
        />
        <LocationField
          label="Lieu"
          error={hasTriedSubmit && !trimmedLocation ? "Lieu requis." : undefined}
          value={locationValue}
          onChange={setLocationValue}
        />
      </div>

      <div
        className={shakingId === NAME_NODE_ID ? "is-shaking" : undefined}
        ref={registerNode(NAME_NODE_ID)}
      >
        <TextField
          label="Nom"
          requirement="required"
          value={createdByName}
          maxLength={80}
          error={hasTriedSubmit && !trimmedName ? "Nom requis." : undefined}
          onChange={(value) => {
            nameEditedRef.current = true;
            setCreatedByName(value);
          }}
        />
      </div>

      {feedback && (
        // Ce bloc ne porte que des erreurs (validation ou envoi raté) :
        // annonce assertive, comme les erreurs du formulaire de vote.
        <p className="feedback" role="alert" ref={registerNode(FEEDBACK_NODE_ID)}>
          {feedback}
        </p>
      )}
    </FormSheet>
  );
}
