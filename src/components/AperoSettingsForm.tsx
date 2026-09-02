import { useState } from "react";
import type { AperoRecurrence } from "../types/apero";
import type { AperoSettings } from "../utils/eventNormalization";
import { hapticError, hapticSuccess } from "../utils/haptics";
import { ActionBar, ChoiceGroup, FormSheet, SwitchRow, TextField, type ChoiceOption } from "./ui";

type RecurrenceChoice = AperoRecurrence | "once";

const recurrenceChoices: ChoiceOption<RecurrenceChoice>[] = [
  { value: "once", label: "Une seule fois", description: "On verra bien après." },
  { value: "weekly", label: "Chaque semaine", description: "Le rituel hebdomadaire." },
  { value: "biweekly", label: "Une semaine sur deux" },
  { value: "monthly", label: "Chaque mois" },
];

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
  const [recurrence, setRecurrence] = useState<RecurrenceChoice>(settings.recurrence ?? "once");
  const [feedback, setFeedback] = useState("");
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  const trimmedCeremonialName = ceremonialName.trim();
  const isReady = Boolean(trimmedCeremonialName);

  async function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setHasTriedSubmit(true);

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
        recurrence: recurrence === "once" ? undefined : recurrence,
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
    setHasTriedSubmit(false);
    onClose();
  }

  return (
    <FormSheet
      isOpen={isOpen}
      title="Retoucher l’apéro"
      lead="Le nom, le prétexte et les règles. Les créneaux, eux, ne bougent plus."
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <ActionBar
          status={
            isReady
              ? "La tablée sera prévenue du changement."
              : "Le nom de l’apéro ne peut pas rester vide."
          }
          tone={isReady ? "ready" : hasTriedSubmit ? "blocked" : "neutral"}
          secondary={
            <button type="button" className="ghost-link" onClick={onClose}>
              Annuler les retouches
            </button>
          }
        >
          <button className="button button--primary" disabled={isSaving} type="submit">
            {isSaving ? "Enregistrement…" : "Enregistrer les retouches"}
          </button>
        </ActionBar>
      }
    >
      <TextField
        label="Nom de l’apéro"
        requirement="required"
        value={ceremonialName}
        maxLength={160}
        placeholder="La Grande Tablée des Olives"
        error={hasTriedSubmit && !isReady ? "Donne-lui un nom." : undefined}
        onChange={setCeremonialName}
      />

      <TextField
        label="Le prétexte"
        requirement="optional"
        value={title}
        maxLength={160}
        placeholder="Apéro fin de chantier"
        onChange={setTitle}
      />

      <SwitchRow
        title="Les mioches sont-ils conviés ?"
        state={childrenAllowed ? "Oui" : "Non"}
        aside={childrenAllowed ? "Marmaille admise" : "Ce soir c’est sans les mômes"}
        checked={childrenAllowed}
        onChange={setChildrenAllowed}
        hint={
          settings.childrenAllowed == null
            ? "Rien n’avait été précisé jusqu’ici : enregistrer tranchera la question pour toute la tablée."
            : undefined
        }
      />

      <ChoiceGroup
        name="edit-recurrence"
        legend="Ça se reproduit ?"
        requirement="optional"
        options={recurrenceChoices}
        value={recurrence}
        onChange={setRecurrence}
      />

      <p className="field__hint">
        Les créneaux ne se retouchent pas ici : les votes y sont accrochés. Pour changer
        l’heure ou le troquet, propose un autre créneau.
      </p>

      {feedback && (
        <p className="feedback" role="alert">
          {feedback}
        </p>
      )}
    </FormSheet>
  );
}
