// Repository des tablées (flux chiffré api-vps).
//
// Une tablée est stockée EXACTEMENT comme un apéro : un fichier chiffré
// AES-GCM sous data/aperos/, écrit via la même API VPS (qui ne lit jamais le
// contenu — elle n'a donc pas besoin de connaître la notion de tablée). Seul
// le payload déchiffré diffère : { kind: "tablee", ... }.

import type { AperitifEvent } from "../types/apero";
import type { Tablee, TableeAperoRef } from "../types/tablee";
import { AperoApiError, createOrUpdateEncryptedApero } from "./aperoApiClient";
import { isAdminKeyHashUnsupported } from "./encryptedAperoRepository";
import {
  generateAperoId,
  generateBase64UrlRandomKey,
  isValidAperoId,
  sha256Hex,
} from "./aperoCryptoKeys";
import { decryptAperoData, encryptAperoData, ENCRYPTION_KEY_BYTE_LENGTH } from "./aperoEncryption";
import { getEncryptedAperoById, readPublicAperoFile } from "./encryptedAperoRepository";
import { getLocalTablees, saveLocalTablee } from "./localTableeRegistry";
import { addTableeAperoRef, addTableeMember, sanitizeTablee } from "../utils/tableeValidation";

const WRITE_KEY_BYTE_LENGTH = 24;
const ADMIN_KEY_BYTE_LENGTH = 24;

export type CreateTableeInput = {
  name: string;
  motto?: string;
  founderName: string;
  /** Blazes attablés dès la fondation (ex. le registre d'un apéro fondateur). */
  memberNames?: string[];
  /** Apéro fondateur à rattacher immédiatement. */
  seedAperoRef?: Omit<TableeAperoRef, "addedAt">;
};

export type CreateTableeResult = {
  tableeId: string;
  encryptionKey: string;
  writeKey: string;
  tablee: Tablee;
};

/** Fondation d'une tablée : clés générées ici, écriture chiffrée via l'API VPS. */
export async function createTablee(input: CreateTableeInput): Promise<CreateTableeResult> {
  const tableeId = generateAperoId();
  const encryptionKey = generateBase64UrlRandomKey(ENCRYPTION_KEY_BYTE_LENGTH);
  const writeKey = generateBase64UrlRandomKey(WRITE_KEY_BYTE_LENGTH);
  // Clé de dissolution : reste sur l'appareil de la personne qui fonde,
  // jamais dans le lien de partage — même contrat que pour les apéros.
  const adminKey = generateBase64UrlRandomKey(ADMIN_KEY_BYTE_LENGTH);
  const now = new Date();
  const nowIso = now.toISOString();

  let tablee = sanitizeTablee(
    {
      kind: "tablee",
      id: tableeId,
      name: input.name,
      motto: input.motto,
      founderName: input.founderName,
      members: [
        { name: input.founderName, joinedAt: nowIso },
        ...(input.memberNames ?? []).map((name) => ({ name, joinedAt: nowIso })),
      ],
      aperoRefs: [],
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    tableeId,
  );

  if (input.seedAperoRef) {
    tablee = addTableeAperoRef(tablee, { ...input.seedAperoRef, addedAt: nowIso }, now);
  }

  const encryptedPayload = await encryptAperoData(tablee, encryptionKey);
  const writeKeyHash = await sha256Hex(writeKey);
  const adminKeyHash = await sha256Hex(adminKey);

  let adminKeyForLocalStorage: string | undefined = adminKey;

  try {
    await createOrUpdateEncryptedApero({
      aperoId: tableeId,
      writeKey,
      encryptedPayload,
      writeKeyHash,
      adminKeyHash,
    });
  } catch (error) {
    if (!isAdminKeyHashUnsupported(error)) {
      throw error;
    }
    // API VPS antérieure à adminKeyHash : on crée sans, comme pour les apéros.
    await createOrUpdateEncryptedApero({
      aperoId: tableeId,
      writeKey,
      encryptedPayload,
      writeKeyHash,
    });
    adminKeyForLocalStorage = undefined;
  }

  saveLocalTablee({
    tableeId,
    encryptionKey,
    writeKey,
    adminKey: adminKeyForLocalStorage,
    name: tablee.name,
    role: "founder",
  });

  return { tableeId, encryptionKey, writeKey, tablee };
}

/**
 * Lecture + déchiffrement d'une tablée. Null si le fichier n'existe pas.
 * TableeValidationError si le fichier déchiffré n'est pas une tablée.
 */
export async function getTableeById(
  tableeId: string,
  encryptionKey: string,
): Promise<{ tablee: Tablee; sha: string } | null> {
  if (!isValidAperoId(tableeId)) {
    return null;
  }

  const stored = await readPublicAperoFile(tableeId);
  if (!stored) {
    return null;
  }

  const raw = await decryptAperoData<unknown>(
    { version: 1, encryption: stored.file.encryption },
    encryptionKey,
  );

  return { tablee: sanitizeTablee(raw, tableeId), sha: stored.sha };
}

/** Mise à jour avec relecture + retry anti-conflit, miroir d'updateEncryptedApero. */
export async function updateTablee(
  tableeId: string,
  writeKey: string,
  encryptionKey: string,
  updater: (tablee: Tablee) => Tablee,
): Promise<Tablee> {
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const current = await getTableeById(tableeId, encryptionKey);

    if (!current) {
      throw new AperoApiError("NOT_FOUND", "Cette tablee n'existe pas ou plus.");
    }

    const updated = sanitizeTablee(
      { ...updater(current.tablee), id: tableeId, updatedAt: new Date().toISOString() },
      tableeId,
    );

    const encryptedPayload = await encryptAperoData(updated, encryptionKey);

    try {
      await createOrUpdateEncryptedApero({
        aperoId: tableeId,
        writeKey,
        encryptedPayload,
        baseSha: current.sha,
      });
      return updated;
    } catch (error) {
      const isRetryableConflict =
        error instanceof AperoApiError && error.code === "CONFLICT" && attempt < maxAttempts;

      if (!isRetryableConflict) {
        throw error;
      }
    }
  }

  throw new AperoApiError("CONFLICT", "Conflit d'ecriture persistant.");
}

