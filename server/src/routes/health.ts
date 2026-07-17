import { Router } from "express";
import { config } from "../config.js";

export const healthRouter = Router();

healthRouter.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "apero-api",
    // Le backend actif, pour verifier d'un curl qu'une bascule de stockage a
    // bien pris (github → sqlite).
    storage: config.storageBackend,
    timestamp: new Date().toISOString(),
  });
});
