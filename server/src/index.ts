import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { config, isGithubWriteConfigured } from "./config.js";
import { errorHandler, notFoundHandler } from "./errors.js";
import { logger } from "./logger.js";
import { aperosRouter } from "./routes/aperos.js";
import { healthRouter } from "./routes/health.js";

const app = express();

// Derrière Nginx sur le VPS : fait confiance au premier proxy pour retrouver
// l'IP cliente réelle (nécessaire au rate limit).
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet());
app.use(
  cors({
    origin: config.allowedOrigins,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  }),
);
app.use(express.json({ limit: config.jsonBodyLimit }));

// Log d'accès minimal : jamais de body, jamais de header.
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`);
  });
  next();
});

const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      ok: false,
      error: "RATE_LIMITED",
      message: "Too many requests. Retry later.",
    });
  },
});

app.use(healthRouter);
app.use("/api", apiLimiter, aperosRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, config.host, () => {
  logger.info(`apero-api à l'écoute sur ${config.host}:${config.port}`);

  if (!isGithubWriteConfigured()) {
    logger.warn(
      "GITHUB_TOKEN absent : les écritures GitHub échoueront tant qu'il n'est pas configuré.",
    );
  }
});
