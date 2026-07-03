import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AlternativeOptionForm } from "../components/AlternativeOptionForm";
import { EventRegistry } from "../components/EventRegistry";
import { LoadingScreen } from "../components/LoadingScreen";
import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";
import { MobileResultsPanel } from "../components/MobileResultsPanel";
import { MobileShareBox } from "../components/MobileShareBox";
import { TraquenardGauge } from "../components/TraquenardGauge";
import { VoteForm } from "../components/VoteForm";
import { useComptoirName } from "../hooks/useComptoirName";
import { AperoApiError } from "../services/aperoApiClient";
import { isValidAperoId } from "../services/aperoCryptoKeys";
import { AperoCryptoError } from "../services/aperoEncryption";
import {
  addEncryptedAperoOption,
  deleteEncryptedApero,
  getEncryptedAperoById,
  joinApero,
} from "../services/encryptedAperoRepository";
import { findLocalApero } from "../services/localAperoRegistry";
import { syncAperoNotificationsFromRegistry } from "../services/notificationSync";
import { removeSnapshot } from "../services/notificationSnapshots";
import { removeNotificationsForApero } from "../services/notificationStore";
import type { AperitifEvent, AperitifOption, ParticipantResponse } from "../types/apero";
import {
  calculateAverageTraquenardLevel,
  calculateBestOptions,
} from "../utils/calculateResults";
import { formatOption } from "../utils/formatOption";
import { normalizeMemberName } from "../utils/memberName";
import { buildInviteUrl, maskInviteUrl, resolveInviteKeys } from "../utils/inviteLink";
import { buildShareText, buildShareTitle } from "../utils/shareMessage";

// Page d'apéro du flux chiffré (mode api-vps).
// Route : #/invite/:aperoId?k=ENCRYPTION_KEY&w=WRITE_KEY — les clés restent
// dans le fragment d'URL et ne sont jamais envoyées à un serveur.
//
// C'est la page COMPLÈTE de l'apéro, pour tout le monde (organisateur comme
// invités) : détails, verdict, votes créneau par créneau, contre-propositions
// et registre. L'organisateur conserve en plus le droit de supprimer l'apéro.

type LoadState =
  | { status: "loading" }
  | { status: "invalid-id" }
  | { status: "missing-key" }
  | { status: "not-found" }
  | { status: "bad-key" }
  | { status: "error"; message: string }
  | { status: "ready"; event: AperitifEvent };

function describeApiError(error: unknown): string {
  if (error instanceof AperoApiError) {
    switch (error.code) {
      case "API_NOT_CONFIGURED":
        return "Le comptoir numérique n'est pas encore raccordé (API non configurée). Ta réponse est notée localement, elle partira quand le zinc rouvrira.";
      case "NETWORK_ERROR":
        return "Impossible de joindre le comptoir numérique. Vérifie la connexion et réessaie — ta réponse reste notée sur cet appareil.";
      case "CONFLICT":
        return "Quelqu'un a griffonné le registre en même temps que toi. Recharge la page et réessaie, ça passe presque toujours du deuxième coup.";
      case "WRITE_FORBIDDEN":
        return "Clé d'écriture refusée par le registre. Vérifie que ton lien d'invitation est complet.";
      case "RATE_LIMITED":
        return "Le comptoir sature, doucement sur la cadence. Réessaie dans une minute.";
      default:
        return "Le registre a fait des siennes, réessaie dans un instant.";
    }
  }

  return "Le registre a fait des siennes, réessaie dans un instant.";
}

