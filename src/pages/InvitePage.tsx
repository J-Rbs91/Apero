import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { AlternativeOptionForm } from "../components/AlternativeOptionForm";
import { ComptoirWall } from "../components/ComptoirWall";
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
  addEncryptedAperoMessage,
  addEncryptedAperoOption,
  deleteEncryptedApero,
  getCachedAperoEvent,
  getEncryptedAperoById,
  joinApero,
  purgeDeletedApero,
  toggleEncryptedAperoCheer,
} from "../services/encryptedAperoRepository";
import { findLocalApero } from "../services/localAperoRegistry";
import { getLocalTablees } from "../services/localTableeRegistry";
import { addAperoToTablee } from "../services/tableeRepository";
import { syncAperoNotificationsFromRegistry } from "../services/notificationSync";
import { removeSnapshot } from "../services/notificationSnapshots";
import {
  hasAperoDeletedNotification,
  removeNotificationsForApero,
} from "../services/notificationStore";
import type { AperitifEvent, AperitifOption, ParticipantResponse } from "../types/apero";
import { createId } from "../utils/createId";
import { isEventExpired } from "../services/eventPurge";
import { calculateAverageTraquenardLevel, calculateBestOptions } from "../utils/calculateResults";
import { downloadAperoIcs } from "../utils/calendarExport";
import { shareOrDownloadVerdictImage } from "../utils/verdictImage";
import { formatOption } from "../utils/formatOption";
import { toggleOptionCheer } from "../utils/eventNormalization";
import { normalizeMemberName } from "../utils/memberName";
import { buildNextRoundPrefill, describeRecurrence } from "../utils/nextRound";
import { buildInviteUrl, maskInviteUrl, resolveInviteKeys } from "../utils/inviteLink";
import { buildReminderText, buildShareText, buildShareTitle } from "../utils/shareMessage";

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
  // Null tant que le curseur n'a pas été touché : pas de pronostic « moyen »
  // gravé d'office — la moyenne de la tablée ne compte que les vrais avis.
  const [traquenardVote, setTraquenardVote] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isProposingSlot, setIsProposingSlot] = useState(false);
  const [isAddingOption, setIsAddingOption] = useState(false);
  // Créneau dont le trinquer est en cours d'envoi. L'UI, elle, a déjà levé
  // le verre : l'application locale est optimiste, le réseau suit.
  const [cheerPendingId, setCheerPendingId] = useState<string | null>(null);
  const [isPostingMessage, setIsPostingMessage] = useState(false);
  const [verdictShareFeedback, setVerdictShareFeedback] = useState("");
  // Tablées connues de cet appareil, pour rattacher l'apéro à une bande.
  const [localTablees] = useState(() => getLocalTablees());
  const [selectedTableeId, setSelectedTableeId] = useState("");
  const [tableeFeedback, setTableeFeedback] = useState("");
  const [isAttachingTablee, setIsAttachingTablee] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  const [hasLocalEntry, setHasLocalEntry] = useState(
    () => Boolean(aperoId && findLocalApero(aperoId)),
  );
  // Vrai juste après l'envoi d'une réponse : c'est LE moment où l'on propose
  // au convive de convoquer à son tour sa propre assemblée (boucle vertueuse).
  const [hasJustVoted, setHasJustVoted] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!aperoId || !isValidAperoId(aperoId)) {
        setState({ status: "invalid-id" });
        return;
      }

      // Apéro annulé dont les traces locales ont déjà été purgées (clés
      // comprises) : le dire clairement AVANT de conclure à un lien incomplet,
      // sinon on pousse l'invité à réclamer un lien vers un apéro disparu.
      if (hasAperoDeletedNotification(aperoId)) {
        setState({ status: "deleted" });
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

    const finalResponse: ParticipantResponse = {
      ...response,
      traquenardLevel: traquenardVote ?? undefined,
    };

    try {
      setIsSaving(true);
      setError("");
      // On mémorise le blaze utilisé : les notifications s'appuient dessus pour
      // reconnaître « moi » et éviter de m'auto-notifier de mes propres actions.
      setComptoirName(finalResponse.participantName);
      const updatedEvent = await joinApero(aperoId, keys.writeKey, keys.encryptionKey, finalResponse);
      setState({ status: "ready", event: updatedEvent });
      setHasLocalEntry(true);
      setHasJustVoted(true);
      syncAperoNotificationsFromRegistry(updatedEvent);
    } catch (submitError) {
      // L'échec remonte au formulaire : c'est lui qui parle à hauteur d'yeux
      // et qui garde la saisie. Jamais de « merci » sur un vote qui a raté.
      throw new Error(describeApiError(submitError));
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
      // Même contrat que le vote : l'échec remonte au formulaire de
      // contre-proposition, qui garde la saisie au lieu de se vider.
      throw new Error(describeApiError(submitError));
    } finally {
      setIsAddingOption(false);
    }
  }

  async function handleToggleCheer(optionId: string) {
    const cheerName = comptoirName.trim();
    if (
      state.status !== "ready" ||
      !aperoId ||
      !keys.writeKey ||
      !keys.encryptionKey ||
      !cheerName ||
      cheerPendingId
    ) {
      return;
    }

    // Optimiste : le verre se lève à l'instant du tap ; le réseau confirme
    // derrière, et en cas de raté on repose le verre tel qu'il était.
    const previousEvent = state.event;
    setState({ status: "ready", event: toggleOptionCheer(previousEvent, optionId, cheerName) });
    setCheerPendingId(optionId);
    setError("");

    try {
      const updatedEvent = await toggleEncryptedAperoCheer(
        aperoId,
        keys.writeKey,
        keys.encryptionKey,
        optionId,
        cheerName,
      );
      setState({ status: "ready", event: updatedEvent });
      syncAperoNotificationsFromRegistry(updatedEvent);
    } catch (submitError) {
      setState({ status: "ready", event: previousEvent });
      setError(describeApiError(submitError));
    } finally {
      setCheerPendingId(null);
    }
  }

  async function handlePostMessage(body: string) {
    const authorName = comptoirName.trim();
    if (state.status !== "ready" || !aperoId || !keys.writeKey || !keys.encryptionKey || !authorName) {
      return;
    }

    try {
      setIsPostingMessage(true);
      const updatedEvent = await addEncryptedAperoMessage(aperoId, keys.writeKey, keys.encryptionKey, {
        id: createId("message"),
        authorName,
        body,
        createdAt: new Date().toISOString(),
      });
      setState({ status: "ready", event: updatedEvent });
      syncAperoNotificationsFromRegistry(updatedEvent);
    } finally {
      setIsPostingMessage(false);
    }
  }

  async function handleAttachToTablee() {
    if (state.status !== "ready" || !aperoId || !keys.encryptionKey || !selectedTableeId) {
      return;
    }
    const tableeEntry = localTablees.find((entry) => entry.tableeId === selectedTableeId);
    if (!tableeEntry) {
      return;
    }

    try {
      setIsAttachingTablee(true);
      setTableeFeedback("");
      await addAperoToTablee(tableeEntry.tableeId, tableeEntry.writeKey, tableeEntry.encryptionKey, {
        aperoId,
        encryptionKey: keys.encryptionKey,
        writeKey: keys.writeKey,
        ceremonialName: state.event.ceremonialName,
        addedBy: comptoirName.trim() || undefined,
      });
      setTableeFeedback(
        `C’est gravé : cet apéro rejoint les annales de « ${tableeEntry.name ?? "la tablée"} ».`,
      );
    } catch {
      setTableeFeedback("Le rattachement a capoté. Réessaie dans un instant.");
    } finally {
      setIsAttachingTablee(false);
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

  // Le rôle et l'état du lecteur pilotent l'ordre de la page : la prochaine
  // action est toujours le premier bloc atteignable, sans consigne à lire.
  const organizerKey = normalizeMemberName(event.organizerName);
  const guests = event.participants.filter(
    (participant) => normalizeMemberName(participant.participantName) !== organizerKey,
  );
  // L'auto-vote de l'organisateur ne fait pas un verdict : tant que la tablée
  // n'a pas émargé, le comptoir délibère et rien n'est proclamé.
  const hasGuestResponses = guests.length > 0;
  const myKey = normalizeMemberName(comptoirName);
  const hasVoted = Boolean(
    myKey &&
      event.participants.some(
        (participant) => normalizeMemberName(participant.participantName) === myKey,
      ),
  );

  const winnerId =
    hasGuestResponses && result.type === "winner" ? result.optionId : undefined;
  const winnerOption = winnerId
    ? event.options.find((option) => option.id === winnerId)
    : undefined;
  const canExportToCalendar = Boolean(winnerOption?.date && winnerOption.time);
  // Apéro passé : place à la tournée suivante — n'importe quel membre de la
  // tablée peut la convoquer, c'est ainsi que le rôle tourne.
  const isPastEvent = isEventExpired(event, new Date());
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
  // L'organisateur seul au registre : sa prochaine action est de rameuter,
  // le partage prend la tête de page.
  const shareFirst = isOrganizer && !hasGuestResponses && !isPastEvent && canShare;

  const shareBox = canShare ? (
    <MobileShareBox
      url={inviteUrl}
      displayUrl={maskInviteUrl(inviteUrl)}
      title={buildShareTitle(event)}
      text={buildShareText(event)}
      reminder={
        isOrganizer
          ? {
              label: "Sonner le rappel",
              title: buildShareTitle(event),
              text: buildReminderText(event),
            }
          : undefined
      }
    />
  ) : null;

  const voteBlock = keys.writeKey ? (
    <>
      <VoteForm
        event={event}
        isSaving={isSaving}
        onSubmit={handleVoteSubmit}
        leadingOptionId={winnerId}
        onProposeSlot={() => setIsProposingSlot(true)}
        childrenAllowed={event.childrenAllowed}
        onToggleCheer={comptoirName.trim() ? handleToggleCheer : undefined}
        hasCheeredOption={(optionId) => {
          const cheerKey = normalizeMemberName(comptoirName);
          const option = event.options.find((candidate) => candidate.id === optionId);
          return Boolean(
            cheerKey &&
              option?.cheers?.some((name) => normalizeMemberName(name) === cheerKey),
          );
        }}
        cheerPendingOptionId={cheerPendingId}
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
            {(option.cheers?.length ?? 0) > 0 && (
              <span className="cheer-count">
                {option.cheers?.length} verre{(option.cheers?.length ?? 0) > 1 ? "s" : ""} levé
                {(option.cheers?.length ?? 0) > 1 ? "s" : ""}
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="lede">
        Ce lien permet de consulter l’apéro, mais pas d’y répondre : il manque la clé
        d’écriture. Demande le lien complet à la personne qui t’a invité·e.
      </p>
    </section>
  );

  const verdictPanel = (
    <MobileResultsPanel
      event={event}
      result={result}
      awaitingGuests={!hasGuestResponses}
      isPast={isPastEvent}
    />
  );

  const tableeSection = keys.encryptionKey ? (
    <section className="sheet">
      <p className="eyebrow">La Tablée</p>
      {localTablees.length > 0 ? (
        <>
          <p className="lede">
            Rattache cet apéro aux annales d’une de tes tablées : la bande le
            retrouvera avec le reste de son histoire.
          </p>
          <label className="field">
            <span>Choisir la tablée</span>
            <select
              value={selectedTableeId}
              onChange={(eventChange) => setSelectedTableeId(eventChange.target.value)}
            >
              <option value="">— Choisir —</option>
              {localTablees.map((entry) => (
                <option value={entry.tableeId} key={entry.tableeId}>
                  {entry.name ?? entry.tableeId}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="button button--ghost button--block"
            onClick={handleAttachToTablee}
            disabled={!selectedTableeId || isAttachingTablee}
          >
            {isAttachingTablee ? "On grave aux annales…" : "Rattacher à cette tablée"}
          </button>
        </>
      ) : (
        <>
          <p className="lede">
            Cette bande mérite mieux qu’un apéro sans lendemain : fonde une tablée,
            la troupe du registre sera attablée d’office.
          </p>
          <button
            type="button"
            className="button button--ghost button--block"
            onClick={() =>
              navigate("/tablees", {
                state: {
                  seedFromApero: {
                    aperoId,
                    encryptionKey: keys.encryptionKey,
                    writeKey: keys.writeKey,
                    ceremonialName: event.ceremonialName,
                    memberNames: event.participants.map(
                      (participant) => participant.participantName,
                    ),
                  },
                },
              })
            }
          >
            Fonder une tablée avec cette bande
          </button>
        </>
      )}
      {tableeFeedback && (
        <p className="meta" role="status">
          {tableeFeedback}
        </p>
      )}
    </section>
  ) : null;

  return (
    <MobilePage className="event-mobile" overlay="deep">
      <MobileHeader eyebrow={isOrganizer ? "Ta convocation" : "Invitation"} />

      <section className="sheet">
        <p className="eyebrow">
          {isOrganizer ? "Ton assemblée" : `Une invitation de ${event.organizerName}`}
        </p>
        <h1 className="h1 h1--sm">{event.ceremonialName}</h1>
        {event.title && <p className="lede">{"« "}{event.title}{" »"}</p>}
        {event.childrenAllowed != null && (
          <span className={`tag ${event.childrenAllowed ? "tag--yes" : "tag--no"}`}>
            {event.childrenAllowed ? "Marmaille admise" : "Sans les mioches"}
          </span>
        )}
        {event.recurrence && (
          <p className="meta">Assemblée récurrente : {describeRecurrence(event.recurrence)}.</p>
        )}
        {hasLocalEntry && !isPastEvent && (
          <p className="meta">C’est gravé sur ton ardoise.</p>
        )}
      </section>

      {error && (
        <p className="page-message page-message--error" role="alert">
          {error}
        </p>
      )}

      {isPastEvent ? (
        // ---- Apéro passé : le verdict est servi, la suite est la tournée
        // suivante. Vote, calendrier et partage n'ont plus cours.
        <>
          {verdictPanel}

          <section className="sheet">
            <p className="eyebrow">{event.recurrence ? "La tournée suivante" : "Remettre ça"}</p>
            <h2 className="h2">
              {event.recurrence
                ? "Cette assemblée se répète, le rituel n’attend pas."
                : "Cet apéro est derrière nous."}
            </h2>
            <p className="lede">
              {event.recurrence
                ? `La cadence est gravée : ${describeRecurrence(event.recurrence)}. Le rituel n’attend que ta convocation.`
                : "Les verres sont secs, le zinc est rangé. La suite logique : la même chose, un peu plus tard — et n’importe quel membre de la tablée peut convoquer la prochaine."}
            </p>
            <button
              type="button"
              className="button button--primary button--block"
              onClick={() =>
                navigate("/create", { state: { prefill: buildNextRoundPrefill(event) } })
              }
            >
              {event.recurrence ? "Convoquer la prochaine tournée" : "Remettre ça"}
            </button>
          </section>

          <ParticipantList participants={event.participants} />

          <ComptoirWall
            messages={event.messages ?? []}
            authorName={comptoirName}
            onPost={keys.writeKey ? handlePostMessage : undefined}
            isSaving={isPostingMessage}
          />

          {tableeSection}
        </>
      ) : (
        // ---- Apéro à venir : l'ordre suit le lecteur. Organisateur seul →
        // partager ; invité pas voté → voter ; a voté → verdict d'abord.
        <>
          {shareFirst && shareBox}

          {!hasVoted && keys.writeKey ? (
            <>
              {voteBlock}
              {verdictPanel}
            </>
          ) : (
            <>
              {verdictPanel}
              {voteBlock}
            </>
          )}

          {hasGuestResponses && canExportToCalendar && winnerOption && (
            <section className="sheet">
              <p className="eyebrow">Graver au registre</p>
              <p className="lede">
                Le verdict est tombé : grave-le avant qu’il ne s’évapore entre deux tournées.
              </p>
              <button
                type="button"
                className="button button--ghost button--block"
                onClick={() =>
                  downloadAperoIcs({
                    event,
                    option: winnerOption,
                    inviteUrl: canShare ? inviteUrl : undefined,
                  })
                }
              >
                Graver dans mon calendrier
              </button>
              <button
                type="button"
                className="button button--ghost button--block"
                onClick={async () => {
                  setVerdictShareFeedback("");
                  const winnerCounts = result.results.find(
                    (item) => item.optionId === winnerOption.id,
                  );
                  const outcome = await shareOrDownloadVerdictImage(
                    {
                      event,
                      option: winnerOption,
                      counts: {
                        yes: winnerCounts?.yesCount ?? 0,
                        maybe: winnerCounts?.maybeCount ?? 0,
                        no: winnerCounts?.noCount ?? 0,
                      },
                      traquenardAverage: calculateAverageTraquenardLevel(event),
                    },
                    "tableau-de-chasse.png",
                  );
                  setVerdictShareFeedback(
                    outcome === "failed"
                      ? "L’image n’a pas voulu sortir du cadre. Réessaie dans un instant."
                      : outcome === "downloaded"
                        ? "Tableau de chasse téléchargé : il n’attend plus que la conversation."
                        : "",
                  );
                }}
              >
                Partager le tableau de chasse
              </button>
              {verdictShareFeedback && (
                <p className="meta" role="status">
                  {verdictShareFeedback}
                </p>
              )}
            </section>
          )}

          <ParticipantList participants={event.participants} />

          <ComptoirWall
            messages={event.messages ?? []}
            authorName={comptoirName}
            onPost={keys.writeKey ? handlePostMessage : undefined}
            isSaving={isPostingMessage}
          />

          {tableeSection}

          {!shareFirst && shareBox}

          {hasJustVoted && !isOrganizer && (
            <section className="sheet">
              <p className="eyebrow">À ton tour</p>
              <p className="lede">
                Une assemblée, deux créneaux, un lien : tu sais tout. La Confrérie
                n’attend plus que ta convocation.
              </p>
              <Link className="button button--ghost button--block" to="/create">
                Organiser mon propre apéro
              </Link>
            </section>
          )}
        </>
      )}

      {isOrganizer && keys.writeKey && (
        <button
          type="button"
          className="ghost-link ghost-link--danger"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Annuler l’apéro
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
              On raye tout, vraiment ?
            </h2>
            <p className="lede">
              Créneaux, réponses, votes et contre-propositions : tout part au vide-cave,
              et le vide-cave ne rend rien.
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
                {isDeleting ? "On raye…" : "Oui, tout rayer"}
              </button>
            </div>
            {error && <p className="feedback">{error}</p>}
          </section>
        </div>
      )}
    </MobilePage>
  );
}
