import { config } from "./config.js";

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 } as const;

type LogLevel = keyof typeof LEVELS;

const activeLevel = LEVELS[config.logLevel];

function write(level: LogLevel, message: string): void {
  if (LEVELS[level] > activeLevel) {
    return;
  }

  const line = `[${new Date().toISOString()}] [${level}] ${message}`;

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

// Interdit de passer ici un secret (GITHUB_TOKEN, writeKey, writeKeyHash,
// contenu chiffré) : ce logger n'accepte que des messages construits à la main.
export const logger = {
  error: (message: string) => write("error", message),
  warn: (message: string) => write("warn", message),
  info: (message: string) => write("info", message),
  debug: (message: string) => write("debug", message),
};
