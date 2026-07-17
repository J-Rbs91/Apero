// Client HTTP de la mini API VPS (server/).
// C'est la SEULE porte de sortie des ecritures du nouveau flux : aucun appel
// GitHub authentifie ne doit etre fait depuis le navigateur.
// Interdits absolus : logger writeKey / adminKey / encryptionKey, ou les
// inclure dans un message d'erreur.

import { getAperoApiBaseUrl } from "../config/aperoApiConfig";
import type { EncryptedAperoPayload } from "../types/encryptedApero";

export type AperoApiErrorCode =
  | "API_NOT_CONFIGURED"
  | "NETWORK_ERROR"
  | "INVALID_REQUEST"
  | "WRITE_FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "GITHUB_ERROR"
  | "UNEXPECTED_RESPONSE";

export class AperoApiError extends Error {
  readonly code: AperoApiErrorCode;
  readonly status?: number;
  /** Code d'erreur renvoye par le serveur (ex. INVALID_WRITE_KEY), sans secret. */
  readonly serverCode?: string;

  constructor(code: AperoApiErrorCode, message: string, status?: number, serverCode?: string) {
    super(message);
    this.name = "AperoApiError";
    this.code = code;
    this.status = status;
    this.serverCode = serverCode;
  }
}

export type FetchEncryptedAperoResult =
  /** L'API a servi le fichier chiffre : source de verite. */
  | { status: "ok"; file: unknown; sha: string }
  /** L'apero n'existe pas (ou plus) : un vrai 404 metier, definitif. */
  | { status: "not-found" }
  /**
   * L'API deployee ne connait pas la route GET (version anterieure au
   * stockage VPS), ou aucune API n'est configuree : au client de se replier
   * sur la lecture publique GitHub, le temps de la transition.
   */
  | { status: "endpoint-missing" };

/**
 * Lecture du fichier chiffre via l'API VPS (GET, sans cle ni secret).
 * Ne se replie JAMAIS silencieusement sur "not-found" : une panne reseau ou
 * un 5xx leve une erreur, pour que l'appelant retombe sur son cache local —
 * confondre une panne avec une disparition purgerait l'apero des appareils.
 */
export async function fetchEncryptedAperoFromApi(
  aperoId: string,
): Promise<FetchEncryptedAperoResult> {
  const baseUrl = getAperoApiBaseUrl();

  if (!baseUrl) {
    return { status: "endpoint-missing" };
  }

  const url = joinApiUrl(baseUrl, `api/aperos/${encodeURIComponent(aperoId)}`);

  let response: Response;
  try {
    // no-cache : revalidation ETag (Express en genere un), un 304 est gratuit.
    response = await fetch(url, { cache: "no-cache" });
  } catch {
    throw new AperoApiError(
      "NETWORK_ERROR",
      "L'API apero est injoignable (reseau, CORS ou serveur arrete).",
    );
  }

  if (response.status === 404) {
    const { serverCode } = await readErrorBody(response);
    // APERO_NOT_FOUND : l'apero a disparu. Tout autre 404 (NOT_FOUND « Route
    // not found ») vient d'une API anterieure a la route GET.
    return serverCode === "APERO_NOT_FOUND"
      ? { status: "not-found" }
      : { status: "endpoint-missing" };
  }

  if (!response.ok) {
    const { serverCode, message } = await readErrorBody(response);
    throw new AperoApiError(
      mapStatusToErrorCode(response.status),
      message ?? `L'API apero a refuse la lecture (HTTP ${response.status}).`,
      response.status,
      serverCode,
    );
  }

  let body: { ok?: boolean; file?: unknown; sha?: string };
  try {
    body = (await response.json()) as { ok?: boolean; file?: unknown; sha?: string };
  } catch {
    throw new AperoApiError("UNEXPECTED_RESPONSE", "Reponse illisible de l'API apero.");
  }

  if (body?.ok !== true || typeof body.sha !== "string" || body.file == null) {
    throw new AperoApiError("UNEXPECTED_RESPONSE", "Reponse inattendue de l'API apero.");
  }

  return { status: "ok", file: body.file, sha: body.sha };
}

export type CreateOrUpdateEncryptedAperoParams = {
  aperoId: string;
  writeKey: string;
  encryptedPayload: EncryptedAperoPayload;
  /** Sha GitHub attendu du fichier actuel (anti-ecrasement silencieux). */
  baseSha?: string;
  /** SHA-256 hexadecimal du writeKey, uniquement pour la creation initiale. */
  writeKeyHash?: string;
  /** SHA-256 hexadecimal de la cle admin locale du createur, creation initiale. */
  adminKeyHash?: string;
};

export type CreateOrUpdateEncryptedAperoResult = {
  ok: true;
  created: boolean;
  updated: boolean;
  aperoId: string;
  sha: string;
};

export function joinApiUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

export function mapStatusToErrorCode(status: number): AperoApiErrorCode {
  switch (status) {
    case 400:
    case 415:
      return "INVALID_REQUEST";
    case 403:
      return "WRITE_FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 413:
      return "PAYLOAD_TOO_LARGE";
    case 429:
      return "RATE_LIMITED";
    case 502:
      return "GITHUB_ERROR";
    default:
      return "SERVER_ERROR";
  }
}

