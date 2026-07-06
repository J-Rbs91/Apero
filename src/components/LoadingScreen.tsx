import { useEffect, useState } from "react";
import { WineGlassMark } from "./WineGlassMark";

type LoadingScreenProps = {
  title?: string;
  subtitle?: string;
};

// En dessous de ce seuil, on n'affiche rien : un chargement expédié en moins
// d'une seconde ne mérite pas qu'on lui colle un écran d'attente sous le nez.
const HIDE_BEFORE_MS = 1000;
// Passé ce délai, l'attente s'éternise : on meuble à la gouaille de comptoir.
const QUIPS_AFTER_MS = 5000;
// Cadence de rotation des vannes.
const QUIP_ROTATE_MS = 3500;

// Balancées quand ça traîne (> 5 s), pour faire patienter avec le sourire.
const LONG_WAIT_QUIPS = [
  "Le tenancier revient, il est parti changer l’eau des olives.",
  "On change le fût, on arrive.",
  "Nous aussi on est pas là pour être ici.",
  "Doucement sur la pression, faudrait pas décapsuler.",
  "Deux minutes, on essuie le zinc et on est à toi.",
  "Le patron cherche ses lunettes pour déchiffrer l’ardoise.",
];

export type LoadingPhase = "hidden" | "waiting" | "quips";

// Seule source de vérité des paliers : rien avant 1 s, écran d'attente
// jusqu'à 5 s, puis les vannes. Fonction pure, donc testable sans DOM.
export function loadingPhase(elapsedMs: number): LoadingPhase {
  if (elapsedMs < HIDE_BEFORE_MS) {
    return "hidden";
  }
  if (elapsedMs < QUIPS_AFTER_MS) {
    return "waiting";
  }
  return "quips";
}

export function LoadingScreen({
  title = "Un instant…",
  subtitle = "La Confrérie ouvre le comptoir…",
}: LoadingScreenProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [quipIndex, setQuipIndex] = useState(0);
  const phase = loadingPhase(elapsedMs);

  useEffect(() => {
    const toWaiting = window.setTimeout(() => setElapsedMs(HIDE_BEFORE_MS), HIDE_BEFORE_MS);
    const toQuips = window.setTimeout(() => setElapsedMs(QUIPS_AFTER_MS), QUIPS_AFTER_MS);
    return () => {
      window.clearTimeout(toWaiting);
      window.clearTimeout(toQuips);
    };
  }, []);

  useEffect(() => {
    if (phase !== "quips") {
      return;
    }
    const rotate = window.setInterval(
      () => setQuipIndex((index) => (index + 1) % LONG_WAIT_QUIPS.length),
      QUIP_ROTATE_MS,
    );
    return () => window.clearInterval(rotate);
  }, [phase]);

  // Chargement trop court : on ne montre rien du tout.
  if (phase === "hidden") {
    return null;
  }

  const isQuips = phase === "quips";

  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <section className="sheet loading-sheet">
        <WineGlassMark size={40} />
        <hr className="accent" />
        <h1 className="h1 h1--sm">{title}</h1>
        <p className="lede">{isQuips ? LONG_WAIT_QUIPS[quipIndex] : subtitle}</p>
      </section>
    </div>
  );
}
