import { describe, expect, it } from "vitest";
import { generateBase64UrlRandomKey } from "./aperoCryptoKeys";
import {
  AperoCryptoError,
  decryptAperoData,
  encryptAperoData,
  ENCRYPTION_KEY_BYTE_LENGTH,
} from "./aperoEncryption";

const SAMPLE_DATA = {
  id: "apero_test1234",
  ceremonialName: "Le Concile du Saucisson",
  participants: [{ participantName: "Tonton Ricard", votes: { option_1: "yes" } }],
};

describe("encryptAperoData", () => {
  it("produit un payload AES-GCM version 1 en base64url", async () => {
    const key = generateBase64UrlRandomKey(ENCRYPTION_KEY_BYTE_LENGTH);
    const payload = await encryptAperoData(SAMPLE_DATA, key);

    expect(payload.version).toBe(1);
    expect(payload.encryption.algorithm).toBe("AES-GCM");
    expect(payload.encryption.iv).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(payload.encryption.ciphertext).toMatch(/^[A-Za-z0-9_-]+$/);
    // Le contenu chiffré ne doit pas laisser transparaître le clair.
    expect(payload.encryption.ciphertext).not.toContain("Tonton");
  });

  it("génère un IV différent à chaque chiffrement", async () => {
    const key = generateBase64UrlRandomKey(ENCRYPTION_KEY_BYTE_LENGTH);
    const first = await encryptAperoData(SAMPLE_DATA, key);
    const second = await encryptAperoData(SAMPLE_DATA, key);
    expect(first.encryption.iv).not.toBe(second.encryption.iv);
    expect(first.encryption.ciphertext).not.toBe(second.encryption.ciphertext);
  });

  it("refuse une clé de mauvaise longueur", async () => {
    await expect(encryptAperoData(SAMPLE_DATA, generateBase64UrlRandomKey(16))).rejects.toMatchObject({
      name: "AperoCryptoError",
      code: "INVALID_KEY",
    });
  });
});

describe("decryptAperoData", () => {
  it("fait un aller-retour chiffrement/déchiffrement fidèle", async () => {
    const key = generateBase64UrlRandomKey(ENCRYPTION_KEY_BYTE_LENGTH);
    const payload = await encryptAperoData(SAMPLE_DATA, key);
    await expect(decryptAperoData(payload, key)).resolves.toEqual(SAMPLE_DATA);
  });

  it("échoue proprement avec une mauvaise clé", async () => {
    const payload = await encryptAperoData(
      SAMPLE_DATA,
      generateBase64UrlRandomKey(ENCRYPTION_KEY_BYTE_LENGTH),
    );
    const wrongKey = generateBase64UrlRandomKey(ENCRYPTION_KEY_BYTE_LENGTH);

    try {
      await decryptAperoData(payload, wrongKey);
      expect.unreachable("le déchiffrement aurait dû échouer");
    } catch (error) {
      expect(error).toBeInstanceOf(AperoCryptoError);
      expect((error as AperoCryptoError).code).toBe("DECRYPT_FAILED");
    }
  });

  it("échoue proprement si le contenu chiffré est altéré", async () => {
    const key = generateBase64UrlRandomKey(ENCRYPTION_KEY_BYTE_LENGTH);
    const payload = await encryptAperoData(SAMPLE_DATA, key);
    const tampered = {
      ...payload,
      encryption: {
        ...payload.encryption,
        ciphertext: `${payload.encryption.ciphertext.slice(0, -2)}AA`,
      },
    };

    await expect(decryptAperoData(tampered, key)).rejects.toMatchObject({
      code: "DECRYPT_FAILED",
    });
  });

  it("refuse un payload au format inattendu", async () => {
    const key = generateBase64UrlRandomKey(ENCRYPTION_KEY_BYTE_LENGTH);
    await expect(
      decryptAperoData(
        { version: 2, encryption: { algorithm: "AES-GCM", iv: "a", ciphertext: "b" } } as never,
        key,
      ),
    ).rejects.toMatchObject({ code: "INVALID_PAYLOAD" });
  });
});
