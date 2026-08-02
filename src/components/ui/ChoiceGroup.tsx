import { useId } from "react";
import type { FieldRequirement } from "./Field";

/** Teinte d'une option retenue : neutre par défaut, accent pour un oui. */
export type ChoiceTone = "accent" | "neutral" | "warn" | "danger";

export type ChoiceOption<TValue extends string> = {
  value: TValue;
  label: string;
  /** Une ligne d'explication sous le libellé, quand le mot seul ne suffit pas. */
  description?: string;
  tone?: ChoiceTone;
};

type ChoiceGroupProps<TValue extends string> = {
  /** Nom technique du groupe de radios (unicité du groupe dans la page). */
  name: string;
  /** Libellé visible du groupe, annoncé aussi aux lecteurs d'écran. */
  legend: string;
  /**
   * Précision réservée aux lecteurs d'écran, accolée à la légende : sans elle,
   * dix groupes « Ta réponse » se ressemblent tous à l'oreille.
   */
  legendDetail?: string;
  options: ChoiceOption<TValue>[];
  value: TValue | "";
  onChange: (value: TValue) => void;
  requirement?: FieldRequirement;
  hint?: string;
  error?: string;
  /** « row » : trois pastilles côte à côte. « stack » : une par ligne. */
  layout?: "row" | "stack";
  /** Masque le libellé du groupe quand le contexte le porte déjà. */
  hideLegend?: boolean;
};

const requirementLabel: Record<FieldRequirement, string> = {
  required: "Obligatoire",
  optional: "Facultatif",
};

/**
 * Groupe de choix visible comme tel : des cartes cochables, pas un menu
 * déroulant qui ressemble à un champ de texte. Chaque option montre son état
 * (pastille vide ou cochée) et l'option retenue est remplie.
 */
export function ChoiceGroup<TValue extends string>({
  name,
  legend,
  legendDetail,
  options,
  value,
  onChange,
  requirement,
  hint,
  error,
  layout = "stack",
  hideLegend = false,
}: ChoiceGroupProps<TValue>) {
  const reactId = useId();
  const hintId = hint ? `choice-${reactId}-hint` : undefined;
  const errorId = error ? `choice-${reactId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <fieldset
      className={`choicegroup${error ? " choicegroup--invalid" : ""}`}
      aria-describedby={describedBy}
    >
      <legend className={hideLegend ? "choicegroup__legend sr-only" : "choicegroup__legend"}>
        <span className="field__name">
          {legend}
          {legendDetail && <span className="sr-only"> ({legendDetail})</span>}
        </span>
        {requirement && (
          <span className={`field__req field__req--${requirement}`}>
            {requirementLabel[requirement]}
          </span>
        )}
      </legend>
      {hint && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      <div className={`choices choices--${layout}`}>
        {options.map((option) => {
          const isPicked = value === option.value;
          return (
            <label
              key={option.value}
              className={`choice choice--${option.tone ?? "neutral"}${isPicked ? " choice--on" : ""}`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={isPicked}
                // Porté par les radios plutôt que par le <fieldset> : c'est ce
                // qui permet au formulaire de venir poser le focus ici quand
                // il remonte sur le bloc refusé.
                aria-invalid={error ? true : undefined}
                onChange={() => onChange(option.value)}
              />
              <span className="choice__mark" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                  <path
                    d="M5 12.5l4.2 4.3L19 7.5"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className="choice__body">
                <span className="choice__label">{option.label}</span>
                {option.description && (
                  <span className="choice__desc">{option.description}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p className="field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
