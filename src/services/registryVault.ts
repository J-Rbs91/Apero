// Le Coffre : sauvegarde et transfert du registre local d'un appareil à
// l'autre. Tant que tout vit dans le localStorage, perdre son téléphone c'est
// perdre son blaze, ses clés d'organisateur et son historique — le Coffre
// répare ça sans rien confier à un serveur.
//
// Le fichier exporté est chiffré côté client : PBKDF2 (SHA-256) sur une phrase
// de passe choisie par le membre, puis AES-GCM. Sans la phrase, le fichier ne
// vaut rien. Les clés d'apéro n'apparaissent JAMAIS en clair dans le fichier.

import type { LocalAperoEntry } from "../types/encryptedApero";
import { COMPTOIR_NAME_STORAGE_KEY } from "../hooks/useComptoirName";
import { fromBase64Url, isValidAperoId, toBase64Url } from "./aperoCryptoKeys";
import { getLocalAperos, saveLocalApero } from "./localAperoRegistry";

const VAULT_FORMAT = "apero-vault";
const VAULT_VERSION = 1;
const PBKDF2_ITERATIONS = 310_000;
const SALT_BYTE_LENGTH = 16;
const IV_BYTE_LENGTH = 12;

export type VaultErrorCode = "INVALID_FILE" | "BAD_PASSPHRASE" | "CRYPTO_UNAVAILABLE";

export class VaultError extends Error {
  readonly code: VaultErrorCode;

  constructor(code: VaultErrorCode, message: string) {
    super(message);
    this.name = "VaultError";
    this.code = code;
  }
}

// Contenu en clair du coffre (avant chiffrement). Les champs inconnus des
// versions futures sont ignorés à l'import.
export type VaultPayload = {
  comptoirName?: string;
  aperos: LocalAperoEntry[];
  // Registres additionnels (ex. tablées) : clé localStorage → contenu brut.
  extraStores?: Record<string, string>;
};

export type StoredVaultFile = {
  format: typeof VAULT_FORMAT;
  version: number;
  exportedAt: string;
  kdf: {
    algorithm: "PBKDF2";
    hash: "SHA-256";
    iterations: number;
    salt: string;
  };
  encryption: {
    algorithm: "AES-GCM";
    iv: string;
    ciphertext: string;
  };
};

function getSubtle(): SubtleCrypto {
  if (typeof globalThis.crypto === "undefined" || !globalThis.crypto.subtle) {
    throw new VaultError("CRYPTO_UNAVAILABLE", "Web Crypto API indisponible.");
  }
  return globalThis.crypto.subtle;
}

async function deriveVaultKey(
  passphrase: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
  usages: KeyUsage[],
): Promise<CryptoKey> {
  const subtle = getSubtle();
  const material = await subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    usages,
  );
}

/** Chiffre un contenu de coffre avec une phrase de passe. */
export async function encryptVault(
  payload: VaultPayload,
  passphrase: string,
  now = new Date(),
): Promise<StoredVaultFile> {
  const salt = new Uint8Array(SALT_BYTE_LENGTH);
  const iv = new Uint8Array(IV_BYTE_LENGTH);
  globalThis.crypto.getRandomValues(salt);
  globalThis.crypto.getRandomValues(iv);

  const key = await deriveVaultKey(passphrase, salt, PBKDF2_ITERATIONS, ["encrypt"]);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await getSubtle().encrypt({ name: "AES-GCM", iv }, key, plaintext);

  return {
    format: VAULT_FORMAT,
    version: VAULT_VERSION,
    exportedAt: now.toISOString(),
    kdf: {
      algorithm: "PBKDF2",
      hash: "SHA-256",
      iterations: PBKDF2_ITERATIONS,
      salt: toBase64Url(salt),
    },
    encryption: {
      algorithm: "AES-GCM",
      iv: toBase64Url(iv),
      ciphertext: toBase64Url(new Uint8Array(ciphertext)),
    },
  };
}

/** Déchiffre un fichier de coffre. VaultError si le fichier ou la phrase cloche. */
export async function decryptVault(
  rawFile: unknown,
  passphrase: string,
): Promise<VaultPayload> {
  const file = rawFile as StoredVaultFile | null;

  if (
    !file ||
    typeof file !== "object" ||
    file.format !== VAULT_FORMAT ||
    file.version !== VAULT_VERSION ||
    file.kdf?.algorithm !== "PBKDF2" ||
    file.encryption?.algorithm !== "AES-GCM" ||
    typeof file.kdf.salt !== "string" ||
    typeof file.encryption.iv !== "string" ||
    typeof file.encryption.ciphertext !== "string" ||
    !Number.isInteger(file.kdf.iterations) ||
    file.kdf.iterations < 1 ||
    file.kdf.iterations > 5_000_000
  ) {
    throw new VaultError("INVALID_FILE", "Ce fichier n'est pas un coffre de la Confrérie.");
  }

  let salt: Uint8Array<ArrayBuffer>;
  let iv: Uint8Array<ArrayBuffer>;
  let ciphertext: Uint8Array<ArrayBuffer>;

  try {
    salt = fromBase64Url(file.kdf.salt);
    iv = fromBase64Url(file.encryption.iv);
    ciphertext = fromBase64Url(file.encryption.ciphertext);
  } catch {
    throw new VaultError("INVALID_FILE", "Coffre illisible.");
  }

  const key = await deriveVaultKey(passphrase, salt, file.kdf.iterations, ["decrypt"]);

  let plaintext: ArrayBuffer;
  try {
    plaintext = await getSubtle().decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  } catch {
    throw new VaultError("BAD_PASSPHRASE", "Cette phrase de passe n'ouvre pas ce coffre.");
  }

  try {
    const payload = JSON.parse(new TextDecoder().decode(plaintext)) as VaultPayload;
    return {
      comptoirName: typeof payload.comptoirName === "string" ? payload.comptoirName : undefined,
      aperos: Array.isArray(payload.aperos) ? payload.aperos : [],
      extraStores:
        payload.extraStores && typeof payload.extraStores === "object"
          ? payload.extraStores
          : undefined,
    };
  } catch {
    throw new VaultError("INVALID_FILE", "Contenu de coffre illisible.");
  }
}

