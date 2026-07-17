import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlternativeOptionForm } from "../components/AlternativeOptionForm";
import { ComptoirWall } from "../components/ComptoirWall";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { LoadingScreen } from "../components/LoadingScreen";
import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";
import { MobileResultsPanel } from "../components/MobileResultsPanel";
import { MobileShareBox } from "../components/MobileShareBox";
import { OpenInMapsButton } from "../components/OpenInMapsButton";
import { ParticipantList } from "../components/ParticipantList";
import { TableeAttachSection } from "../components/TableeAttachSection";
import { TraquenardSlider } from "../components/TraquenardGauge";
import { VerdictExportSection } from "../components/VerdictExportSection";
import { VoteForm } from "../components/VoteForm";
import { useAperoInvite } from "../hooks/useAperoInvite";
import { useComptoirName } from "../hooks/useComptoirName";
import {
  addEncryptedAperoMessage,
  addEncryptedAperoOption,
  deleteEncryptedApero,
  joinApero,
  toggleEncryptedAperoCheer,
} from "../services/encryptedAperoRepository";
import { findLocalApero } from "../services/localAperoRegistry";
import { syncAperoNotificationsFromRegistry } from "../services/notificationSync";
import { removeSnapshot } from "../services/notificationSnapshots";
import { removeNotificationsForApero } from "../services/notificationStore";
import type { AperitifOption, ParticipantResponse } from "../types/apero";
import { describeApiError } from "../utils/apiErrorMessages";
import { createId } from "../utils/createId";
import { hapticError, hapticSuccess, hapticTap } from "../utils/haptics";
import { isEventExpired } from "../services/eventPurge";
import { calculateBestOptions } from "../utils/calculateResults";
import { formatOption } from "../utils/formatOption";
import { toggleOptionCheer } from "../utils/eventNormalization";
import { normalizeMemberName } from "../utils/memberName";
import { buildNextRoundPrefill, describeRecurrence } from "../utils/nextRound";
import { buildInviteUrl, maskInviteUrl } from "../utils/inviteLink";
import { buildReminderText, buildShareText, buildShareTitle } from "../utils/shareMessage";

// Page d'invitation du nouveau flux chiffré (mode api-vps).
// Route : #/invite/:aperoId?k=ENCRYPTION_KEY&w=WRITE_KEY — les clés restent
// dans le fragment d'URL et ne sont jamais envoyées à un serveur.
// Le chargement (clés, déchiffrement, états d'échec) vit dans useAperoInvite ;
// cette page ne raconte que les gestes du convive et la mise en page.

export function InvitePage() {
  const { aperoId } = useParams<{ aperoId: string }>();
  const navigate = useNavigate();
  const { comptoirName, setComptoirName } = useComptoirName();
  const { state, setState, keys, loadWarning, hasLocalEntry, setHasLocalEntry } =
    useAperoInvite(aperoId);

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState("");
  // Vrai juste après l'envoi d'une réponse : c'est LE moment où l'on propose
  // au convive de convoquer à son tour sa propre assemblée (boucle vertueuse).
  const [hasJustVoted, setHasJustVoted] = useState(false);
  // L'ordre vote/verdict se décide à l'arrivée sur la page et n'en bouge
  // plus : voter ne doit pas faire sauter la mise en page sous le pouce
  // (et un remontage du formulaire perdrait son état). Déclaré ici, avant
  // les retours anticipés, pour respecter l'ordre des hooks ; initialisé
  // plus bas, une fois l'apéro déchiffré.
  const voteFirstRef = useRef<{ aperoId: string | undefined; voteFirst: boolean } | null>(null);

  // Le pronostic déjà gravé au registre réapparaît sur la jauge : sans ça, un
  // simple « Modifier ma réponse » dans une session où le curseur n'a pas été
  // touché écraserait silencieusement le pronostic précédent.
  useEffect(() => {
    if (state.status !== "ready") {
      return;
    }
    setTraquenardVote((currentVote) => {
      if (currentVote !== null) {
        return currentVote;
      }
      const myKey = normalizeMemberName(comptoirName);
      const mine = myKey
        ? state.event.participants.find(
            (participant) => normalizeMemberName(participant.participantName) === myKey,
          )
        : undefined;
      return mine?.traquenardLevel ?? null;
    });
  }, [state, comptoirName]);

  async function handleVoteSubmit(response: ParticipantResponse) {
    if (state.status !== "ready" || !aperoId || !keys.writeKey || !keys.encryptionKey) {
      return;
    }

    // Curseur pas touché dans cette session → on conserve le pronostic déjà
    // au registre plutôt que de l'effacer (upsertParticipant remplace tout).
    const responseKey = normalizeMemberName(response.participantName);
    const registeredParticipant = state.event.participants.find(
      (participant) => normalizeMemberName(participant.participantName) === responseKey,
    );
    const finalResponse: ParticipantResponse = {
      ...response,
      traquenardLevel: traquenardVote ?? registeredParticipant?.traquenardLevel,
    };

    try {
      setIsSaving(true);
      setError("");
      const updatedEvent = await joinApero(aperoId, keys.writeKey, keys.encryptionKey, finalResponse);
      // On mémorise le blaze utilisé (une fois la réponse acceptée : jamais un
      // blaze que le registre vient de refuser) : les notifications s'appuient
      // dessus pour reconnaître « moi » et éviter l'auto-notification.
      setComptoirName(finalResponse.participantName);
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
    hapticTap();
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
      hapticError();
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
      hapticSuccess();
      navigate("/agenda", { replace: true });
    } catch (deleteError) {
      hapticError();
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

  // Gel de l'ordre vote/verdict pour cette visite (voir déclaration du ref).
  if (voteFirstRef.current === null || voteFirstRef.current.aperoId !== aperoId) {
    voteFirstRef.current = { aperoId, voteFirst: !hasVoted };
  }
  const voteFirst = voteFirstRef.current.voteFirst;

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

  const tableeSection = aperoId ? (
    <TableeAttachSection aperoId={aperoId} keys={keys} event={event} comptoirName={comptoirName} />
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

      {(error || loadWarning) && (
        <p className="page-message page-message--error" role="alert">
          {error || loadWarning}
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

          {voteFirst && keys.writeKey ? (
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
            <VerdictExportSection
              event={event}
              winnerOption={winnerOption}
              result={result}
              inviteUrl={canShare ? inviteUrl : undefined}
            />
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

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        eyebrow="Annuler l’apéro"
        title="On raye tout, vraiment ?"
        body="Créneaux, réponses, votes et contre-propositions : tout part au vide-cave, et le vide-cave ne rend rien."
        cancelLabel="Non, je le garde"
        confirmLabel="Oui, tout rayer"
        busyLabel="On raye…"
        isBusy={isDeleting}
        error={error || undefined}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
      />
    </MobilePage>
  );
}
