import { useCallback, useEffect, useState } from "react";
import { normalizeDisplayName } from "../utils/memberName";

export const GENTLEMAN_NAME_STORAGE_KEY = "apero_gentleman_name";
export const GENTLEMAN_NAME_CHANGE_EVENT = "apero:gentleman-name-change";
export const GENTLEMAN_NAME_EDIT_EVENT = "apero:gentleman-name-edit";

export function getStoredGentlemanName(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(GENTLEMAN_NAME_STORAGE_KEY) ?? "";
}

function emitGentlemanNameChange(name: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(GENTLEMAN_NAME_CHANGE_EVENT, { detail: name }));
}

export function requestGentlemanNameEdit() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(GENTLEMAN_NAME_EDIT_EVENT));
}

export function useGentlemanName() {
  const [gentlemanName, setGentlemanNameState] = useState(getStoredGentlemanName);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === GENTLEMAN_NAME_STORAGE_KEY) {
        setGentlemanNameState(event.newValue ?? "");
      }
    }

    function handleLocalChange(event: Event) {
      setGentlemanNameState((event as CustomEvent<string>).detail ?? getStoredGentlemanName());
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(GENTLEMAN_NAME_CHANGE_EVENT, handleLocalChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(GENTLEMAN_NAME_CHANGE_EVENT, handleLocalChange);
    };
  }, []);

  const setGentlemanName = useCallback((name: string) => {
    const normalizedName = normalizeDisplayName(name);

    if (!normalizedName) {
      return "";
    }

    window.localStorage.setItem(GENTLEMAN_NAME_STORAGE_KEY, normalizedName);
    setGentlemanNameState(normalizedName);
    emitGentlemanNameChange(normalizedName);
    return normalizedName;
  }, []);

  const clearGentlemanName = useCallback(() => {
    window.localStorage.removeItem(GENTLEMAN_NAME_STORAGE_KEY);
    setGentlemanNameState("");
    emitGentlemanNameChange("");
  }, []);

  return {
    gentlemanName,
    setGentlemanName,
    clearGentlemanName,
    requestGentlemanNameEdit,
  };
}
