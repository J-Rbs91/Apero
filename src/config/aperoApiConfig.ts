// Configuration du nouveau flux « API VPS ».
// Aucune de ces variables n'est un secret : l'URL de l'API et le mode de
// stockage sont publics par nature. Le token GitHub, lui, ne vit QUE côté
// serveur (voir server/) et ne doit jamais réapparaître ici.

export type AperoStorageMode = "legacy-github" | "api-vps";

export function getAperoStorageMode(): AperoStorageMode {
  // Toute valeur absente ou inconnue retombe sur le mode historique :
  // c'est le comportement le moins risqué tant que la migration n'est pas validée.
  return import.meta.env.VITE_APERO_STORAGE_MODE === "api-vps" ? "api-vps" : "legacy-github";
}

export function getAperoApiBaseUrl(): string {
  const rawBaseUrl = import.meta.env.VITE_APERO_API_BASE_URL;
  return typeof rawBaseUrl === "string" ? rawBaseUrl.trim().replace(/\/+$/, "") : "";
}

export function isAperoApiConfigured(): boolean {
  return getAperoApiBaseUrl().length > 0;
}

export function getAppBaseUrl(): string {
  const rawBaseUrl = import.meta.env.VITE_APP_BASE_URL;
  return typeof rawBaseUrl === "string" ? rawBaseUrl.trim().replace(/\/+$/, "") : "";
}
