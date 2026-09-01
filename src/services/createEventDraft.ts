// Brouillon local du formulaire de création d'apéro.
//
// Raison d'être : sans lui, tout ce qui ferme l'onglet ou recharge la page —
// appel entrant, bascule d'application, tap malheureux sur « recharger » —
// fait repartir la saisie de zéro, y compris les recherches de lieu, qui sont
// le geste le plus coûteux du formulaire.
//
// Ce brouillon ne contient que ce que l'utilisateur a tapé : aucune clé,
// aucun identifiant d'apéro. Ces objets-là n'existent pas encore au moment où
// le brouillon vit — l'apéro n'est créé qu'à l'envoi.

import type { AperitifOption, AperoRecurrence } from "../types/apero";

export const CREATE_EVENT_DRAFT_STORAGE_KEY = "apero_create_draft_v1";

/** Au-delà, le brouillon est ignoré et effacé : un formulaire qui se repeuple
 *  tout seul trois semaines plus tard est une surprise, pas un service. */
export const CREATE_EVENT_DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type CreateEventDraft = {
  ceremonialName: string;
  title: string;
  childrenAllowed: boolean;
  recurrence: AperoRecurrence | "once";
  options: AperitifOption[];
  updatedAt: string;
};

const RECURRENCE_VALUES: ReadonlyArray<CreateEventDraft["recurrence"]> = [
  "once",
  "weekly",
  "biweekly",
  "monthly",
];

function getStorage(): Storage | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }
  return window.localStorage;
}

function isDraftOption(value: unknown): value is AperitifOption {
  const option = value as AperitifOption | null;

  return Boolean(
    option &&
      typeof option === "object" &&
      typeof option.id === "string" &&
      option.id.length > 0 &&
      typeof option.date === "string" &&
      typeof option.time === "string" &&
      typeof option.location === "string",
  );
}

function isDraft(value: unknown): value is CreateEventDraft {
  const draft = value as CreateEventDraft | null;

  return Boolean(
    draft &&
      typeof draft === "object" &&
      typeof draft.ceremonialName === "string" &&
      typeof draft.title === "string" &&
      typeof draft.childrenAllowed === "boolean" &&
      RECURRENCE_VALUES.includes(draft.recurrence) &&
      Array.isArray(draft.options) &&
      draft.options.length > 0 &&
      draft.options.every(isDraftOption) &&
      typeof draft.updatedAt === "string" &&
      !Number.isNaN(Date.parse(draft.updatedAt)),
  );
}

/**
 * Un brouillon ne vaut d'être gardé que s'il contient quelque chose à
 * retrouver. Un formulaire simplement ouvert puis quitté n'en produit pas :
 * proposer une reprise sur du vide serait du bruit.
 */
export function hasDraftContent(draft: Omit<CreateEventDraft, "updatedAt">): boolean {
  return Boolean(
    draft.ceremonialName.trim() ||
      draft.title.trim() ||
      draft.childrenAllowed ||
      draft.recurrence !== "once" ||
      draft.options.some(
        (option) => option.date.trim() || option.time.trim() || option.location.trim(),
      ),
  );
}

export function clearCreateEventDraft(): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(CREATE_EVENT_DRAFT_STORAGE_KEY);
  } catch {
    // Stockage inaccessible : rien à faire, et surtout rien à casser.
  }
}

/**
 * Lit le brouillon en attente. Renvoie `null` — et efface ce qui traîne — dès
 * que le contenu est illisible, vide ou périmé : on ne restaure jamais une
 * saisie dont on n'est pas sûr qu'elle soit celle de l'utilisateur.
 */
export function readCreateEventDraft(now: number = Date.now()): CreateEventDraft | null {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  let parsed: unknown;

  try {
    const raw = storage.getItem(CREATE_EVENT_DRAFT_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    parsed = JSON.parse(raw);
  } catch {
    clearCreateEventDraft();
    return null;
  }

  if (!isDraft(parsed)) {
    clearCreateEventDraft();
    return null;
  }

  if (now - Date.parse(parsed.updatedAt) > CREATE_EVENT_DRAFT_MAX_AGE_MS) {
    clearCreateEventDraft();
    return null;
  }

  if (!hasDraftContent(parsed)) {
    clearCreateEventDraft();
    return null;
  }

  return parsed;
}

/**
 * Enregistre le brouillon, ou l'efface s'il n'y a plus rien dedans (le
 * formulaire vidé à la main ne doit pas laisser un fantôme derrière lui).
 *
 * Une écriture qui échoue — stockage plein, mode privé — ne remonte pas :
 * la saisie en cours continue de fonctionner. C'est aussi pour cela que le
 * message de reprise ne s'affiche que sur un brouillon réellement relu, jamais
 * sur la foi d'une sauvegarde supposée.
 */
export function saveCreateEventDraft(
  draft: Omit<CreateEventDraft, "updatedAt">,
  now: Date = new Date(),
): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  if (!hasDraftContent(draft)) {
    clearCreateEventDraft();
    return;
  }

  try {
    storage.setItem(
      CREATE_EVENT_DRAFT_STORAGE_KEY,
      JSON.stringify({ ...draft, updatedAt: now.toISOString() }),
    );
  } catch {
    // localStorage plein ou bloqué : on ne casse pas le flux appelant.
  }
}
