import { useEffect, useRef } from "react";

// Ce qu'un doigt ou une touche Tab peut atteindre dans la modale.
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Comportement clavier d'une vraie boîte de dialogue pour nos sections
 * role="dialog" aria-modal="true" : focus déplacé dans la modale à
 * l'ouverture, Tab confiné dedans (aria-modal masque déjà le reste de la
 * page aux lecteurs d'écran, le clavier doit suivre), Échap qui ferme, et
 * focus rendu au déclencheur à la fermeture.
 *
 * Usage : poser le ref retourné (et tabIndex={-1}) sur l'élément dialog.
 */
export function useModalDialog(isOpen: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLElement | null>(null);
  // onClose est souvent une flèche recréée à chaque rendu : on la lit via un
  // ref pour ne pas réarmer l'effet (et re-déplacer le focus) à chaque rendu.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusables = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusables[0] ?? dialog).focus();

    function handleKeyDown(keyEvent: KeyboardEvent) {
      if (keyEvent.key === "Escape") {
        keyEvent.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (keyEvent.key !== "Tab" || !dialog) {
        return;
      }

      const items = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (items.length === 0) {
        keyEvent.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const isInside = active instanceof Node && dialog.contains(active);

      if (keyEvent.shiftKey && (active === first || active === dialog || !isInside)) {
        keyEvent.preventDefault();
        last.focus();
      } else if (!keyEvent.shiftKey && (active === last || !isInside)) {
        keyEvent.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  return dialogRef;
}
