// Alphabet base64url : 64 caractères, donc `byte & 63` reste uniforme.
const ID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const ID_RANDOM_LENGTH = 10;

// Identifiants tirés d'un CSPRNG uniquement : jamais Math.random, dont l'état
// interne est prédictible (cf. la même règle dans aperoCryptoKeys.ts). Un
// crypto.getRandomValues manquant est un environnement inutilisable pour l'app,
// on échoue franchement plutôt que de retomber sur une source non sûre.
export function createId(prefix = "apero"): string {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) {
    throw new Error("Web Crypto API indisponible : impossible de générer un identifiant sûr.");
  }

  const bytes = new Uint8Array(ID_RANDOM_LENGTH);
  crypto.getRandomValues(bytes);

  let randomPart = "";
  bytes.forEach((byte) => {
    randomPart += ID_ALPHABET[byte & 63];
  });

  return `${prefix}_${randomPart}`;
}
