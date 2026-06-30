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
  medium: "Tournée générale",
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
              : "Le greffe a perdu la convocation.",
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
      setSuccess("Suffrage enregistré. Le registre du zinc est à jour.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Le comptoir est saturé, retente dans deux secondes.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="app app--compact">
        <TicketCard className="state-card">
          <p className="eyebrow">Lecture du registre</p>
          <h1>On cherche l’assemblée derrière le comptoir...</h1>
        </TicketCard>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="app app--compact">
        <TicketCard className="state-card">
          <p className="eyebrow">Assemblée introuvable</p>
          <h1>Cette convocation n’existe pas</h1>
          <p>
            Soit le lien est moisi, soit le patron a fermé le bar.
          </p>
          {error && <p className="feedback">{error}</p>}
          <Link className="button button--primary" to="/">
            Retour à la Confrérie
          </Link>
        </TicketCard>
      </main>
    );
  }

  const locations = Array.from(new Set(event.options.map((option) => option.location)));

  return (
    <main className="app app--compact">
      <header className="topbar">
        <Link className="brand-link" to="/">
          <span className="brand-mark">CJ</span>
          <span>La Confrérie du Petit Jaune</span>
        </Link>
      </header>

      <section className="event-hero">
        <div>
          <p className="eyebrow">{beaufLabels[event.beaufLevel]}</p>
          <h1>{event.ceremonialName}</h1>
          {event.title && (
            <p>
              <strong>Objet de la réunion :</strong> {event.title}
            </p>
          )}
          <p>Convoqué par : {event.organizerName}</p>
          {event.description && <p>{event.description}</p>}
          <p>
            <strong>Lieu proposé :</strong> {locations.join(" / ")}
          </p>
          <p>Le peuple du comptoir est appelé à voter.</p>
        </div>
        <ShareLinkBox url={shareUrl} />
      </section>

      <p className="security-note">
        C’est une institution de comptoir, pas un coffre-fort. Ne mets rien que tu ne voudrais
        pas voir traîner sur une nappe collante publique.
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
            <p className="eyebrow">Les membres de la Confrérie</p>
            <h2>Le registre du comptoir</h2>
          </div>
          {event.participants.length === 0 ? (
            <p>Aucun membre n’a encore signé. L’institution retient son souffle.</p>
          ) : (
            <div className="participant-stack">
              {event.participants.map((participant) => (
                <article className="participant-card" key={participant.id}>
                  <div>
                    <h3>{participant.participantName}</h3>
                    {participant.brings && <p>{participant.brings}</p>}
                  </div>
                  {participant.comment && <p className="comment">“{participant.comment}”</p>}
                </article>
              ))}
            </div>
          )}
        </TicketCard>
      </div>
    </main>
  );
}
