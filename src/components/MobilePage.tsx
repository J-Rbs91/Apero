import type { ReactNode } from "react";
import { TabBar } from "./TabBar";

type MobilePageProps = {
  children: ReactNode;
  className?: string;
  /** Rangée du haut de la façade : barre de marque ou bouton retour. */
  header?: ReactNode;
  /** Enseigne peinte sur la façade (titre, chapô, verdict). */
  hero?: ReactNode;
  /** Écran de premier niveau : affiche la navigation persistante. */
  nav?: boolean;
};

// Coque d'une page : l'auvent à festons, la façade sombre qui porte l'enseigne,
// puis le comptoir de papier (le contenu). Voir design-system.md §3 et §4.
export function MobilePage({ children, className = "", header, hero, nav = false }: MobilePageProps) {
  return (
    <div className={`screen ${nav ? "screen--nav" : ""} ${className}`.trim()}>
      <header className="facade">
        <div className="canopy" aria-hidden="true" />
        <div className="facade__inner">
          {header}
          {nav && <TabBar />}
        </div>
        {hero && <div className="facade__hero">{hero}</div>}
      </header>
      {children != null && (
        <main className="page">
          <div className="page__body">{children}</div>
        </main>
      )}
    </div>
  );
}
