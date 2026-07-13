import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AlternativeOptionForm } from "../components/AlternativeOptionForm";
import { LoadingScreen } from "../components/LoadingScreen";
import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";
import { MobileResultsPanel } from "../components/MobileResultsPanel";
import { MobileShareBox } from "../components/MobileShareBox";
import { ParticipantList } from "../components/ParticipantList";
import { VoteForm } from "../components/VoteForm";
import { useComptoirName } from "../hooks/useComptoirName";
import { useModalDialog } from "../hooks/useModalDialog";
import { eventStorage } from "../services";
import type { AperitifEvent, AperitifOption, ParticipantResponse } from "../types/apero";
import { calculateBestOptions } from "../utils/calculateResults";
import { normalizeMemberName } from "../utils/memberName";
import { buildShareText, buildShareTitle } from "../utils/shareMessage";

const MIN_LOADING_MS = 700;

export function EventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { comptoirName } = useComptoirName();
  const seededEvent = (location.state as { createdEvent?: AperitifEvent } | null)?.createdEvent;
  const initialEvent = seededEvent && seededEvent.id === eventId ? seededEvent : null;
  const [event, setEvent] = useState<AperitifEvent | null>(initialEvent);
  const [isPurged, setIsPurged] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialEvent);
  const [isSaving, setIsSaving] = useState(false);
  const [isProposingSlot, setIsProposingSlot] = useState(false);
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const deleteDialogRef = useModalDialog(showDeleteConfirm, () => {
    if (!isDeleting) {
      setShowDeleteConfirm(false);
    }
  });
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

        if (fetchedEvent) {
          if (isMounted) {
            setEvent(fetchedEvent);
            setIsPurged(false);
          }
        } else if (!initialEvent) {
          // Pas de version fraîche et pas d'apéro tout juste créé en mémoire :
          // alors seulement on conclut à l'absence (purgé ou inexistant).
          const eventWasPurged = await eventStorage.isEventPurged(eventId);
          if (isMounted) {
            setEvent(null);
            setIsPurged(eventWasPurged);
          }
        }
        // Sinon : on vient de créer cet apéro, GitHub peut être en retard —
        // on garde la version en mémoire plutôt que d'afficher « introuvable ».
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Impossible de récupérer cet apéro pour le moment. Réessaie dans un instant.",
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
      setSuccess("Réponse bien reçue, merci !");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Le comptoir est débordé. Réessaie dans deux secondes, ça devrait passer.",
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
      setSuccess("Nouvelle date proposée, elle apparaît maintenant dans la liste.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Impossible d’ajouter cette proposition pour le moment. Réessaie dans un instant.",
      );
    } finally {
      setIsAddingOption(false);
    }
  }

  async function handleDelete() {
    if (!eventId) {
      return;
    }

    try {
      setIsDeleting(true);
      setError("");
      await eventStorage.deleteEvent(eventId);
      navigate("/agenda", { replace: true });
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Impossible de supprimer cet apéro pour le moment. Réessaie dans un instant.",
      );
      setIsDeleting(false);
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
        <MobileHeader eyebrow="Apéro archivé" />
        <section className="sheet">
          <h1 className="h1 h1--sm">Cet apéro est terminé</h1>
          <p className="lede">
            La soirée est passée, cette page a été nettoyée, mais rassure-toi : les hauts faits
            de la tablée, eux, restent gravés dans la Confrérie pour l’éternité — ou en tout cas
            jusqu’à la prochaine purge.
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
        <MobileHeader eyebrow="Apéro introuvable" />
        <section className="sheet">
          <h1 className="h1 h1--sm">Cet apéro n’existe pas</h1>
          <p className="lede">
            Soit le lien est complètement moisi, soit le troquet a purement et simplement fermé
            boutique — et dans les deux cas, on ne peut plus rien pour toi ici.
          </p>
          {error && <p className="feedback">{error}</p>}
          <Link className="button button--primary button--block" to="/">
            Retour à la Confrérie
          </Link>
        </section>
      </MobilePage>
    );
  }

  const metaText = `par ${event.organizerName} · ${event.options.length} créneaux · ${event.participants.length} réponses`;
  const isOrganizer =
    Boolean(comptoirName) &&
    normalizeMemberName(comptoirName) === normalizeMemberName(event.organizerName);

  return (
    <MobilePage className="event-mobile" overlay="scene">
      <MobileHeader eyebrow="Ton apéro" title={event.ceremonialName} meta={metaText} />
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
        <VoteForm
          event={event}
          isSaving={isSaving}
          onSubmit={handleVoteSubmit}
          leadingOptionId={result?.type === "winner" ? result.optionId : undefined}
          onProposeSlot={() => setIsProposingSlot(true)}
        />
        <AlternativeOptionForm
          isSaving={isAddingOption}
          isOpen={isProposingSlot}
          onClose={() => setIsProposingSlot(false)}
          onSubmit={handleOptionSubmit}
        />

        <ParticipantList participants={event.participants} />

        <MobileShareBox
          url={shareUrl}
          title={buildShareTitle(event)}
          text={buildShareText(event)}
        />

        {isOrganizer && (
          <button
            type="button"
            className="ghost-link ghost-link--danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Supprimer cet apéro
          </button>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="modal-backdrop" role="presentation">
          <section
            ref={deleteDialogRef}
            tabIndex={-1}
            className="sheet modal-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <p className="eyebrow">Suppression</p>
            <h2 className="h1 h1--sm" id="delete-title">
              Supprimer cet apéro ?
            </h2>
            <p className="lede">
              Ça efface tout, pour de bon : créneaux, réponses, propositions, tout y passe. Pas de
              retour en arrière possible.
            </p>
            <div className="button-row">
              <button
                type="button"
                className="button button--ghost"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Non, je le garde
              </button>
              <button
                type="button"
                className="button button--danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Suppression…" : "Oui, supprimer"}
              </button>
            </div>
            {error && <p className="feedback">{error}</p>}
          </section>
        </div>
      )}
    </MobilePage>
  );
}
