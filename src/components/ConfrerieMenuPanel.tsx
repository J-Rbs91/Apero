import { useState } from "react";
import { Link } from "react-router-dom";
import { requestComptoirNameEdit } from "../hooks/useComptoirName";

// Panneau partagé du menu de la Confrérie (accueil + pages intérieures).
// Les entrées du quotidien (Ardoise, Tablées, Le Carnet) et les bilans
// (Palmarès, Les Comptes) restent à plat ; Le Coffre et le changement de
// blaze, plus rares, sont repliés dans un sous-menu « Réglages ».
export function ConfrerieMenuPanel({
  withComptoirLink = false,
  className = "brand-menu__panel",
  onClose,
}: {
  withComptoirLink?: boolean;
  className?: string;
  onClose: () => void;
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <div className={className} role="menu">
      {withComptoirLink && (
        <Link className="brand-menu__item" role="menuitem" to="/" onClick={onClose}>
          Le Comptoir
        </Link>
      )}
      <Link className="brand-menu__item" role="menuitem" to="/agenda" onClick={onClose}>
        Ardoise
      </Link>
      <Link className="brand-menu__item" role="menuitem" to="/tablees" onClick={onClose}>
        Tablées
      </Link>
      <Link className="brand-menu__item" role="menuitem" to="/notifications" onClick={onClose}>
        Le Carnet
      </Link>
      <Link className="brand-menu__item" role="menuitem" to="/palmares" onClick={onClose}>
        Palmarès
      </Link>
      <Link className="brand-menu__item" role="menuitem" to="/comptes" onClick={onClose}>
        Les Comptes
      </Link>

      <div className="brand-menu__group">
        <button
          type="button"
          className="brand-menu__item brand-menu__group-toggle"
          role="menuitem"
          aria-expanded={isSettingsOpen}
          onClick={() => setIsSettingsOpen((open) => !open)}
        >
          <span>Réglages</span>
          <svg
            className="brand-menu__group-chevron"
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {isSettingsOpen && (
          <div className="brand-menu__sub" role="menu">
            <Link
              className="brand-menu__item brand-menu__item--sub"
              role="menuitem"
              to="/coffre"
              onClick={onClose}
            >
              Le Coffre
            </Link>
            <button
              type="button"
              className="brand-menu__item brand-menu__item--sub"
              role="menuitem"
              onClick={() => {
                onClose();
                requestComptoirNameEdit();
              }}
            >
              Changer de blaze
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
