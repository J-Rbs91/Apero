import { useEffect, useState } from "react";
type LoadingScreenProps = {
  title?: string;
  subtitle?: string;
  /** « h1 » quand le chargement occupe seul la page (tablée, invitation), « h2 » sinon. */
  heading?: "h1" | "h2";
};

// En dessous de ce seuil, on n'affiche rien : un chargement expédié en moins
// d'une seconde ne mérite pas qu'on lui colle un écran d'attente sous le nez.
const HIDE_BEFORE_MS = 1000;
// Palier « attente longue » : conservé comme repère de durée. Aucun texte
// supplémentaire n'y est affiché (charte UXER_VOICE : pas de phrase de patience).
const QUIPS_AFTER_MS = 5000;

export type LoadingPhase = "hidden" | "waiting" | "quips";

// Seule source de vérité des paliers : rien avant 1 s, écran d'attente
// jusqu'à 5 s, puis attente longue. Fonction pure, donc testable sans DOM.
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
  title = "Chargement",
  subtitle,
  heading: Heading = "h2",
}: LoadingScreenProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const phase = loadingPhase(elapsedMs);

  useEffect(() => {
    const toWaiting = window.setTimeout(() => setElapsedMs(HIDE_BEFORE_MS), HIDE_BEFORE_MS);
    return () => window.clearTimeout(toWaiting);
  }, []);

  // Chargement trop court : on ne montre rien du tout.
  if (phase === "hidden") {
    return null;
  }

  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <section className="sheet loading-sheet">
        {/* Trois ampoules qui s'allument en séquence : le seul mouvement en
            boucle du produit, et il s'arrête avec l'écran. */}
        <div className="loading-bulbs" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <Heading className="h1 h1--sm">{title}</Heading>
        {subtitle && <p className="lede">{subtitle}</p>}
      </section>
    </div>
  );
}