// Clés localStorage embarquées telles quelles dans le coffre, en plus du
// registre d'apéros (ex. registre des tablées, ajouté par la suite).
const EXTRA_STORE_KEYS = ["apero_tablee_registry_v1"];

/** Rassemble tout ce que l'appareil sait dans un contenu de coffre. */
export function collectVaultPayload(): VaultPayload {
  const extraStores: Record<string, string> = {};
  if (typeof window !== "undefined" && window.localStorage) {
    for (const key of EXTRA_STORE_KEYS) {
      const value = window.localStorage.getItem(key);
      if (value) {
        extraStores[key] = value;
      }
    }
  }

  return {
    comptoirName:
      typeof window !== "undefined"
        ? window.localStorage?.getItem(COMPTOIR_NAME_STORAGE_KEY) ?? undefined
        : undefined,
    aperos: getLocalAperos(),
    ...(Object.keys(extraStores).length > 0 ? { extraStores } : {}),
  };
}

export type VaultImportResult = {
  importedAperoCount: number;
  importedComptoirName?: string;
  restoredExtraStores: number;
};

// Bornes défensives à l'import : un coffre reste un fichier fourni par
// l'utilisateur — potentiellement forgé — et ne doit pouvoir ni injecter des
// identifiants exotiques, ni gonfler le localStorage sans limite.
const MAX_IMPORTED_KEY_LENGTH = 256;
const MAX_IMPORTED_NAME_LENGTH = 80;
const MAX_EXTRA_STORE_VALUE_LENGTH = 512 * 1024;

function isImportableKey(value: unknown): value is string {
  return typeof value === "string" && value.length >= 16 && value.length <= MAX_IMPORTED_KEY_LENGTH;
}

/**
 * Fusionne un contenu de coffre dans l'appareil : upsert de chaque apéro
 * (une entrée existante garde son rôle de créateur et sa clé admin), blaze
 * adopté seulement si l'appareil n'en a pas déjà un.
 */
export function mergeVaultPayload(payload: VaultPayload): VaultImportResult {
  let importedAperoCount = 0;

  for (const entry of payload.aperos) {
    if (
      !entry ||
      typeof entry.aperoId !== "string" ||
      !isValidAperoId(entry.aperoId) ||
      !isImportableKey(entry.encryptionKey) ||
      !isImportableKey(entry.writeKey) ||
      (entry.adminKey !== undefined && !isImportableKey(entry.adminKey))
    ) {
      continue;
    }

    const displayName =
      typeof entry.displayName === "string"
        ? entry.displayName.slice(0, MAX_IMPORTED_NAME_LENGTH)
        : undefined;

    saveLocalApero({
      aperoId: entry.aperoId,
      encryptionKey: entry.encryptionKey,
      writeKey: entry.writeKey,
      adminKey: entry.adminKey,
      // Le cache d'événement est réévalué par normalizeEvent/sanitize à chaque
      // lecture : un contenu forgé sera rejeté à l'usage, pas ici.
      lastKnownEvent: entry.lastKnownEvent,
      displayName,
      role: entry.role === "creator" || entry.role === "participant" ? entry.role : undefined,
      lastSeenPublicSha:
        typeof entry.lastSeenPublicSha === "string" && /^[0-9a-f]{40}$/i.test(entry.lastSeenPublicSha)
          ? entry.lastSeenPublicSha
          : undefined,
    });
    importedAperoCount += 1;
  }

  let importedComptoirName: string | undefined;
  let restoredExtraStores = 0;

  if (typeof window !== "undefined" && window.localStorage) {
    const currentName = window.localStorage.getItem(COMPTOIR_NAME_STORAGE_KEY);
    const importedName = payload.comptoirName?.trim().slice(0, MAX_IMPORTED_NAME_LENGTH);
    if (!currentName && importedName) {
      window.localStorage.setItem(COMPTOIR_NAME_STORAGE_KEY, importedName);
      importedComptoirName = importedName;
    }

    for (const [key, value] of Object.entries(payload.extraStores ?? {})) {
      // Seules les clés connues sont restaurées (un coffre forgé ne doit pas
      // pouvoir écrire n'importe où dans le localStorage), avec une taille
      // bornée pour ne pas saturer le stockage de l'appareil.
      if (
        !EXTRA_STORE_KEYS.includes(key) ||
        window.localStorage.getItem(key) ||
        typeof value !== "string" ||
        value.length > MAX_EXTRA_STORE_VALUE_LENGTH
      ) {
        continue;
      }
      window.localStorage.setItem(key, value);
      restoredExtraStores += 1;
    }
  }

  return { importedAperoCount, importedComptoirName, restoredExtraStores };
}