export function InvitePage() {
  const { aperoId } = useParams<{ aperoId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { comptoirName, setComptoirName } = useComptoirName();

  // Clés : d'abord le lien (fragment), sinon le registre local (apéro déjà
  // créé ou rejoint sur cet appareil).
  const keys = useMemo(() => {
    const fromLink = resolveInviteKeys(location.search);
    const localEntry = aperoId ? findLocalApero(aperoId) : null;

    return {
      encryptionKey: fromLink.encryptionKey ?? localEntry?.encryptionKey,
      writeKey: fromLink.writeKey ?? localEntry?.writeKey,
    };
  }, [aperoId, location.search]);

  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAbsentees, setShowAbsentees] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

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
        setState({ status: "loading" });
        const loaded = await getEncryptedAperoById(aperoId, keys.encryptionKey);

        if (!isMounted) {
          return;
        }

        if (!loaded) {
          setState({ status: "not-found" });
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

        setState({
          status: "error",
          message:
            "Le greffe n'arrive pas à sortir le registre. Réessaie dans un instant, il finit toujours par céder.",
        });
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [aperoId, keys.encryptionKey]);

  async function handleVoteSubmit(response: ParticipantResponse) {
    if (state.status !== "ready" || !aperoId || !keys.encryptionKey || !keys.writeKey) {
      return;
    }

    setError("");
    setFeedback("");

    try {
      setIsSaving(true);
      setComptoirName(response.participantName);
      const updatedEvent = await joinApero(aperoId, keys.writeKey, keys.encryptionKey, response);
      setState({ status: "ready", event: updatedEvent });
      // Enregistre l'état vu après vote sans se notifier soi-même.
      syncAperoNotificationsFromRegistry(updatedEvent);
    } catch (voteError) {
      setError(describeApiError(voteError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleOptionSubmit(option: AperitifOption) {
    if (state.status !== "ready" || !aperoId || !keys.encryptionKey || !keys.writeKey) {
      return;
    }

    setError("");
    setFeedback("");

    try {
      setIsAddingOption(true);
      const updatedEvent = await addEncryptedAperoOption(
        aperoId,
        keys.writeKey,
        keys.encryptionKey,
        option,
      );
      setState({ status: "ready", event: updatedEvent });
      syncAperoNotificationsFromRegistry(updatedEvent);
      setFeedback(
        "Contre-proposition ajoutée au registre de cette assemblée, dûment considérée par le Conseil.",
      );
    } catch (optionError) {
      setError(describeApiError(optionError));
    } finally {
      setIsAddingOption(false);
    }
  }

  async function handleDelete() {
    if (!aperoId || !keys.writeKey) {
      return;
    }

    setError("");

    try {
      setIsDeleting(true);
      await deleteEncryptedApero(aperoId, keys.writeKey);
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
        <LoadingScreen title="On déplie l'invitation" subtitle="Le greffe déchiffre le registre…" />
      </MobilePage>
    );
  }

  if (state.status !== "ready") {
    const message =
      state.status === "invalid-id"
        ? "Ce lien d'invitation est mal formé : l'identifiant de l'assemblée ne ressemble à rien de connu au greffe."
        : state.status === "missing-key"
          ? "Ce lien d'invitation est incomplet : il lui manque sa clé de lecture. Réclame le lien complet à la personne qui t'a convoqué."
          : state.status === "not-found"
            ? "Cette assemblée est introuvable au registre : jamais existé, ou déjà remisée à la cave."
            : state.status === "bad-key"
              ? "La clé de ce lien n'ouvre pas ce registre : lien tronqué ou périmé. Réclame une invitation fraîche."
              : state.message;

    return (
      <MobilePage className="event-mobile" overlay="deep">
        <MobileHeader eyebrow="Invitation" />
        <section className="sheet">
          <h1 className="h1 h1--sm">Au comptoir, on est formels</h1>
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
  const averageTraquenardLevel = calculateAverageTraquenardLevel(event);
  const traquenardVoteCount = event.participants.filter(
    (participant) => typeof participant.traquenardLevel === "number",
  ).length;
  const canWrite = Boolean(keys.writeKey);
  const canShare = Boolean(aperoId && keys.encryptionKey);
  const inviteUrl = canShare
    ? buildInviteUrl({
        aperoId: aperoId as string,
        encryptionKey: keys.encryptionKey,
        writeKey: keys.writeKey,
      })
    : "";

  // L'organisateur : soit le rôle « creator » du registre local, soit un blaze
  // qui correspond au nom de l'organisateur. Il garde le droit de supprimer.
  const localEntry = aperoId ? findLocalApero(aperoId) : null;
  const isOrganizer =
    localEntry?.role === "creator" ||
    (Boolean(comptoirName) &&
      normalizeMemberName(comptoirName) === normalizeMemberName(event.organizerName));

  const metaText = `Convocation signée ${event.organizerName} · ${event.options.length} créneau${
    event.options.length > 1 ? "x" : ""
  } · ${event.participants.length} réponse${event.participants.length > 1 ? "s" : ""}`;

  return (
    <MobilePage className="event-mobile" overlay="deep">
      <MobileHeader eyebrow="Assemblée" title={event.ceremonialName} meta={metaText} />
      {event.title && <p className="lede">{"« "}{event.title}{" »"}</p>}

      {error && (
        <p className="page-message page-message--error" role="alert">
          {error}
        </p>
      )}
      {feedback && (
        <p className="page-message page-message--success" role="status">
          {feedback}
        </p>
      )}

      <div className="event-stack">
        <MobileResultsPanel event={event} result={result} />

        {traquenardVoteCount > 0 && (
          <section className="sheet">
            <TraquenardGauge level={averageTraquenardLevel} voteCount={traquenardVoteCount} />
          </section>
        )}

        {canWrite ? (
          <>
            <VoteForm event={event} isSaving={isSaving} onSubmit={handleVoteSubmit} showTraquenard />
            <AlternativeOptionForm isSaving={isAddingOption} onSubmit={handleOptionSubmit} />
          </>
        ) : (
          <section className="sheet">
            <p className="lbl">Les créneaux proposés</p>
            <div className="slot-stack">
              {event.options.map((option) => (
                <div className="slot" key={option.id}>
                  <div className="slot__top">
                    <div>
                      <div className="slot__d">{formatOption(option)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="lede">
              Ce lien permet de consulter l'assemblée, mais pas d'y voter : il lui manque la clé
              d'écriture. Réclame le lien complet à la personne qui t'a convoqué.
            </p>
          </section>
        )}

        <EventRegistry
          participants={event.participants}
          showAbsentees={showAbsentees}
          onToggleAbsentees={() => setShowAbsentees((isShown) => !isShown)}
        />

        {canShare && (
          <MobileShareBox
            url={inviteUrl}
            displayUrl={maskInviteUrl(inviteUrl)}
            title={buildShareTitle(event)}
            text={buildShareText(event)}
          />
        )}

        {isOrganizer && canWrite && (
          <button
            type="button"
            className="ghost-link ghost-link--danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Supprimer cet évènement
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
              Es-tu sûr de vouloir supprimer cet évènement ?
            </h2>
            <p className="lede">
              Cette action est définitive : créneaux, réponses, votes et contre-propositions, tout
              part à la cave pour de bon. Pas de session de rattrapage, pas de commission d'appel.
            </p>
            <button
              type="button"
              className="button button--danger button--block"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Radiation…" : "Oui, supprimer définitivement"}
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
