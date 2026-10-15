import { useEffect, useState } from "react";
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
  // La prochaine assemblée reste prioritaire pour l'habitué, sans appel réseau.
  const [nextApero] = useState(findNextApero);

  useEffect(() => {
    eventStorage.purgeExpiredEvents().catch(() => {
      // Une purge indisponible ne doit jamais retenir l'accueil.
    });
  }, []);

  return (
    <MobilePage className="home-mobile" overlay="scene">
      <header className="home-topline">
        <BrandMenu />
        <span className="home-topline__edition" aria-hidden="true">Édition des copains</span>
      </header>

      <section className="home-masthead" aria-labelledby="home-title">
        <div className="home-masthead__rule">
          <span>Le bulletin officiel des rendez-vous officieux</span>
          <span aria-hidden="true">N° 01</span>
        </div>

        <p className="home-masthead__eyebrow">La très honorable</p>
        <h1 className="home-masthead__title" id="home-title">
          Confrérie <em>du</em><br />
          Petit Jaune<span aria-hidden="true">.</span>
        </h1>
        <div className="home-masthead__seal" aria-hidden="true">
          <span>Se réunir</span>
          <strong>✳</strong>
          <span>sans chichis</span>
        </div>
      </section>

      {nextApero && (
        <section className="home-next sheet sheet--hero" aria-labelledby="next-apero-title">
          <div className="home-next__heading">
            <span className="home-next__marker" aria-hidden="true">À LA UNE</span>
            <p className="eyebrow">
              {nextApero.isDecided ? "Prochain rendez-vous" : "Ça vote au comptoir"}
            </p>
          </div>
          <h2 className="h2" id="next-apero-title">{nextApero.event.ceremonialName}</h2>
          <p className="factline">
            <span>{formatNextDate(nextApero.startMs)}</span>
            <span>
              <b>{nextApero.event.participants.length}</b> réponse
              {nextApero.event.participants.length > 1 ? "s" : ""} au registre
            </span>
          </p>
          <AppLink className="button button--primary button--block" to={nextApero.path}>
            Ouvrir l’apéro <span aria-hidden="true">↗</span>
          </AppLink>
        </section>
      )}

      <section className="home-manifesto sheet" aria-labelledby="home-manifesto-title">
        <p className="eyebrow">Institution officieuse du comptoir</p>
        <h2 className="home-manifesto__title" id="home-manifesto-title">
          Le moment est sacré.<br />
          <em>Le protocole, un peu moins.</em>
        </h2>
        <p className="lede">
          Une date à trouver, une tablée à réunir, et personne qui ne sait
          où se retrouver. Ici, on propose, on partage, on vote.
        </p>
        <p className="hint">
          Peu importe ce qu'il y a dans ton verre. Nous défendons une seule
          cause : ne jamais laisser un bon rendez-vous mourir dans une
          conversation de groupe.
        </p>

        <AppLink
          className={"button " + (nextApero ? "button--ghost" : "button--primary") + " button--block home-manifesto__cta"}
          to="/create"
        >
          Organiser un apéro <span aria-hidden="true">↗</span>
        </AppLink>
      </section>

      <section className="home-how" aria-label="Comment fonctionne la Confrérie">
        <p className="home-how__heading">Trois articles au règlement</p>
        <ol className="home-how__steps">
          <li><span>01</span> Tu proposes les créneaux.</li>
          <li><span>02</span> La tablée donne son avis.</li>
          <li><span>03</span> Le verdict tombe tout seul.</li>
        </ol>
      </section>

      <nav className="home-shortcuts" aria-label="Accès aux autres espaces">
        <AppLink to="/agenda">
          <span>Le programme</span>
          <strong>Les apéros à venir</strong>
          <span aria-hidden="true">↗</span>
        </AppLink>
        <AppLink to="/tablees">
          <span>La communauté</span>
          <strong>Mes tablées</strong>
          <span aria-hidden="true">↗</span>
        </AppLink>
      </nav>

      <p className="home-colophon">L'amitié mérite un beau registre. Le reste est accessoire.</p>
    </MobilePage>
  );
}
