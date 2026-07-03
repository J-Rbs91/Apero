// Types du nouveau flux chiffré (migration API VPS).
// Miroir exact du contrat de la mini API serveur (server/src/validators.ts).

import type { AperitifEvent } from "./apero";

export type AperoEncryptionBlock = {
  algorithm: "AES-GCM";
  iv: string;
  ciphertext: string;
};

export type EncryptedAperoPayload = {
  version: 1;
  encryption: AperoEncryptionBlock;
};

// Fichier public data/aperos/{aperoId}.json tel qu'écrit par l'API VPS.
// Il ne contient jamais writeKey ni encryptionKey — uniquement le hash
// de la clé d'écriture et le contenu chiffré.
export type StoredEncryptedAperoFile = {
  id: string;
  version: number;
  writeKeyHash: string;
  adminKeyHash?: string;
  encryption: AperoEncryptionBlock;
  createdAt: string;
  updatedAt: string;
};

export type LocalAperoRole = "creator" | "participant";

// Entrée du registre local (localStorage) des apéros créés ou rejoints
// sur cet appareil. Ne quitte jamais le navigateur.
export type LocalAperoEntry = {
  aperoId: string;
  encryptionKey: string;
  writeKey: string;
  adminKey?: string;
  lastKnownEvent?: AperitifEvent;
  displayName?: string;
  role?: LocalAperoRole;
  joinedAt: string;
  updatedAt: string;
};
