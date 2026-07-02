// Génération d'identifiants et de clés pour le flux chiffré.
// Règles non négociables :
// - jamais de Math.random pour du matériel cryptographique ;
// - jamais de log des clés générées ;
// - les clés ne sont jamais stockées dans GitHub (uniquement localStorage
//   et fragment d'URL, qui ne quitte pas le navigateur).

// Doit rester aligné avec la validation serveur (server/src/validators.ts).
export const APERO_ID_PATTERN = /^apero_[A-Za-z0-9_-]{5,64}$/;

const APERO_ID_RANDOM_LENGTH = 10;

// Alphabet base64url : 64 caractères, donc `byte & 63` reste uniforme.
const BASE64URL_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function getCrypto(): Crypto {
  if (typeof globalThis.crypto === "undefined" || !globalThis.crypto.getRandomValues) {
    throw new Error("Web Crypto API indisponible dans cet environnement.");
  }
  return globalThis.crypto;
}

export function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

export function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

// Identifiant non séquentiel du type apero_7F92Kx91ab (~60 bits d'aléa).
export function generateAperoId(): string {
  const bytes = new Uint8Array(APERO_ID_RANDOM_LENGTH);
  getCrypto().getRandomValues(bytes);

  let randomPart = "";
  bytes.forEach((byte) => {
    randomPart += BASE64URL_ALPHABET[byte & 63];
  });

  return `apero_${randomPart}`;
}

export function isValidAperoId(aperoId: string): boolean {
  return APERO_ID_PATTERN.test(aperoId);
}

// Clé aléatoire encodée base64url (32 octets => 43 caractères, clé AES-256).
export function generateBase64UrlRandomKey(byteLength: number): string {
  if (!Number.isInteger(byteLength) || byteLength <= 0) {
    throw new Error("byteLength doit être un entier positif.");
  }

  const bytes = new Uint8Array(byteLength);
  getCrypto().getRandomValues(bytes);
  return toBase64Url(bytes);
}

async function sha256Bytes(value: string): Promise<Uint8Array> {
  const digest = await getCrypto().subtle.digest("SHA-256", new TextEncoder().encode(value));
  return new Uint8Array(digest);
}

// Empreinte hexadécimale : c'est CE format que l'API VPS attend pour
// writeKeyHash (regex serveur ^[0-9a-f]{64}$).
export async function sha256Hex(value: string): Promise<string> {
  const bytes = await sha256Bytes(value);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// Variante base64url, disponible pour d'autres usages futurs (jamais pour
// writeKeyHash côté API, qui est en hexadécimal).
export async function sha256Base64Url(value: string): Promise<string> {
  return toBase64Url(await sha256Bytes(value));
}
