import { useEffect, useMemo, useState } from "react";
import { VERRERIE_ECRANS } from "../components/field/verrerieEcrans";
import { AppLink } from "../components/AppLink";
import { useAppNavigation } from "../routes/useAppNavigation";
import { LoadingScreen } from "../components/LoadingScreen";
import { MobileHeader } from "../components/MobileHeader";
import { Signature } from "../components/field/Signature";
import { MobilePage } from "../components/MobilePage";
import { SlotHead } from "../components/SlotHead";
import { TraquenardGauge } from "../components/TraquenardGauge";
import { getAperoStorageMode } from "../config/aperoApiConfig";
import { eventStorage } from "../services";
import { getMyAperos } from "../services/encryptedAperoRepository";
import type { AperitifEvent, AperitifOption } from "../types/apero";
import {
  calculateAverageTraquenardLevel,
  calculateBestOptions,
} from "../utils/calculateResults";
import { buildNextRoundPrefill } from "../utils/nextRound";

function getSlotTime(option: AperitifOption): number {
  if (!option.date || !option.time) {
    return Number.NaN;
  }
  const time = new Date(`${option.date}T${option.time}:00`).getTime();
  return Number.isNaN(time) ? Number.NaN : time;
}

type AgendaItem = {
  event: AperitifEvent;
  upcomingSlots: AperitifOption[];
  earliest: number;
  winnerId?: string;
};

const storageMode = getAperoStorageMode();

// Mode api-vps : « Mes apéros » ne liste plus tout le repo, uniquement les
// apéros créés ou rejoints sur cet appareil (registre local dans le
// localStorage), chargés en lecture publique puis déchiffrés localement.
async function loadMyLocalAperos(): Promise<AperitifEvent[]> {
  const mine = await getMyAperos();
  return mine
    .map((item) => item.event)
    .filter((event): event is AperitifEvent => Boolean(event && event.status === "active"));
}

export function AgendaPage() {
  const { aller } = useAppNavigation();
  const [events, setEvents] = useState<AperitifEvent[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);
        setError("");
        const list =
          storageMode === "api-vps"
            ? await loadMyLocalAperos()
            : await eventStorage.listActiveEvents();
        if (isMounted) {
          setEvents(list);
        }
      } catch {
        if (isMounted) {
          setError("Chargement impossible. Réessayer.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const items = useMemo<AgendaItem[]>(() => {
    if (!events) {
      return [];
    }

    const now = Date.now();

    return events
      .map((event) => {
        const upcomingSlots = event.options
          .filter((option) => {
            const time = getSlotTime(option);
            return !Number.isNaN(time) && time >= now;
          })
          .sort((first, second) => getSlotTime(first) - getSlotTime(second));
        const earliest = upcomingSlots.length ? getSlotTime(upcomingSlots[0]) : Number.POSITIVE_INFINITY;
        const result = calculateBestOptions(event);
        const winnerId = result.type === "winner" ? result.optionId : undefined;

        return { event, upcomingSlots, earliest, winnerId };
      })
      .filter((item) => item.upcomingSlots.length > 0)
      .sort((first, second) => first.earliest - second.earliest);
  }, [events]);

  // Les tournées passées restent sur l'ardoise : c'est là que vit « Remettre
  // ça » — sans quoi un apéro terminé devient un cul-de-sac dès le lendemain.
  const pastItems = useMemo(() => {
    if (!events) {
      return [];
    }
    const now = Date.now();

    return events
      .map((event) => {
        const slotTimes = event.options
          .map(getSlotTime)
          .filter((time) => !Number.isNaN(time));
        const latest = slotTimes.length ? Math.max(...slotTimes) : Number.NaN;
        return { event, latest };
      })
      .filter((item) => !Number.isNaN(item.latest) && item.latest < now)
      .sort((first, second) => second.latest - first.latest);
  }, [events]);

  const hero = (
    <div className="page-hero">
      <h1 className="h1 h1--sm">À venir</h1>
    </div>
  );

  if (isLoading) {
    return (
      <MobilePage
        className="agenda-mobile"
        verrerie={VERRERIE_ECRANS.agenda}
        header={<MobileHeader eyebrow="À venir" />}
        hero={hero}
      >
        <LoadingScreen title="Chargement" />
      </MobilePage>
    );
  }

  return (
    <MobilePage
      className="agenda-mobile"
      verrerie={VERRERIE_ECRANS.agenda}
      header={<MobileHeader eyebrow="À venir" />}
      hero={hero}
    >
      {error ? (
        <section className="sheet">
          <p className="feedback">{error}</p>
        </section>
      ) : items.length === 0 ? (
        <section className="sheet">
          <p className="lede">Aucun apéro.</p>
          <AppLink className="button button--primary button--block" to="/create">
            Nouvel apéro
          </AppLink>
        </section>
      ) : (
        <div className="event-stack event-stack--grid">
          {items.map(({ event, upcomingSlots, winnerId }) => (
            <section className="sheet" key={event.id}>
              <p className="eyebrow">
                {upcomingSlots.length} créneau{upcomingSlots.length > 1 ? "x" : ""} ·{" "}
                {event.participants.length} réponse{event.participants.length > 1 ? "s" : ""}
              </p>
              <h2 className="h2">{event.ceremonialName}</h2>
              <Signature seed={event.id} />
              {event.title && <p className="lede">{event.title}</p>}
              <p className="meta">Hôte : {event.organizerName}</p>

              <div className="slot-stack">
                {upcomingSlots.map((option) => (
                  <div className="slot slot--compact" key={option.id}>
                    <SlotHead option={option} badge={option.id === winnerId ? <span className="agenda-lead">En tête</span> : undefined}>
                      <div className="slot__p">{option.location}</div>
                    </SlotHead>
                  </div>
                ))}
              </div>

              <AppLink
                className="button button--ghost button--block"
                to={
                  storageMode === "api-vps" ? `/invite/${event.id}` : `/event/${event.id}`
                }
              >
                Ouvrir
              </AppLink>

              <TraquenardGauge
                level={calculateAverageTraquenardLevel(event)}
                voteCount={
                  event.participants.filter(
                    (participant) => typeof participant.traquenardLevel === "number",
                  ).length
                }
              />
            </section>
          ))}
        </div>
      )}

      {pastItems.length > 0 && (
        <>
          <section className="sheet">
            <h2 className="h2">Passés</h2>
          </section>
          <div className="event-stack event-stack--grid">
            {pastItems.map(({ event, latest }) => (
              <section className="sheet sheet--past" key={event.id}>
                <p className="eyebrow">
                  {new Intl.DateTimeFormat("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(latest))}{" "}
                  · {event.participants.length} réponse
                  {event.participants.length > 1 ? "s" : ""}
                </p>
                <h2 className="h2">{event.ceremonialName}</h2>
                <div className="button-row">
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={() =>
                      aller("/create", { state: { prefill: buildNextRoundPrefill(event) } })
                    }
                  >
                    Refaire
                  </button>
                  <AppLink
                    className="button button--ghost"
                    to={
                      storageMode === "api-vps" ? `/invite/${event.id}` : `/event/${event.id}`
                    }
                  >
                    Ouvrir
                  </AppLink>
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </MobilePage>
  );
}
