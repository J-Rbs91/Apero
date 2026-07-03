import type {
  AperitifEvent,
  AperitifEventStatus,
  AperitifOption,
  BeaufLevel,
  OptionCreatorRole,
  ParticipantResponse,
  VoteStatus,
} from "../types/apero";
import { APERO_ID_PATTERN } from "../services/aperoCryptoKeys";

const GENERIC_ID_PATTERN = /^[A-Za-z0-9_-]{3,80}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const ISO_DATE_MAX_LENGTH = 40;

const MAX_OPTIONS = 20;
const MAX_PARTICIPANTS = 120;
const MAX_NAME_LENGTH = 80;
const MAX_TITLE_LENGTH = 160;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_LOCATION_LENGTH = 160;
const MAX_ADDRESS_LENGTH = 240;
const MAX_NOTE_LENGTH = 280;
const MAX_BRINGS_LENGTH = 120;
const MAX_COMMENT_LENGTH = 500;

const BEAUF_LEVELS = new Set(["soft", "medium", "legendary"]);
const EVENT_STATUSES = new Set(["active", "closed", "archived"]);
const CREATOR_ROLES = new Set(["organizer", "participant"]);
const VOTE_STATUSES = new Set(["yes", "maybe", "no"]);

export class AperoValidationError extends Error {
  readonly code = "INVALID_APERO_DATA";

  constructor(message: string) {
    super(message);
    this.name = "AperoValidationError";
  }
}

