import { useEffect, useRef, useState } from "react";
import { useComptoirName } from "../hooks/useComptoirName";
import { useShakeInvalid } from "../hooks/useShakeInvalid";
import type { AperitifOption } from "../types/apero";
import { createId } from "../utils/createId";
import { hapticError, hapticSuccess } from "../utils/haptics";
import { LocationField, type LocationValue } from "./LocationField";
import { ActionBar, FormSheet, TextField } from "./ui";

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
  // Renvoie le regard sur le bloc fautif, comme dans les deux autres
  // formulaires de saisie (CreateEventPage, VoteForm).
  const { registerNode, shake, shakingId } = useShakeInvalid();

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

    if (!date || !time || !trimmedLocation) {
      hapticError();
      setFeedback(
        "Quitte à imposer cette contradiction, il s’agirait au moins d’avoir l’élégance d’être précis : un jour, une heure et un lieu, histoire que cette proposition ait meilleure mine que la tienne.",
      );
      shake("slot");
      return;
    }

    if (!trimmedName) {
      hapticError();
      setFeedback("Indique ton blaze, qu’on sache au moins l’intitulé du fauteur de troubles.");
      shake("name");
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
          : "La contre-proposition n’est pas arrivée au registre. Ta saisie reste là, réessaie.",
      );
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
      title="Proposer un autre créneau"
      lead="Jour, heure et troquet, puis ton blaze. Le créneau rejoindra la liste, et toute la tablée pourra voter dessus."
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <ActionBar
          status={
            isReady
              ? "Prêt à rejoindre la liste des créneaux."
              : "Jour, heure et troquet sont obligatoires."
          }
          tone={isReady ? "ready" : hasTriedSubmit ? "blocked" : "neutral"}
          secondary={
            <button type="button" className="ghost-link" onClick={onClose}>
              Laisser tomber
            </button>
          }
        >
          <button className="button button--primary" disabled={isSaving} type="submit">
            {isSaving ? "Envoi…" : "Proposer ce créneau"}
          </button>
        </ActionBar>
      }
    >
      {/* Les trois champs du créneau sont obligatoires : la phrase du pied de
          feuille le dit une fois, inutile de coller une pastille sur chacun. */}
      <div
        ref={registerNode("slot")}
        className={`slot__fields${shakingId === "slot" ? " is-shaking" : ""}`}
      >
        <TextField
          label="Jour"
          type="date"
          value={date}
          error={hasTriedSubmit && !date ? "Choisis un jour." : undefined}
          onChange={setDate}
        />
        <TextField
          label="Heure"
          type="time"
          value={time}
          error={hasTriedSubmit && !time ? "Choisis une heure." : undefined}
          onChange={setTime}
        />
        <LocationField
          label="Le troquet"
          placeholder="Le Bar du Coin"
          hint="Tape deux lettres, la liste te propose les rades du coin."
          error={hasTriedSubmit && !trimmedLocation ? "Indique où on se retrouve." : undefined}
          value={locationValue}
          onChange={setLocationValue}
        />
      </div>

      <div
        ref={registerNode("name")}
        className={shakingId === "name" ? "is-shaking" : ""}
      >
        <TextField
          label="Proposé par"
          requirement="required"
          hint="Pour que la tablée sache qui a bousculé le programme."
          value={createdByName}
          maxLength={80}
          placeholder="Nadine Diabolo, Jean-Mi Pastaga…"
          error={hasTriedSubmit && !trimmedName ? "Indique ton blaze." : undefined}
          onChange={(value) => {
            nameEditedRef.current = true;
            setCreatedByName(value);
          }}
        />
      </div>

      {feedback && (
        // Ce bloc ne porte que des erreurs (validation ou envoi raté) :
        // annonce assertive, comme les erreurs du formulaire de vote.
        <p className="feedback" role="alert">
          {feedback}
        </p>
      )}
    </FormSheet>
  );
}
