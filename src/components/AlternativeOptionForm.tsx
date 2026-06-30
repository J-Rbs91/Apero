import { useEffect, useState } from "react";
import { useGentlemanName } from "../hooks/useGentlemanName";
import type { AperitifOption } from "../types/apero";
import { createId } from "../utils/createId";
import { TicketCard } from "./TicketCard";

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
  const [note, setNote] = useState("");
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
      setFeedback("Il faut un jour, une heure et un \u00e9tablissement pour troubler le Conseil.");
      return;
    }

    const now = new Date().toISOString();
    await onSubmit({
      id: createId("option"),
      date,
      time,
      location: trimmedLocation,
      note: note.trim() || undefined,
      createdByRole: "participant",
      createdByName: trimmedName,
      createdAt: now,
    });

    setDate("");
    setTime("");
    setLocation("");
    setNote("");
    setFeedback("Contre-proposition d\u00e9pos\u00e9e dans cette assembl\u00e9e, pas dans celle du voisin.");
    setIsOpen(false);
  }

  return (
    <TicketCard className="ticket-card--counter alternative-option-panel">
      <div className="section-heading">
        <p className="eyebrow">Contre-proposition</p>
        <h2>{"Une autre id\u00e9e pour le zinc ?"}</h2>
      </div>

      {!isOpen ? (
        <button
          className="button button--secondary button--block"
          type="button"
          onClick={() => setIsOpen(true)}
        >
          Soumettre une contre-proposition au zinc
        </button>
      ) : (
        <form className="option-editor option-editor--mobile" onSubmit={handleSubmit}>
          <div className="option-editor__title">
            <p className="eyebrow">Nouvelle proposition</p>
            <button className="button button--ghost" type="button" onClick={() => setIsOpen(false)}>
              Annuler
            </button>
          </div>

          <label className="field">
            <span>Nom du contre-proposant</span>
            <input
              value={createdByName}
              onChange={(eventChange) => setCreatedByName(eventChange.target.value)}
              placeholder="Jean-Michel Pastaga"
            />
          </label>

          <label className="field">
            <span>Jour du rassemblement</span>
            <input
              type="date"
              value={date}
              onChange={(eventChange) => setDate(eventChange.target.value)}
            />
          </label>

          <label className="field">
            <span>Heure de comparution</span>
            <input
              type="time"
              value={time}
              onChange={(eventChange) => setTime(eventChange.target.value)}
            />
          </label>

          <label className="field">
            <span>{"\u00c9tablissement de r\u00e9ception"}</span>
            <input
              value={location}
              onChange={(eventChange) => setLocation(eventChange.target.value)}
              placeholder="Le Bar du Coin"
            />
          </label>

          <label className="field">
            <span>Note optionnelle</span>
            <input
              value={note}
              onChange={(eventChange) => setNote(eventChange.target.value)}
              placeholder={"Terrasse, comptoir ou coin des habitu\u00e9s"}
            />
          </label>

          <button className="button button--primary button--block" disabled={isSaving} type="submit">
            {isSaving ? "D\u00e9p\u00f4t de la contre-proposition\u2026" : "D\u00e9poser la contre-proposition"}
          </button>
        </form>
      )}

      {feedback && (
        <p className="feedback" role="status">
          {feedback}
        </p>
      )}
    </TicketCard>
  );
}
