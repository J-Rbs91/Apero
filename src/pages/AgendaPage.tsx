import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LoadingScreen } from "../components/LoadingScreen";
import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";
import { eventStorage } from "../services";
import type { AperitifEvent, AperitifOption } from "../types/apero";
import { calculateBestOptions } from "../utils/calculateResults";

function getSlotTime(option: AperitifOption): number {
  if (!option.date || !option.time) {
    return Number.NaN;
  }
  const time = new Date(`${option.date}T${option.time}:00`).getTime();
  return Number.isNaN(time) ? Number.NaN : time;
}

function formatSlot(option: AperitifOption): string {
  const dateLabel = option.date
    ? new Intl.DateTimeFormat("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }).format(new Date(`${option.date}T00:00:00`))
    : "Date mystère";

  return `${dateLabel} · ${option.time || "?"}`;
}

type AgendaItem = {
  event: AperitifEvent;
  upcomingSlots: AperitifOption[];
  earliest: number;
  winnerId?: string;
};

export function AgendaPage() {
  const [events, setEvents] = useState<AperitifEvent[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);
        setError("");
        const list = await eventStorage.listActiveEvents();
        if (isMounted) {
          setEvents(list);
        }
      } catch {
        if (isMounted) {
          setError(
            "L’ardoise est restée coincée à la cave, on ne sait pas pourquoi, mais réessaie dans un instant, elle finit toujours par remonter.",
          );
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

  if (isLoading) {
    return (
      <MobilePage className="agenda-mobile" overlay="deep">
        <MobileHeader eyebrow="L’agenda du comptoir" />
        <LoadingScreen title="On feuillette l’ardoise" subtitle="La Confrérie sort les apéros à venir…" />
      </MobilePage>
    );
  }

  return (
    <MobilePage className="agenda-mobile" overlay="deep">
      <MobileHeader eyebrow="L’agenda du comptoir" />

      <section className="sheet">
        <h1 className="h1 h1--sm">Les apéros à venir</h1>
        <p className="lede">
          Les assemblées encore debout, celles qui tiennent bon, triées par date la plus proche.
        </p>
      </section>

      {error ? (
        <section className="sheet">
          <p className="feedback">{error}</p>
        </section>
      ) : items.length === 0 ? (
        <section className="sheet">
          <p className="lede">
            L’ardoise est vide, désespérément vide, le comptoir tourne au ralenti dans un silence
            presque inquiétant — à toi de relancer la machine avant que ça devienne
            philosophique.
          </p>
          <Link className="button button--primary button--block" to="/create">
            Convoquer une assemblée
          </Link>
        </section>
      ) : (
        <div className="event-stack">
          {items.map(({ event, upcomingSlots, winnerId }) => (
            <section className="sheet" key={event.id}>
              <p className="eyebrow">
                {upcomingSlots.length} créneau{upcomingSlots.length > 1 ? "x" : ""} ·{" "}
                {event.participants.length} voix
              </p>
              <h2 className="h2">{event.ceremonialName}</h2>
              {event.title && <p className="lede">{"« "}{event.title}{" »"}</p>}
              <p className="meta">par {event.organizerName}</p>

              <div className="slot-stack">
                {upcomingSlots.map((option) => (
                  <div className="slot" key={option.id}>
                    <div className="slot__top">
                      <div>
                        <div className="slot__d">{formatSlot(option)}</div>
                        <div className="slot__p">{option.location}</div>
                      </div>
                      {option.id === winnerId && <span className="agenda-lead">En tête</span>}
                    </div>
                  </div>
                ))}
              </div>

              <Link className="button button--ghost button--block" to={`/event/${event.id}`}>
                Voir l’assemblée
              </Link>
            </section>
          ))}
        </div>
      )}
    </MobilePage>
  );
}
