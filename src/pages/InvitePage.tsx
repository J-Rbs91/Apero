import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { AlternativeOptionForm } from "../components/AlternativeOptionForm";
import { LoadingScreen } from "../components/LoadingScreen";
import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";
import { MobileResultsPanel } from "../components/MobileResultsPanel";
import { MobileShareBox } from "../components/MobileShareBox";
import { ParticipantList } from "../components/ParticipantList";
import { TraquenardGauge } from "../components/TraquenardGauge";
import { VoteForm } from "../components/VoteForm";
import { AperoApiError } from "../services/aperoApiClient";
import { isValidAperoId } from "../services/aperoCryptoKeys";
import { AperoCryptoError } from "../services/aperoEncryption";
import {
  getEncryptedAperoById,
  joinApero,
  updateEncryptedApero,
} from "../services/encryptedAperoRepository";
import { findLocalApero } from "../services/localAperoRegistry";
import type { AperitifEvent, AperitifOption, ParticipantResponse } from "../types/apero";
import {
  calculateAverageTraquenardLevel,
  calculateBestOptions,
  TRAQUENARD_LEVEL_MAX,
} from "../utils/calculateResults";
import { appendEventOption } from "../utils/eventNormalization";
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
        return "Ce lien ne permet pas de répondre ici. Vérifie qu’il est complet.";
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

  // Clés : d'abord le lien (fragment), sinon l'appareil (apéro déjà créé ou
  // déjà accepté sur cet appareil).
  const keys = useMemo(() => {
    const fromLink = resolveInviteKeys(location.search);
    const localEntry = aperoId ? findLocalApero(aperoId) : null;

    return {
      encryptionKey: fromLink.encryptionKey ?? localEntry?.encryptionKey,
      writeKey: fromLink.writeKey ?? localEntry?.writeKey,
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
  const [isAddingOption, setIsAddingOption] = useState(false);
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
            setState({ status: "not-found" });
          }
          // Sinon : on vient de créer cet apéro, la lecture publique GitHub
          // peut être en retard sur l'écriture — on garde la version fraîche
          // en mémoire plutôt que d'afficher « introuvable ».
          return;
        }

        setState({ status: "ready", event: loaded.event });
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        if (loadError instanceof AperoCryptoError) {
          setState({ status: "bad-key" });
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
      const updatedEvent = await joinApero(aperoId, keys.writeKey, keys.encryptionKey, finalResponse);
      setState({ status: "ready", event: updatedEvent });
      setHasLocalEntry(true);
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
      const updatedEvent = await updateEncryptedApero(
        aperoId,
        keys.writeKey,
        keys.encryptionKey,
        (currentEvent) => appendEventOption(currentEvent, option),
      );
      setState({ status: "ready", event: updatedEvent });
    } catch (submitError) {
      setError(describeApiError(submitError));
    } finally {
      setIsAddingOption(false);
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
            : state.status === "bad-key"
              ? "Cette clé n’ouvre pas cet apéro : lien tronqué ou périmé. Demande une invitation fraîche."
              : state.message;

    return (
      <MobilePage className="event-mobile" overlay="deep">
        <MobileHeader eyebrow="Invitation" />
        <section className="sheet">
          <h1 className="h1 h1--sm">Aïe, ce lien coince</h1>
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
        <p className="eyebrow">Une invitation de {event.organizerName}</p>
        <h1 className="h1 h1--sm">{event.ceremonialName}</h1>
        {event.title && <p className="lede">{"« "}{event.title}{" »"}</p>}
        {hasLocalEntry && (
          <p className="meta">C’est noté : tu retrouveras cet apéro dans ton agenda sur cet appareil.</p>
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
            extraFields={
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
                <span className="hint">
                  0 = petite soirée sage, {TRAQUENARD_LEVEL_MAX} = grand n’importe quoi. Pour
                  l’instant : {traquenardVote}/{TRAQUENARD_LEVEL_MAX}.
                </span>
              </label>
            }
          />
          <AlternativeOptionForm isSaving={isAddingOption} onSubmit={handleOptionSubmit} />
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

      <section className="sheet" style={{ display: "flex", justifyContent: "center" }}>
        <TraquenardGauge level={averageTraquenardLevel} voteCount={traquenardVoteCount} />
      </section>

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
