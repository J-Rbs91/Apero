import type { ReactNode } from "react";
import { Verrerie, type VerrerieComposition } from "./field/Verrerie";

type MobilePageProps = {
  children?: ReactNode;
  className?: string;
  /** Rangée du haut de la façade : bouton retour + navigation, ou barre de marque. */
  header?: ReactNode;
  /** En-tête de l'écran : légende, titre, chapô. */
  hero?: ReactNode;
  /** Verrerie de l'écran : une silhouette derrière l'en-tête (contrat §17). */
  verrerie?: VerrerieComposition;
};

// Coque d'une page : la rangée de navigation, l'en-tête (la déclaration de
// l'écran), puis le contenu. Voir docs/uxer/manifesto-void/UXER_DESIGN_SYSTEM.md §3.
//
// `<main>` n'est rendu que lorsqu'il y a un contenu : pendant un chargement,
// l'enseigne seule occupe l'écran, et l'arrivée du contenu ne pousse rien.
export function MobilePage({ children, className = "", header, hero, verrerie }: MobilePageProps) {
  const classes = verrerie ? `screen has-verrerie ${className}` : `screen ${className}`;

  return (
    <div className={classes.trim()}>
      <header className="facade">
        <div className="facade__inner">{header}</div>
        {/* Sous la rangée de navigation, jamais dessous : la silhouette part
            de l'en-tête de l'écran et passe derrière le contenu. */}
        {verrerie && hero && (
          <Verrerie
            objet={verrerie.objet}
            angle={verrerie.angle}
            ancre={verrerie.ancre}
            className="verrerie--page"
          />
        )}
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
