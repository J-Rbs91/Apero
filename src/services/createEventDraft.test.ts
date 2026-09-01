import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  CREATE_EVENT_DRAFT_MAX_AGE_MS,
  CREATE_EVENT_DRAFT_STORAGE_KEY,
  clearCreateEventDraft,
  hasDraftContent,
  readCreateEventDraft,
  saveCreateEventDraft,
  type CreateEventDraft,
} from "./createEventDraft";

// Pas de jsdom dans ce dépôt : le localStorage est un stub global, comme dans
// les tests de registryVault.
function createStorageStub(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    removeItem: (key: string) => void map.delete(key),
    setItem: (key: string, value: string) => void map.set(key, value),
  } as Storage;
}

function draftBody(): Omit<CreateEventDraft, "updatedAt"> {
  return {
    ceremonialName: "La Grande Tablée des Olives",
    title: "",
    childrenAllowed: false,
    recurrence: "once",
    options: [{ id: "option_1", date: "2030-01-01", time: "19:00", location: "Le Bar du Coin" }],
  };
}

describe("createEventDraft", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { localStorage: createStorageStub() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("relit ce qui vient d'être écrit", () => {
    saveCreateEventDraft(draftBody());

    const draft = readCreateEventDraft();

    expect(draft?.ceremonialName).toBe("La Grande Tablée des Olives");
    expect(draft?.options).toHaveLength(1);
    expect(draft?.options[0].location).toBe("Le Bar du Coin");
  });

  it("n'écrit rien pour un formulaire vide, et efface un brouillon vidé à la main", () => {
    saveCreateEventDraft(draftBody());
    expect(readCreateEventDraft()).not.toBeNull();

    saveCreateEventDraft({
      ceremonialName: "",
      title: "",
      childrenAllowed: false,
      recurrence: "once",
      options: [{ id: "option_1", date: "", time: "", location: "" }],
    });

    expect(window.localStorage.getItem(CREATE_EVENT_DRAFT_STORAGE_KEY)).toBeNull();
  });

  it("garde un brouillon dont seul un réglage a bougé", () => {
    // Cocher « les mioches sont conviés » est une saisie comme une autre : la
    // perdre au rechargement serait aussi désagréable que perdre un créneau.
    saveCreateEventDraft({
      ceremonialName: "",
      title: "",
      childrenAllowed: true,
      recurrence: "once",
      options: [{ id: "option_1", date: "", time: "", location: "" }],
    });

    expect(readCreateEventDraft()?.childrenAllowed).toBe(true);
  });

  it("ignore et efface un brouillon plus vieux que 24 h", () => {
    const writtenAt = new Date("2026-09-01T10:00:00.000Z");
    saveCreateEventDraft(draftBody(), writtenAt);

    const justBefore = writtenAt.getTime() + CREATE_EVENT_DRAFT_MAX_AGE_MS - 1_000;
    expect(readCreateEventDraft(justBefore)).not.toBeNull();

    const justAfter = writtenAt.getTime() + CREATE_EVENT_DRAFT_MAX_AGE_MS + 1_000;
    expect(readCreateEventDraft(justAfter)).toBeNull();
    expect(window.localStorage.getItem(CREATE_EVENT_DRAFT_STORAGE_KEY)).toBeNull();
  });

  it("ignore et efface un contenu illisible ou de forme inattendue", () => {
    window.localStorage.setItem(CREATE_EVENT_DRAFT_STORAGE_KEY, "{pas du json");
    expect(readCreateEventDraft()).toBeNull();
    expect(window.localStorage.getItem(CREATE_EVENT_DRAFT_STORAGE_KEY)).toBeNull();

    window.localStorage.setItem(
      CREATE_EVENT_DRAFT_STORAGE_KEY,
      JSON.stringify({ ceremonialName: "x", options: "pas un tableau" }),
    );
    expect(readCreateEventDraft()).toBeNull();

    window.localStorage.setItem(
      CREATE_EVENT_DRAFT_STORAGE_KEY,
      JSON.stringify({ ...draftBody(), recurrence: "tous les jours", updatedAt: new Date().toISOString() }),
    );
    expect(readCreateEventDraft()).toBeNull();
  });

  it("efface sur demande", () => {
    saveCreateEventDraft(draftBody());
    clearCreateEventDraft();

    expect(readCreateEventDraft()).toBeNull();
  });

  it("ne casse pas quand le stockage est indisponible", () => {
    vi.stubGlobal("window", {});

    expect(() => saveCreateEventDraft(draftBody())).not.toThrow();
    expect(readCreateEventDraft()).toBeNull();
    expect(() => clearCreateEventDraft()).not.toThrow();
  });

  it("ne casse pas quand le stockage refuse l'écriture", () => {
    // Mode privé, quota dépassé : la saisie en cours doit continuer de
    // fonctionner, et rien ne doit prétendre avoir été sauvegardé.
    vi.stubGlobal("window", {
      localStorage: {
        ...createStorageStub(),
        setItem: () => {
          throw new Error("QuotaExceededError");
        },
      },
    });

    expect(() => saveCreateEventDraft(draftBody())).not.toThrow();
    expect(readCreateEventDraft()).toBeNull();
  });

  it("hasDraftContent distingue un formulaire touché d'un formulaire vierge", () => {
    const vierge = {
      ceremonialName: "",
      title: "",
      childrenAllowed: false,
      recurrence: "once" as const,
      options: [{ id: "option_1", date: "", time: "", location: "" }],
    };

    expect(hasDraftContent(vierge)).toBe(false);
    expect(hasDraftContent({ ...vierge, title: "   " })).toBe(false);
    expect(hasDraftContent({ ...vierge, title: "Apéro fin de chantier" })).toBe(true);
    expect(hasDraftContent({ ...vierge, recurrence: "weekly" })).toBe(true);
  });
});
