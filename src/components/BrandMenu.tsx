import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { requestComptoirNameEdit } from "../hooks/useComptoirName";
import { NotificationBell } from "./NotificationBell";
import { WineGlassMark } from "./WineGlassMark";

export function BrandMenu() {
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
    <div className="brand-row">
      <div className="brand-menu" ref={containerRef}>
      <button
        type="button"
        className="brandpill brandpill--button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Menu de la Confrérie"
        onClick={() => setIsOpen((open) => !open)}
      >
        <WineGlassMark size={26} />
        <span>Menu de la Confrérie</span>
        <svg className="brandpill__menu-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
          <path
            className="brandpill__menu-line brandpill__menu-line--top"
            d="M4 7h16"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <path
            className="brandpill__menu-line brandpill__menu-line--mid"
            d="M4 12h16"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <path
            className="brandpill__menu-line brandpill__menu-line--bottom"
            d="M4 17h16"
            stroke="currentColor"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="brand-menu__panel" role="menu">
          <Link
            className="brand-menu__item"
            role="menuitem"
            to="/notifications"
            onClick={() => setIsOpen(false)}
          >
            Notifications
          </Link>
          <Link
            className="brand-menu__item"
            role="menuitem"
            to="/agenda"
            onClick={() => setIsOpen(false)}
          >
            Agenda
          </Link>
          <Link
            className="brand-menu__item"
            role="menuitem"
            to="/palmares"
            onClick={() => setIsOpen(false)}
          >
            Palmarès
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
      <NotificationBell />
    </div>
  );
}
