import { z } from "zod";
import { config } from "./config.js";
import { ApiError } from "./errors.js";

export const APERO_ID_PATTERN = /^apero_[A-Za-z0-9_-]{5,64}$/;

// Defense in depth: the strict pattern already excludes these, but path-like
// sequences are rejected before any GitHub path is built.
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
  .regex(/^[A-Za-z0-9_-]+$/, "doit etre encode en base64url");

const sha256HexSchema = z
  .string()
  .regex(/^[0-9a-f]{64}$/i, "doit etre une empreinte SHA-256 hexadecimale");

const gitShaSchema = z
  .string()
  .regex(/^[0-9a-f]{40}$/i, "doit etre un sha git de 40 caracteres hexadecimaux");

const secretKeySchema = z.string().min(16).max(256);

const encryptionSchema = z
  .object({
    algorithm: z.literal("AES-GCM"),
    iv: base64UrlSchema.length(16, "doit etre un IV AES-GCM 96 bits encode en base64url"),
    ciphertext: base64UrlSchema.min(1).max(config.maxCiphertextLength),
  })
  .strict();

export const writeAperoBodySchema = z
  .object({
    writeKey: secretKeySchema,
    encryptedPayload: z
      .object({
        version: z.literal(1),
        encryption: encryptionSchema,
      })
      .strict(),
    baseSha: gitShaSchema.optional(),
    writeKeyHash: sha256HexSchema.optional(),
    adminKeyHash: sha256HexSchema.optional(),
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

// Deletion uses a creator/admin key. Legacy files created before adminKeyHash
// can still be deleted with the old shared write key only when the server env
// ALLOW_LEGACY_WRITE_KEY_DELETE=true is set intentionally.
export const deleteAperoBodySchema = z
  .object({
    adminKey: secretKeySchema.optional(),
    legacyWriteKey: secretKeySchema.optional(),
    baseSha: gitShaSchema.optional(),
  })
  .strict()
  .refine((body) => Boolean(body.adminKey) !== Boolean(body.legacyWriteKey), {
    message: "adminKey ou legacyWriteKey requis, mais pas les deux",
  });

export type DeleteAperoBody = z.infer<typeof deleteAperoBodySchema>;

export function parseDeleteAperoBody(body: unknown): DeleteAperoBody {
  const result = deleteAperoBodySchema.safeParse(body);

  if (!result.success) {
    const details = result.error.issues
      .slice(0, 3)
      .map((issue) => (issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message))
      .join("; ");
    throw new ApiError(400, "INVALID_PAYLOAD", `Invalid payload. ${details}`);
  }

  return result.data;
}

// Minimal fields an already stored apero file must expose before any mutation.
// Unknown fields are tolerated to keep older JSON readable, but only known
// server-controlled fields are preserved when the file is rewritten.
export const storedAperoFileSchema = z
  .object({
    writeKeyHash: sha256HexSchema,
    adminKeyHash: sha256HexSchema.optional(),
    createdAt: z.string().optional(),
  })
  .passthrough();
