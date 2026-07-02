// Chiffrement côté client des données d'apéro.
// AES-GCM 256 bits via Web Crypto API native — aucun chiffrement maison.
// L'encryptionKey ne quitte jamais le navigateur : elle vit dans le fragment
// d'URL du lien d'invitation et dans le registre localStorage, jamais dans
// GitHub, jamais dans les logs, jamais dans les messages d'erreur.

import type { EncryptedAperoPayload } from "../types/encryptedApero";
import { fromBase64Url, toBase64Url } from "./aperoCryptoKeys";

export const ENCRYPTION_KEY_BYTE_LENGTH = 32;
const IV_BYTE_LENGTH = 12;

export type AperoCryptoErrorCode = "INVALID_KEY" | "INVALID_PAYLOAD" | "DECRYPT_FAILED";

export class AperoCryptoError extends Error {
  readonly code: AperoCryptoErrorCode;

  constructor(code: AperoCryptoErrorCode, message: string) {
    super(message);
    this.name = "AperoCryptoError";
    this.code = code;
  }
}

function getSubtle(): SubtleCrypto {
  if (typeof globalThis.crypto === "undefined" || !globalThis.crypto.subtle) {
    throw new AperoCryptoError(
      "DECRYPT_FAILED",
      "Web Crypto API indisponible dans cet environnement.",
    );
  }
  return globalThis.crypto.subtle;
}

async function importAesKey(
  encryptionKey: string,
  usages: KeyUsage[],
): Promise<CryptoKey> {
  let keyBytes: Uint8Array<ArrayBuffer>;

  try {
    keyBytes = fromBase64Url(encryptionKey);
  } catch {
    throw new AperoCryptoError("INVALID_KEY", "Clé de chiffrement illisible.");
  }

  if (keyBytes.length !== ENCRYPTION_KEY_BYTE_LENGTH) {
    throw new AperoCryptoError("INVALID_KEY", "Clé de chiffrement de longueur inattendue.");
  }

  return getSubtle().importKey("raw", keyBytes, "AES-GCM", false, usages);
}

export async function encryptAperoData(
  data: unknown,
  encryptionKey: string,
): Promise<EncryptedAperoPayload> {
  const key = await importAesKey(encryptionKey, ["encrypt"]);
  const iv = new Uint8Array(IV_BYTE_LENGTH);
  globalThis.crypto.getRandomValues(iv);

  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await getSubtle().encrypt({ name: "AES-GCM", iv }, key, plaintext);

  return {
    version: 1,
    encryption: {
      algorithm: "AES-GCM",
      iv: toBase64Url(iv),
      ciphertext: toBase64Url(new Uint8Array(ciphertext)),
    },
  };
}

function assertPayloadShape(payload: EncryptedAperoPayload): void {
  const encryption = payload?.encryption;

  if (
    payload?.version !== 1 ||
    encryption?.algorithm !== "AES-GCM" ||
    typeof encryption?.iv !== "string" ||
    typeof encryption?.ciphertext !== "string"
  ) {
    throw new AperoCryptoError("INVALID_PAYLOAD", "Payload chiffré au format inattendu.");
  }
}

export async function decryptAperoData<T = unknown>(
  encryptedPayload: EncryptedAperoPayload,
  encryptionKey: string,
): Promise<T> {
  assertPayloadShape(encryptedPayload);

  const key = await importAesKey(encryptionKey, ["decrypt"]);

  let iv: Uint8Array<ArrayBuffer>;
  let ciphertext: Uint8Array<ArrayBuffer>;

  try {
    iv = fromBase64Url(encryptedPayload.encryption.iv);
    ciphertext = fromBase64Url(encryptedPayload.encryption.ciphertext);
  } catch {
    throw new AperoCryptoError("INVALID_PAYLOAD", "Payload chiffré illisible.");
  }

  let plaintextBuffer: ArrayBuffer;

  try {
    plaintextBuffer = await getSubtle().decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  } catch {
    // AES-GCM échoue en bloc si la clé est mauvaise ou la donnée altérée :
    // impossible (et inutile) de distinguer les deux cas.
    throw new AperoCryptoError(
      "DECRYPT_FAILED",
      "Déchiffrement impossible : clé invalide ou données altérées.",
    );
  }

  try {
    return JSON.parse(new TextDecoder().decode(plaintextBuffer)) as T;
  } catch {
    throw new AperoCryptoError("INVALID_PAYLOAD", "Contenu déchiffré illisible.");
  }
}
