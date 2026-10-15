import { useRef, type ReactNode } from "react";
import { useDialogFocus } from "../hooks/useDialogFocus";

type DialogProps = {
  labelledBy?: string;
  label?: string;
  className?: string;
  onClose: () => void;
  children: ReactNode;
};

// Modale du design system : papier, bordure encre, ampoules statiques (CSS).
// Gère focus, piège à Tab et Échap.
export function Dialog({ labelledBy, label, className = "", onClose, children }: DialogProps) {
  const ref = useRef<HTMLElement>(null);
  useDialogFocus(ref, { onEscape: onClose });

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        ref={ref}
        tabIndex={-1}
        className={`sheet modal-sheet ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={label}
      >
        {children}
      </section>
    </div>
  );
}
