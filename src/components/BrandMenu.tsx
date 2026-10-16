import { useEffect, useRef } from "react";
import { useAppNavigation } from "../routes/useAppNavigation";
import { ConfrerieMenuPanel } from "./ConfrerieMenuPanel";
import { NotificationBell } from "./NotificationBell";
import { PointMark } from "./field/PointMark";

/* Le menu est une COUCHE posée sur l'écran, pas un écran : son ouverture empile
   une entrée d'historique, et le geste retour du téléphone la referme au lieu de
   quitter la page. L'état ouvert se LIT dans l'historique plutôt que de vivre à
   côté — deux sources qui divergent, c'est un menu qui reste affiché sur un
   écran qu'on a quitté. Le contrat est en tête de src/routes/navigationTree.ts. */
export function BrandMenu() {
  const { ouvrirCouche, fermerCouche, coucheCourante } = useAppNavigation();
  const isOpen = coucheCourante === "menu";
  const setIsOpen = (ouvert: boolean) => (ouvert ? ouvrirCouche("menu") : fermerCouche());
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
    <div className="brand-row">
      <div className="brand-menu" ref={containerRef}>
      <button
        type="button"
        className="brandpill brandpill--button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="La Confrérie, menu"
        onClick={() => setIsOpen(!isOpen)}
      >
        <PointMark />
        <span>La Confrérie</span>
        <svg className="brandpill__menu-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
          <path
            className="brandpill__menu-line brandpill__menu-line--top"
            d="M4 7h16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
          <path
            className="brandpill__menu-line brandpill__menu-line--mid"
            d="M4 12h16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
          <path
            className="brandpill__menu-line brandpill__menu-line--bottom"
            d="M4 17h16"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="brand-menu__overlay" aria-hidden="true" onClick={() => setIsOpen(false)} />
          <ConfrerieMenuPanel onClose={() => setIsOpen(false)} />
        </>
      )}
      </div>
      <NotificationBell />
    </div>
  );
}
