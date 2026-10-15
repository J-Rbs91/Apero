import { useEffect, useState } from "react";
import zincIllustration from "../assets/art/Le-zinc.jpg";
import { AppLink } from "../components/AppLink";
import { BrandMenu } from "../components/BrandMenu";
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
                {nextApero.isDecided ? "Prochain rendez-vous" : "Ça vote au comptoir"}
              </p>
              <h2 className="h2">{nextApero.event.ceremonialName}</h2>
              <p className="factline">
                <span>{formatNextDate(nextApero.startMs)}</span>
                <span>
                  <b>{nextApero.event.participants.length}</b> réponse
                  {nextApero.event.participants.length > 1 ? "s" : ""} au registre
                </span>
              </p>
              <AppLink className="button button--primary button--block" to={nextApero.path}>
                Ouvrir l’apéro
              </AppLink>
            </section>
          )}

          <div className="sign__text">
            <p className="eyebrow">Institution officieuse du comptoir</p>
            <h1 className="h1">
              La Confrérie du <span className="h1__pop">Petit Jaune</span>
            </h1>
            <p className="lede">
              Le zinc décide, pour toute la tablée. Tu proposes des créneaux, tu partages un lien,
              la tablée tranche.
            </p>
            <AppLink
              className={`button ${nextApero ? "button--ghost" : "button--primary"} button--block`}
              to="/create"
            >
              Organiser un apéro
            </AppLink>
          </div>

          <div className="window" aria-hidden="true">
            <img src={zincIllustration} alt="" width="1376" height="782" />
          </div>
        </div>
      }
    >
      <p className="hint">
        Nous ne saurions présumer de ce que tu porteras à tes lèvres, ni sous quelle toiture, ou
        pas, tu le porteras. Ces détails demeurent ta souveraine affaire. En revanche, nul ne
        saurait se dérober à la question qui vient, ça, jamais.
      </p>
    </MobilePage>
  );
}
