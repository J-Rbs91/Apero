import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AlternativeOptionForm } from "../components/AlternativeOptionForm";
import { LoadingScreen } from "../components/LoadingScreen";
import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";
import { MobileResultsPanel } from "../components/MobileResultsPanel";
import { MobileShareBox } from "../components/MobileShareBox";
import { VoteForm } from "../components/VoteForm";
import { useComptoirName } from "../hooks/useComptoirName";
import { eventStorage } from "../services";
import type { AperitifEvent, AperitifOption, ParticipantResponse } from "../types/apero";
import { calculateBestOptions } from "../utils/calculateResults";
import { normalizeMemberName } from "../utils/memberName";
import { buildShareText, buildShareTitle } from "../utils/shareMessage";

const MIN_LOADING_MS = 700;

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

type PresenceGroup = "coming" | "wavering" | "declined";

function getPresenceGroup(participant: ParticipantResponse): PresenceGroup {
  const votes = Object.values(participant.votes);

  if (votes.some((vote) => vote === "yes")) {
    return "coming";
  }

  if (votes.some((vote) => vote === "maybe")) {
    return "wavering";
  }

  return "declined";
}

function ParticipantRow({ participant }: { participant: ParticipantResponse }) {
  return (
    <div className="person">
      <i>{getInitials(participant.participantName)}</i>
      <div className="person__body">
        <div className="person__name">{participant.participantName}</div>
        {participant.brings && <div className="person__sub">{participant.brings}</div>}
        {participant.comment && (
          <div className="person__sub person__sub--quote">{"« "}{participant.comment}{" »"}</div>
        )}
      </div>
    </div>
  );
}

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
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAbsentees, setShowAbsentees] = useState(false);
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
              : "Le greffe a perdu la convocation, on ne sait plus où, on ne sait plus comment, et à la limite on ne sait même plus si elle a vraiment existé un jour.",
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
      setSuccess("Réponse enregistrée, gravée, scellée dans le marbre du zinc : le registre est à jour, et l’Histoire, la vraie, en prend acte.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Le comptoir est saturé, complètement débordé, à deux doigts de la rupture d’anévrisme administratif. Réessaie dans deux secondes, ça devrait passer.",
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
      setSuccess("Contre-proposition ajoutée au registre de cette assemblée, dûment considérée, et le Conseil, désormais, en délibère avec le sérieux qu’elle mérite.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Le registre du zinc refuse net la contre-proposition, sans explication, avec l’autorité tranquille d’une institution qui n’a de comptes à rendre à personne. Réessaie dans un instant.",
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
          : "Le registre s’accroche à cette assemblée comme à sa dernière olive, et refuse obstinément de la lâcher. Réessaie dans un instant.",
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
        <MobileHeader eyebrow="Registre nettoyé" />
        <section className="sheet">
          <h1 className="h1 h1--sm">Cette assemblée a quitté le comptoir</h1>
          <p className="lede">
            L’apéro est passé, le registre actif a été nettoyé, mais rassure-toi : les hauts faits
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
        <MobileHeader eyebrow="Assemblée introuvable" />
        <section className="sheet">
          <h1 className="h1 h1--sm">Cette convocation n’existe pas</h1>
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
  const comingParticipants = event.participants.filter(
    (participant) => getPresenceGroup(participant) === "coming",
  );
  const waveringParticipants = event.participants.filter(
    (participant) => getPresenceGroup(participant) === "wavering",
  );
  const decliningParticipants = event.participants.filter(
    (participant) => getPresenceGroup(participant) === "declined",
  );
  const absenteeCount = waveringParticipants.length + decliningParticipants.length;
  const isOrganizer =
    Boolean(comptoirName) &&
    normalizeMemberName(comptoirName) === normalizeMemberName(event.organizerName);

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
            <p className="lede">
              Aucun convive n’a encore signé le registre. L’institution retient son souffle,
              suspendue à la première signature comme à un premier amour.
            </p>
          ) : (
            <>
              {comingParticipants.length === 0 ? (
                <p className="lede">
                  Personne n’a encore juré présence. Le zinc garde les verres au frais, sans
                  illusion excessive, mais avec l’espoir tenace qui caractérise les grandes
                  institutions.
                </p>
              ) : (
                <div className="people">
                  {comingParticipants.map((participant) => (
                    <ParticipantRow key={participant.id} participant={participant} />
                  ))}
                </div>
              )}

              {absenteeCount > 0 && (
                <>
                  <button
                    type="button"
                    className="ghost-link"
                    aria-expanded={showAbsentees}
                    aria-controls="registre-absents"
                    onClick={() => setShowAbsentees((isShown) => !isShown)}
                  >
                    {showAbsentees
                      ? "Replier les dossiers sensibles"
                      : `Qui se défile, qui se tâte (${absenteeCount})`}
                  </button>

                  {showAbsentees && (
                    <div id="registre-absents" className="event-stack">
                      {waveringParticipants.length > 0 && (
                        <>
                          <p className="lbl">Le cul entre deux chaises</p>
                          <div className="people">
                            {waveringParticipants.map((participant) => (
                              <ParticipantRow key={participant.id} participant={participant} />
                            ))}
                          </div>
                        </>
                      )}
                      {decliningParticipants.length > 0 && (
                        <>
                          <p className="lbl">Désertions assumées</p>
                          <div className="people">
                            {decliningParticipants.map((participant) => (
                              <ParticipantRow key={participant.id} participant={participant} />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>

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
            Supprimer cette assemblée
          </button>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="sheet modal-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <p className="eyebrow">Radiation du registre</p>
            <h2 className="h1 h1--sm" id="delete-title">
              Supprimer cette assemblée ?
            </h2>
            <p className="lede">
              Le comptoir efface tout, pour de bon : créneaux, votes, contre-propositions, tout le
              tralala administratif. Il n’y a pas de session de rattrapage, pas de recours, pas de
              commission d’appel.
            </p>
            <button
              type="button"
              className="button button--danger button--block"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Radiation…" : "Oui, raye-la du registre"}
            </button>
            <button
              type="button"
              className="button button--ghost button--block"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Non, je la garde
            </button>
            {error && <p className="feedback">{error}</p>}
          </section>
        </div>
      )}
    </MobilePage>
  );
}
