import { useAppNavigation } from "../routes/useAppNavigation";
import { HeaderNav } from "./HeaderNav";

type MobileHeaderProps = {
  eyebrow: string;
  title?: string;
  meta?: string;
};

export function MobileHeader({ eyebrow, title, meta }: MobileHeaderProps) {
  /* Le bouton retour REMONTE d'un niveau dans l'arbre — il ne rejoue pas la
     chronologie des visites. `navigate(-1)` ramenait à l'écran précédemment vu,
     ce qui n'est le parent qu'au premier pas : après trois apéros consultés à la
     file, il fallait trois appuis pour revenir au programme. Et il ne navigue
     pas non plus vers le parent, ce qui empilerait une entrée de plus et
     éloignerait la sortie à chaque remontée.

     C'est aussi la seule façon que ce bouton et celui du téléphone aboutissent
     au même écran depuis le même point. Le contrat est en tête de
     src/routes/navigationTree.ts. */
  const { remonter } = useAppNavigation();

  return (
    <header className="screen-head">
      <div className="backrow">
        <button type="button" className="bk" onClick={remonter} aria-label="Retour">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
            <path
              d="M15 5l-7 7 7 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <p className="eyebrow">{eyebrow}</p>
        {/* Cloche + menu : la Confrérie reste à portée de pouce sur toutes
            les pages, pas seulement à l'accueil. */}
        <HeaderNav />
      </div>
      {title && <h1 className="h1 h1--sm screen-head__title">{title}</h1>}
      {meta && <p className="meta">{meta}</p>}
    </header>
  );
}
