import { useEffect, useRef, useState } from "react";
import { ConfrerieMenuPanel } from "./ConfrerieMenuPanel";
import { NotificationBell } from "./NotificationBell";

// Navigation globale des pages intérieures : la cloche et le menu de la
// Confrérie suivent l'utilisateur partout — plus besoin de remonter à
// l'accueil pour retrouver le programme, ses tablées ou sa rétrospective.
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
        <>
          <div className="brand-menu__overlay" aria-hidden="true" onClick={() => setIsOpen(false)} />
          <ConfrerieMenuPanel
            withComptoirLink
            className="brand-menu__panel header-nav__panel"
            onClose={() => setIsOpen(false)}
          />
        </>
      )}
    </div>
  );
}
