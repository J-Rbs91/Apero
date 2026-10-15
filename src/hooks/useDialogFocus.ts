import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Comportement clavier d'une modale (design-system §5) : focus initial dans la
// boîte, Tab / Maj+Tab bouclent à l'intérieur, Échap la ferme, le focus revient
// au déclencheur à la fermeture.
export function useDialogFocus(
  ref: RefObject<HTMLElement | null>,
  options: { onEscape?: () => void } = {},
) {
  const { onEscape } = options;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;

    function focusables(): HTMLElement[] {
      return Array.from(dialog!.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      );
    }

    // On ne vole pas le focus s'il est déjà dans la boîte (autofocus du champ).
    if (!dialog.contains(document.activeElement)) {
      const [first] = focusables();
      (first ?? dialog).focus({ preventScroll: true });
    }

    function handleKeyDown(keyEvent: KeyboardEvent) {
      if (keyEvent.key === "Escape" && onEscape) {
        keyEvent.stopPropagation();
        onEscape();
        return;
      }

      if (keyEvent.key !== "Tab") {
        return;
      }

      const items = focusables();
      if (items.length === 0) {
        keyEvent.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (keyEvent.shiftKey && (active === first || !dialog!.contains(active))) {
        keyEvent.preventDefault();
        last.focus();
      } else if (!keyEvent.shiftKey && (active === last || !dialog!.contains(active))) {
        keyEvent.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);
}
