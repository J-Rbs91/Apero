import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlternativeOptionForm } from "../components/AlternativeOptionForm";
import { LoadingScreen } from "../components/LoadingScreen";
import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";
import { MobileResultsPanel } from "../components/MobileResultsPanel";
import { MobileShareBox } from "../components/MobileShareBox";
import { VoteForm } from "../components/VoteForm";
import { eventStorage } from "../services";
import type { AperitifEvent, AperitifOption, ParticipantResponse } from "../types/apero";
import { calculateBestOptions } from "../utils/calculateResults";

const MIN_LOADING_MS = 700;

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function EventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<AperitifEvent | null>(null);
  const [isPurged, setIsPurged] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const result = useMemo(() => (event ? calculateBestOptions(event) : null), [event]);
  const shareUrl = `${window.location.origin}${window.location.pathname}#/event/${eventId}`;

  useEffect(() => {
    let isMounted = true;

    async function loadEvent() {
      if (!eventId) {
        return;
      }

      const startedAt = Date.now();

      try {
        setIsLoading(true);
        setError("");
        setIsPurged(false);
        const fetchedEvent = await eventStorage.getEvent(eventId);
        const eventWasPurged = fetchedEvent ? false : await eventStorage.isEventPurged(eventId);

        if (isMounted) {
          setEvent(fetchedEvent);
          setIsPurged(eventWasPurged);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Le greffe a perdu la convocation.",
          );
        }
      } finally {
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
        window.setTimeout(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        }, remaining);
      }
    }

    loadEvent();
    return () => {
      isMounted = false;
    };
  }, [eventId]);

  async function handleVoteSubmit(response: ParticipantResponse) {
    if (!eventId) {
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      setSuccess("");
      const updatedEvent = await eventStorage.saveParticipantResponse(eventId, response);
      setEvent(updatedEvent);
      setSuccess("Suffrage enregistré. Le registre du zinc est à jour.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Le comptoir est saturé, réessaie dans deux secondes.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleOptionSubmit(option: AperitifOption) {
    if (!eventId) {
      return;
    }

    try {
      setIsAddingOption(true);
      setError("");
      setSuccess("");
      const updatedEvent = await eventStorage.addEventOption(eventId, option);
      setEvent(updatedEvent);
      setSuccess("Contre-proposition ajoutée au registre de cette assemblée.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Le registre du zinc refuse la contre-proposition. Réessaie dans un instant.",
      );
    } finally {
      setIsAddingOption(false);
    }
  }

  if (isLoading) {
    return (
      <MobilePage className="event-mobile" overlay="scene">
        <LoadingScreen />
      </MobilePage>
    );
  }

  if (!event && isPurged) {
    return (
      <MobilePage className="event-mobile" overlay="deep">
        <MobileHeader eyebrow="Registre nettoyé" />
        <section className="sheet">
          <h1 className="h1 h1--sm">Cette assemblée a quitté le comptoir</h1>
          <p className="lede">
            L’apéro est passé. Le registre actif a été nettoyé, mais les hauts faits des membres
            restent gravés dans la Confrérie.
          </p>
          <Link className="button button--primary button--block" to="/">
            Retourner à l’accueil
          </Link>
        </section>
      </MobilePage>
    );
  }

  if (!event) {
    return (
      <MobilePage className="event-mobile" overlay="deep">
        <MobileHeader eyebrow="Assemblée introuvable" />
        <section className="sheet">
          <h1 className="h1 h1--sm">Cette convocation n’existe pas</h1>
          <p className="lede">Soit le lien est moisi, soit le patron a fermé le bar.</p>
          {error && <p className="feedback">{error}</p>}
          <Link className="button button--primary button--block" to="/">
            Retour à la Confrérie
          </Link>
        </section>
      </MobilePage>
    );
  }

  const metaText = `par ${event.organizerName} · ${event.options.length} créneaux · ${event.participants.length} votants`;

  return (
    <MobilePage className="event-mobile" overlay="scene">
      <MobileHeader eyebrow="Assemblée" title={event.ceremonialName} meta={metaText} />
      {event.title && <p className="lede">{"« "}{event.title}{" »"}</p>}

      {error && (
        <p className="page-message page-message--error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="page-message page-message--success" role="status">
          {success}
        </p>
      )}

      <div className="event-stack">
        {result && <MobileResultsPanel event={event} result={result} />}
        <VoteForm event={event} isSaving={isSaving} onSubmit={handleVoteSubmit} />
        <AlternativeOptionForm isSaving={isAddingOption} onSubmit={handleOptionSubmit} />

        <section className="sheet" id="registre">
          <p className="eyebrow">Le registre du comptoir</p>
          {event.participants.length === 0 ? (
            <p className="lede">Aucun membre n’a encore signé. L’institution retient son souffle.</p>
          ) : (
            <div className="people">
              {event.participants.map((participant) => (
                <div className="person" key={participant.id}>
                  <i>{getInitials(participant.participantName)}</i>
                  <div className="person__body">
                    <div className="person__name">{participant.participantName}</div>
                    {participant.brings && <div className="person__sub">{participant.brings}</div>}
                    {participant.comment && (
                      <div className="person__sub person__sub--quote">{"« "}{participant.comment}{" »"}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <MobileShareBox url={shareUrl} />
      </div>
    </MobilePage>
  );
}
