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
