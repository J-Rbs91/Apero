import { useId } from "react";

type SwitchRowProps = {
  /** Question posée, en clair. */
  title: string;
  /** Ce que vaut le réglage tel qu'il est réglé maintenant. */
  state: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Précision facultative sous la ligne. */
  hint?: string;
};

/**
 * Réglage oui/non : la ligne entière est cliquable et annonce son état en
 * toutes lettres. Une bascule seule ne dit pas ce qu'elle vaut ; celle-ci
 * porte son résultat à côté d'elle.
 */
export function SwitchRow({ title, state, checked, onChange, hint }: SwitchRowProps) {
  const switchId = `switch-${useId()}`;

  return (
    <div className="switchrow">
      <button
        type="button"
        id={switchId}
        role="switch"
        aria-checked={checked}
        className={`switchrow__button${checked ? " switchrow__button--on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span className="switchrow__text">
          <span className="switchrow__title">{title}</span>
          <span className="switchrow__state">{state}</span>
        </span>
        <span className="switch" aria-hidden="true">
          <span className="switch__knob" />
        </span>
      </button>
      {hint && <p className="field__hint">{hint}</p>}
    </div>
  );
}
