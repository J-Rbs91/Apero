import { useModalDialog } from "../hooks/useModalDialog";

// Boîte de dialogue de confirmation destructive (annuler/supprimer un apéro).
// Une seule implémentation pour toutes les pages : focus déplacé et piégé,
// Échap qui annule (sauf pendant l'action), et l'erreur affichée sur place.

type ConfirmDialogProps = {
  isOpen: boolean;
  eyebrow: string;
  title: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  /** Libellé du bouton de confirmation pendant l'action (« On raye… »). */
  busyLabel: string;
  isBusy: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  isOpen,
  eyebrow,
  title,
  body,
  cancelLabel,
  confirmLabel,
  busyLabel,
  isBusy,
  error,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useModalDialog(isOpen, () => {
    if (!isBusy) {
      onCancel();
    }
  });

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section
        ref={dialogRef}
        tabIndex={-1}
        className="sheet modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="h1 h1--sm" id="confirm-dialog-title">
          {title}
        </h2>
        <p className="lede">{body}</p>
        <div className="button-row">
          <button type="button" className="button button--ghost" onClick={onCancel} disabled={isBusy}>
            {cancelLabel}
          </button>
          <button type="button" className="button button--danger" onClick={onConfirm} disabled={isBusy}>
            {isBusy ? busyLabel : confirmLabel}
          </button>
        </div>
        {error && <p className="feedback">{error}</p>}
      </section>
    </div>
  );
}
