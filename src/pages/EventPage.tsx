import { useEffect, useMemo, useState } from "react";
import { VERRERIE_ECRANS } from "../components/field/verrerieEcrans";
import { composerVerrerie } from "../components/field/Verrerie";
import { useLocation, useParams } from "react-router";
import { AppLink } from "../components/AppLink";
import { useAppNavigation } from "../routes/useAppNavigation";
import { AlternativeOptionForm } from "../components/AlternativeOptionForm";
import { LoadingScreen } from "../components/LoadingScreen";
import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";
import { MobileResultsPanel } from "../components/MobileResultsPanel";
import { MobileShareBox } from "../components/MobileShareBox";
import { ParticipantList } from "../components/ParticipantList";
import { VoteForm } from "../components/VoteForm";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useComptoirName } from "../hooks/useComptoirName";
import { eventStorage } from "../services";
import type { AperitifEvent, AperitifOption, ParticipantResponse } from "../types/apero";
import { calculateBestOptions } from "../utils/calculateResults";
import { normalizeMemberName } from "../utils/memberName";
import { buildShareText, buildShareTitle } from "../utils/shareMessage";

const MIN_LOADING_MS = 700;

export function EventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { aller } = useAppNavigation();
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
              : "Réseau indisponible. Réessayer.",
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
      setSuccess("Réponse enregistrée.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Réseau indisponible. Réessayer.",
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
      setSuccess("Créneau ajouté.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Réseau indisponible. Réessayer.",
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
      /* Même raison que sur la page d'invitation : l'apéro supprimé quitte la
         pile avec son entrée. */
      aller("/agenda");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Réseau indisponible. Réessayer.",
      );
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <MobilePage className="event-mobile" header={<MobileHeader eyebrow="Apéro" />}>
        <LoadingScreen heading="h1" />
      </MobilePage>
    );
  }

  if (!event && isPurged) {
    return (
      <MobilePage
        className="event-mobile"
        verrerie={VERRERIE_ECRANS.erreur}
        header={<MobileHeader eyebrow="Apéro" />}
        hero={<h1 className="h1 h1--sm">Apéro passé</h1>}
      >
        <section className="sheet">
          <AppLink className="button button--primary button--block" to="/">
            Accueil
          </AppLink>
        </section>
      </MobilePage>
    );
  }

  if (!event) {
    return (
      <MobilePage
        className="event-mobile"
        verrerie={VERRERIE_ECRANS.erreur}
        header={<MobileHeader eyebrow="Apéro" />}
        hero={<h1 className="h1 h1--sm">Apéro introuvable</h1>}
      >
        <section className="sheet">
          {error && <p className="feedback">{error}</p>}
          <AppLink className="button button--primary button--block" to="/">
            Accueil
          </AppLink>
        </section>
      </MobilePage>
    );
  }

  const metaText = `Hôte : ${event.organizerName} · ${event.options.length} créneau${event.options.length > 1 ? "x" : ""} · ${event.participants.length} réponse${event.participants.length > 1 ? "s" : ""}`;
  const isOrganizer =
    Boolean(comptoirName) &&
    normalizeMemberName(comptoirName) === normalizeMemberName(event.organizerName);

  return (
    <MobilePage
      className="event-mobile invite-page"
      verrerie={composerVerrerie(event.id)}
      header={<MobileHeader eyebrow="Apéro" />}
      hero={
        <div className="page-hero">
          <h1 className="h1 h1--sm">{event.ceremonialName}</h1>
          <p className="meta">{metaText}</p>
          {event.title && <p className="lede">{event.title}</p>}
        </div>
      }
    >
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

      <div className="invite-grid">
        <div className="invite-main">
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
        </div>

        <div className="invite-aside">
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
              Supprimer l’apéro
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Supprimer ?"
        body="Irréversible."
        cancelLabel="Annuler"
        confirmLabel="Supprimer"
        busyLabel="Suppression…"
        isBusy={isDeleting}
        error={error || undefined}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />
    </MobilePage>
  );
}
