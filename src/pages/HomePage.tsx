import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

  // L’accueil vierge est un écran d’atterrissage tenu sur une seule vue : on
  // verrouille le défilement le temps qu’on y reste. Dès qu’une carte d’apéro
  // s’ajoute, le contenu peut déborder : on laisse défiler.
  useEffect(() => {
    if (nextApero) {
      return;
    }
    const root = document.documentElement;
    const { body } = document;
    root.classList.add("is-locked");
    body.classList.add("is-locked");
    return () => {
      root.classList.remove("is-locked");
      body.classList.remove("is-locked");
    };
  }, [nextApero]);

  return (
    <MobilePage className="home-mobile" overlay="scene">
      <BrandMenu />

      <div className="grow" />

      {nextApero && (
        <section className="sheet">
          <p className="eyebrow">
            {nextApero.isDecided ? "Prochain rendez-vous" : "Ça vote au comptoir"}
          </p>
          <h2 className="h2">{nextApero.event.ceremonialName}</h2>
          <p className="meta">
            {formatNextDate(nextApero.startMs)} · {nextApero.event.participants.length}{" "}
            réponse{nextApero.event.participants.length > 1 ? "s" : ""} au registre
          </p>
          <Link className="button button--primary button--block" to={nextApero.path}>
            Ouvrir l’apéro
          </Link>
        </section>
      )}

      <section className="sheet">
        <p className="eyebrow">Institution officieuse du comptoir</p>
        <hr className="accent" />
        <h1 className="h1">La Confrérie du Petit Jaune</h1>
        <p className="lede">
          Le zinc décide, pour toute la tablée. Choisir une date d’apéro, c’est plus sérieux qu’il
          n’y paraît.
        </p>
        <p className="hint">
          Nous ne saurions présumer de ce que tu porteras à tes lèvres, ni sous quelle toiture, ou
          pas, tu le porteras. Ces détails demeurent ta souveraine affaire. En revanche nul ne
          saurait se dérober à la question qui vient, ça, jamais.
        </p>
        <Link
          className={`button ${nextApero ? "button--ghost" : "button--primary"} button--block`}
          to="/create"
        >
          Organiser un apéro
        </Link>
        <p className="meta meta--center">Propose · partage · le comptoir tranche</p>
      </section>
    </MobilePage>
  );
}
