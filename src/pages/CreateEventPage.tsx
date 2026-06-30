import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";
import { StickyActionBar } from "../components/StickyActionBar";
import { TicketCard } from "../components/TicketCard";
import { eventStorage } from "../services";
import { useGentlemanName } from "../hooks/useGentlemanName";
import type { AperitifEvent, AperitifOption, BeaufLevel } from "../types/apero";
import { createId } from "../utils/createId";
import { generateUniqueCeremonialName } from "../utils/generateCeremonialName";

const beaufLevels: Array<{ value: BeaufLevel; label: string; detail: string }> = [
  {
    value: "soft",
    label: "Petit jaune tranquille",
    detail: "Ambiance pose-coudes, olives et politesse.",
  },
  {
    value: "medium",
    label: "Tournée générale",
    detail: "La bande est motivée, le planning tremble déjà.",
  },
  {
    value: "legendary",
    label: "PMU Champions League",
    detail: "Le comité d’organisation sort les grands tickets.",
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
  const { gentlemanName } = useGentlemanName();
  const [title, setTitle] = useState("");
  const [organizerName, setOrganizerName] = useState(gentlemanName);
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
      location: "Chez Dédé",
    },
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
        note: option.note?.trim() || undefined,
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
      setFeedback("Chaque proposition doit avoir un jour, une heure et un établissement.");
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
        description: description.trim() || undefined,
        beaufLevel,
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
    <MobilePage className="create-mobile">
      <MobileHeader
        eyebrow="Registre de convocation"
        title="Convoquer une assemblée"
        subtitle="Une table de zinc, quelques propositions, et le suffrage peut commencer."
      />


      <form className="page-stack page-stack--mobile" onSubmit={handleSubmit}>
        <TicketCard className="ticket-card--registry">
          <div className="section-heading section-heading--with-stamp">
            <p className="eyebrow">Étape 1</p>
            <h2>La convocation</h2>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Objet officiel de la convocation</span>
              <input
                value={title}
                onChange={(eventChange) => setTitle(eventChange.target.value)}
                placeholder="Apéro fin de chantier"
              />
            </label>
            <label className="field">
              <span>Nom du Grand Convoqueur</span>
              <input
                value={organizerName}
                onChange={(eventChange) => setOrganizerName(eventChange.target.value)}
                placeholder="Jojo"
              />
            </label>
            <label className="field field--wide">
              <span>Motif solennel de la réunion</span>
              <textarea
                value={description}
                onChange={(eventChange) => setDescription(eventChange.target.value)}
                rows={4}
                placeholder="On enterre cette semaine comme elle le mérite."
              />
            </label>
          </div>
        </TicketCard>

        <TicketCard className="ticket-card--wood">
          <div className="section-heading">
            <p className="eyebrow">Apparat</p>
            <h2>Choisis l’apparat du zinc</h2>
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

        <TicketCard className="ticket-card--counter">
          <div className="section-heading">
            <p className="eyebrow">Étape 2</p>
            <h2>Les propositions</h2>
          </div>
          <button
            className="button button--secondary button--block"
            type="button"
            onClick={() =>
              setOptions((currentOptions) => [...currentOptions, createEmptyOption()])
            }
          >
            Soumettre une proposition au zinc
          </button>

          <div className="option-editor-stack">
            {options.map((option, index) => (
              <article className="option-editor option-editor--mobile" key={option.id}>
                <div className="option-editor__title">
                  <p className="eyebrow">Ticket {index + 1}</p>
                  <button
                    className="button button--ghost"
                    type="button"
                    onClick={() => removeOption(option.id)}
                  >
                    Retirer
                  </button>
                </div>
                <label className="field">
                  <span>Jour du rassemblement</span>
                  <input
                    type="date"
                    value={option.date}
                    onChange={(eventChange) =>
                      updateOption(option.id, { date: eventChange.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>Heure de comparution</span>
                  <input
                    type="time"
                    value={option.time}
                    onChange={(eventChange) =>
                      updateOption(option.id, { time: eventChange.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>Établissement de réception</span>
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
                    placeholder="Terrasse si le ciel coopère"
                  />
                </label>
              </article>
            ))}
          </div>
        </TicketCard>

        <TicketCard className="ticket-card--seal">
          <div className="section-heading">
            <p className="eyebrow">Étape 3</p>
            <h2>Sceller la convocation</h2>
          </div>
          <p>
            Le nom cérémoniel sera attribué automatiquement. Le lien restera simple à partager dans la conversation.
          </p>
        </TicketCard>

        <StickyActionBar>
          <button className="button button--primary button--large button--block" disabled={isSubmitting}>
            {isSubmitting ? "Scellement du registre…" : "Sceller la convocation"}
          </button>
        </StickyActionBar>
        {feedback && (
          <p className="feedback" role="alert">
            {feedback}
          </p>
        )}
      </form>
    </MobilePage>
  );
}