async function readErrorBody(
  response: Response,
): Promise<{ serverCode?: string; message?: string }> {
  try {
    const body = (await response.json()) as { error?: string; message?: string };
    return {
      serverCode: typeof body.error === "string" ? body.error : undefined,
      // Le serveur ne met jamais de secret dans ses messages ; on ne relaie
      // de toute facon que ce champ, jamais le payload envoye.
      message: typeof body.message === "string" ? body.message : undefined,
    };
  } catch {
    return {};
  }
}

export async function createOrUpdateEncryptedApero(
  params: CreateOrUpdateEncryptedAperoParams,
): Promise<CreateOrUpdateEncryptedAperoResult> {
  const baseUrl = getAperoApiBaseUrl();

  if (!baseUrl) {
    throw new AperoApiError(
      "API_NOT_CONFIGURED",
      "VITE_APERO_API_BASE_URL est absente : impossible de joindre l'API apero.",
    );
  }

  const url = joinApiUrl(baseUrl, `api/aperos/${encodeURIComponent(params.aperoId)}`);

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        writeKey: params.writeKey,
        encryptedPayload: params.encryptedPayload,
        ...(params.baseSha ? { baseSha: params.baseSha } : {}),
        ...(params.writeKeyHash ? { writeKeyHash: params.writeKeyHash } : {}),
        ...(params.adminKeyHash ? { adminKeyHash: params.adminKeyHash } : {}),
      }),
    });
  } catch {
    throw new AperoApiError(
      "NETWORK_ERROR",
      "L'API apero est injoignable (reseau, CORS ou serveur arrete).",
    );
  }

  if (!response.ok) {
    const { serverCode, message } = await readErrorBody(response);
    throw new AperoApiError(
      mapStatusToErrorCode(response.status),
      message ?? `L'API apero a refuse l'ecriture (HTTP ${response.status}).`,
      response.status,
      serverCode,
    );
  }

  let result: CreateOrUpdateEncryptedAperoResult;

  try {
    result = (await response.json()) as CreateOrUpdateEncryptedAperoResult;
  } catch {
    throw new AperoApiError("UNEXPECTED_RESPONSE", "Reponse illisible de l'API apero.");
  }

  if (result?.ok !== true || typeof result.sha !== "string") {
    throw new AperoApiError("UNEXPECTED_RESPONSE", "Reponse inattendue de l'API apero.");
  }

  return result;
}

export type DeleteEncryptedAperoParams = {
  aperoId: string;
  adminKey?: string;
  legacyWriteKey?: string;
  baseSha?: string;
};

export type DeleteEncryptedAperoResult = {
  ok: true;
  deleted: boolean;
  aperoId: string;
};

export async function deleteEncryptedApero(
  params: DeleteEncryptedAperoParams,
): Promise<DeleteEncryptedAperoResult> {
  const baseUrl = getAperoApiBaseUrl();

  if (!baseUrl) {
    throw new AperoApiError(
      "API_NOT_CONFIGURED",
      "VITE_APERO_API_BASE_URL est absente : impossible de joindre l'API apero.",
    );
  }

  const url = joinApiUrl(baseUrl, `api/aperos/${encodeURIComponent(params.aperoId)}/delete`);

  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(params.adminKey ? { adminKey: params.adminKey } : {}),
        ...(params.legacyWriteKey ? { legacyWriteKey: params.legacyWriteKey } : {}),
        ...(params.baseSha ? { baseSha: params.baseSha } : {}),
      }),
    });
  } catch {
    throw new AperoApiError(
      "NETWORK_ERROR",
      "L'API apero est injoignable (reseau, CORS ou serveur arrete).",
    );
  }

  // Un serveur VPS anterieur a l'endpoint POST /delete repond 404 sur cette
  // route (route inexistante). Ce n'est jamais « apero introuvable » : un apero
  // absent renvoie 200 { deleted: false }. On le distingue par un serverCode
  // dedie pour afficher un message clair (« mettre a jour l'API ») plutot qu'un
  // vague « souci technique ». On NE retombe PAS sur DELETE /aperos/:id : cette
  // methode declenche une prevol CORS que les proxys GET,POST bloquent — c'est
  // justement pourquoi l'API expose la suppression en POST.
  if (response.status === 404) {
    throw new AperoApiError(
      "NOT_FOUND",
      "L'endpoint de suppression est absent de l'API deployee.",
      404,
      "DELETE_ENDPOINT_MISSING",
    );
  }

  if (!response.ok) {
    const { serverCode, message } = await readErrorBody(response);
    throw new AperoApiError(
      mapStatusToErrorCode(response.status),
      message ?? `L'API apero a refuse la suppression (HTTP ${response.status}).`,
      response.status,
      serverCode,
    );
  }

  let result: DeleteEncryptedAperoResult;

  try {
    result = (await response.json()) as DeleteEncryptedAperoResult;
  } catch {
    throw new AperoApiError("UNEXPECTED_RESPONSE", "Reponse illisible de l'API apero.");
  }

  if (result?.ok !== true) {
    throw new AperoApiError("UNEXPECTED_RESPONSE", "Reponse inattendue de l'API apero.");
  }

  return result;
}