/** S'attabler : ajoute le blaze aux membres et mémorise la tablée localement. */
export async function joinTablee(
  tableeId: string,
  writeKey: string,
  encryptionKey: string,
  memberName: string,
): Promise<Tablee> {
  const updated = await updateTablee(tableeId, writeKey, encryptionKey, (tablee) =>
    addTableeMember(tablee, memberName),
  );

  saveLocalTablee({
    tableeId,
    encryptionKey,
    writeKey,
    name: updated.name,
    role: "member",
  });

  return updated;
}

/** Rattache un apéro à la tablée (idempotent par aperoId). */
export async function addAperoToTablee(
  tableeId: string,
  writeKey: string,
  encryptionKey: string,
  ref: Omit<TableeAperoRef, "addedAt">,
): Promise<Tablee> {
  return updateTablee(tableeId, writeKey, encryptionKey, (tablee) =>
    addTableeAperoRef(tablee, { ...ref, addedAt: new Date().toISOString() }),
  );
}

export type TableeAperoItem = {
  ref: TableeAperoRef;
  event: AperitifEvent | null;
};

/** Charge les apéros rattachés (null pour ceux devenus illisibles/supprimés). */
export async function loadTableeAperos(tablee: Tablee): Promise<TableeAperoItem[]> {
  return Promise.all(
    tablee.aperoRefs.map(async (ref) => {
      try {
        const loaded = await getEncryptedAperoById(ref.aperoId, ref.encryptionKey);
        return { ref, event: loaded?.event ?? null };
      } catch {
        return { ref, event: null };
      }
    }),
  );
}

export type MyTableeItem = {
  entry: ReturnType<typeof getLocalTablees>[number];
  tablee: Tablee | null;
};

/** « Mes tablées » : uniquement celles du registre local de l'appareil. */
export async function getMyTablees(): Promise<MyTableeItem[]> {
  const entries = getLocalTablees();

  return Promise.all(
    entries.map(async (entry) => {
      try {
        const loaded = await getTableeById(entry.tableeId, entry.encryptionKey);
        return { entry, tablee: loaded?.tablee ?? null };
      } catch {
        return { entry, tablee: null };
      }
    }),
  );
}
