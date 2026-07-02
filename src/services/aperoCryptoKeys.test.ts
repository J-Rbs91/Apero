import { describe, expect, it } from "vitest";
import {
  APERO_ID_PATTERN,
  fromBase64Url,
  generateAperoId,
  generateBase64UrlRandomKey,
  isValidAperoId,
  sha256Base64Url,
  sha256Hex,
  toBase64Url,
} from "./aperoCryptoKeys";

describe("generateAperoId", () => {
  it("produit un identifiant au format attendu par l'API serveur", () => {
    for (let index = 0; index < 50; index += 1) {
      const aperoId = generateAperoId();
      expect(aperoId).toMatch(APERO_ID_PATTERN);
      expect(isValidAperoId(aperoId)).toBe(true);
    }
  });

  it("ne produit pas deux fois le même identifiant sur un petit échantillon", () => {
    const ids = new Set(Array.from({ length: 200 }, () => generateAperoId()));
    expect(ids.size).toBe(200);
  });
});

describe("generateBase64UrlRandomKey", () => {
  it("encode 32 octets en 43 caractères base64url (clé AES-256)", () => {
    const key = generateBase64UrlRandomKey(32);
    expect(key).toHaveLength(43);
    expect(key).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("refuse une longueur invalide", () => {
    expect(() => generateBase64UrlRandomKey(0)).toThrow();
    expect(() => generateBase64UrlRandomKey(1.5)).toThrow();
  });
});

describe("toBase64Url / fromBase64Url", () => {
  it("fait un aller-retour sans perte", () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
    expect(Array.from(fromBase64Url(toBase64Url(bytes)))).toEqual(Array.from(bytes));
  });

  it("n'utilise ni +, ni /, ni = dans l'encodage", () => {
    const bytes = new Uint8Array([251, 239, 190]);
    const encoded = toBase64Url(bytes);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});

describe("sha256", () => {
  it("sha256Hex correspond au vecteur attendu par le serveur", async () => {
    // Même vecteur que server/README.md : hash de la writeKey d'exemple.
    await expect(sha256Hex("test-write-key")).resolves.toBe(
      "04c0218b3c6929c6638fa052827cc353c3e1eb3a432020f686e083aae900d6c4",
    );
  });

  it("sha256Hex produit 64 caractères hexadécimaux (format writeKeyHash)", async () => {
    await expect(sha256Hex("n'importe quoi")).resolves.toMatch(/^[0-9a-f]{64}$/);
  });

  it("sha256Base64Url encode la même empreinte en base64url", async () => {
    const hex = await sha256Hex("abc");
    const base64Url = await sha256Base64Url("abc");
    const bytes = fromBase64Url(base64Url);
    const hexFromBytes = Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
    expect(hexFromBytes).toBe(hex);
  });
});
