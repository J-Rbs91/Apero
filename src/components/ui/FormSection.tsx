import type { ReactNode } from "react";

type FormSectionProps = {
  /** Numéro d'étape affiché dans la pastille : donne l'ordre de lecture. */
  step?: number;
  title: string;
  /** Une phrase qui dit quoi faire ici, pas ce que le bloc contient. */
  lead?: string;
  /** État du bloc, affiché en haut à droite (« 2 sur 3 remplis »). */
  status?: string;
  /** Vrai quand le bloc est complet : la pastille se coche. */
  isDone?: boolean;
  children: ReactNode;
};

/**
 * Bloc de formulaire numéroté. On voit d'un coup d'œil combien d'étapes il y
 * a, où on en est, et ce qu'on attend de nous à chacune.
 */
export function FormSection({
  step,
  title,
  lead,
  status,
  isDone,
  children,
}: FormSectionProps) {
  return (
    <section className={`formsec${isDone ? " formsec--done" : ""}`}>
      <header className="formsec__head">
        {step != null && (
          <span className="formsec__step" aria-hidden="true">
            {isDone ? (
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                <path
                  d="M5 12.5l4.2 4.3L19 7.5"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              step
            )}
          </span>
        )}
        <div className="formsec__titles">
          <h2 className="formsec__title">{title}</h2>
          {lead && <p className="formsec__lead">{lead}</p>}
        </div>
        {status && <span className="formsec__status">{status}</span>}
      </header>
      <div className="formsec__body">{children}</div>
    </section>
  );
}
