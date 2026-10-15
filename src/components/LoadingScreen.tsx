type LoadingScreenProps = {
  title?: string;
  subtitle?: string;
};

// Trois ampoules qui s'allument en séquence (design-system §6.1) : le seul
// mouvement en boucle du produit, et il s'arrête avec l'écran.
export function LoadingScreen({
  title = "Un instant…",
  subtitle = "La Confrérie ouvre le comptoir…",
}: LoadingScreenProps) {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <section className="sheet loading-sheet">
        <div className="loading-bulbs" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <h1 className="h1 h1--sm">{title}</h1>
        <p className="lede">{subtitle}</p>
      </section>
    </div>
  );
}
