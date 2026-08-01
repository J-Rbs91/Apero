import { useState } from "react";
import type { AperoRecurrence } from "../types/apero";
import type { AperoSettings } from "../utils/eventNormalization";
import { hapticError, hapticSuccess } from "../utils/haptics";
import { ToggleSwitch } from "./ToggleSwitch";

type AperoSettingsFormProps = {
  /** Réglages actuels de l'apéro, qui pré-remplissent le formulaire. */
  settings: AperoSettings;
  isSaving: boolean;
  /** Ouverture pilotée par la page : le déclencheur vit sous l'en-tête. */
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (settings: AperoSettings) => Promise<void>;
};

/**
 * Retouche des réglages d'un apéro déjà convoqué, réservée à son auteur :
 * un mauvais aiguillage (les mioches conviés alors qu'ils ne l'étaient pas,
 * un prétexte de travers) se corrige sans annuler et reconvoquer toute la
 * tablée. Les créneaux n'y sont pas : les votes y sont accrochés, ils se
 * modifient par contre-proposition.
 */
export function AperoSettingsForm({
  settings,
  isSaving,
  isOpen,
  onClose,
  onSubmit,
}: AperoSettingsFormProps) {
  // Le formulaire se remonte à chaque ouverture (clé côté page) : l'état part
  // donc toujours des réglages tels qu'ils sont gravés au registre.
  const [ceremonialName, setCeremonialName] = useState(settings.ceremonialName);
  const [title, setTitle] = useState(settings.title ?? "");
  const [childrenAllowed, setChildrenAllowed] = useState(settings.childrenAllowed ?? false);
  const [recurrence, setRecurrence] = useState<AperoRecurrence | "">(settings.recurrence ?? "");
  const [feedback, setFeedback] = useState("");

  async function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const trimmedCeremonialName = ceremonialName.trim();

    if (!trimmedCeremonialName) {
      hapticError();
      setFeedback("Un apéro sans nom, ça ne se convoque pas. Garde l’ancien ou trouve mieux.");
      return;
    }

    try {
      await onSubmit({
        ceremonialName: trimmedCeremonialName,
        title: title.trim() || undefined,
        childrenAllowed,
        recurrence: recurrence || undefined,
      });
    } catch (submitError) {
      // Échec d'écriture : la saisie reste en place, l'explication s'affiche
      // ici. On ne referme jamais un formulaire dont rien n'est arrivé.
      hapticError();
      setFeedback(
        submitError instanceof Error && submitError.message
          ? submitError.message
          : "La retouche n’est pas arrivée au registre. Ta saisie reste là, réessaie.",
      );
      return;
    }

    hapticSuccess();
    setFeedback("");
    onClose();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <section className="sheet">
      <p className="eyebrow">Retoucher l’apéro</p>

      <form onSubmit={handleSubmit}>
        <label className="field">
          <span>Nom de l’apéro</span>
          <input
            value={ceremonialName}
            maxLength={160}
            onChange={(eventChange) => setCeremonialName(eventChange.target.value)}
            placeholder="La Grande Tablée des Olives"
          />
        </label>

        <label className="field">
          <span>Le prétexte</span>
          <input
            value={title}
            maxLength={160}
            onChange={(eventChange) => setTitle(eventChange.target.value)}
            placeholder="Apéro fin de chantier"
          />
        </label>

        <div className="setting">
          <div className="switchrow">
            <label className="switchrow__label" htmlFor="edit-children-allowed">
              <span className="switchrow__title">Les mioches sont-ils conviés ?</span>
              <span className="switchrow__state">
                {childrenAllowed ? "Marmaille admise" : "Ce soir c’est sans les mômes"}
              </span>
            </label>
            <ToggleSwitch
              id="edit-children-allowed"
              checked={childrenAllowed}
              onChange={setChildrenAllowed}
              label="Les mioches sont-ils conviés ?"
            />
          </div>
        </div>
        {settings.childrenAllowed == null && (
          <p className="hint">
            Rien n’avait été précisé jusqu’ici sur les mioches : enregistrer tranchera la
            question pour toute la tablée.
          </p>
        )}

        <label className="field">
          <span>Ça se reproduit ?</span>
          <select
            value={recurrence}
            onChange={(eventChange) =>
              setRecurrence(eventChange.target.value as AperoRecurrence | "")
            }
          >
            <option value="">Une fois, on verra après</option>
            <option value="weekly">Chaque semaine</option>
            <option value="biweekly">Toutes les deux semaines</option>
            <option value="monthly">Chaque mois</option>
          </select>
        </label>

        <p className="hint">
          Les créneaux ne se retouchent pas ici : les votes y sont accrochés. Pour changer
          l’heure ou le troquet, propose un autre créneau.
        </p>

        <div className="button-row">
          <button className="button button--primary" disabled={isSaving} type="submit">
            {isSaving ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button className="button button--ghost" type="button" onClick={onClose}>
            Annuler
          </button>
        </div>
      </form>

      {feedback && (
        <p className="feedback" role="alert">
          {feedback}
        </p>
      )}
    </section>
  );
}
