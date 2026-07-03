import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  GITHUB_TOKEN: z.string().min(1).optional(),
  GITHUB_OWNER: z.string().min(1).default("J-Rbs91"),
  GITHUB_REPO: z.string().min(1).default("Apero"),
  GITHUB_BRANCH: z.string().min(1).default("main"),
  // Une ou plusieurs origines, separees par des virgules
  // (ex. https://j-rbs91.github.io,http://localhost:5173).
  ALLOWED_ORIGIN: z.string().min(1).default("https://j-rbs91.github.io"),
  // Sur le VPS l'API reste derriere Caddy : ecoute locale uniquement.
  HOST: z.string().min(1).default("127.0.0.1"),
  // 3001 = PANUM, 3002 = ORTABEL, 3103 = Apero.
  PORT: z.coerce.number().int().min(1).max(65535).default(3103),
  JSON_BODY_LIMIT: z
    .string()
    .regex(/^\d+(b|kb|mb)$/i, "attendu: un volume du type 100kb")
    .default("100kb"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(3).default(1),
  API_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1_000).max(3_600_000).default(60_000),
  API_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(10_000).default(60),
  WRITE_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1_000).max(3_600_000).default(60_000),
  WRITE_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(1_000).default(10),
  MAX_CIPHERTEXT_LENGTH: z.coerce.number().int().min(1_024).max(200_000).default(80_000),
  GITHUB_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(500).max(30_000).default(8_000),
  SERVER_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(120_000).default(15_000),
  ALLOW_LEGACY_WRITE_KEY_DELETE: z.enum(["true", "false"]).default("false"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
  throw new Error(`Configuration serveur invalide. ${issues}`);
}

export const config = {
  githubToken: parsed.data.GITHUB_TOKEN ?? "",
  githubOwner: parsed.data.GITHUB_OWNER,
  githubRepo: parsed.data.GITHUB_REPO,
  githubBranch: parsed.data.GITHUB_BRANCH,
  allowedOrigins: parsed.data.ALLOWED_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0),
  host: parsed.data.HOST,
  port: parsed.data.PORT,
  jsonBodyLimit: parsed.data.JSON_BODY_LIMIT,
  logLevel: parsed.data.LOG_LEVEL,
  trustProxyHops: parsed.data.TRUST_PROXY_HOPS,
  apiRateLimitWindowMs: parsed.data.API_RATE_LIMIT_WINDOW_MS,
  apiRateLimitMax: parsed.data.API_RATE_LIMIT_MAX,
  writeRateLimitWindowMs: parsed.data.WRITE_RATE_LIMIT_WINDOW_MS,
  writeRateLimitMax: parsed.data.WRITE_RATE_LIMIT_MAX,
  maxCiphertextLength: parsed.data.MAX_CIPHERTEXT_LENGTH,
  githubRequestTimeoutMs: parsed.data.GITHUB_REQUEST_TIMEOUT_MS,
  serverRequestTimeoutMs: parsed.data.SERVER_REQUEST_TIMEOUT_MS,
  allowLegacyWriteKeyDelete: parsed.data.ALLOW_LEGACY_WRITE_KEY_DELETE === "true",
  // Chemin d'écriture volontairement verrouillé dans le code, pas en variable
  // d'environnement : l'API ne doit jamais pouvoir écrire ailleurs.
  aperosDataPath: "data/aperos",
} as const;

export function isGithubWriteConfigured(): boolean {
  return config.githubToken.length > 0;
}
