import type { Request, Response } from "express";
import { Router } from "express";
import { config } from "../config.js";
import { safeEqualHex, sha256Hex } from "../crypto.js";
import { ApiError } from "../errors.js";
import { getStorage } from "../storage.js";
import type { StoredAperoFile } from "../storage.js";
import { logger } from "../logger.js";
import {
  parseDeleteAperoBody,
  parseWriteAperoBody,
  storedAperoFileSchema,
  validateAperoId,
} from "../validators.js";

export const aperosRouter = Router();

// Lecture publique du fichier chiffre : c'est le pendant serveur de ce que le
// frontend lisait directement sur GitHub (Contents API anonyme, 60 req/h).
// Le blob est chiffre de bout en bout : le servir ne divulgue rien — seule la
// cle du fragment d'URL, jamais transmise ici, sait l'ouvrir.
// Le code APERO_NOT_FOUND (et non NOT_FOUND) est un discriminant de contrat :
// il distingue « apero disparu » d'une vieille API sans cette route, dont le
// notFoundHandler repond NOT_FOUND — le client sait alors se replier sur la
// lecture GitHub le temps de la transition.
aperosRouter.get("/aperos/:aperoId", async (req, res, next) => {
  try {
    const aperoId = validateAperoId(req.params.aperoId);
    const existing = await getStorage().get(aperoId);

    if (!existing) {
      throw new ApiError(404, "APERO_NOT_FOUND", "This apero does not exist (anymore).");
    }

    res.json({ ok: true, aperoId, sha: existing.sha, file: existing.json });
  } catch (error) {
    next(error);
  }
});

aperosRouter.post("/aperos/:aperoId", async (req, res, next) => {
  try {
    const aperoId = validateAperoId(req.params.aperoId);
    const body = parseWriteAperoBody(req.body);
    const receivedKeyHash = sha256Hex(body.writeKey);

    const existing = await getStorage().get(aperoId);
    const now = new Date().toISOString();

    if (!existing) {
      // Initial creation.
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
      if (!body.adminKeyHash) {
        throw new ApiError(
          400,
          "MISSING_ADMIN_KEY_HASH",
          "adminKeyHash is required to create a new apero.",
        );
      }
      if (!safeEqualHex(receivedKeyHash, body.writeKeyHash)) {
        throw new ApiError(
          400,
          "WRITE_KEY_HASH_MISMATCH",
          "writeKeyHash does not match the provided writeKey.",
        );
      }
      if (safeEqualHex(receivedKeyHash, body.adminKeyHash)) {
        throw new ApiError(
          400,
          "ADMIN_KEY_REUSES_WRITE_KEY",
          "adminKeyHash must not reuse the shared write key.",
        );
      }

      const file: StoredAperoFile = {
        id: aperoId,
        version: body.encryptedPayload.version,
        writeKeyHash: receivedKeyHash,
        adminKeyHash: body.adminKeyHash.toLowerCase(),
        encryption: body.encryptedPayload.encryption,
        createdAt: now,
        updatedAt: now,
      };

      const { sha } = await getStorage().put(aperoId, file);
      logger.info(`Apero created: ${aperoId}`);
      res.status(201).json({ ok: true, created: true, updated: false, aperoId, sha });
      return;
    }

    // Update of an existing file.
    const stored = storedAperoFileSchema.safeParse(existing.json);

    if (!stored.success) {
      // Default deny: a file without a verifiable writeKeyHash stays locked.
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
      adminKeyHash: stored.data.adminKeyHash?.toLowerCase(),
      encryption: body.encryptedPayload.encryption,
      createdAt: stored.data.createdAt || now,
      updatedAt: now,
    };

    const { sha } = await getStorage().put(aperoId, file, existing.sha);
    logger.info(`Apero updated: ${aperoId}`);
    res.json({ ok: true, created: false, updated: true, aperoId, sha });
  } catch (error) {
    next(error);
  }
});

async function handleDeleteApero(req: Request, res: Response): Promise<void> {
  const aperoId = validateAperoId(req.params.aperoId);
  const body = parseDeleteAperoBody(req.body);

  const existing = await getStorage().get(aperoId);

  if (!existing) {
    // Already gone: the target state is reached.
    res.json({ ok: true, deleted: false, aperoId });
    return;
  }

  const stored = storedAperoFileSchema.safeParse(existing.json);

  if (!stored.success) {
    throw new ApiError(403, "WRITE_NOT_ALLOWED", "Existing apero file cannot be verified.");
  }

  if (stored.data.adminKeyHash) {
    if (!body.adminKey) {
      throw new ApiError(403, "ADMIN_KEY_REQUIRED", "Admin key is required to delete this apero.");
    }

    const receivedAdminKeyHash = sha256Hex(body.adminKey);
    if (!safeEqualHex(receivedAdminKeyHash, stored.data.adminKeyHash)) {
      throw new ApiError(403, "INVALID_ADMIN_KEY", "Invalid admin key.");
    }
  } else {
    if (!body.legacyWriteKey || !config.allowLegacyWriteKeyDelete) {
      throw new ApiError(
        403,
        "LEGACY_DELETE_DISABLED",
        "This legacy apero has no admin key. Legacy write-key deletion is disabled on the server.",
      );
    }

    const receivedLegacyHash = sha256Hex(body.legacyWriteKey);
    if (!safeEqualHex(receivedLegacyHash, stored.data.writeKeyHash)) {
      throw new ApiError(403, "INVALID_WRITE_KEY", "Invalid write key.");
    }
  }

  if (body.baseSha && body.baseSha.toLowerCase() !== existing.sha.toLowerCase()) {
    throw new ApiError(
      409,
      "SHA_CONFLICT",
      "The apero file changed since baseSha. Fetch the latest version and retry.",
    );
  }

  await getStorage().delete(aperoId, existing.sha);
  logger.info(`Apero deleted: ${aperoId}`);
  res.json({ ok: true, deleted: true, aperoId });
}

// POST avoids browser/Caddy deployments that forgot to allow DELETE in CORS.
aperosRouter.post("/aperos/:aperoId/delete", async (req, res, next) => {
  try {
    await handleDeleteApero(req, res);
  } catch (error) {
    next(error);
  }
});

// Keep the REST endpoint for API clients and older tooling.
aperosRouter.delete("/aperos/:aperoId", async (req, res, next) => {
  try {
    await handleDeleteApero(req, res);
  } catch (error) {
    next(error);
  }
});
