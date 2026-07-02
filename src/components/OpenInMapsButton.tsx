import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { buildMapLinks, formatCoordinates, type MapLinkTarget } from "../utils/mapLinks";

const PANEL_ASSUMED_WIDTH = 220;
const VIEWPORT_MARGIN = 12;

type OpenInMapsButtonProps = MapLinkTarget & {
  className?: string;
};

type PanelPosition = { top: number; left: number };

export function OpenInMapsButton({ label, address, lat, lng, className }: OpenInMapsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null);
  const [copyFeedback, setCopyFeedback] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(pointerEvent: PointerEvent) {
      const target = pointerEvent.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(keyEvent: KeyboardEvent) {
      if (keyEvent.key === "Escape") {
        setIsOpen(false);
      }
    }

    // La carte sous le menu peut défiler/zoomer sous le doigt : mieux vaut
    // refermer plutôt que garder un menu ancré dans le vide.
    function handleScrollOrResize() {
      setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen]);

  if (lat == null && lng == null && !address) {
    return null;
  }

  const displayText =
    address || (lat != null && lng != null ? formatCoordinates(lat, lng) : label);
  const links = buildMapLinks({ label, address, lat, lng });

  function handleToggle() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setPanelPosition({
        top: rect.bottom + 8,
        left: Math.min(rect.left, window.innerWidth - PANEL_ASSUMED_WIDTH - VIEWPORT_MARGIN),
      });
    }
    setIsOpen(true);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(displayText);
      setCopyFeedback("Copié.");
    } catch {
      setCopyFeedback("Copie impossible ici.");
    }
    window.setTimeout(() => setCopyFeedback(""), 2000);
  }

  return (
    <div className={className ? `maplinks ${className}` : "maplinks"}>
      <button
        type="button"
        ref={triggerRef}
        className="maplinks__trigger"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={handleToggle}
      >
        {displayText}
      </button>

      {isOpen &&
        panelPosition &&
        createPortal(
          <div
            className="maplinks__panel"
            role="menu"
            ref={panelRef}
            style={{ top: panelPosition.top, left: panelPosition.left }}
          >
            <p className="maplinks__eyebrow">Direction le troquet</p>
            {links.map((link) => (
              <a
                key={link.key}
                className="maplinks__item"
                role="menuitem"
                href={link.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              className="maplinks__item maplinks__item--button"
              role="menuitem"
              onClick={handleCopy}
            >
              {copyFeedback || "Copier l’adresse"}
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
