import { Router } from "express";
import { safeEqualHex, sha256Hex } from "../crypto.js";
import { ApiError } from "../errors.js";
import { createOrUpdateAperoFile, getAperoFile } from "../githubClient.js";
import type { StoredAperoFile } from "../githubClient.js";
import { logger } from "../logger.js";
import { parseWriteAperoBody, storedAperoFileSchema, validateAperoId } from "../validators.js";

export const aperosRouter = Router();

aperosRouter.post("/aperos/:aperoId", async (req, res, next) => {
  try {
    const aperoId = validateAperoId(req.params.aperoId);
    const body = parseWriteAperoBody(req.body);
    const receivedKeyHash = sha256Hex(body.writeKey);

    const existing = await getAperoFile(aperoId);
    const now = new Date().toISOString();

    if (!existing) {
      // Cas 1 — création initiale.
      if (body.baseSha) {
        throw new ApiError(
          409,
          "CONFLICT",
          "baseSha was provided but the apero file does not exist.",
        );
      }
      if (!body.writeKeyHash) {
        throw new ApiError(
          400,
          "MISSING_WRITE_KEY_HASH",
          "writeKeyHash is required to create a new apero.",
        );
      }
      if (!safeEqualHex(receivedKeyHash, body.writeKeyHash)) {
        throw new ApiError(
          400,
          "WRITE_KEY_HASH_MISMATCH",
          "writeKeyHash does not match the provided writeKey.",
        );
      }

      const file: StoredAperoFile = {
        id: aperoId,
        version: body.encryptedPayload.version,
        writeKeyHash: receivedKeyHash,
        encryption: body.encryptedPayload.encryption,
        createdAt: now,
        updatedAt: now,
      };

      const { sha } = await createOrUpdateAperoFile(aperoId, file);
      logger.info(`Apero created: ${aperoId}`);
      res.status(201).json({ ok: true, created: true, updated: false, aperoId, sha });
      return;
    }

    // Cas 2 — mise à jour d'un fichier existant.
    const stored = storedAperoFileSchema.safeParse(existing.json);

    if (!stored.success) {
      // Default deny : un fichier sans writeKeyHash vérifiable reste verrouillé.
      throw new ApiError(403, "WRITE_NOT_ALLOWED", "Existing apero file cannot be verified.");
    }

    if (!safeEqualHex(receivedKeyHash, stored.data.writeKeyHash)) {
      throw new ApiError(403, "INVALID_WRITE_KEY", "Invalid write key.");
    }

    if (body.baseSha && body.baseSha.toLowerCase() !== existing.sha.toLowerCase()) {
      throw new ApiError(
        409,
        "SHA_CONFLICT",
        "The apero file changed since baseSha. Fetch the latest version and retry.",
      );
    }

    const file: StoredAperoFile = {
      id: aperoId,
      version: body.encryptedPayload.version,
      writeKeyHash: stored.data.writeKeyHash.toLowerCase(),
      encryption: body.encryptedPayload.encryption,
      createdAt: stored.data.createdAt || now,
      updatedAt: now,
    };

    const { sha } = await createOrUpdateAperoFile(aperoId, file, existing.sha);
    logger.info(`Apero updated: ${aperoId}`);
    res.json({ ok: true, created: false, updated: true, aperoId, sha });
  } catch (error) {
    next(error);
  }
});
