import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LocationField } from "../components/LocationField";
import { ToggleSwitch } from "../components/ToggleSwitch";
import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";
import { getAperoStorageMode } from "../config/aperoApiConfig";
import { eventStorage } from "../services";
import { AperoApiError } from "../services/aperoApiClient";
import { createEncryptedApero } from "../services/encryptedAperoRepository";
import { addAperoToTablee } from "../services/tableeRepository";
import { useComptoirName } from "../hooks/useComptoirName";
import type {
  AperitifEvent,
  AperitifOption,
  AperoRecurrence,
  ParticipantResponse,
  VoteStatus,
} from "../types/apero";
import { createId } from "../utils/createId";
import type { CreateEventPrefill } from "../utils/nextRound";
import {
  generateUniqueCeremonialName,
  isCeremonialNameTaken,
  pickRandomCeremonialName,
} from "../utils/generateCeremonialName";
import { buildInvitePath } from "../utils/inviteLink";

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
  const location = useLocation();
  const { comptoirName } = useComptoirName();

  // Pré-remplissage « Remettre ça » / tournée récurrente : lieu, heure et
  // cadence de l'assemblée écoulée, transmis par la page d'invitation.
  const navigationState = location.state as {
    prefill?: CreateEventPrefill;
    // « Convoquer la tablée » : l'apéro créé rejoint d'office ses annales.
    linkToTablee?: { tableeId: string; encryptionKey?: string; writeKey?: string };
  } | null;
  const prefill = navigationState?.prefill;
  const linkToTablee = navigationState?.linkToTablee;

  const [ceremonialNameInput, setCeremonialNameInput] = useState(prefill?.ceremonialName ?? "");
  const [title, setTitle] = useState(prefill?.title ?? "");
  const [childrenAllowed, setChildrenAllowed] = useState(prefill?.childrenAllowed ?? false);
  const [recurrence, setRecurrence] = useState<AperoRecurrence | "">(prefill?.recurrence ?? "");
  const [options, setOptions] = useState<AperitifOption[]>(() =>
    prefill?.options?.length
      ? prefill.options.map((option) => ({ ...option, id: createId("option") }))
      : [createEmptyOption()],
  );
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
      }))
      .filter((option) => option.date || option.time || option.location);

    if (
      cleanedOptions.length === 0 ||
      cleanedOptions.some((option) => !option.date || !option.time || !option.location)
    ) {
      setFeedback(
        "Chaque créneau réclame un jour, une heure et un établissement, parce qu’un apéro sans lieu ni horaire, ce n’est plus un apéro, c’est un concept — et ici, on n’organise pas de concepts.",
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
        "Tous tes créneaux sont déjà dans le passé, ce qui est un joli exploit temporel mais totalement inutile pour inviter qui que ce soit. Propose une date à venir, la machine à remonter le temps est encore en réparation.",
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const storageMode = getAperoStorageMode();
      // Mode api-vps : les apéros sont chiffrés, impossible de lister
      // l'existant pour garantir un nom unique.
      const activeEvents =
        storageMode === "api-vps" ? [] : await eventStorage.listActiveEvents();
      const trimmedCeremonialName = ceremonialNameInput.trim();

      if (trimmedCeremonialName && storageMode !== "api-vps" && isCeremonialNameTaken(trimmedCeremonialName, activeEvents)) {
        setFeedback(
          "Ce nom d’apéro est déjà pris par un événement en cours. Trouve-en un autre, ou laisse le champ vide pour un tirage au sort.",
        );
        return;
      }

      const ceremonialName = trimmedCeremonialName
        ? trimmedCeremonialName
        : storageMode === "api-vps"
          ? pickRandomCeremonialName()
          : generateUniqueCeremonialName(activeEvents);
      const now = new Date().toISOString();
      const trimmedOrganizerName = comptoirName.trim();

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

      if (storageMode === "api-vps") {
        // Nouveau flux : chiffrement côté client puis écriture via l'API VPS.
        // L'aperoId et les clés sont générés par le repository ; le lien
        // d'invitation (avec clés en fragment) devient la seule porte d'entrée.
        const created = await createEncryptedApero({
          ceremonialName,
          title: title.trim() || undefined,
          organizerName: trimmedOrganizerName,
          beaufLevel: "medium",
          status: "active",
          childrenAllowed,
          recurrence: recurrence || undefined,
          options: cleanedOptions.map((option) => ({
            ...option,
            createdByRole: "organizer",
            createdByName: trimmedOrganizerName,
            createdAt: now,
          })),
          participants: [organizerParticipant],
          createdAt: now,
          updatedAt: now,
        });

        // Convocation depuis une tablée : on grave l'apéro à ses annales.
        // Meilleur effort — un échec ici ne doit pas gâcher la création.
        if (linkToTablee?.writeKey && linkToTablee.encryptionKey) {
          try {
            await addAperoToTablee(
              linkToTablee.tableeId,
              linkToTablee.writeKey,
              linkToTablee.encryptionKey,
              {
                aperoId: created.aperoId,
                encryptionKey: created.encryptionKey,
                writeKey: created.writeKey,
                ceremonialName,
                addedBy: trimmedOrganizerName || undefined,
              },
            );
          } catch {
            // L'apéro existe et reste rattachable plus tard depuis sa page.
          }
        }

        navigate(
          buildInvitePath(created.aperoId, {
            encryptionKey: created.encryptionKey,
            writeKey: created.writeKey,
          }),
          { state: { createdEvent: created.event } },
        );
        return;
      }

      const event: AperitifEvent = {
        id: createId("apero"),
        ceremonialName,
        title: title.trim() || undefined,
        organizerName: trimmedOrganizerName,
        beaufLevel: "medium",
        status: "active",
        childrenAllowed,
        recurrence: recurrence || undefined,
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
        error instanceof AperoApiError && error.code === "API_NOT_CONFIGURED"
          ? "Le comptoir numérique n’est pas encore raccordé (API non configurée) : impossible de créer l’apéro dans ce mode. Repasse en mode classique ou configure VITE_APERO_API_BASE_URL."
          : error instanceof AperoApiError && error.code === "NETWORK_ERROR"
            ? "Impossible de joindre le comptoir numérique. Vérifie la connexion (ou que l’API tourne bien) et réessaie."
            : error instanceof Error && error.message === "NO_CEREMONIAL_NAME_AVAILABLE"
              ? "La Confrérie est complète, archi-complète même : trop d’apéros tournent déjà en coulisses dans une magouille généralisée que plus personne ne maîtrise vraiment. Clôture un apéro avant d’en lancer un nouveau, sinon c’est le chaos total."
              : error instanceof Error
                ? error.message
                : "Le service a fait une bêtise, on ne sait pas comment, et franchement personne ne veut savoir comment. Réessaie dans deux secondes, ça se répare presque toujours tout seul.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <MobilePage className="create-mobile" overlay="deep">
      <MobileHeader eyebrow="Invitation" />

      <form className="sheet" onSubmit={handleSubmit}>
        <h1 className="h1 h1--sm">Organiser un apéro</h1>

        <label className="field">
          <span>Nom de l’apéro (optionnel)</span>
          <input
            value={ceremonialNameInput}
            onChange={(eventChange) => setCeremonialNameInput(eventChange.target.value)}
            placeholder="La Grande Tablée des Olives"
          />
        </label>

        <label className="field">
          <span>Description</span>
          <input
            value={title}
            onChange={(eventChange) => setTitle(eventChange.target.value)}
            placeholder="Apéro fin de chantier"
          />
        </label>

        <div className="setting">
          <div className="switchrow">
            <label className="switchrow__label" htmlFor="children-allowed">
              <span className="switchrow__title">Les mioches sont-ils conviés ?</span>
              <span className="switchrow__state">
                {childrenAllowed ? "Marmaille admise" : "Ce soir c’est sans les mômes"}
              </span>
            </label>
            <ToggleSwitch
              id="children-allowed"
              checked={childrenAllowed}
              onChange={setChildrenAllowed}
              label="Les mioches sont-ils conviés ?"
            />
          </div>
        </div>

        <label className="field">
          <span>Ça se reproduit ?</span>
          <select
            value={recurrence}
            onChange={(eventChange) =>
              setRecurrence(eventChange.target.value as AperoRecurrence | "")
            }
          >
            <option value="">Une fois, on verra après</option>
            <option value="weekly">Chaque semaine</option>
            <option value="biweekly">Toutes les deux semaines</option>
            <option value="monthly">Chaque mois</option>
          </select>
        </label>
        {recurrence && (
          <p className="hint">
            Une assemblée qui se répète devient un rituel : une fois celle-ci passée, la
            Confrérie proposera de convoquer la suivante dans la foulée, mêmes lieu et
            heure, date décalée d’autant.
          </p>
        )}

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
          {isSubmitting ? "Création de l’apéro…" : "Créer l’apéro"}
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
