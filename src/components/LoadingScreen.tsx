import { AperoOrnaments } from "./AperoOrnaments";

type LoadingScreenProps = {
  title?: string;
  subtitle?: string;
};

export function LoadingScreen({
  title = "ap\u00e9ro ?",
  subtitle = "Le comptoir prépare le registre...",
}: LoadingScreenProps) {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-screen__wall">
        <div className="loading-screen__chalk">
          <span className="loading-screen__handwriting">{title}</span>
        </div>
        <p className="loading-screen__subtitle">{subtitle}</p>
      </div>
      <AperoOrnaments variant="counter" />
      <div className="loading-screen__counter">
        <div className="loading-screen__note">
          <span className="loading-screen__receipt">
            <i />
            <i />
            <i />
          </span>
          <span className="loading-screen__glass" />
        </div>
      </div>
    </div>
  );
}
