import { useEffect, useState } from "react";
import { useComptoirName } from "../hooks/useComptoirName";
import type { AperitifOption } from "../types/apero";
import { createId } from "../utils/createId";
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

  useEffect(() => {
    if (!createdByName && comptoirName) {
      setCreatedByName(comptoirName);
    }
  }, [createdByName, comptoirName]);

  async function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const trimmedName = createdByName.trim().replace(/\s+/g, " ");
    const trimmedLocation = locationValue.location.trim();

    if (!date || !time || !trimmedLocation) {
      setFeedback("Il manque un jour, une heure ou un lieu pour cette proposition.");
      return;
    }

    if (!trimmedName) {
      setFeedback("Indique ton prénom, pour qu’on sache qui propose ce créneau.");
      return;
    }

    const now = new Date().toISOString();
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
            onChange={(eventChange) => setCreatedByName(eventChange.target.value)}
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
        <p className="feedback" role="status">
          {feedback}
        </p>
      )}
    </section>
  );
}
