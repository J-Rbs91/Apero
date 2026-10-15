import { useAppNavigation } from "../routes/useAppNavigation";
import { HeaderNav } from "./HeaderNav";
import { Icon } from "./Icon";

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
    <div className="screen-head">
      <div className="backrow">
        <button type="button" className="bk" onClick={remonter} aria-label="Retour">
          <Icon name="back" size={22} />
        </button>
        <p className="eyebrow backrow__label">{eyebrow}</p>
        {/* Cloche + menu : la Confrérie reste à portée de pouce sur toutes
            les pages, pas seulement à l'accueil. */}
        <HeaderNav />
      </div>
      {title && <h1 className="h1 h1--sm screen-head__title">{title}</h1>}
      {meta && <p className="meta">{meta}</p>}
    </div>
  );
}
