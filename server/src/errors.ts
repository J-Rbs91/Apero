import type { NextFunction, Request, Response } from "express";
import { logger } from "./logger.js";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ ok: false, error: "NOT_FOUND", message: "Route not found." });
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ApiError) {
    res.status(error.status).json({ ok: false, error: error.code, message: error.message });
    return;
  }

  // Erreurs levées par express.json() (body-parser).
  const bodyParserError = error as { type?: string };
  if (bodyParserError?.type === "entity.too.large") {
    res.status(413).json({
      ok: false,
      error: "PAYLOAD_TOO_LARGE",
      message: "Request body exceeds the configured limit.",
    });
    return;
  }
  if (bodyParserError?.type === "entity.parse.failed") {
    res.status(400).json({
      ok: false,
      error: "INVALID_JSON",
      message: "Request body is not valid JSON.",
    });
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  logger.error(`Unhandled error: ${message}`);
  res.status(500).json({
    ok: false,
    error: "INTERNAL_ERROR",
    message: "Unexpected server error.",
  });
}
