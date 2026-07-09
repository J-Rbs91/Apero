import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AlternativeOptionForm } from "../components/AlternativeOptionForm";
import { LoadingScreen } from "../components/LoadingScreen";
import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";
import { MobileResultsPanel } from "../components/MobileResultsPanel";
import { MobileShareBox } from "../components/MobileShareBox";
import { OpenInMapsButton } from "../components/OpenInMapsButton";
import { ParticipantList } from "../components/ParticipantList";
import { TraquenardSlider } from "../components/TraquenardGauge";
import { VoteForm } from "../components/VoteForm";
import { useComptoirName } from "../hooks/useComptoirName";
import { AperoApiError } from "../services/aperoApiClient";
import { isValidAperoId } from "../services/aperoCryptoKeys";
import { AperoCryptoError } from "../services/aperoEncryption";
import {
  addEncryptedAperoOption,
  deleteEncryptedApero,
  getCachedAperoEvent,
  getEncryptedAperoById,
  joinApero,
  purgeDeletedApero,
} from "../services/encryptedAperoRepository";
import { findLocalApero } from "../services/localAperoRegistry";
import { syncAperoNotificationsFromRegistry } from "../services/notificationSync";
import { removeSnapshot } from "../services/notificationSnapshots";
import {
  hasAperoDeletedNotification,
  removeNotificationsForApero,
} from "../services/notificationStore";
import type { AperitifEvent, AperitifOption, ParticipantResponse } from "../types/apero";
import { calculateBestOptions } from "../utils/calculateResults";
import { formatOption } from "../utils/formatOption";
import { buildInviteUrl, maskInviteUrl, resolveInviteKeys } from "../utils/inviteLink";
import { buildShareText, buildShareTitle } from "../utils/shareMessage";

// Page d'invitation du nouveau flux chiffré (mode api-vps).
// Route : #/invite/:aperoId?k=ENCRYPTION_KEY&w=WRITE_KEY — les clés restent
// dans le fragment d'URL et ne sont jamais envoyées à un serveur.

type LoadState =
  | { status: "loading" }
  | { status: "invalid-id" }
  | { status: "missing-key" }
  | { status: "not-found" }
  // L'apéro était connu sur cet appareil et a disparu du stockage public :
  // annulé par la personne qui l'organisait (traces locales purgées).
  | { status: "deleted" }
  | { status: "bad-key" }
  | { status: "error"; message: string }
  | { status: "ready"; event: AperitifEvent };

function describeApiError(error: unknown): string {
  if (error instanceof AperoApiError) {
    switch (error.code) {
      case "API_NOT_CONFIGURED":
        return "Le comptoir numérique n’est pas encore raccordé (API non configurée). Ta réponse est notée sur cet appareil, elle partira dès que le service sera rétabli.";
      case "NETWORK_ERROR":
        return "Impossible de joindre le comptoir numérique. Vérifie la connexion et réessaie — ta réponse reste notée sur cet appareil.";
      case "CONFLICT":
        return "Quelqu’un a répondu en même temps que toi. Recharge la page et réessaie, ça passe presque toujours du deuxième coup.";
      case "WRITE_FORBIDDEN":
        if (error.serverCode === "LEGACY_DELETE_DISABLED") {
          return "Cette ancienne convocation n’a pas encore de clé d’annulation sécurisée. Active temporairement ALLOW_LEGACY_WRITE_KEY_DELETE côté API pour la supprimer, puis remets la variable à false.";
        }
        return "Ce lien ne permet pas de répondre ici. Vérifie qu’il est complet.";
      case "NOT_FOUND":
        if (error.serverCode === "DELETE_ENDPOINT_MISSING") {
          return "La suppression n’est pas encore disponible côté serveur : l’API du VPS doit être mise à jour. Rien n’a été supprimé.";
        }
        return "Un souci technique est survenu, réessaie dans un instant.";
      case "RATE_LIMITED":
        return "Le comptoir sature, doucement sur la cadence. Réessaie dans une minute.";
      default:
        return "Un souci technique est survenu, réessaie dans un instant.";
    }
  }

  return "Un souci technique est survenu, réessaie dans un instant.";
}

