import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TicketCard } from "../components/TicketCard";
import { eventStorage } from "../services";
import type { AperitifEvent, AperitifOption, BeaufLevel } from "../types/apero";
import { createId } from "../utils/createId";

const beaufLevels: Array<{ value: BeaufLevel; label: string; detail: string }> = [
  {
    value: "soft",
    label: "Petit jaune tranquille",
    detail: "Ambiance pose-coudes, olives et politesse.",
  },
  {
    value: "medium",
    label: "Tournee generale",
    detail: "La bande est motivee, le planning tremble deja.",
  },
  {
    value: "legendary",
    label: "PMU Champions League",
    detail: "Le comite d'organisation sort les grands tickets.",
  },
];

function createEmptyOption(): AperitifOption {
  return {
    id: createId("option"),
    date: "",
    time: "",
    location: "",
    note: "",
  };
}

export function CreateEventPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [description, setDescription] = useState("");
  const [beaufLevel, setBeaufLevel] = useState<BeaufLevel>("medium");
  const [options, setOptions] = useState<AperitifOption[]>([
    {
      ...createEmptyOption(),
      date: "2026-07-03",
      time: "19:00",
      location: "Bar des Sports",
    },
    {
      ...createEmptyOption(),
      date: "2026-07-04",
      time: "18:30",
      location: "Chez Dede",
    },
  ]);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        note: option.note?.trim() || undefined,
      }))
      .filter((option) => option.date || option.time || option.location);

    if (!title.trim() || !organizerName.trim()) {
      setFeedback("Titre et organisateur : le minimum syndical du comptoir.");
      return;
    }

    if (
      cleanedOptions.length === 0 ||
      cleanedOptions.some((option) => !option.date || !option.time || !option.location)
    ) {
      setFeedback("Chaque option doit avoir une date, une heure et un lieu.");
      return;
    }

    const now = new Date().toISOString();
    const event: AperitifEvent = {
      id: createId("apero"),
      title: title.trim(),
      organizerName: organizerName.trim(),
      description: description.trim() || undefined,
      beaufLevel,
      options: cleanedOptions,
      participants: [],
      createdAt: now,
      updatedAt: now,
    };

    try {
      setIsSubmitting(true);
      await eventStorage.createEvent(event);
      navigate(`/event/${event.id}`);
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "GitHub a renverse le plateau. Retente dans deux secondes.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app app--compact">
      <header className="topbar">
        <Link className="brand-link" to="/">
          <span className="brand-mark">AP</span>
          <span>Apero PMU</span>
        </Link>
      </header>

      <section className="page-intro">
        <p className="eyebrow">Creation du scrutin</p>
        <h1>Lancer un apero</h1>
        <p>
          Un apéro = un fichier JSON. Un lien = un scrutin. Les groupes restent
          chacun a leur comptoir.
        </p>
      </section>

      <form className="page-stack" onSubmit={handleSubmit}>
        <TicketCard>
          <div className="form-grid">
            <label className="field">
              <span>Titre de l'apero</span>
              <input
                value={title}
                onChange={(eventChange) => setTitle(eventChange.target.value)}
                placeholder="Apero fin de semaine"
              />
            </label>
            <label className="field">
              <span>Organisateur</span>
              <input
                value={organizerName}
                onChange={(eventChange) => setOrganizerName(eventChange.target.value)}
                placeholder="Jojo"
              />
            </label>
            <label className="field field--wide">
              <span>Description optionnelle</span>
              <textarea
                value={description}
                onChange={(eventChange) => setDescription(eventChange.target.value)}
                rows={4}
                placeholder="On enterre cette semaine comme elle le merite."
              />
            </label>
          </div>
        </TicketCard>

        <TicketCard>
          <div className="section-heading">
            <p className="eyebrow">Niveau de beaufitude</p>
            <h2>Choisis l'ambiance</h2>
          </div>
          <div className="choice-grid">
            {beaufLevels.map((level) => (
              <label
                className={
                  beaufLevel === level.value
                    ? "choice-card choice-card--selected"
                    : "choice-card"
                }
                key={level.value}
              >
                <input
                  type="radio"
                  name="beaufLevel"
                  checked={beaufLevel === level.value}
                  onChange={() => setBeaufLevel(level.value)}
                />
                <strong>{level.label}</strong>
                <span>{level.detail}</span>
              </label>
            ))}
          </div>
        </TicketCard>

        <TicketCard>
          <div className="section-heading section-heading--inline">
            <div>
              <p className="eyebrow">Options date + heure + lieu</p>
              <h2>Les propositions du zinc</h2>
            </div>
            <button
              className="button button--secondary"
              type="button"
              onClick={() =>
                setOptions((currentOptions) => [...currentOptions, createEmptyOption()])
              }
            >
              Ajouter une option
            </button>
          </div>

          <div className="option-editor-stack">
            {options.map((option, index) => (
              <article className="option-editor" key={option.id}>
                <label className="field">
                  <span>Date {index + 1}</span>
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
                <label className="field">
                  <span>Lieu</span>
                  <input
                    value={option.location}
                    onChange={(eventChange) =>
                      updateOption(option.id, { location: eventChange.target.value })
                    }
                    placeholder="Bar des Sports"
                  />
                </label>
                <label className="field">
                  <span>Note optionnelle</span>
                  <input
                    value={option.note ?? ""}
                    onChange={(eventChange) =>
                      updateOption(option.id, { note: eventChange.target.value })
                    }
                    placeholder="Terrasse si le ciel coopere"
                  />
                </label>
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={() => removeOption(option.id)}
                >
                  Retirer
                </button>
              </article>
            ))}
          </div>
        </TicketCard>

        <div className="form-actions">
          <button className="button button--primary button--large" disabled={isSubmitting}>
            {isSubmitting ? "Creation du ticket..." : "Creer le ticket d'apero"}
          </button>
          {feedback && (
            <p className="feedback" role="alert">
              {feedback}
            </p>
          )}
        </div>
      </form>
    </main>
  );
}
