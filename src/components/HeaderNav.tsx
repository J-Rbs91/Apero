import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { requestComptoirNameEdit } from "../hooks/useComptoirName";
import { NotificationBell } from "./NotificationBell";

// Navigation globale des pages intérieures : la cloche et le menu de la
// Confrérie suivent l'utilisateur partout — plus besoin de remonter à
// l'accueil pour retrouver son ardoise, ses tablées ou son carnet.
export function HeaderNav() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(pointerEvent: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(pointerEvent.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(keyEvent: KeyboardEvent) {
      if (keyEvent.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="header-nav" ref={containerRef}>
      <NotificationBell />
      <button
        type="button"
        className="bk header-nav__menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Menu de la Confrérie"
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
        </svg>
      </button>

      {isOpen && (
        <div className="brand-menu__panel header-nav__panel" role="menu">
          <Link className="brand-menu__item" role="menuitem" to="/" onClick={() => setIsOpen(false)}>
            Le Comptoir
          </Link>
          <Link className="brand-menu__item" role="menuitem" to="/agenda" onClick={() => setIsOpen(false)}>
            Ardoise
          </Link>
          <Link className="brand-menu__item" role="menuitem" to="/tablees" onClick={() => setIsOpen(false)}>
            Tablées
          </Link>
          <Link className="brand-menu__item" role="menuitem" to="/notifications" onClick={() => setIsOpen(false)}>
            Le Carnet
          </Link>
          <Link className="brand-menu__item" role="menuitem" to="/palmares" onClick={() => setIsOpen(false)}>
            Palmarès
          </Link>
          <Link className="brand-menu__item" role="menuitem" to="/comptes" onClick={() => setIsOpen(false)}>
            Les Comptes
          </Link>
          <Link className="brand-menu__item" role="menuitem" to="/coffre" onClick={() => setIsOpen(false)}>
            Le Coffre
          </Link>
          <button
            type="button"
            className="brand-menu__item"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              requestComptoirNameEdit();
            }}
          >
            Changer de blaze
          </button>
        </div>
      )}
    </div>
  );
}
