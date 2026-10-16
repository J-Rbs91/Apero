import { MAX_COMPANIONS } from "../utils/aperoValidation";
import { SwitchRow } from "./ui";

type CompanionsFieldProps = {
  /** Nombre de renforts (undefined = le convive vient en solo). */
  companions: number | undefined;
  onChange: (companions: number | undefined) => void;
  /** Politique mioches de l'apéro, pour ajuster le petit laïus. */
  childrenAllowed?: boolean;
};

/**
 * Bloc « tu ramènes du monde ? » de la réponse : une ligne oui/non qui dit son
 * état en toutes lettres, et le compteur au +/- qui n'apparaît qu'une fois la
 * réponse « oui ».
 */
export function CompanionsField({
  companions,
  onChange,
  childrenAllowed,
}: CompanionsFieldProps) {
  const accompanied = companions != null;
  const count = companions ?? 1;

  function setAccompanied(next: boolean) {
    // « Accompagné » démarre à un renfort ; « solo » efface le compteur.
    onChange(next ? Math.min(Math.max(count, 1), MAX_COMPANIONS) : undefined);
  }

  function step(delta: number) {
    const next = Math.min(Math.max(count + delta, 1), MAX_COMPANIONS);
    onChange(next);
  }

  const childrenNote = childrenAllowed
    ? "Enfants inclus."
    : childrenAllowed === false
      ? "Sans enfants."
      : "";

  return (
    <div className="setting">
      <SwitchRow
        title="Accompagnants"
        state={accompanied ? "Oui" : "Non"}
        checked={accompanied}
        onChange={setAccompanied}
      />

      {accompanied && (
        <div className="companions">
          <div className="stepper" role="group" aria-label="Nombre d’accompagnants">
            <button
              type="button"
              className="stepper__btn"
              onClick={() => step(-1)}
              disabled={count <= 1}
              aria-label="Retirer un accompagnant"
            >
              −
            </button>
            <span className="stepper__val" aria-live="polite">
              {count}
            </span>
            <button
              type="button"
              className="stepper__btn"
              onClick={() => step(1)}
              disabled={count >= MAX_COMPANIONS}
              aria-label="Ajouter un accompagnant"
            >
              +
            </button>
            <span className="stepper__unit">
              {count > 1 ? "accompagnants" : "accompagnant"}
            </span>
          </div>
          {childrenNote && <p className="field__hint">{childrenNote}</p>}
        </div>
      )}
    </div>
  );
}