export function InvitePage() {
  const { aperoId } = useParams<{ aperoId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { comptoirName, setComptoirName } = useComptoirName();

  // Clés : d'abord le lien (fragment), sinon l'appareil (apéro déjà créé ou
  // déjà accepté sur cet appareil).
  const keys = useMemo(() => {
    const fromLink = resolveInviteKeys(location.search);
    const localEntry = aperoId ? findLocalApero(aperoId) : null;

    return {
      encryptionKey: fromLink.encryptionKey ?? localEntry?.encryptionKey,
      writeKey: fromLink.writeKey ?? localEntry?.writeKey,
      adminKey: localEntry?.adminKey,
    };
  }, [aperoId, location.search]);

  // Apéro tout juste créé (state de navigation) : sert de repli tant que la
  // lecture publique GitHub n'a pas rattrapé le commit d'écriture — évite un
  // faux « introuvable » juste après avoir envoyé l'invitation.
  const seededEvent = (location.state as { createdEvent?: AperitifEvent } | null)?.createdEvent;
  const initialEvent = seededEvent && seededEvent.id === aperoId ? seededEvent : null;

  const [state, setState] = useState<LoadState>(
    initialEvent ? { status: "ready", event: initialEvent } : { status: "loading" },
  );
  const [traquenardVote, setTraquenardVote] = useState(5);
  const [isSaving, setIsSaving] = useState(false);
  const [isProposingSlot, setIsProposingSlot] = useState(false);
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [hasLocalEntry, setHasLocalEntry] = useState(
    () => Boolean(aperoId && findLocalApero(aperoId)),
  );

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!aperoId || !isValidAperoId(aperoId)) {
        setState({ status: "invalid-id" });
        return;
      }

      if (!keys.encryptionKey) {
        setState({ status: "missing-key" });
        return;
      }

      try {
        if (!initialEvent) {
          setState({ status: "loading" });
        }
        const loaded = await getEncryptedAperoById(aperoId, keys.encryptionKey);

        if (!isMounted) {
          return;
        }

        if (!loaded) {
          if (!initialEvent) {
            // Apéro supprimé par son organisateur : il disparaît aussi de cet
            // appareil (registre local, notifications, instantané) — sans
            // toucher aux apéros jamais encore vus publiquement, dont la
            // lecture peut simplement être en retard sur l'écriture. Quand la
            // purge a lieu (ou a déjà eu lieu : la notification d'annulation
            // en garde la trace), on l'explique clairement au lieu d'un
            // simple « introuvable ».
            if (purgeDeletedApero(aperoId) || hasAperoDeletedNotification(aperoId)) {
              setHasLocalEntry(false);
              setState({ status: "deleted" });
            } else {
              setState({ status: "not-found" });
            }
          }
          // Sinon : on vient de créer cet apéro, la lecture publique GitHub
          // peut être en retard sur l'écriture — on garde la version fraîche
          // en mémoire plutôt que d'afficher « introuvable ».
          return;
        }

        setState({ status: "ready", event: loaded.event });
        // Génère les notifications de cet apéro (si connu localement) à partir
        // de l'écart avec le dernier état vu sur cet appareil.
        syncAperoNotificationsFromRegistry(loaded.event);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        if (loadError instanceof AperoCryptoError) {
          setState({ status: "bad-key" });
          return;
        }

        // Lecture publique en panne (quota GitHub anonyme épuisé, réseau) :
        // comme l'agenda, on retombe sur la dernière version connue de cet
        // apéro sur cet appareil plutôt que de bloquer l'accès — l'organisateur
        // garde notamment la main pour le supprimer.
        const cachedEvent = getCachedAperoEvent(aperoId);
        if (cachedEvent) {
          setState({ status: "ready", event: cachedEvent });
          setError(
            "Impossible de rafraîchir cet apéro pour le moment : voici sa dernière version connue sur cet appareil.",
          );
          return;
        }

        if (!initialEvent) {
          setState({
            status: "error",
            message: "Impossible de récupérer cet apéro pour le moment. Réessaie dans un instant.",
          });
        }
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [aperoId, keys.encryptionKey]);

  async function handleVoteSubmit(response: ParticipantResponse) {
    if (state.status !== "ready" || !aperoId || !keys.writeKey || !keys.encryptionKey) {
      return;
    }

    const finalResponse: ParticipantResponse = { ...response, traquenardLevel: traquenardVote };

    try {
      setIsSaving(true);
      setError("");
      // On mémorise le blaze utilisé : les notifications s'appuient dessus pour
      // reconnaître « moi » et éviter de m'auto-notifier de mes propres actions.
      setComptoirName(finalResponse.participantName);
      const updatedEvent = await joinApero(aperoId, keys.writeKey, keys.encryptionKey, finalResponse);
      setState({ status: "ready", event: updatedEvent });
      setHasLocalEntry(true);
      syncAperoNotificationsFromRegistry(updatedEvent);
    } catch (submitError) {
      setError(describeApiError(submitError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleOptionSubmit(option: AperitifOption) {
    if (state.status !== "ready" || !aperoId || !keys.writeKey || !keys.encryptionKey) {
      return;
    }

    try {
      setIsAddingOption(true);
      setError("");
      const updatedEvent = await addEncryptedAperoOption(
        aperoId,
        keys.writeKey,
        keys.encryptionKey,
        option,
      );
      setState({ status: "ready", event: updatedEvent });
      syncAperoNotificationsFromRegistry(updatedEvent);
    } catch (submitError) {
      setError(describeApiError(submitError));
    } finally {
      setIsAddingOption(false);
    }
  }

  async function handleDelete() {
    if (!aperoId) {
      return;
    }

    const localEntry = findLocalApero(aperoId);
    const adminKey = localEntry?.adminKey;
    const legacyWriteKey = !adminKey && localEntry?.role === "creator" ? keys.writeKey : undefined;

    if (!adminKey && !legacyWriteKey) {
      setError("Cette annulation n’est disponible que depuis l’appareil qui a créé l’apéro.");
      return;
    }

    setError("");

    try {
      setIsDeleting(true);
      await deleteEncryptedApero(aperoId, { adminKey, legacyWriteKey });
      // Nettoyage local : plus de notifications ni d'instantané pour un apéro
      // qui n'existe plus.
      removeNotificationsForApero(aperoId);
      removeSnapshot(aperoId);
      navigate("/agenda", { replace: true });
    } catch (deleteError) {
      setError(describeApiError(deleteError));
      setIsDeleting(false);
    }
  }

  if (state.status === "loading") {
    return (
      <MobilePage className="event-mobile" overlay="deep">
        <MobileHeader eyebrow="Invitation" />
        <LoadingScreen title="On ouvre l’invitation" subtitle="On déchiffre les détails de l’apéro…" />
      </MobilePage>
    );
  }

  if (state.status !== "ready") {
    const message =
      state.status === "invalid-id"
        ? "Ce lien d’invitation est mal formé : on ne reconnaît pas cet identifiant."
        : state.status === "missing-key"
          ? "Ce lien d’invitation est incomplet : il lui manque sa clé de lecture. Demande le lien complet à la personne qui t’a invité·e."
          : state.status === "not-found"
            ? "Cet apéro reste introuvable : soit ce lien ne mène nulle part, soit l’apéro a déjà eu lieu."
            : state.status === "deleted"
              ? "Cet apéro a été annulé par la personne qui l’organisait : créneaux, votes et registre, tout a été effacé. Il a aussi été retiré de ton ardoise sur cet appareil."
              : state.status === "bad-key"
                ? "Cette clé n’ouvre pas cet apéro : lien tronqué ou périmé. Demande une invitation fraîche."
                : state.message;

    return (
      <MobilePage className="event-mobile" overlay="deep">
        <MobileHeader eyebrow="Invitation" />
        <section className="sheet">
          <h1 className="h1 h1--sm">
            {state.status === "deleted" ? "Apéro annulé" : "Aïe, ce lien coince"}
          </h1>
          <p className="lede">{message}</p>
          <Link className="button button--ghost button--block" to="/">
            Retour au comptoir
          </Link>
        </section>
      </MobilePage>
    );
  }

  const { event } = state;
  const result = calculateBestOptions(event);
  const winnerId = result.type === "winner" ? result.optionId : undefined;
  const canShare = Boolean(aperoId && keys.encryptionKey);
  const inviteUrl = canShare
    ? buildInviteUrl({
        aperoId: aperoId as string,
        encryptionKey: keys.encryptionKey,
        writeKey: keys.writeKey,
      })
    : "";

  // L'annulation n'est visible que depuis le registre local du créateur.
  const localEntry = aperoId ? findLocalApero(aperoId) : null;
  const isOrganizer = localEntry?.role === "creator" && Boolean(localEntry.adminKey || keys.writeKey);

  return (
    <MobilePage className="event-mobile" overlay="deep">
      <MobileHeader eyebrow="Invitation" />

      <section className="sheet">
        <p className="eyebrow">Une invitation de {event.organizerName}</p>
        <h1 className="h1 h1--sm">{event.ceremonialName}</h1>
        {event.title && <p className="lede">{"« "}{event.title}{" »"}</p>}
        {event.childrenAllowed != null && (
          <span className={`tag ${event.childrenAllowed ? "tag--yes" : "tag--no"}`}>
            {event.childrenAllowed
              ? "👶 Marmaille admise — les mioches sont conviés"
              : "🚫 Sans les mioches — apéro entre grandes personnes"}
          </span>
        )}
        {hasLocalEntry && (
          <p className="meta">C’est noté : tu retrouveras cet apéro dans ton ardoise sur cet appareil.</p>
        )}
      </section>

      {error && (
        <p className="page-message page-message--error" role="alert">
          {error}
        </p>
      )}

      <MobileResultsPanel event={event} result={result} />

      {keys.writeKey ? (
        <>
          <VoteForm
            event={event}
            isSaving={isSaving}
            onSubmit={handleVoteSubmit}
            leadingOptionId={winnerId}
            onProposeSlot={() => setIsProposingSlot(true)}
            childrenAllowed={event.childrenAllowed}
            extraFields={
              <TraquenardSlider value={traquenardVote} onChange={setTraquenardVote} />
            }
          />
          <AlternativeOptionForm
            isSaving={isAddingOption}
            isOpen={isProposingSlot}
            onClose={() => setIsProposingSlot(false)}
            onSubmit={handleOptionSubmit}
          />
        </>
      ) : (
        <section className="sheet">
          <p className="lbl">{event.options.length > 1 ? "Toutes les dates proposées" : "Le créneau proposé"}</p>
          <div className="slot-stack">
            {event.options.map((option) => (
              <div className="slot" key={option.id}>
                <div className="slot__top">
                  <div>
                    <div className="slot__d">{formatOption(option)}</div>
                    {(option.locationAddress ||
                      (option.locationLat != null && option.locationLng != null)) && (
                      <OpenInMapsButton
                        className="slot__maplink"
                        label={option.location}
                        address={option.locationAddress}
                        lat={option.locationLat}
                        lng={option.locationLng}
                      />
                    )}
                  </div>
                  {option.id === winnerId && <span className="agenda-lead">En tête</span>}
                </div>
              </div>
            ))}
          </div>
          <p className="lede">
            Ce lien permet de consulter l’apéro, mais pas d’y répondre : il manque la clé
            d’écriture. Demande le lien complet à la personne qui t’a invité·e.
          </p>
        </section>
      )}

      <ParticipantList participants={event.participants} />

      {canShare && (
        <MobileShareBox
          url={inviteUrl}
          displayUrl={maskInviteUrl(inviteUrl)}
          title={buildShareTitle(event)}
          text={buildShareText(event)}
        />
      )}

      {isOrganizer && keys.writeKey && (
        <button
          type="button"
          className="ghost-link ghost-link--danger"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Supprimer cet évènement
        </button>
      )}

      {showDeleteConfirm && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="sheet modal-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <p className="eyebrow">Annuler l’apéro</p>
            <h2 className="h1 h1--sm" id="delete-title">
              Es-tu sûr de vouloir supprimer cet évènement ?
            </h2>
            <p className="lede">
              Cette action est définitive : créneaux, réponses, votes et contre-propositions, tout
              disparaît pour de bon. Pas de retour en arrière possible.
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
                {isDeleting ? "Suppression…" : "Oui, supprimer définitivement"}
              </button>
            </div>
            {error && <p className="feedback">{error}</p>}
          </section>
        </div>
      )}
    </MobilePage>
  );
}
