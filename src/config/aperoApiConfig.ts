// Configuration du nouveau flux « API VPS ».
// Aucune de ces variables n'est un secret : l'URL de l'API et le mode de
// stockage sont publics par nature. Le token GitHub, lui, ne vit QUE côté
// serveur (voir server/) et ne doit jamais réapparaître ici.

export type AperoStorageMode = "legacy-github" | "api-vps";

export function getAperoStorageMode(): AperoStorageMode {
  // Le mode sur API VPS est le chemin par defaut : aucun token GitHub ne doit
  // pouvoir repartir dans un build frontend par accident.
  return import.meta.env.VITE_APERO_STORAGE_MODE === "legacy-github"
    ? "legacy-github"
    : "api-vps";
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
