import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

type FormSheetProps = {
  isOpen: boolean;
  /** Ce qu'on vient faire ici, en trois mots. */
  title: string;
  /** Une phrase de contexte sous le titre. */
  lead?: string;
  onClose: () => void;
  /** Le corps du formulaire (champs uniquement). */
  children: ReactNode;
  /** Le pied collant : bouton d'enregistrement et statut. */
  footer: ReactNode;
  /** Passé au <form> : la feuille EST le formulaire, le pied peut donc
   * porter un bouton submit ordinaire. */
  onSubmit: (formEvent: React.FormEvent<HTMLFormElement>) => void;
};

/**
 * Feuille plein écran pour une saisie secondaire (contre-proposition,
 * retouche des réglages). Elle prend toute la place, annonce son titre et son
 * unique bouton d'enregistrement : impossible de la confondre avec le reste
 * de la page, ni de se demander lequel des boutons valide.
 */
export function FormSheet({
  isOpen,
  title,
  lead,
  onClose,
  children,
  footer,
  onSubmit,
}: FormSheetProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(keyEvent: KeyboardEvent) {
      if (keyEvent.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="formsheet" role="dialog" aria-modal="true" aria-label={title}>
      <div className="formsheet__scrim" onClick={onClose} aria-hidden="true" />
      <form className="formsheet__panel" onSubmit={onSubmit}>
        <header className="formsheet__head">
          <div className="formsheet__titles">
            <h2 className="formsheet__title">{title}</h2>
            {lead && <p className="formsheet__lead">{lead}</p>}
          </div>
          <button
            type="button"
            className="formsheet__close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>
        <div className="formsheet__body">{children}</div>
        <footer className="formsheet__foot">{footer}</footer>
      </form>
    </div>,
    document.body,
  );
}
