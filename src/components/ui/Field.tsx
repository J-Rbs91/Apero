import { useId, type ReactNode } from "react";

/**
 * Attributs à recopier sur le contrôle (input, textarea, select, composant
 * maison) : identifiant, description, état d'erreur. Le champ fabrique les
 * identifiants, le contrôle n'a qu'à les porter — impossible d'oublier le
 * lien libellé/aide/erreur.
 */
export type FieldControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

/** Statut de saisie affiché en clair à côté du libellé. */
export type FieldRequirement = "required" | "optional";

type FieldProps = {
  label: string;
  /**
   * Dit noir sur blanc si le champ doit être rempli. Le reproche numéro un de
   * l'ancienne interface : on ne savait pas ce qui était attendu.
   */
  requirement?: FieldRequirement;
  /** Phrase d'aide sous le libellé : quoi mettre, dans quel format. */
  hint?: string;
  /** Erreur de ce champ précis, affichée sous le contrôle. */
  error?: string;
  /** Le contrôle, fabriqué avec les attributs fournis. */
  children: (control: FieldControlProps) => ReactNode;
  className?: string;
};

const requirementLabel: Record<FieldRequirement, string> = {
  required: "Obligatoire",
  optional: "Facultatif",
};

export function Field({
  label,
  requirement,
  hint,
  error,
  children,
  className,
}: FieldProps) {
  const reactId = useId();
  const controlId = `field-${reactId}`;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`field${error ? " field--invalid" : ""}${className ? ` ${className}` : ""}`}>
      <label className="field__label" htmlFor={controlId}>
        <span className="field__name">{label}</span>
        {requirement && (
          <span className={`field__req field__req--${requirement}`}>
            {requirementLabel[requirement]}
          </span>
        )}
      </label>
      {hint && (
        <p className="field__hint" id={hintId}>
          {hint}
        </p>
      )}
      {children({
        id: controlId,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}
      {error && (
        <p className="field__error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

type TextFieldProps = Omit<FieldProps, "children"> & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  type?: "text" | "date" | "time";
  autoComplete?: string;
  inputMode?: "text" | "numeric";
};

export function TextField({
  value,
  onChange,
  placeholder,
  maxLength,
  type = "text",
  autoComplete,
  inputMode,
  ...fieldProps
}: TextFieldProps) {
  return (
    <Field {...fieldProps}>
      {(control) => (
        <input
          {...control}
          type={type}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          onChange={(changeEvent) => onChange(changeEvent.target.value)}
        />
      )}
    </Field>
  );
}

type TextAreaFieldProps = Omit<FieldProps, "children"> & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
};

export function TextAreaField({
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 3,
  ...fieldProps
}: TextAreaFieldProps) {
  return (
    <Field {...fieldProps}>
      {(control) => (
        <textarea
          {...control}
          value={value}
          rows={rows}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(changeEvent) => onChange(changeEvent.target.value)}
        />
      )}
    </Field>
  );
}
