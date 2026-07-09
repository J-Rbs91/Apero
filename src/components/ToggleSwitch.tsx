type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Libellé accessible (le texte visible vit à côté, dans la ligne). */
  label: string;
  id?: string;
};

/**
 * Interrupteur discret pour un réglage secondaire (mioches conviés, venir
 * accompagné…). Volontairement léger : il ne doit pas rivaliser avec les CTA
 * primaires — pas de grosse pastille pleine, juste une bascule.
 */
export function ToggleSwitch({ checked, onChange, label, id }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={checked ? "switch switch--on" : "switch"}
      onClick={() => onChange(!checked)}
    >
      <span className="switch__knob" aria-hidden="true" />
    </button>
  );
}
