import { useEffect, useRef, useState } from "react";
import { useComptoirName } from "../hooks/useComptoirName";
import type { AperitifOption } from "../types/apero";
import { createId } from "../utils/createId";
import { hapticError, hapticSuccess } from "../utils/haptics";
import { LocationField, type LocationValue } from "./LocationField";

type AlternativeOptionFormProps = {
  isSaving: boolean;
  /** Ouverture pilotée par le parent : le bouton déclencheur vit désormais à
   * côté du bouton « Répondre à l'invitation », dans le formulaire de vote. */
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (option: AperitifOption) => Promise<void>;
};

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
  // Le blaze mémorisé pré-remplit le champ tant qu'il n'a pas été touché ;
  // après une première frappe, il doit pouvoir être vidé sans se re-remplir.
  const nameEditedRef = useRef(false);
  // Verrou synchrone : disabled={isSaving} ne protège pas deux clics
  // dispatchés dans la même tâche JS, qui créeraient deux créneaux jumeaux.
  const submitLockRef = useRef(false);

  useEffect(() => {
    if (!nameEditedRef.current && !createdByName && comptoirName) {
      setCreatedByName(comptoirName);
    }
  }, [createdByName, comptoirName]);

  async function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (submitLockRef.current) {
      return;
    }
    const trimmedName = createdByName.trim().replace(/\s+/g, " ");
    const trimmedLocation = locationValue.location.trim();

    if (!date || !time || !trimmedLocation) {
      hapticError();
      setFeedback("Quitte à imposer cette contradiction, il s’agirait au moins d’avoir l’élégance d’être précis : un jour, une heure ou un lieu, par exemple, histoire que cette proposition ait meilleure mine que la tienne.");
      return;
    }

    if (!trimmedName) {
      hapticError();
      setFeedback("Indique ton blaze, qu’on sache au moins l’intitulé du fauteur de troubles.");
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
    onClose();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <section className="sheet">
      <p className="eyebrow">Proposer une autre date</p>

      <form className="vote-form" onSubmit={handleSubmit}>
        <div className="slot">
          <div className="slot__fields">
            <label className="field">
              <span>Jour</span>
              <input
                type="date"
                value={date}
                onChange={(eventChange) => setDate(eventChange.target.value)}
              />
            </label>
            <label className="field">
              <span>Heure</span>
              <input
                type="time"
                value={time}
                onChange={(eventChange) => setTime(eventChange.target.value)}
              />
            </label>
            <LocationField
              label="Établissement"
              placeholder="Le Bar du Coin"
              value={locationValue}
              onChange={setLocationValue}
            />
          </div>
        </div>

        {/* Le créneau mène le formulaire (l'intention du clic « Proposer un
            autre créneau »). Le prénom, déjà connu via le blaze mémorisé,
            ferme en confirmation plutôt que de rejouer une saisie d'identité. */}
        <label className="field">
          <span>Proposé par</span>
          <input
            value={createdByName}
            maxLength={80}
            onChange={(eventChange) => {
              nameEditedRef.current = true;
              setCreatedByName(eventChange.target.value);
            }}
            placeholder="Nadine Diabolo, Jean-Mi Pastaga…"
          />
        </label>

        <div className="button-row">
          <button className="button button--primary" disabled={isSaving} type="submit">
            {isSaving ? "Envoi…" : "Proposer cette date"}
          </button>
          <button className="button button--ghost" type="button" onClick={onClose}>
            Annuler
          </button>
        </div>
      </form>

      {feedback && (
        // Ce bloc ne porte que des erreurs (validation ou envoi raté) :
        // annonce assertive, comme les erreurs du formulaire de vote.
        <p className="feedback" role="alert">
          {feedback}
        </p>
      )}
    </section>
  );
}
