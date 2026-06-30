import { WineGlassMark } from "./WineGlassMark";

type LoadingScreenProps = {
  title?: string;
  subtitle?: string;
};

export function LoadingScreen({
  title = "On prépare le registre",
  subtitle = "La Confrérie ouvre le comptoir…",
}: LoadingScreenProps) {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <section className="sheet loading-sheet">
        <WineGlassMark size={40} />
        <hr className="accent" />
        <h1 className="h1 h1--sm">{title}</h1>
        <p className="lede">{subtitle}</p>
      </section>
    </div>
  );
}
