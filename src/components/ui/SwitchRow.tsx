import { useId } from "react";

type SwitchRowProps = {
  /** Question posée, en clair. */
  title: string;
  /**
   * Ce que vaut le réglage tel qu'il est réglé maintenant. Réponse à la
   * question du titre, tenue courte : c'est le seul texte de la ligne qui
   * change quand on bascule, et il se relit à chaque passage.
   */
  state: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /**
   * Commentaire de la maison sur l'état courant, posé sous la ligne plutôt
   * que dans le bouton. Il accompagne le réglage sans être ce qu'on lit pour
   * décider — d'où sa place et son échelle, un cran sous l'aide.
   */
  aside?: string;
  /** Précision facultative sous la ligne. */
  hint?: string;
};

/**
 * Réglage oui/non : la ligne entière est cliquable et annonce son état.
 * Une bascule seule ne dit pas ce qu'elle vaut ; celle-ci porte sa réponse à
 * côté d'elle, et laisse ce qui n'est pas la réponse sortir du bouton.
 */
export function SwitchRow({
  title,
  state,
  checked,
  onChange,
  aside,
  hint,
}: SwitchRowProps) {
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
      {aside && <p className="switchrow__aside">{aside}</p>}
      {hint && <p className="field__hint">{hint}</p>}
    </div>
  );
}
