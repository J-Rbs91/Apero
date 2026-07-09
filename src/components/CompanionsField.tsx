import { BinaryChoice } from "./BinaryChoice";
import { MAX_COMPANIONS } from "../utils/aperoValidation";

type CompanionsFieldProps = {
  /** Nombre de renforts (undefined = le convive vient en solo). */
  companions: number | undefined;
  onChange: (companions: number | undefined) => void;
  /** Politique mioches de l'apéro, pour ajuster le petit laïus. */
  childrenAllowed?: boolean;
};

/**
 * Bloc « tu ramènes du monde ? » de la réponse à l'invitation : on coche d'abord
 * solo/escorté, puis, si escorté, on compte les pièces rapportées au +/-.
 */
export function CompanionsField({
  companions,
  onChange,
  childrenAllowed,
}: CompanionsFieldProps) {
  const accompanied = companions != null;
  const count = companions ?? 1;

  function setAccompanied(next: boolean) {
    // « Escorté » démarre à un renfort ; « solo » efface le compteur.
    onChange(next ? Math.min(Math.max(count, 1), MAX_COMPANIONS) : undefined);
  }

  function step(delta: number) {
    const next = Math.min(Math.max(count + delta, 1), MAX_COMPANIONS);
    onChange(next);
  }

  const miocheNote = childrenAllowed
    ? " Les mioches comptent dans le lot : ils carburent au diabolo mais grignotent comme quatre."
    : childrenAllowed === false
      ? " Petit rappel : c’est sans les mioches ce coup-ci, donc on parle bien de renforts en âge de trinquer."
      : "";

  return (
    <div className="field">
      <span>Tu débarques seul·e ou en escadron ?</span>
      <BinaryChoice
        name="Tu débarques seul ou accompagné ?"
        value={accompanied}
        onChange={setAccompanied}
        yesLabel="En escadron"
        noLabel="Peinard, en solo"
      />
      {accompanied && (
        <div className="companions">
          <p className="lbl">Combien de renforts ?</p>
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
          </div>
          <p className="person__sub">
            Annonce le nombre de bouches en plus, qu’on prévoie assez de cacahuètes
            et qu’on n’ait pas à couper les olives en quatre.{miocheNote}
          </p>
        </div>
      )}
    </div>
  );
}
