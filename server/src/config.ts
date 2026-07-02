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
  // Chemin d'écriture volontairement verrouillé dans le code, pas en variable
  // d'environnement : l'API ne doit jamais pouvoir écrire ailleurs.
  aperosDataPath: "data/aperos",
} as const;

export function isGithubWriteConfigured(): boolean {
  return config.githubToken.length > 0;
}
