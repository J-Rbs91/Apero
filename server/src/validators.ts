import { z } from "zod";
import { config } from "./config.js";
import { ApiError } from "./errors.js";

export const APERO_ID_PATTERN = /^apero_[A-Za-z0-9_-]{5,64}$/;

// Défense en profondeur : le pattern strict exclut déjà tout cela, mais on
// refuse explicitement les séquences de path traversal avant toute autre logique.
const FORBIDDEN_ID_SEQUENCES = ["..", "/", "\\", ".", "%"];

export function validateAperoId(rawId: unknown): string {
  const aperoId = typeof rawId === "string" ? rawId : "";
  const containsForbidden = FORBIDDEN_ID_SEQUENCES.some((sequence) =>
    aperoId.toLowerCase().includes(sequence),
  );

  if (containsForbidden || !APERO_ID_PATTERN.test(aperoId)) {
    throw new ApiError(400, "INVALID_APERO_ID", "Invalid apero id.");
  }

  return aperoId;
}

const base64UrlSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]+$/, "doit être encodé en base64url");

const encryptionSchema = z
  .object({
    algorithm: z.literal("AES-GCM"),
    iv: base64UrlSchema.min(16).max(32),
    ciphertext: base64UrlSchema.min(1).max(config.maxCiphertextLength),
  })
  .strict();

export const writeAperoBodySchema = z
  .object({
    writeKey: z.string().min(16).max(256),
    encryptedPayload: z
      .object({
        version: z.literal(1),
        encryption: encryptionSchema,
      })
      .strict(),
    baseSha: z
      .string()
      .regex(/^[0-9a-f]{40}$/i, "doit être un sha git de 40 caractères hexadécimaux")
      .optional(),
    writeKeyHash: z
      .string()
      .regex(/^[0-9a-f]{64}$/i, "doit être une empreinte SHA-256 hexadécimale")
      .optional(),
  })
  .strict();

export type WriteAperoBody = z.infer<typeof writeAperoBodySchema>;

export function parseWriteAperoBody(body: unknown): WriteAperoBody {
  const result = writeAperoBodySchema.safeParse(body);

  if (!result.success) {
    const details = result.error.issues
      .slice(0, 3)
      .map((issue) => (issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message))
      .join("; ");
    throw new ApiError(400, "INVALID_PAYLOAD", `Invalid payload. ${details}`);
  }

  return result.data;
}

// Champs minimaux qu'un fichier apéro déjà stocké doit exposer pour autoriser
// une mise à jour. Tout fichier illisible reste verrouillé (default deny).
export const storedAperoFileSchema = z
  .object({
    writeKeyHash: z.string().regex(/^[0-9a-f]{64}$/i),
    createdAt: z.string().optional(),
  })
  .passthrough();
