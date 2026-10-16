import type { ReactNode } from "react";

type MobilePageProps = {
  children?: ReactNode;
  className?: string;
  /** Rangée du haut de la façade : bouton retour + navigation, ou barre de marque. */
  header?: ReactNode;
  /** Enseigne peinte sur la façade : titre, chapô, verdict. */
  hero?: ReactNode;
};

// Coque d'une page : l'auvent à festons, la façade sombre qui porte l'enseigne,
// puis le comptoir de papier (le contenu). Voir docs/uxer/design-system.md §3-4.
//
// `<main>` n'est rendu que lorsqu'il y a un contenu : pendant un chargement,
// l'enseigne seule occupe l'écran, et l'arrivée du contenu ne pousse rien.
export function MobilePage({ children, className = "", header, hero }: MobilePageProps) {
  return (
    <div className={`screen ${className}`.trim()}>
      <header className="facade">
        <div className="canopy" aria-hidden="true" />
        <div className="facade__inner">{header}</div>
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
