import { createHash, timingSafeEqual } from "node:crypto";

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

// Comparaison en temps constant de deux empreintes hexadécimales, pour ne pas
// laisser fuiter d'information de timing sur le writeKeyHash stocké.
export function safeEqualHex(a: string, b: string): boolean {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();

  if (left.length !== right.length || left.length === 0) {
    return false;
  }

  return timingSafeEqual(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}
