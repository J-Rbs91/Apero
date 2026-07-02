import { useCallback, useEffect, useState } from "react";
import { normalizeDisplayName } from "../utils/memberName";

// La clé garde sa valeur historique pour que les habitués ne perdent pas
// le blaze déjà gravé dans leur localStorage.
export const COMPTOIR_NAME_STORAGE_KEY = "apero_gentleman_name";
export const COMPTOIR_NAME_CHANGE_EVENT = "apero:comptoir-name-change";
export const COMPTOIR_NAME_EDIT_EVENT = "apero:comptoir-name-edit";

export function getStoredComptoirName(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(COMPTOIR_NAME_STORAGE_KEY) ?? "";
}

function emitComptoirNameChange(name: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(COMPTOIR_NAME_CHANGE_EVENT, { detail: name }));
}

export function requestComptoirNameEdit() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(COMPTOIR_NAME_EDIT_EVENT));
}

export function useComptoirName() {
  const [comptoirName, setComptoirNameState] = useState(getStoredComptoirName);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === COMPTOIR_NAME_STORAGE_KEY) {
        setComptoirNameState(event.newValue ?? "");
      }
    }

    function handleLocalChange(event: Event) {
      setComptoirNameState((event as CustomEvent<string>).detail ?? getStoredComptoirName());
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(COMPTOIR_NAME_CHANGE_EVENT, handleLocalChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(COMPTOIR_NAME_CHANGE_EVENT, handleLocalChange);
    };
  }, []);

  const setComptoirName = useCallback((name: string) => {
    const normalizedName = normalizeDisplayName(name);

    if (!normalizedName) {
      return "";
    }

    window.localStorage.setItem(COMPTOIR_NAME_STORAGE_KEY, normalizedName);
    setComptoirNameState(normalizedName);
    emitComptoirNameChange(normalizedName);
    return normalizedName;
  }, []);

  const clearComptoirName = useCallback(() => {
    window.localStorage.removeItem(COMPTOIR_NAME_STORAGE_KEY);
    setComptoirNameState("");
    emitComptoirNameChange("");
  }, []);

  return {
    comptoirName,
    setComptoirName,
    clearComptoirName,
    requestComptoirNameEdit,
  };
}
