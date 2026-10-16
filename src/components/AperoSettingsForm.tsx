import { useState } from "react";
import type { AperoRecurrence } from "../types/apero";
import type { AperoSettings } from "../utils/eventNormalization";
import { hapticError, hapticSuccess } from "../utils/haptics";
import { ActionBar, ChoiceGroup, FormSheet, SwitchRow, TextField, type ChoiceOption } from "./ui";

type RecurrenceChoice = AperoRecurrence | "once";

const recurrenceChoices: ChoiceOption<RecurrenceChoice>[] = [
  { value: "once", label: "Une fois" },
  { value: "weekly", label: "Hebdomadaire" },
  { value: "biweekly", label: "Bimensuel" },
  { value: "monthly", label: "Mensuel" },
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
      setFeedback("Nom requis.");
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
          : "Envoi échoué. Réessayer.",
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
      title="Réglages"
      onClose={onClose}
      onSubmit={handleSubmit}
      footer={
        <ActionBar
          status={
            isReady
              ? "Convives prévenus après enregistrement."
              : "Nom requis."
          }
          tone={isReady ? "ready" : hasTriedSubmit ? "blocked" : "neutral"}
          secondary={
            <button type="button" className="ghost-link" onClick={onClose}>
              Annuler
            </button>
          }
        >
          <button className="button button--primary" disabled={isSaving} type="submit">
            {isSaving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </ActionBar>
      }
    >
      <TextField
        label="Nom"
        requirement="required"
        value={ceremonialName}
        maxLength={160}
        error={hasTriedSubmit && !isReady ? "Nom requis." : undefined}
        onChange={setCeremonialName}
      />

      <TextField
        label="Objet"
        requirement="optional"
        value={title}
        maxLength={160}
        onChange={setTitle}
      />

      <SwitchRow
        title="Enfants"
        state={childrenAllowed ? "Oui" : "Non"}
        checked={childrenAllowed}
        onChange={setChildrenAllowed}
        hint={settings.childrenAllowed == null ? "Non défini jusqu’ici." : undefined}
      />

      <ChoiceGroup
        name="edit-recurrence"
        legend="Récurrence"
        requirement="optional"
        options={recurrenceChoices}
        value={recurrence}
        onChange={setRecurrence}
      />

      <p className="field__hint">Créneaux non modifiables.</p>

      {feedback && (
        <p className="feedback" role="alert">
          {feedback}
        </p>
      )}
    </FormSheet>
  );
}
