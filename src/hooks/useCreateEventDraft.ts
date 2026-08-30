import { useCallback, useRef, useState } from "react";
import type { AperitifOption, AperoRecurrence } from "../types/apero";

export type CreateEventDraft = {
  ceremonialNameInput: string;
  title: string;
  childrenAllowed: boolean;
  recurrence: AperoRecurrence | "once";
  options: AperitifOption[];
};

// Historique : rien avant cette clé, donc pas de format antérieur à migrer.
const STORAGE_KEY = "apero_create_draft_v1";

function isDraftEmpty(draft: CreateEventDraft): boolean {
  const hasSlotContent = draft.options.some(
    (option) => option.date || option.time || option.location.trim(),
  );
  return (
    !draft.ceremonialNameInput.trim() &&
    !draft.title.trim() &&
    !draft.childrenAllowed &&
    draft.recurrence === "once" &&
    !hasSlotContent
  );
}

function readStoredDraft(): CreateEventDraft | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<CreateEventDraft> | null;
    if (!parsed || !Array.isArray(parsed.options)) {
      return null;
    }
    return {
      ceremonialNameInput: parsed.ceremonialNameInput ?? "",
      title: parsed.title ?? "",
      childrenAllowed: Boolean(parsed.childrenAllowed),
      recurrence: parsed.recurrence ?? "once",
      options: parsed.options,
    };
  } catch {
    // Brouillon corrompu (JSON invalide, quota dépassé côté lecture d'un
    // autre onglet) : on repart d'un formulaire vierge plutôt que de planter.
    return null;
  }
}

/**
 * Persiste le formulaire de création dans localStorage pour survivre à une
 * interruption (rechargement, appli déchargée en arrière-plan par le système
 * mobile). Des trois formulaires de saisie de créneau, celui-ci est le seul
 * assez long — plusieurs créneaux, chacun jour + heure + lieu — pour que
 * perdre son contenu à l'interruption coûte réellement une reprise complète.
 *
 * `skip` désactive la relecture : un pré-remplissage explicite (« Remettre
 * ça ») transporte déjà l'état voulu, un vieux brouillon ne doit pas
 * l'écraser.
 */
export function useCreateEventDraft(skip: boolean) {
  const initialDraft = useRef<CreateEventDraft | null>(skip ? null : readStoredDraft());
  const [hasRestoredDraft] = useState(
    () => initialDraft.current !== null && !isDraftEmpty(initialDraft.current),
  );

  const saveDraft = useCallback((draft: CreateEventDraft) => {
    if (typeof window === "undefined") {
      return;
    }
    if (isDraftEmpty(draft)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Stockage plein ou bloqué : la saisie continue normalement en
      // mémoire, seule la reprise après interruption est perdue.
    }
  }, []);

  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { initialDraft: initialDraft.current, hasRestoredDraft, saveDraft, clearDraft };
}
