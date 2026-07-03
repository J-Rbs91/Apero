export type ComptoirNameValidation =
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

export function validateComptoirName(name: string): ComptoirNameValidation {
  const normalizedName = normalizeDisplayName(name);

  if (!normalizedName) {
    return { ok: false, message: "M\u00eame le pilier du fond a un nom. Inscris quelque chose." };
  }

  if (normalizedName.length < 2) {
    return {
      ok: false,
      message:
        "C\u2019est un peu court pour entrer dans les grandes archives du zinc, qui ont leur dignit\u00e9.",
    };
  }

  if (normalizedName.length > 40) {
    return {
      ok: false,
      message: "C\u2019est un peu long pour un blaze. Fais plus court, \u00e7a passera mieux au comptoir.",
    };
  }

  return { ok: true, name: normalizedName };
}
