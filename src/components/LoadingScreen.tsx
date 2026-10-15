type LoadingScreenProps = {
  title?: string;
  subtitle?: string;
  /** « h1 » quand le chargement est seul à occuper la page (invitation), « h2 » sinon. */
  heading?: "h1" | "h2";
};

// Trois ampoules qui s'allument en séquence (design-system §6.1) : le seul
// mouvement en boucle du produit, et il s'arrête avec l'écran.
export function LoadingScreen({
  title = "Un instant…",
  subtitle = "La Confrérie ouvre le comptoir…",
  heading: Heading = "h2",
}: LoadingScreenProps) {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <section className="sheet loading-sheet">
        <div className="loading-bulbs" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <Heading className="h1 h1--sm">{title}</Heading>
        <p className="lede">{subtitle}</p>
      </section>
    </div>
  );
}
