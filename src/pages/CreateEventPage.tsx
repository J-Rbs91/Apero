import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";
import { eventStorage } from "../services";
import { useGentlemanName } from "../hooks/useGentlemanName";
import type { AperitifEvent, AperitifOption } from "../types/apero";
import { createId } from "../utils/createId";
import { generateUniqueCeremonialName } from "../utils/generateCeremonialName";

function createEmptyOption(): AperitifOption {
  return {
    id: createId("option"),
    date: "",
    time: "",
    location: "",
  };
}

export function CreateEventPage() {
  const navigate = useNavigate();
  const { gentlemanName } = useGentlemanName();
  const [title, setTitle] = useState("");
  const [organizerName, setOrganizerName] = useState(gentlemanName);
  const [options, setOptions] = useState<AperitifOption[]>([
    createEmptyOption(),
    createEmptyOption(),
  ]);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!organizerName && gentlemanName) {
      setOrganizerName(gentlemanName);
    }
  }, [gentlemanName, organizerName]);

  function updateOption(optionId: string, updates: Partial<AperitifOption>) {
    setOptions((currentOptions) =>
      currentOptions.map((option) =>
        option.id === optionId ? { ...option, ...updates } : option,
      ),
    );
  }

  function removeOption(optionId: string) {
    setOptions((currentOptions) =>
      currentOptions.filter((option) => option.id !== optionId),
    );
  }

  async function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setFeedback("");

    const cleanedOptions = options
      .map((option) => ({
        ...option,
        date: option.date.trim(),
        time: option.time.trim(),
        location: option.location.trim(),
      }))
      .filter((option) => option.date || option.time || option.location);

    if (!organizerName.trim()) {
      setFeedback("Il faut un Grand Convoqueur pour ouvrir le registre.");
      return;
    }

    if (
      cleanedOptions.length === 0 ||
      cleanedOptions.some((option) => !option.date || !option.time || !option.location)
    ) {
      setFeedback("Chaque créneau doit avoir un jour, une heure et un établissement.");
      return;
    }

    try {
      setIsSubmitting(true);
      const activeEvents = await eventStorage.listActiveEvents();
      const ceremonialName = generateUniqueCeremonialName(activeEvents);
      const now = new Date().toISOString();
      const event: AperitifEvent = {
        id: createId("apero"),
        ceremonialName,
        title: title.trim() || undefined,
        organizerName: organizerName.trim(),
        beaufLevel: "medium",
        status: "active",
        options: cleanedOptions.map((option) => ({
          ...option,
          createdByRole: "organizer",
          createdByName: organizerName.trim(),
          createdAt: now,
        })),
        participants: [],
        createdAt: now,
        updatedAt: now,
      };

      await eventStorage.createEvent(event);
      navigate(`/event/${event.id}`);
    } catch (error) {
      setFeedback(
        error instanceof Error && error.message === "NO_CEREMONIAL_NAME_AVAILABLE"
          ? "La Confrérie est complète. Trop d’apéros sont déjà en cours. Clôture une assemblée avant d’en convoquer une nouvelle."
          : error instanceof Error
            ? error.message
            : "GitHub a renversé le registre. Réessaie dans deux secondes.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <MobilePage className="create-mobile" overlay="deep">
      <MobileHeader eyebrow="Convocation" />

      <form className="sheet" onSubmit={handleSubmit}>
        <h1 className="h1 h1--sm">Convoquer</h1>

        <label className="field">
          <span>Objet (optionnel)</span>
          <input
            value={title}
            onChange={(eventChange) => setTitle(eventChange.target.value)}
            placeholder="Apéro fin de chantier"
          />
        </label>
        <p className="hint">Vide → nom de baptême tiré au sort.</p>

        <label className="field">
          <span>Toi</span>
          <input
            value={organizerName}
            onChange={(eventChange) => setOrganizerName(eventChange.target.value)}
            placeholder="Jean-Mi Pastaga"
          />
        </label>

        <hr className="accent accent--wide" />

        <p className="lbl">Les créneaux</p>
        <div className="slot-stack">
          {options.map((option, index) => (
            <div className="slot" key={option.id}>
              <div className="slot__top">
                <p className="lbl">Créneau {index + 1}</p>
                <button
                  type="button"
                  className="slot__x"
                  onClick={() => removeOption(option.id)}
                  aria-label="Retirer le créneau"
                >
                  ✕
                </button>
              </div>
              <div className="slot__fields">
                <label className="field">
                  <span>Jour</span>
                  <input
                    type="date"
                    value={option.date}
                    onChange={(eventChange) =>
                      updateOption(option.id, { date: eventChange.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>Heure</span>
                  <input
                    type="time"
                    value={option.time}
                    onChange={(eventChange) =>
                      updateOption(option.id, { time: eventChange.target.value })
                    }
                  />
                </label>
                <label className="field field--wide">
                  <span>Lieu</span>
                  <input
                    value={option.location}
                    onChange={(eventChange) =>
                      updateOption(option.id, { location: eventChange.target.value })
                    }
                    placeholder="Bar des Sports"
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="addline"
          onClick={() => setOptions((currentOptions) => [...currentOptions, createEmptyOption()])}
        >
          + Ajouter un créneau
        </button>

        <button className="button button--primary button--block" disabled={isSubmitting}>
          {isSubmitting ? "Scellement du registre…" : "Sceller la convocation"}
        </button>
        {feedback && (
          <p className="feedback" role="alert">
            {feedback}
          </p>
        )}
      </form>
    </MobilePage>
  );
}
