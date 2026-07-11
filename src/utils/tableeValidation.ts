// Validation du payload déchiffré d'une tablée. Même philosophie que
// sanitizeAperoEvent : le contenu vient d'un porteur de clé, donc un objet
// hostile ne doit jamais faire remonter une TypeError brute ni gonfler sans
// limite.

import type { Tablee, TableeAperoRef, TableeMember } from "../types/tablee";
import { APERO_ID_PATTERN } from "../services/aperoCryptoKeys";
import { normalizeMemberName } from "./memberName";

const MAX_NAME_LENGTH = 80;
const MAX_MOTTO_LENGTH = 160;
const MAX_MEMBERS = 120;
const MAX_APERO_REFS = 200;
const MAX_KEY_LENGTH = 256;
const ISO_DATE_MAX_LENGTH = 40;

export class TableeValidationError extends Error {
  readonly code = "INVALID_TABLEE_DATA";

  constructor(message: string) {
    super(message);
    this.name = "TableeValidationError";
  }
}

function fail(field: string, message: string): never {
  throw new TableeValidationError(`${field}: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function cleanText(
  value: unknown,
  field: string,
  maxLength: number,
  options: { required?: boolean } = {},
): string | undefined {
  if (value == null || value === "") {
    if (options.required) {
      fail(field, "champ requis");
    }
    return undefined;
  }

  if (typeof value !== "string") {
    fail(field, "doit etre du texte");
  }

  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();

  if (!cleaned) {
    if (options.required) {
      fail(field, "champ requis");
    }
    return undefined;
  }

  if (cleaned.length > maxLength) {
    fail(field, `depasse ${maxLength} caracteres`);
  }

  return cleaned;
}

function cleanIsoDate(value: unknown, field: string): string {
  const text = cleanText(value, field, ISO_DATE_MAX_LENGTH, { required: true });
  const timestamp = text ? Date.parse(text) : Number.NaN;

  if (!text || Number.isNaN(timestamp)) {
    fail(field, "date ISO invalide");
  }

  return new Date(timestamp).toISOString();
}

// Les clés ne sont pas interprétées ici, juste bornées : le déchiffrement
// tranchera de toute façon.
function cleanKey(value: unknown, field: string, options: { required?: boolean } = {}): string | undefined {
  if (value == null || value === "") {
    if (options.required) {
      fail(field, "champ requis");
    }
    return undefined;
  }
  if (typeof value !== "string" || value.length < 16 || value.length > MAX_KEY_LENGTH) {
    fail(field, "cle invalide");
  }
  return value;
}

function cleanMember(rawMember: unknown, index: number): TableeMember {
  if (!isRecord(rawMember)) {
    fail(`members[${index}]`, "doit etre un objet");
  }

  return {
    name: cleanText(rawMember.name, `members[${index}].name`, MAX_NAME_LENGTH, {
      required: true,
    }) as string,
    joinedAt: cleanIsoDate(rawMember.joinedAt, `members[${index}].joinedAt`),
  };
}

function cleanAperoRef(rawRef: unknown, index: number): TableeAperoRef {
  if (!isRecord(rawRef)) {
    fail(`aperoRefs[${index}]`, "doit etre un objet");
  }

  const aperoId = cleanText(rawRef.aperoId, `aperoRefs[${index}].aperoId`, 80, {
    required: true,
  }) as string;
  if (!APERO_ID_PATTERN.test(aperoId)) {
    fail(`aperoRefs[${index}].aperoId`, "identifiant invalide");
  }

  const writeKey = cleanKey(rawRef.writeKey, `aperoRefs[${index}].writeKey`);
  const addedBy = cleanText(rawRef.addedBy, `aperoRefs[${index}].addedBy`, MAX_NAME_LENGTH);

  return {
    aperoId,
    encryptionKey: cleanKey(rawRef.encryptionKey, `aperoRefs[${index}].encryptionKey`, {
      required: true,
    }) as string,
    ...(writeKey ? { writeKey } : {}),
    ceremonialName: cleanText(rawRef.ceremonialName, `aperoRefs[${index}].ceremonialName`, MAX_NAME_LENGTH, {
      required: true,
    }) as string,
    addedAt: cleanIsoDate(rawRef.addedAt, `aperoRefs[${index}].addedAt`),
    ...(addedBy ? { addedBy } : {}),
  };
}

export function sanitizeTablee(rawTablee: unknown, expectedId?: string): Tablee {
  if (!isRecord(rawTablee)) {
    fail("tablee", "doit etre un objet");
  }

  if (rawTablee.kind !== "tablee") {
    fail("tablee.kind", "ce fichier n'est pas une tablee");
  }

  const id = cleanText(rawTablee.id, "tablee.id", 80, { required: true }) as string;
  if (!APERO_ID_PATTERN.test(id)) {
    fail("tablee.id", "identifiant invalide");
  }
  if (expectedId && id !== expectedId) {
    fail("tablee.id", "ne correspond pas au fichier demande");
  }

  if (!Array.isArray(rawTablee.members)) {
    fail("tablee.members", "doit etre un tableau");
  }
  if (rawTablee.members.length > MAX_MEMBERS) {
    fail("tablee.members", `depasse ${MAX_MEMBERS} membres`);
  }

  const rawRefs = rawTablee.aperoRefs == null ? [] : rawTablee.aperoRefs;
  if (!Array.isArray(rawRefs)) {
    fail("tablee.aperoRefs", "doit etre un tableau");
  }
  if (rawRefs.length > MAX_APERO_REFS) {
    fail("tablee.aperoRefs", `depasse ${MAX_APERO_REFS} aperos`);
  }

  // Membres dédupliqués par nom normalisé, comme partout ailleurs.
  const memberKeys = new Set<string>();
  const members: TableeMember[] = [];
  rawTablee.members.forEach((rawMember, index) => {
    const member = cleanMember(rawMember, index);
    const key = normalizeMemberName(member.name);
    if (!key || memberKeys.has(key)) {
      return;
    }
    memberKeys.add(key);
    members.push(member);
  });

  const refIds = new Set<string>();
  const aperoRefs: TableeAperoRef[] = [];
  rawRefs.forEach((rawRef, index) => {
    const ref = cleanAperoRef(rawRef, index);
    if (refIds.has(ref.aperoId)) {
      return;
    }
    refIds.add(ref.aperoId);
    aperoRefs.push(ref);
  });

  const motto = cleanText(rawTablee.motto, "tablee.motto", MAX_MOTTO_LENGTH);

  return {
    kind: "tablee",
    id,
    name: cleanText(rawTablee.name, "tablee.name", MAX_NAME_LENGTH, { required: true }) as string,
    ...(motto ? { motto } : {}),
    founderName: cleanText(rawTablee.founderName, "tablee.founderName", MAX_NAME_LENGTH, {
      required: true,
    }) as string,
    members,
    aperoRefs,
    createdAt: cleanIsoDate(rawTablee.createdAt, "tablee.createdAt"),
    updatedAt: cleanIsoDate(rawTablee.updatedAt, "tablee.updatedAt"),
  };
}

/** Ajoute un membre (dédupliqué par nom normalisé). */
export function addTableeMember(tablee: Tablee, name: string, now = new Date()): Tablee {
  const key = normalizeMemberName(name);
  if (!key || tablee.members.some((member) => normalizeMemberName(member.name) === key)) {
    return tablee;
  }

  return {
    ...tablee,
    members: [...tablee.members, { name, joinedAt: now.toISOString() }],
    updatedAt: now.toISOString(),
  };
}

/** Rattache un apéro (dédupliqué par identifiant). */
export function addTableeAperoRef(tablee: Tablee, ref: TableeAperoRef, now = new Date()): Tablee {
  if (tablee.aperoRefs.some((existing) => existing.aperoId === ref.aperoId)) {
    return tablee;
  }

  return {
    ...tablee,
    aperoRefs: [...tablee.aperoRefs, ref],
    updatedAt: now.toISOString(),
  };
}
