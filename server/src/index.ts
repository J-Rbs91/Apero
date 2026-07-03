import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { config, isGithubWriteConfigured } from "./config.js";
import { ApiError, errorHandler, notFoundHandler } from "./errors.js";
import { logger } from "./logger.js";
import { aperosRouter } from "./routes/aperos.js";
import { healthRouter } from "./routes/health.js";

const app = express();

// Derrière Caddy/Nginx sur le VPS : fait confiance au proxy configuré pour
// retrouver l'IP cliente réelle (nécessaire au rate limit).
app.set("trust proxy", config.trustProxyHops);
app.disable("x-powered-by");

app.use(
  helmet({
    referrerPolicy: { policy: "no-referrer" },
  }),
);
app.use(
  cors({
    origin: config.allowedOrigins,
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type"],
    optionsSuccessStatus: 204,
  }),
);

app.use((req, _res, next) => {
  if (["POST", "PUT", "PATCH"].includes(req.method) && !req.is("application/json")) {
    next(new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Content-Type must be application/json."));
    return;
  }

  next();
});

app.use(express.json({ limit: config.jsonBodyLimit, strict: true }));

// Log d'accès minimal : jamais de body, jamais de header.
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`);
  });
  next();
});

function rateLimitResponse(_req: express.Request, res: express.Response): void {
  res.status(429).json({
    ok: false,
    error: "RATE_LIMITED",
    message: "Too many requests. Retry later.",
  });
}

const apiLimiter = rateLimit({
  windowMs: config.apiRateLimitWindowMs,
  limit: config.apiRateLimitMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rateLimitResponse,
});

const writeLimiter = rateLimit({
  windowMs: config.writeRateLimitWindowMs,
  limit: config.writeRateLimitMax,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rateLimitResponse,
});

app.use(healthRouter);
app.use("/api", apiLimiter);
app.use("/api/aperos/:aperoId", writeLimiter);
app.use("/api", aperosRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(config.port, config.host, () => {
  logger.info(`apero-api à l'écoute sur ${config.host}:${config.port}`);

  if (!isGithubWriteConfigured()) {
    logger.warn(
      "GITHUB_TOKEN absent : les écritures GitHub échoueront tant qu'il n'est pas configuré.",
    );
  }
});

server.requestTimeout = config.serverRequestTimeoutMs;
server.headersTimeout = Math.min(config.serverRequestTimeoutMs + 1_000, 60_000);
server.keepAliveTimeout = 5_000;
