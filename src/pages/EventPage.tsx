import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AperoOrnaments } from "../components/AperoOrnaments";
import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";
import { MobileResultsPanel } from "../components/MobileResultsPanel";
import { MobileShareBox } from "../components/MobileShareBox";
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
      setSuccess("Suffrage enregistre. Le registre du zinc est a jour.");
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
      <MobilePage className="event-mobile">
        <TicketCard className="state-card state-card--loading">
          <p className="eyebrow">Lecture du registre</p>
          <h1>On cherche l'assemblee derriere le comptoir...</h1>
        </TicketCard>
      </MobilePage>
    );
  }

  if (!event) {
    return (
      <MobilePage className="event-mobile">
        <TicketCard className="state-card state-card--error">
          <p className="eyebrow">Assemblee introuvable</p>
          <h1>Cette convocation n'existe pas</h1>
          <p>Soit le lien est moisi, soit le patron a ferme le bar.</p>
          {error && <p className="feedback">{error}</p>}
          <Link className="button button--primary" to="/">
            Retour a la Confrerie
          </Link>
        </TicketCard>
      </MobilePage>
    );
  }

  const locations = Array.from(new Set(event.options.map((option) => option.location)));

  return (
    <MobilePage className="event-mobile">
      <MobileHeader
        eyebrow={beaufLabels[event.beaufLevel]}
        title={event.ceremonialName}
        subtitle="Ouvre, comprends, vote. L'assemblee est pensee pour le telephone."
      />

      <section className="event-summary-card event-summary-card--counter">
        {event.title && (
          <p>
            <strong>Objet :</strong> {event.title}
          </p>
        )}
        <p>
          <strong>Convoque par :</strong> {event.organizerName}
        </p>
        <p>
          <strong>Propositions :</strong> {event.options.length} | <strong>Participants :</strong>{" "}
          {event.participants.length}
        </p>
        <p>
          <strong>Lieux :</strong> {locations.join(" / ")}
        </p>
        {event.description && <p>{event.description}</p>}
      </section>

      <AperoOrnaments variant="verdict" />

      <p className="security-note">
        C'est une institution de comptoir, pas un coffre-fort. Ne mets rien que tu ne voudrais
        pas voir trainer sur une nappe collante publique.
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

      <div className="page-stack page-stack--mobile">
        {result && <MobileResultsPanel event={event} result={result} />}
        <VoteForm event={event} isSaving={isSaving} onSubmit={handleVoteSubmit} />

        <TicketCard className="ticket-card--register" id="registre">
          <div className="section-heading">
            <p className="eyebrow">Les membres de la Confrerie</p>
            <h2>Le registre du comptoir</h2>
          </div>
          {event.participants.length === 0 ? (
            <p>Aucun membre n'a encore signe. L'institution retient son souffle.</p>
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

        <MobileShareBox url={shareUrl} />
      </div>
    </MobilePage>
  );
}
