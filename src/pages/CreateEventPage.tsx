import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LocationField } from "../components/LocationField";
import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";
import { eventStorage } from "../services";
import { useComptoirName } from "../hooks/useComptoirName";
import type { AperitifEvent, AperitifOption, ParticipantResponse, VoteStatus } from "../types/apero";
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
  const { comptoirName } = useComptoirName();
  const [title, setTitle] = useState("");
  const [organizerName, setOrganizerName] = useState(comptoirName);
  const [options, setOptions] = useState<AperitifOption[]>([createEmptyOption()]);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!organizerName && comptoirName) {
      setOrganizerName(comptoirName);
    }
  }, [comptoirName, organizerName]);

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
      setFeedback(
        "Pas de signature, pas de registre, et sans registre, techniquement, cette assemblée n'existe pas encore — ce qui est un comble pour un apéro qu'on est en train d'organiser depuis dix bonnes minutes.",
      );
      return;
    }

    if (
      cleanedOptions.length === 0 ||
      cleanedOptions.some((option) => !option.date || !option.time || !option.location)
    ) {
      setFeedback(
        "Chaque créneau réclame un jour, une heure et un établissement, parce qu'un apéro sans lieu ni horaire, ce n'est plus un apéro, c'est un concept — et ici, on n'organise pas de concepts.",
      );
      return;
    }

    const now = Date.now();
    const hasFutureSlot = cleanedOptions.some((option) => {
      const slotTime = new Date(`${option.date}T${option.time}:00`).getTime();
      return !Number.isNaN(slotTime) && slotTime > now;
    });

    if (!hasFutureSlot) {
      setFeedback(
        "Tous tes créneaux sont déjà dans le passé, ce qui est un joli exploit temporel mais totalement inutile pour convoquer qui que ce soit. Propose une date à venir, la machine à remonter le temps est encore en réparation.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const activeEvents = await eventStorage.listActiveEvents();
      const ceremonialName = generateUniqueCeremonialName(activeEvents);
      const now = new Date().toISOString();
      const trimmedOrganizerName = organizerName.trim();

      // L'organisateur est compté présent par défaut sur tous ses créneaux.
      const organizerVotes: Record<string, VoteStatus> = {};
      cleanedOptions.forEach((option) => {
        organizerVotes[option.id] = "yes";
      });
      const organizerParticipant: ParticipantResponse = {
        id: createId("participant"),
        participantName: trimmedOrganizerName,
        votes: organizerVotes,
        createdAt: now,
        updatedAt: now,
      };

      const event: AperitifEvent = {
        id: createId("apero"),
        ceremonialName,
        title: title.trim() || undefined,
        organizerName: trimmedOrganizerName,
        beaufLevel: "medium",
        status: "active",
        options: cleanedOptions.map((option) => ({
          ...option,
          createdByRole: "organizer",
          createdByName: trimmedOrganizerName,
          createdAt: now,
        })),
        participants: [organizerParticipant],
        createdAt: now,
        updatedAt: now,
      };

      await eventStorage.createEvent(event);
      navigate(`/event/${event.id}`, { state: { createdEvent: event } });
    } catch (error) {
      setFeedback(
        error instanceof Error && error.message === "NO_CEREMONIAL_NAME_AVAILABLE"
          ? "La Confrérie est complète, archi-complète même : trop d’apéros tournent déjà en coulisses dans une magouille généralisée que plus personne ne maîtrise vraiment. Clôture une assemblée avant d’en convoquer une nouvelle, sinon c’est le chaos institutionnel."
          : error instanceof Error
            ? error.message
            : "Le service a renversé le registre, on ne sait pas comment, et franchement personne ne veut savoir comment. Réessaie dans deux secondes, ça se répare presque toujours tout seul.",
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
        <p className="hint">
          Vide → un nom de baptême tombe du ciel, tiré au sort par le grand ordinateur du zinc,
          qui a d’ailleurs un humour assez discutable.
        </p>

        <label className="field">
          <span>Toi</span>
          <input
            value={organizerName}
            onChange={(eventChange) => setOrganizerName(eventChange.target.value)}
            placeholder="Jean-Mi Pastaga, Mémé Cacahuète…"
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
                <LocationField
                  value={{
                    location: option.location,
                    locationAddress: option.locationAddress,
                    locationLat: option.locationLat,
                    locationLng: option.locationLng,
                  }}
                  onChange={(locationValue) => updateOption(option.id, locationValue)}
                />
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
