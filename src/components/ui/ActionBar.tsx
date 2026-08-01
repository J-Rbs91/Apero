import type { ReactNode } from "react";

type ActionBarProps = {
  /** Ce qui manque, ou ce qui va se passer au tap. Toujours une phrase. */
  status?: string;
  /** Teinte du statut : gris par défaut, rouge quand il bloque l'envoi. */
  tone?: "neutral" | "blocked" | "ready";
  /** Le bouton principal, et lui seul. */
  children: ReactNode;
  /** Action secondaire discrète, sous le bouton (annuler, passer). */
  secondary?: ReactNode;
};

/**
 * Barre d'action collée en bas de l'écran : le bouton qui enregistre reste
 * sous le pouce, quelle que soit la longueur du formulaire. Plus besoin de
 * chercher où appuyer pour valider.
 */
export function ActionBar({ status, tone = "neutral", children, secondary }: ActionBarProps) {
  return (
    <div className="actionbar">
      {status && (
        <p className={`actionbar__status actionbar__status--${tone}`} role="status">
          {status}
        </p>
      )}
      <div className="actionbar__main">{children}</div>
      {secondary && <div className="actionbar__secondary">{secondary}</div>}
    </div>
  );
}
