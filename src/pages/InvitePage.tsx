import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { LoadingScreen } from "../components/LoadingScreen";
import { MiniMap } from "../components/MiniMap";
import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";
import { MobileShareBox } from "../components/MobileShareBox";
import { TraquenardGauge } from "../components/TraquenardGauge";
import { useComptoirName } from "../hooks/useComptoirName";
import { AperoApiError } from "../services/aperoApiClient";
import { isValidAperoId } from "../services/aperoCryptoKeys";
import { AperoCryptoError } from "../services/aperoEncryption";
import { getEncryptedAperoById, joinApero } from "../services/encryptedAperoRepository";
import { findLocalApero } from "../services/localAperoRegistry";
import { syncAperoNotificationsFromRegistry } from "../services/notificationSync";
import type { AperitifEvent, ParticipantResponse } from "../types/apero";
import { calculateAverageTraquenardLevel, TRAQUENARD_LEVEL_MAX } from "../utils/calculateResults";
import { createId } from "../utils/createId";
import { formatOption } from "../utils/formatOption";
import { normalizeDisplayName } from "../utils/memberName";
import { buildInviteUrl, maskInviteUrl, resolveInviteKeys } from "../utils/inviteLink";
import { buildShareText, buildShareTitle } from "../utils/shareMessage";

