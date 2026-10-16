import type { ReactNode } from "react";

type MobilePageProps = {
  children?: ReactNode;
  className?: string;
  /** Rangée du haut de la façade : bouton retour + navigation, ou barre de marque. */
  header?: ReactNode;
  /** En-tête de l'écran : légende, titre, chapô. */
  hero?: ReactNode;
};

// Coque d'une page : la rangée de navigation, l'en-tête (la déclaration de
// l'écran), puis le contenu. Voir docs/uxer/manifesto-void/UXER_DESIGN_SYSTEM.md §3.
//
// `<main>` n'est rendu que lorsqu'il y a un contenu : pendant un chargement,
// l'enseigne seule occupe l'écran, et l'arrivée du contenu ne pousse rien.
export function MobilePage({ children, className = "", header, hero }: MobilePageProps) {
  return (
    <div className={`screen ${className}`.trim()}>
      <header className="facade">
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