function fail(field: string, message: string): never {
  throw new AperoValidationError(`${field}: ${message}`);
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

function cleanId(value: unknown, field: string, pattern = GENERIC_ID_PATTERN): string {
  const id = cleanText(value, field, 80, { required: true });

  if (!id || !pattern.test(id)) {
    fail(field, "identifiant invalide");
  }

  return id;
}

function cleanIsoDate(value: unknown, field: string): string {
  const text = cleanText(value, field, ISO_DATE_MAX_LENGTH, { required: true });
  const timestamp = text ? Date.parse(text) : Number.NaN;

  if (!text || Number.isNaN(timestamp)) {
    fail(field, "date ISO invalide");
  }

  return new Date(timestamp).toISOString();
}

function cleanOptionalIsoDate(value: unknown, field: string): string | undefined {
  if (value == null || value === "") {
    return undefined;
  }
  return cleanIsoDate(value, field);
}

function cleanDate(value: unknown, field: string): string {
  const text = cleanText(value, field, 10, { required: true });

  if (!text || !DATE_PATTERN.test(text)) {
    fail(field, "format attendu YYYY-MM-DD");
  }

  const parsed = new Date(`${text}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text) {
    fail(field, "date invalide");
  }

  return text;
}

function cleanTime(value: unknown, field: string): string {
  const text = cleanText(value, field, 5, { required: true });

  if (!text || !TIME_PATTERN.test(text)) {
    fail(field, "format attendu HH:MM");
  }

  return text;
}

function cleanOptionalNumber(
  value: unknown,
  field: string,
  min: number,
  max: number,
  options: { integer?: boolean } = {},
): number | undefined {
  if (value == null || value === "") {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    fail(field, "doit etre un nombre fini");
  }

  if (options.integer && !Number.isInteger(value)) {
    fail(field, "doit etre un entier");
  }

  if (value < min || value > max) {
    fail(field, `doit etre entre ${min} et ${max}`);
  }

  return value;
}

function cleanEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: Set<string>,
  fallback?: T,
): T {
  if (value == null || value === "") {
    if (fallback) {
      return fallback;
    }
    fail(field, "champ requis");
  }

  if (typeof value !== "string" || !allowed.has(value)) {
    fail(field, "valeur non autorisee");
  }

  return value as T;
}

function cleanOption(rawOption: unknown, index: number, optionIds: Set<string>): AperitifOption {
  if (!isRecord(rawOption)) {
    fail(`options[${index}]`, "doit etre un objet");
  }

  const id = cleanId(rawOption.id, `options[${index}].id`);
  if (optionIds.has(id)) {
    fail(`options[${index}].id`, "identifiant duplique");
  }
  optionIds.add(id);

  const locationLat = cleanOptionalNumber(rawOption.locationLat, `options[${index}].locationLat`, -90, 90);
  const locationLng = cleanOptionalNumber(rawOption.locationLng, `options[${index}].locationLng`, -180, 180);
  if ((locationLat == null) !== (locationLng == null)) {
    fail(`options[${index}]`, "latitude et longitude doivent etre fournies ensemble");
  }

  const option: AperitifOption = {
    id,
    date: cleanDate(rawOption.date, `options[${index}].date`),
    time: cleanTime(rawOption.time, `options[${index}].time`),
    location: cleanText(rawOption.location, `options[${index}].location`, MAX_LOCATION_LENGTH, {
      required: true,
    }) as string,
  };

  const locationAddress = cleanText(rawOption.locationAddress, `options[${index}].locationAddress`, MAX_ADDRESS_LENGTH);
  const note = cleanText(rawOption.note, `options[${index}].note`, MAX_NOTE_LENGTH);
  const createdByName = cleanText(rawOption.createdByName, `options[${index}].createdByName`, MAX_NAME_LENGTH);
  const createdAt = cleanOptionalIsoDate(rawOption.createdAt, `options[${index}].createdAt`);
  const createdByRole = rawOption.createdByRole == null
    ? undefined
    : cleanEnum<OptionCreatorRole>(rawOption.createdByRole, `options[${index}].createdByRole`, CREATOR_ROLES);

  return {
    ...option,
    ...(locationAddress ? { locationAddress } : {}),
    ...(locationLat != null && locationLng != null ? { locationLat, locationLng } : {}),
    ...(note ? { note } : {}),
    ...(createdByRole ? { createdByRole } : {}),
    ...(createdByName ? { createdByName } : {}),
    ...(createdAt ? { createdAt } : {}),
  };
}

function cleanParticipant(
  rawParticipant: unknown,
  index: number,
  optionIds: Set<string>,
  participantIds: Set<string>,
): ParticipantResponse {
  if (!isRecord(rawParticipant)) {
    fail(`participants[${index}]`, "doit etre un objet");
  }

  const id = cleanId(rawParticipant.id, `participants[${index}].id`);
  if (participantIds.has(id)) {
    fail(`participants[${index}].id`, "identifiant duplique");
  }
  participantIds.add(id);

  if (!isRecord(rawParticipant.votes)) {
    fail(`participants[${index}].votes`, "doit etre un objet");
  }

  const votes: Record<string, VoteStatus> = {};
  Object.entries(rawParticipant.votes).forEach(([optionId, vote]) => {
    if (!optionIds.has(optionId)) {
      fail(`participants[${index}].votes.${optionId}`, "option inconnue");
    }
    votes[optionId] = cleanEnum<VoteStatus>(vote, `participants[${index}].votes.${optionId}`, VOTE_STATUSES);
  });

  if (Object.keys(votes).length === 0) {
    fail(`participants[${index}].votes`, "au moins un vote est requis");
  }

  const brings = cleanText(rawParticipant.brings, `participants[${index}].brings`, MAX_BRINGS_LENGTH);
  const comment = cleanText(rawParticipant.comment, `participants[${index}].comment`, MAX_COMMENT_LENGTH);
  const traquenardLevel = cleanOptionalNumber(
    rawParticipant.traquenardLevel,
    `participants[${index}].traquenardLevel`,
    0,
    10,
    { integer: true },
  );

  return {
    id,
    participantName: cleanText(rawParticipant.participantName, `participants[${index}].participantName`, MAX_NAME_LENGTH, {
      required: true,
    }) as string,
    votes,
    ...(brings ? { brings } : {}),
    ...(comment ? { comment } : {}),
    ...(traquenardLevel != null ? { traquenardLevel } : {}),
    createdAt: cleanIsoDate(rawParticipant.createdAt, `participants[${index}].createdAt`),
    updatedAt: cleanIsoDate(rawParticipant.updatedAt, `participants[${index}].updatedAt`),
  };
}

export function sanitizeAperoEvent(rawEvent: unknown, expectedId?: string): AperitifEvent {
  if (!isRecord(rawEvent)) {
    fail("event", "doit etre un objet");
  }

  const id = cleanId(rawEvent.id, "event.id", APERO_ID_PATTERN);
  if (expectedId && id !== expectedId) {
    fail("event.id", "ne correspond pas au fichier demande");
  }

  if (!Array.isArray(rawEvent.options) || rawEvent.options.length === 0) {
    fail("event.options", "au moins un creneau est requis");
  }
  if (rawEvent.options.length > MAX_OPTIONS) {
    fail("event.options", `depasse ${MAX_OPTIONS} creneaux`);
  }

  if (!Array.isArray(rawEvent.participants)) {
    fail("event.participants", "doit etre un tableau");
  }
  if (rawEvent.participants.length > MAX_PARTICIPANTS) {
    fail("event.participants", `depasse ${MAX_PARTICIPANTS} participants`);
  }

  const optionIds = new Set<string>();
  const options = rawEvent.options.map((option, index) => cleanOption(option, index, optionIds));

  const participantIds = new Set<string>();
  const participants = rawEvent.participants.map((participant, index) =>
    cleanParticipant(participant, index, optionIds, participantIds),
  );

  const selectedOptionId = cleanText(rawEvent.selectedOptionId, "event.selectedOptionId", 80);
  if (selectedOptionId && !optionIds.has(selectedOptionId)) {
    fail("event.selectedOptionId", "option inconnue");
  }

  const title = cleanText(rawEvent.title, "event.title", MAX_TITLE_LENGTH);
  const description = cleanText(rawEvent.description, "event.description", MAX_DESCRIPTION_LENGTH);
  const closedAt = cleanOptionalIsoDate(rawEvent.closedAt, "event.closedAt");

  return {
    id,
    ceremonialName: cleanText(rawEvent.ceremonialName, "event.ceremonialName", MAX_TITLE_LENGTH, {
      required: true,
    }) as string,
    ...(title ? { title } : {}),
    organizerName: cleanText(rawEvent.organizerName, "event.organizerName", MAX_NAME_LENGTH, {
      required: true,
    }) as string,
    ...(description ? { description } : {}),
    beaufLevel: cleanEnum<BeaufLevel>(rawEvent.beaufLevel, "event.beaufLevel", BEAUF_LEVELS, "medium"),
    status: cleanEnum<AperitifEventStatus>(rawEvent.status, "event.status", EVENT_STATUSES, "active"),
    options,
    participants,
    createdAt: cleanIsoDate(rawEvent.createdAt, "event.createdAt"),
    updatedAt: cleanIsoDate(rawEvent.updatedAt, "event.updatedAt"),
    ...(closedAt ? { closedAt } : {}),
    ...(selectedOptionId ? { selectedOptionId } : {}),
  };
}
