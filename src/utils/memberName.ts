export type GentlemanNameValidation =
  | { ok: true; name: string }
  | { ok: false; message: string };

export function normalizeDisplayName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

export function normalizeMemberName(name: string): string {
  return normalizeDisplayName(name)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function validateGentlemanName(name: string): GentlemanNameValidation {
  const normalizedName = normalizeDisplayName(name);

  if (!normalizedName) {
    return { ok: false, message: "M\u00eame le pilier du fond a un nom. Inscris quelque chose." };
  }

  if (normalizedName.length < 2) {
    return {
      ok: false,
      message: "C\u2019est un peu court pour entrer dans les archives du zinc.",
    };
  }

  if (normalizedName.length > 40) {
    return {
      ok: false,
      message: "Le registre n\u2019a pas assez de papier pour un blaze pareil.",
    };
  }

  return { ok: true, name: normalizedName };
}
