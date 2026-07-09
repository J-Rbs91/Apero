import { ToggleSwitch } from "./ToggleSwitch";
import { MAX_COMPANIONS } from "../utils/aperoValidation";

type CompanionsFieldProps = {
  /** Nombre de renforts (undefined = le convive vient en solo). */
  companions: number | undefined;
  onChange: (companions: number | undefined) => void;
  /** Politique mioches de l'apéro, pour ajuster le petit laïus. */
  childrenAllowed?: boolean;
};

/**
 * Bloc « tu ramènes du monde ? » de la réponse : réglage secondaire, donc
 * interrupteur discret plutôt que grosses pastilles. Coché, on révèle le
 * compteur de pièces rapportées au +/-.
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

  const miocheNote = childrenAllowed
    ? " Les mioches comptent dans le lot."
    : childrenAllowed === false
      ? " C’est sans les mioches ce coup-ci : on parle de renforts en âge de trinquer."
      : "";

  return (
    <div className="setting">
      <div className="switchrow">
        <label className="switchrow__label" htmlFor="companions-toggle">
          <span className="switchrow__title">Tu débarques accompagné·e ?</span>
          <span className="switchrow__state">
            {accompanied ? "En escadron" : "Peinard, en solo"}
          </span>
        </label>
        <ToggleSwitch
          id="companions-toggle"
          checked={accompanied}
          onChange={setAccompanied}
          label="Tu débarques accompagné·e ?"
        />
      </div>

      {accompanied && (
        <div className="companions">
          <div className="stepper" role="group" aria-label="Nombre de renforts">
            <button
              type="button"
              className="stepper__btn"
              onClick={() => step(-1)}
              disabled={count <= 1}
              aria-label="Un renfort de moins"
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
              aria-label="Un renfort de plus"
            >
              +
            </button>
            <span className="stepper__unit">
              {count > 1 ? "renforts" : "renfort"}
            </span>
          </div>
          <p className="hint">
            Le nombre de bouches en plus, qu’on prévoie assez de cacahuètes.{miocheNote}
          </p>
        </div>
      )}
    </div>
  );
}