// Page d'invitation du nouveau flux chiffré (mode api-vps).
// Route : #/invite/:aperoId?k=ENCRYPTION_KEY&w=WRITE_KEY — les clés restent
// dans le fragment d'URL et ne sont jamais envoyées à un serveur.
// Version volontairement minimale pour cette étape de migration : lecture,
// déchiffrement, adhésion (nom). Les votes par créneau et contre-propositions
// seront branchés à l'étape suivante.

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
        return "Le comptoir numérique n'est pas encore raccordé (API non configurée). Ta place est notée localement, la réponse partira quand le zinc rouvrira.";
      case "NETWORK_ERROR":
        return "Impossible de joindre le comptoir numérique. Vérifie la connexion et réessaie — ta place reste notée sur cet appareil.";
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
  const [guestName, setGuestName] = useState("");
  const [traquenardVote, setTraquenardVote] = useState(5);
  const [isJoining, setIsJoining] = useState(false);
  const [joinFeedback, setJoinFeedback] = useState("");
  const [joinedLocally, setJoinedLocally] = useState(
    () => Boolean(aperoId && findLocalApero(aperoId)),
  );

  useEffect(() => {
    if (!guestName && comptoirName) {
      setGuestName(comptoirName);
    }
  }, [comptoirName, guestName]);

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

  async function handleJoin(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setJoinFeedback("");

    if (state.status !== "ready" || !aperoId || !keys.encryptionKey || !keys.writeKey) {
      return;
    }

    const normalizedName = normalizeDisplayName(guestName);

    if (!normalizedName) {
      setJoinFeedback("Un blaze, même d'emprunt, est exigé pour émarger au registre.");
      return;
    }

    const now = new Date().toISOString();
    const participant: ParticipantResponse = {
      id: createId("participant"),
      participantName: normalizedName,
      votes: {},
      traquenardLevel: traquenardVote,
      createdAt: now,
      updatedAt: now,
    };

    try {
      setIsJoining(true);
      setComptoirName(normalizedName);
      const updatedEvent = await joinApero(aperoId, keys.writeKey, keys.encryptionKey, participant);
      setJoinedLocally(true);
      setState({ status: "ready", event: updatedEvent });
      // Enregistre l'état vu après adhésion sans se notifier soi-même.
      syncAperoNotificationsFromRegistry(updatedEvent);
      setJoinFeedback("Bien noté au registre. La réponse créneau par créneau arrive bientôt sur cette page.");
    } catch (joinError) {
      // joinApero mémorise l'apéro localement avant l'écriture réseau :
      // l'entrée « Mes apéros » existe donc déjà, on l'assume dans le message.
      setJoinedLocally(Boolean(findLocalApero(aperoId)));
      setJoinFeedback(describeApiError(joinError));
    } finally {
      setIsJoining(false);
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
  const mapOption = event.options.find(
    (option) => option.locationLat != null && option.locationLng != null,
  );
  const averageTraquenardLevel = calculateAverageTraquenardLevel(event);
  const traquenardVoteCount = event.participants.filter(
    (participant) => typeof participant.traquenardLevel === "number",
  ).length;
  const canShare = Boolean(aperoId && keys.encryptionKey);
  const inviteUrl = canShare
    ? buildInviteUrl({
        aperoId: aperoId as string,
        encryptionKey: keys.encryptionKey,
        writeKey: keys.writeKey,
      })
    : "";

  return (
    <MobilePage className="event-mobile" overlay="deep">
      <MobileHeader eyebrow="Invitation" />

      <section className="sheet">
        <p className="eyebrow">
          {event.participants.length} réponse{event.participants.length > 1 ? "s" : ""} au registre
        </p>
        <h1 className="h1 h1--sm">{event.ceremonialName}</h1>
        {event.title && <p className="lede">{"« "}{event.title}{" »"}</p>}
        <p className="meta">Convocation signée {event.organizerName}</p>

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

        {mapOption && (
          <div className="minimap-with-gauge">
            <MiniMap
              lat={mapOption.locationLat as number}
              lng={mapOption.locationLng as number}
              label={mapOption.location}
              address={mapOption.locationAddress}
            />
            <TraquenardGauge level={averageTraquenardLevel} voteCount={traquenardVoteCount} />
          </div>
        )}
      </section>

      {event.participants.length > 0 && (
        <section className="sheet">
          <p className="lbl">Déjà au registre</p>
          {event.participants.map((participant) => (
            <p className="meta" key={participant.id}>
              {participant.participantName}
            </p>
          ))}
        </section>
      )}

      {joinedLocally ? (
        <section className="sheet">
          <p className="lede">
            Cette assemblée est consignée sur ton appareil : tu la retrouveras dans l'agenda du
            comptoir.
          </p>
          {joinFeedback && (
            <p className="feedback" role="status">
              {joinFeedback}
            </p>
          )}
        </section>
      ) : keys.writeKey ? (
        <form className="sheet" onSubmit={handleJoin}>
          <p className="lbl">Émarger au registre</p>
          <label className="field">
            <span>Ton blaze</span>
            <input
              value={guestName}
              onChange={(changeEvent) => setGuestName(changeEvent.target.value)}
              placeholder="Jean-Mi Pastaga, Mémé Cacahuète…"
            />
          </label>

          <label className="field">
            <span>Traquenard-O-mètre : ton pronostic</span>
            <input
              type="range"
              min={0}
              max={TRAQUENARD_LEVEL_MAX}
              step={1}
              value={traquenardVote}
              onChange={(changeEvent) => setTraquenardVote(Number(changeEvent.target.value))}
            />
          </label>
          <p className="hint">
            0 = petite soirée sage, {TRAQUENARD_LEVEL_MAX} = traquenard total. Ton pronostic
            actuel : {traquenardVote}/{TRAQUENARD_LEVEL_MAX}.
          </p>

          <button className="button button--primary button--block" disabled={isJoining}>
            {isJoining ? "Émargement en cours…" : "Rejoindre l'assemblée"}
          </button>
          {joinFeedback && (
            <p className="feedback" role="alert">
              {joinFeedback}
            </p>
          )}
        </form>
      ) : (
        <section className="sheet">
          <p className="lede">
            Ce lien permet de consulter l'assemblée, mais pas d'y émarger : il lui manque la clé
            d'écriture. Réclame le lien complet à la personne qui t'a convoqué.
          </p>
        </section>
      )}

      {canShare && (
        <MobileShareBox
          url={inviteUrl}
          displayUrl={maskInviteUrl(inviteUrl)}
          title={buildShareTitle(event)}
          text={buildShareText(event)}
        />
      )}
    </MobilePage>
  );
}
