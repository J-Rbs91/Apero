import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { requestGentlemanNameEdit } from "../hooks/useGentlemanName";
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
    <div className="brand-menu" ref={containerRef}>
      <button
        type="button"
        className="brandpill brandpill--button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <WineGlassMark size={26} />
        <span>La Confrérie</span>
        <svg className="brandpill__chev" viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="brand-menu__panel" role="menu">
          <Link
            className="brand-menu__item"
            role="menuitem"
            to="/agenda"
            onClick={() => setIsOpen(false)}
          >
            Les apéros à venir
          </Link>
          <Link
            className="brand-menu__item"
            role="menuitem"
            to="/palmares"
            onClick={() => setIsOpen(false)}
          >
            Le palmarès de la Confrérie
          </Link>
          <button
            type="button"
            className="brand-menu__item"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              requestGentlemanNameEdit();
            }}
          >
            Modifier mon nom de gentleman
          </button>
        </div>
      )}
    </div>
  );
}
