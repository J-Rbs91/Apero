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
    return { ok: false, message: "Nom requis." };
  }

  if (normalizedName.length < 2) {
    return { ok: false, message: "2 caract\u00e8res min." };
  }

  if (normalizedName.length > 40) {
    return { ok: false, message: "40 caract\u00e8res max." };
  }

  return { ok: true, name: normalizedName };
}
