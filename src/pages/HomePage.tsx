import { useEffect, useState } from "react";
import { AppLink } from "../components/AppLink";
import { BrandMenu } from "../components/BrandMenu";
import { ComptoirField, type ConstellationPoint } from "../components/field/ComptoirField";
import { Signature } from "../components/field/Signature";
import { MobilePage } from "../components/MobilePage";
import { eventStorage } from "../services";
import { getCachedAperoEvent } from "../services/encryptedAperoRepository";
import { getLocalAperos } from "../services/localAperoRegistry";
import type { AperitifEvent } from "../types/apero";
import { buildInvitePath } from "../utils/inviteLink";
import { calculateBestOptions } from "../utils/calculateResults";

// « Continuer » avant « Nouvelle partie » : si l'appareil connaît un apéro à
// venir, l'accueil le montre en premier — l'habitué reprend sa partie en un
// tap, sans passer par le menu. Tout vient du cache local : rendu instantané.
type NextApero = {
  aperoId: string;
  event: AperitifEvent;
  path: string;
  startMs: number;
  isDecided: boolean;
};

function findNextApero(): NextApero | null {
  const now = Date.now();
  let next: NextApero | null = null;

  for (const entry of getLocalAperos()) {
    const event = getCachedAperoEvent(entry.aperoId);
    if (!event || event.status !== "active") {
      continue;
    }

    const upcoming = event.options
      .map((option) =>
        option.date && option.time
          ? new Date(`${option.date}T${option.time}:00`).getTime()
          : Number.NaN,
      )
      .filter((ms) => !Number.isNaN(ms) && ms >= now)
      .sort((a, b) => a - b);

    if (upcoming.length === 0) {
      continue;
    }

    if (!next || upcoming[0] < next.startMs) {
      const result = calculateBestOptions(event);
      next = {
        aperoId: entry.aperoId,
        event,
        path: buildInvitePath(entry.aperoId, {
          encryptionKey: entry.encryptionKey,
          writeKey: entry.writeKey,
        }),
        startMs: upcoming[0],
        isDecided: result.type === "winner",
      };
    }
  }

  return next;
}

// La constellation de l'accueil : un point par apéro que l'appareil connaît
// (premier créneau, nombre de réponses), le prochain rendez-vous en jaune.
// Rien d'autre n'est lu ; sans apéro, la figure garde un seul point jaune.
function collectConstellation(nextId: string | undefined): ConstellationPoint[] {
  const points: ConstellationPoint[] = [];
  for (const entry of getLocalAperos()) {
    const event = getCachedAperoEvent(entry.aperoId);
    if (!event || event.status !== "active") {
      continue;
    }
    const first = event.options
      .map((option) =>
        option.date ? new Date(`${option.date}T${option.time || "00:00"}:00`).getTime() : Number.NaN,
      )
      .filter((ms) => !Number.isNaN(ms))
      .sort((a, b) => a - b)[0];
    if (first === undefined) {
      continue;
    }
    points.push({
      id: entry.aperoId,
      at: first,
      responses: event.participants.length,
      isNext: entry.aperoId === nextId,
    });
  }
  return points;
}

function formatNextDate(startMs: number): string {
  const label = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(startMs));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function HomePage() {
  // Lecture synchrone du cache local : l'écran est complet au premier paint.
  const [nextApero] = useState(findNextApero);
  const [now] = useState(() => Date.now());
  const [constellation] = useState(() => collectConstellation(nextApero?.aperoId));

  useEffect(() => {
    eventStorage.purgeExpiredEvents().catch(() => {
      // La purge ne doit pas empêcher l’accueil de s’afficher.
    });
  }, []);

  return (
    <MobilePage
      className="home-mobile"
      header={<BrandMenu />}
      hero={
        <div className="sign">
          {/* Un apéro en cours passe devant : c'est la seule chose qui attend une
              action de la part de l'habitué qui rouvre l'app. */}
          {nextApero && (
            <section className="sheet sheet--hero nextapero">
              <p className="eyebrow">
                {nextApero.isDecided ? "Prochain" : "En cours"}
              </p>
              <h2 className="h2">{nextApero.event.ceremonialName}</h2>
              <Signature seed={nextApero.aperoId} />
              <p className="factline">
                <span>{formatNextDate(nextApero.startMs)}</span>
                <span>
                  <b>{nextApero.event.participants.length}</b> réponse
                  {nextApero.event.participants.length > 1 ? "s" : ""}
                </span>
              </p>
              <AppLink className="button button--primary button--block" to={nextApero.path}>
                Ouvrir
              </AppLink>
            </section>
          )}

          {/* La constellation : les apéros de cet appareil, ou le récipient
              vide qui attend d'être rempli. */}
          <div className="sign__field">
            <ComptoirField points={constellation} now={now} />
          </div>

          <div className="sign__text">
            <h1 className="h1">
              La Confrérie du <span className="h1__pop">Petit Jaune</span>
            </h1>
            <AppLink
              className={`button ${nextApero ? "button--ghost" : "button--primary"} button--block`}
              to="/create"
            >
              Nouvel apéro
            </AppLink>
          </div>
        </div>
      }
    />
  );
}
