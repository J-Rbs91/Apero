import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { AppLink } from "../components/AppLink";
import { useAppNavigation } from "../routes/useAppNavigation";
import { AlternativeOptionForm } from "../components/AlternativeOptionForm";
import { AperoSettingsForm } from "../components/AperoSettingsForm";
import { ComptoirWall } from "../components/ComptoirWall";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { LoadingScreen } from "../components/LoadingScreen";
import { MobileHeader } from "../components/MobileHeader";
import { SlotHead } from "../components/SlotHead";
import { Signature } from "../components/field/Signature";
import { MobilePage } from "../components/MobilePage";
import { MobileResultsPanel } from "../components/MobileResultsPanel";
import { MobileShareBox } from "../components/MobileShareBox";
import { OpenInMapsButton } from "../components/OpenInMapsButton";
import { ParticipantList } from "../components/ParticipantList";
import { TableeAttachSection } from "../components/TableeAttachSection";
import { TraquenardSlider } from "../components/TraquenardGauge";
import { VerdictExportSection } from "../components/VerdictExportSection";
import { VoteForm } from "../components/VoteForm";
import { Disclosure } from "../components/ui";
import { useAperoInvite } from "../hooks/useAperoInvite";
import { useComptoirName } from "../hooks/useComptoirName";
import {
  addEncryptedAperoMessage,
  addEncryptedAperoOption,
  deleteEncryptedApero,
  joinApero,
  toggleEncryptedAperoCheer,
  updateEncryptedAperoSettings,
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
import { readAperoSettings, toggleOptionCheer } from "../utils/eventNormalization";
import type { AperoSettings } from "../utils/eventNormalization";
import { normalizeMemberName } from "../utils/memberName";
import { buildNextRoundPrefill, describeRecurrence } from "../utils/nextRound";
import { buildInviteUrl, maskInviteUrl } from "../utils/inviteLink";
import { buildReminderText, buildShareText, buildShareTitle } from "../utils/shareMessage";

// Page d'invitation du nouveau flux chiffré (mode api-vps).
// Route : #/invite/:aperoId?k=ENCRYPTION_KEY&w=WRITE_KEY — les clés restent
// dans le fragment d'URL et ne sont jamais envoyées à un serveur.
//
// Organisation de la page depuis la refonte : une carte de tête qui dit de
// quoi il s'agit, UN geste attendu (répondre, ou rameuter), le verdict, puis
// tout le second plan rangé dans des volets repliés. Un seul bouton plein par
// écran, et c'est celui qui enregistre.

export function InvitePage() {
  const { aperoId } = useParams<{ aperoId: string }>();
  const { aller } = useAppNavigation();
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
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
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

  async function handleSettingsSubmit(settings: AperoSettings) {
    if (state.status !== "ready" || !aperoId || !keys.writeKey || !keys.encryptionKey) {
      return;
    }

    try {
      setIsSavingSettings(true);
      setError("");
      const updatedEvent = await updateEncryptedAperoSettings(
        aperoId,
        keys.writeKey,
        keys.encryptionKey,
        settings,
      );
      setState({ status: "ready", event: updatedEvent });
      // La tablée engagée est prévenue du changement (politique mioches en
      // tête : elle a pu conditionner les renforts déjà annoncés).
      syncAperoNotificationsFromRegistry(updatedEvent);
    } catch (submitError) {
      // Même contrat que les autres formulaires : l'échec remonte au
      // formulaire, qui garde la saisie et l'explique à hauteur d'yeux.
      throw new Error(describeApiError(submitError));
    } finally {
      setIsSavingSettings(false);
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
      setError("Suppression réservée à l’appareil créateur.");
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
      /* L'apéro supprimé n'existe plus : on REMONTE au programme. Dépiler fait
         partir son entrée avec lui — la remplacer la laisserait accessible au
         geste retour, sur un apéro qui n'est plus là. */
      aller("/agenda");
    } catch (deleteError) {
      hapticError();
      setError(describeApiError(deleteError));
      setIsDeleting(false);
    }
  }

  if (state.status === "loading") {
    return (
      <MobilePage className="event-mobile" header={<MobileHeader eyebrow="Invitation" />}>
        <LoadingScreen heading="h1" title="Chargement" />
      </MobilePage>
    );
  }

  if (state.status !== "ready") {
    const heading =
      state.status === "invalid-id" || state.status === "bad-key"
        ? "Lien invalide"
        : state.status === "missing-key"
          ? "Lien incomplet"
          : state.status === "not-found"
            ? "Apéro introuvable"
            : state.status === "deleted"
              ? "Apéro supprimé"
              : "Erreur";
    const message =
      state.status === "deleted"
        ? "Retiré de cet appareil."
        : state.status === "error"
          ? state.message
          : "";

    return (
      <MobilePage
        className="event-mobile"
        header={<MobileHeader eyebrow="Invitation" />}
        hero={<h1 className="h1 h1--sm">{heading}</h1>}
      >
        <section className="sheet">
          {message && <p className="lede">{message}</p>}
          <AppLink className="button button--ghost button--block" to="/">
            Accueil
          </AppLink>
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
  // Retoucher les réglages : réservé à l'auteur de l'apéro, et seulement tant
  // que l'assemblée est devant nous — on ne réécrit pas une soirée passée.
  const canEditSettings = isOrganizer && Boolean(keys.writeKey) && !isPastEvent;

  const shareBox = canShare ? (
    <MobileShareBox
      url={inviteUrl}
      displayUrl={maskInviteUrl(inviteUrl)}
      title={buildShareTitle(event)}
      text={buildShareText(event)}
      isPrimary={shareFirst}
      reminder={
        isOrganizer
          ? {
              label: "Relancer",
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
      <h2 className="h2">{event.options.length > 1 ? "Créneaux" : "Créneau"}</h2>
      <div className="slot-stack">
        {event.options.map((option) => (
          <div className="slot slot--compact" key={option.id}>
            <SlotHead
              option={option}
              badge={option.id === winnerId ? <span className="agenda-lead">En tête</span> : undefined}
            >
              <div className="slot__p">{option.location}</div>
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
            </SlotHead>
            {(option.cheers?.length ?? 0) > 0 && (
              <span className="cheer-count">
                {option.cheers?.length} soutien{(option.cheers?.length ?? 0) > 1 ? "s" : ""}
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="lede">Lecture seule. Demander le lien complet.</p>
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

  // Toutes les commandes de l'organisateur au même endroit, repliées : elles
  // ne se disputent plus l'écran avec le geste attendu du convive.
  const organizerTools =
    isOrganizer && keys.writeKey ? (
      <Disclosure title="Gestion">
        {canEditSettings && (
          <button
            type="button"
            className="button button--ghost button--block"
            onClick={() => {
              hapticTap();
              setIsEditingSettings(true);
            }}
          >
            Réglages
          </button>
        )}
        <button
          type="button"
          className="button button--danger button--block"
          onClick={() => setShowDeleteConfirm(true)}
        >
          Supprimer l’apéro
        </button>
      </Disclosure>
    ) : null;

  // Tête de page : le nom de l'assemblée proclamé, sa signature, son état.
  const heroBlock = (
    <div className="page-hero">
      <p className="eyebrow">{`Hôte : ${event.organizerName}`}</p>
      <h1 className="h1 h1--sm">{event.ceremonialName}</h1>
      <Signature seed={event.id} />
      {event.title && <p className="lede">{event.title}</p>}
      <p className="factline">
        <span>
          <b>{event.options.length}</b> créneau{event.options.length > 1 ? "x" : ""}
        </span>
        <span>
          <b>{event.participants.length}</b> réponse{event.participants.length > 1 ? "s" : ""}
        </span>
      </p>
      <div className="tagrow">
        {event.childrenAllowed != null && (
          <span className={`tag ${event.childrenAllowed ? "tag--yes" : "tag--no"}`}>
            {event.childrenAllowed ? "Enfants bienvenus" : "Sans enfants"}
          </span>
        )}
        {event.recurrence && <span className="tag">{describeRecurrence(event.recurrence)}</span>}
        {hasLocalEntry && !isPastEvent && <span className="tag">Sur cet appareil</span>}
      </div>
    </div>
  );

  return (
    <MobilePage
      className="event-mobile invite-page"
      header={<MobileHeader eyebrow={isOrganizer ? "Apéro" : "Invitation"} />}
      hero={heroBlock}
    >
      {(error || loadWarning) && (
        <p className="page-message page-message--error" role="alert">
          {error || loadWarning}
        </p>
      )}

      {canEditSettings && (
        // Remonté à chaque enregistrement : rouvrir le formulaire repart
        // toujours des réglages tels qu'ils sont gravés au registre.
        <AperoSettingsForm
          key={event.updatedAt}
          settings={readAperoSettings(event)}
          isOpen={isEditingSettings}
          isSaving={isSavingSettings}
          onClose={() => setIsEditingSettings(false)}
          onSubmit={handleSettingsSubmit}
        />
      )}

      {/* Deux flux qui gardent l'ordre de lecture d'origine : la prochaine
          action et le verdict (flux principal), puis le registre, le mur et
          les outils (flux secondaire). Empilés sur mobile, côte à côte sur
          grand écran. */}
      <div className="invite-grid">
        {isPastEvent ? (
          // ---- Apéro passé : le verdict est servi, la suite est la tournée
          // suivante. Vote, calendrier et partage n'ont plus cours.
          <>
            <div className="invite-main">
              {verdictPanel}

              <section className="sheet">
                <button
                  type="button"
                  className="button button--primary button--block"
                  onClick={() =>
                    aller("/create", { state: { prefill: buildNextRoundPrefill(event) } })
                  }
                >
                  Refaire
                </button>
              </section>
            </div>

            <div className="invite-aside">
              <ParticipantList participants={event.participants} />

              <ComptoirWall
                messages={event.messages ?? []}
                authorName={comptoirName}
                onPost={keys.writeKey ? handlePostMessage : undefined}
                isSaving={isPostingMessage}
              />

              {tableeSection}
            </div>
          </>
        ) : (
          // ---- Apéro à venir : l'ordre suit le lecteur. Organisateur seul →
          // partager ; invité pas voté → voter ; a voté → verdict d'abord.
          <>
            <div className="invite-main">
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

              {!shareFirst && shareBox}
            </div>

            <div className="invite-aside">
              <ParticipantList participants={event.participants} />

              <ComptoirWall
                messages={event.messages ?? []}
                authorName={comptoirName}
                onPost={keys.writeKey ? handlePostMessage : undefined}
                isSaving={isPostingMessage}
              />

              {tableeSection}

              {hasJustVoted && !isOrganizer && (
                <section className="sheet">
                  <AppLink className="button button--ghost button--block" to="/create">
                    Nouvel apéro
                  </AppLink>
                </section>
              )}
            </div>
          </>
        )}
      </div>

      {organizerTools}

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
