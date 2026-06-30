import { useEffect, useState } from "react";
import { useGentlemanName } from "../hooks/useGentlemanName";
import type { AperitifOption } from "../types/apero";
import { createId } from "../utils/createId";

type AlternativeOptionFormProps = {
  isSaving: boolean;
  onSubmit: (option: AperitifOption) => Promise<void>;
};

export function AlternativeOptionForm({ isSaving, onSubmit }: AlternativeOptionFormProps) {
  const { gentlemanName } = useGentlemanName();
  const [isOpen, setIsOpen] = useState(false);
  const [createdByName, setCreatedByName] = useState(gentlemanName);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!createdByName && gentlemanName) {
      setCreatedByName(gentlemanName);
    }
  }, [createdByName, gentlemanName]);

  async function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const trimmedName = createdByName.trim().replace(/\s+/g, " ");
    const trimmedLocation = location.trim();

    if (!trimmedName) {
      setFeedback("Le zinc exige le nom du contre-proposant.");
      return;
    }

    if (!date || !time || !trimmedLocation) {
      setFeedback("Il faut un jour, une heure et un établissement pour troubler le Conseil.");
      return;
    }

    const now = new Date().toISOString();
    await onSubmit({
      id: createId("option"),
      date,
      time,
      location: trimmedLocation,
      createdByRole: "participant",
      createdByName: trimmedName,
      createdAt: now,
    });

    setDate("");
    setTime("");
    setLocation("");
    setFeedback("Contre-proposition déposée dans cette assemblée, pas dans celle du voisin.");
    setIsOpen(false);
  }

  return (
    <section className="sheet">
      <p className="eyebrow">Contre-proposition</p>

      {!isOpen ? (
        <button
          className="button button--ghost button--block"
          type="button"
          onClick={() => setIsOpen(true)}
        >
          Proposer un autre créneau
        </button>
      ) : (
        <form className="vote-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Nom du contre-proposant</span>
            <input
              value={createdByName}
              onChange={(eventChange) => setCreatedByName(eventChange.target.value)}
              placeholder="Jean-Michel Pastaga"
            />
          </label>

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
              <label className="field field--wide">
                <span>{"Établissement"}</span>
                <input
                  value={location}
                  onChange={(eventChange) => setLocation(eventChange.target.value)}
                  placeholder="Le Bar du Coin"
                />
              </label>
            </div>
          </div>

          <div className="vote-form">
            <button className="button button--primary button--block" disabled={isSaving} type="submit">
              {isSaving ? "Dépôt…" : "Déposer la contre-proposition"}
            </button>
            <button className="button button--ghost button--block" type="button" onClick={() => setIsOpen(false)}>
              Annuler
            </button>
          </div>
        </form>
      )}

      {feedback && (
        <p className="feedback" role="status">
          {feedback}
        </p>
      )}
    </section>
  );
}
