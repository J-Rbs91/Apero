import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ResultsPanel } from "../components/ResultsPanel";
import { ShareLinkBox } from "../components/ShareLinkBox";
import { TicketCard } from "../components/TicketCard";
import { VoteForm } from "../components/VoteForm";
import { eventStorage } from "../services";
import type { AperitifEvent, BeaufLevel, ParticipantResponse } from "../types/apero";
import { calculateBestOptions } from "../utils/calculateResults";

const beaufLabels: Record<BeaufLevel, string> = {
  soft: "Petit jaune tranquille",
  medium: "Tournee generale",
  legendary: "PMU Champions League",
};

export function EventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<AperitifEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

      try {
        setIsLoading(true);
        setError("");
        const fetchedEvent = await eventStorage.getEvent(eventId);

        if (isMounted) {
          setEvent(fetchedEvent);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Le patron a perdu le ticket.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
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
      setSuccess("Vote enregistre. Le comptoir a tamponne le bulletin.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Le comptoir est sature, retente dans deux secondes.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="app app--compact">
        <TicketCard className="state-card">
          <p className="eyebrow">Lecture du ticket</p>
          <h1>On cherche l'apero derriere le comptoir...</h1>
        </TicketCard>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="app app--compact">
        <TicketCard className="state-card">
          <p className="eyebrow">Evenement introuvable</p>
          <h1>Cet apero n'existe pas</h1>
          <p>
            Soit le lien est moisi, soit le patron a ferme le bar.
          </p>
          {error && <p className="feedback">{error}</p>}
          <Link className="button button--primary" to="/">
            Retour au comptoir
          </Link>
        </TicketCard>
      </main>
    );
  }

  return (
    <main className="app app--compact">
      <header className="topbar">
        <Link className="brand-link" to="/">
          <span className="brand-mark">AP</span>
          <span>Apero PMU</span>
        </Link>
      </header>

      <section className="event-hero">
        <div>
          <p className="eyebrow">{beaufLabels[event.beaufLevel]}</p>
          <h1>{event.title}</h1>
          <p>Organise par {event.organizerName}</p>
          {event.description && <p>{event.description}</p>}
        </div>
        <ShareLinkBox url={shareUrl} />
      </section>

      <p className="security-note">
        C'est une app d'apero, pas un coffre-fort. Ne mets rien que tu ne voudrais
        pas voir trainer sur un comptoir public.
      </p>

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

      <div className="page-stack">
        {result && <ResultsPanel event={event} result={result} />}
        <VoteForm event={event} isSaving={isSaving} onSubmit={handleVoteSubmit} />

        <TicketCard>
          <div className="section-heading">
            <p className="eyebrow">Participants deja inscrits</p>
            <h2>La liste du comptoir</h2>
          </div>
          {event.participants.length === 0 ? (
            <p>Aucun vote pour le moment. Le zinc retient son souffle.</p>
          ) : (
            <div className="participant-stack">
              {event.participants.map((participant) => (
                <article className="participant-card" key={participant.id}>
                  <div>
                    <h3>{participant.participantName}</h3>
                    {participant.brings && <p>{participant.brings}</p>}
                  </div>
                  {participant.comment && <p className="comment">"{participant.comment}"</p>}
                </article>
              ))}
            </div>
          )}
        </TicketCard>
      </div>
    </main>
  );
}
