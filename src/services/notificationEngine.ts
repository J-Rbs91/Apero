// Moteur de notifications — logique pure et testable.
//
// Il ne touche ni au localStorage, ni au DOM, ni à l'API Notification : il
// prend un apéro déjà déchiffré + l'instantané « déjà vu » précédent, et rend
// la liste des notifications à créer + le prochain instantané. La persistance
// et la diffusion (badge, notifications système) vivent ailleurs.

import type { AperitifEvent, AperitifOption, ParticipantResponse } from "../types/apero";
import type {
  AppNotification,
  NotificationEventType,
  NotificationViewer,
  ViewerVote,
} from "../types/notifications";
import { normalizeMemberName } from "../utils/memberName";

// Instantané de l'état « déjà vu » d'un apéro sur cet appareil.
export type AperoSnapshot = {
  // Signature de contenu de chaque créneau, indexée par id.
  optionSignatures: Record<string, string>;
  // Signature du vote de chaque participant, indexée par nom normalisé.
  participantVotes: Record<string, string>;
  // Créneau confirmé au moment du dernier sync.
  selectedOptionId?: string;
  // Mots du mur du comptoir déjà vus. Optionnel : les instantanés d'avant la
  // fonctionnalité n'ont pas le champ (aucun message n'existait alors).
  messageIds?: string[];
  // Rappels « peut-être » déjà déclenchés ("48h", "24h", "2h").
  firedReminders: string[];
  // Coup de coude « à qui le tour ? » déjà envoyé une fois l'apéro passé.
  // Optionnel : les instantanés persistés avant cette fonctionnalité n'ont pas
  // le champ, ce qui vaut « pas encore envoyé ».
  firedNextRoundNudge?: boolean;
  // Faux tant qu'on n'a jamais synchronisé cet apéro : le tout premier passage
  // ne fait qu'enregistrer l'état, sans notifier l'historique déjà présent.
  initialized: boolean;
};

export function createEmptySnapshot(): AperoSnapshot {
  return {
    optionSignatures: {},
    participantVotes: {},
    selectedOptionId: undefined,
    messageIds: [],
    firedReminders: [],
    firedNextRoundNudge: false,
    initialized: false,
  };
}

// Réponse d'un participant dérivée de ses votes créneau par créneau.
export function deriveVote(participant: ParticipantResponse | undefined): ViewerVote {
  if (!participant) {
    return "none";
  }
  const votes = Object.values(participant.votes ?? {});
  if (votes.length === 0) {
    return "none";
  }
  if (votes.some((vote) => vote === "yes")) {
    return "yes";
  }
  if (votes.some((vote) => vote === "maybe")) {
    return "maybe";
  }
  return "no";
}

function optionSignature(option: AperitifOption): string {
  return [
    option.date,
    option.time,
    option.location,
    option.locationAddress ?? "",
    option.locationLat ?? "",
    option.locationLng ?? "",
    option.note ?? "",
  ].join("|");
}

function participantVoteSignature(participant: ParticipantResponse): string {
  const entries = Object.entries(participant.votes ?? {}).sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(entries);
}

export function snapshotApero(event: AperitifEvent): AperoSnapshot {
  const optionSignatures: Record<string, string> = {};
  for (const option of event.options) {
    optionSignatures[option.id] = optionSignature(option);
  }

  const participantVotes: Record<string, string> = {};
  for (const participant of event.participants) {
    participantVotes[normalizeMemberName(participant.participantName)] =
      participantVoteSignature(participant);
  }

  return {
    optionSignatures,
    participantVotes,
    selectedOptionId: event.selectedOptionId,
    messageIds: (event.messages ?? []).map((message) => message.id),
    firedReminders: [],
    initialized: true,
  };
}

// Un invité « oui » ou encore indécis (« none ») est tenu au courant des
// évolutions de l'apéro. Un « peut-être » ne reçoit que des rappels, un « non »
// plus rien (section 4 : sauf s'il rechange lui-même sa réponse — ce qui le
// fait repasser « oui/peut-être/none » et réactive donc ce canal).
function guestFollowsUpdates(vote: ViewerVote): boolean {
  return vote === "yes" || vote === "none";
}

type DraftNotification = {
  type: NotificationEventType;
  title: string;
  body: string;
  dedupeKey: string;
};

function buildNotifications(
  event: AperitifEvent,
  previous: AperoSnapshot,
  viewer: NotificationViewer,
): DraftNotification[] {
  const drafts: DraftNotification[] = [];
  const isCreator = viewer.role === "creator";

  // 1) Participants : réponses des invités (canal créateur uniquement).
  if (isCreator) {
    for (const participant of event.participants) {
      const key = normalizeMemberName(participant.participantName);
      // Ne jamais s'auto-notifier de sa propre ligne.
      if (key === viewer.normalizedName) {
        continue;
      }
      const signature = participantVoteSignature(participant);
      const previousSignature = previous.participantVotes[key];

      if (previousSignature === undefined) {
        drafts.push({
          type: "guest-responded",
          title: "Nouvelle réponse au registre",
          body: `${participant.participantName} vient d’émarger à « ${event.ceremonialName} ».`,
          dedupeKey: `${event.id}:responded:${key}`,
        });
      } else if (previousSignature !== signature) {
        drafts.push({
          type: "guest-changed-response",
          title: "Un convive a changé d’avis",
          body: `${participant.participantName} a modifié sa réponse à « ${event.ceremonialName} ».`,
          // La signature entre dans la clé : chaque modification distincte
          // produit sa propre notification.
          dedupeKey: `${event.id}:changed:${key}:${signature}`,
        });
      }
    }
  }

  // 2) Créneaux ajoutés ou modifiés.
  for (const option of event.options) {
    const signature = optionSignature(option);
    const previousSignature = previous.optionSignatures[option.id];
    const addedByViewer =
      option.createdByName != null &&
      normalizeMemberName(option.createdByName) === viewer.normalizedName;

    if (previousSignature === undefined) {
      // Créneau nouveau.
      if (isCreator && !addedByViewer && option.createdByRole === "participant") {
        // Le créateur est prévenu qu'un invité a proposé un créneau.
        drafts.push({
          type: "guest-proposed-option",
          title: "Nouvelle proposition de créneau",
          body: `${option.createdByName ?? "Un convive"} propose un créneau pour « ${event.ceremonialName} ».`,
          dedupeKey: `${event.id}:proposed:${option.id}`,
        });
      }
      if (!isCreator && !addedByViewer && guestFollowsUpdates(viewer.vote)) {
        // Les invités engagés sont prévenus des nouvelles propositions.
        drafts.push({
          type: "new-option",
          title: "Nouvelle proposition de créneau",
          body: `Un nouveau créneau a été proposé pour « ${event.ceremonialName} ».`,
          dedupeKey: `${event.id}:new-option:${option.id}`,
        });
      }
    } else if (previousSignature !== signature && !addedByViewer) {
      // Créneau modifié : les invités engagés sont prévenus.
      if (!isCreator && guestFollowsUpdates(viewer.vote)) {
        drafts.push({
          type: "option-modified",
          title: "Un créneau a bougé",
          body: `Un créneau de « ${event.ceremonialName} » a bougé. Va voir lequel.`,
          dedupeKey: `${event.id}:option-modified:${option.id}:${signature}`,
        });
      }
    }
  }

  // 3) Mots laissés sur le mur du comptoir : créateur et invités engagés sont
  // prévenus, jamais l'auteur du mot lui-même.
  const knownMessageIds = new Set(previous.messageIds ?? []);
  for (const message of event.messages ?? []) {
    if (knownMessageIds.has(message.id)) {
      continue;
    }
    if (normalizeMemberName(message.authorName) === viewer.normalizedName) {
      continue;
    }
    if (isCreator || guestFollowsUpdates(viewer.vote)) {
      const excerpt =
        message.body.length > 90 ? `${message.body.slice(0, 89)}…` : message.body;
      drafts.push({
        type: "new-message",
        title: "Un mot au comptoir",
        body: `${message.authorName}, à propos de « ${event.ceremonialName} » : ${excerpt}`,
        dedupeKey: `${event.id}:message:${message.id}`,
      });
    }
  }

  // 4) Confirmation finale : le créneau retenu vient d'être fixé ou changé.
  if (
    event.selectedOptionId &&
    event.selectedOptionId !== previous.selectedOptionId &&
    !isCreator &&
    guestFollowsUpdates(viewer.vote)
  ) {
    const selected = event.options.find((option) => option.id === event.selectedOptionId);
    const wasAlreadySet = Boolean(previous.selectedOptionId);
    drafts.push({
      type: wasAlreadySet ? "important-change" : "final-confirmation",
      title: wasAlreadySet ? "Changement important" : "C’est confirmé !",
      body: selected
        ? `« ${event.ceremonialName} » est calé : ${selected.date} à ${selected.time}, ${selected.location}.`
        : `Le créneau retenu de « ${event.ceremonialName} » a changé.`,
      dedupeKey: `${event.id}:confirmed:${event.selectedOptionId}`,
    });
  }

  return drafts;
}

// ---- Rappels « peut-être » (section 3) --------------------------------------

const HOUR_MS = 60 * 60 * 1000;

const REMINDER_WINDOWS: Array<{ id: string; type: NotificationEventType; hours: number }> = [
  { id: "48h", type: "reminder-48h", hours: 48 },
  { id: "24h", type: "reminder-24h", hours: 24 },
  { id: "2h", type: "reminder-2h", hours: 2 },
];

function optionStartMs(option: AperitifOption): number {
  if (!option.date || !option.time) {
    return Number.NaN;
  }
  const time = new Date(`${option.date}T${option.time}:00`).getTime();
  return Number.isNaN(time) ? Number.NaN : time;
}

// Cible temporelle de l'apéro : le créneau confirmé s'il existe, sinon le
// prochain créneau à venir.
export function resolveAperoStartMs(event: AperitifEvent, nowMs: number): number {
  if (event.selectedOptionId) {
    const selected = event.options.find((option) => option.id === event.selectedOptionId);
    const selectedMs = selected ? optionStartMs(selected) : Number.NaN;
    if (!Number.isNaN(selectedMs)) {
      return selectedMs;
    }
  }
  const upcoming = event.options
    .map(optionStartMs)
    .filter((ms) => !Number.isNaN(ms) && ms >= nowMs)
    .sort((a, b) => a - b);
  return upcoming.length ? upcoming[0] : Number.NaN;
}

// Rappels à déclencher pour un « peut-être ». On ne rejoue jamais un palier
// déjà déclenché, et si plusieurs paliers sont franchis d'un coup (l'app était
// fermée), on n'émet que le plus proche de l'apéro pour ne pas spammer — les
// autres sont marqués comme déclenchés.
export function computeReminders(
  event: AperitifEvent,
  viewer: NotificationViewer,
  previous: AperoSnapshot,
  nowMs: number,
): { drafts: DraftNotification[]; firedReminders: string[] } {
  if (viewer.vote !== "maybe") {
    return { drafts: [], firedReminders: previous.firedReminders };
  }

  const startMs = resolveAperoStartMs(event, nowMs);
  if (Number.isNaN(startMs) || startMs <= nowMs) {
    return { drafts: [], firedReminders: previous.firedReminders };
  }

  const fired = new Set(previous.firedReminders);
  const crossedUnfired = REMINDER_WINDOWS.filter(
    (window) => nowMs >= startMs - window.hours * HOUR_MS && !fired.has(window.id),
  );

  if (crossedUnfired.length === 0) {
    return { drafts: [], firedReminders: previous.firedReminders };
  }

  // Marquer tous les paliers franchis comme déclenchés (pas de rattrapage).
  for (const window of crossedUnfired) {
    fired.add(window.id);
  }

  // N'émettre que le plus urgent (plus petite fenêtre) parmi les franchis.
  const mostUrgent = crossedUnfired.reduce((closest, window) =>
    window.hours < closest.hours ? window : closest,
  );

  const draft: DraftNotification = {
    type: mostUrgent.type,
    title: "Tu te tâtes encore ?",
    body: `« ${event.ceremonialName} » approche : plus que ${mostUrgent.id} pour trancher. Le registre attend.`,
    dedupeKey: `${event.id}:reminder:${mostUrgent.id}`,
  };

  return { drafts: [draft], firedReminders: Array.from(fired) };
}

// ---- Coup de coude post-apéro (« à qui le tour ? ») --------------------------

// On laisse l'apéro se finir tranquillement (12 h après l'heure du créneau),
// puis on souffle l'idée de la tournée suivante. Au-delà de 7 jours, on ne
// déterre plus rien : la fenêtre d'envie est passée.
const NEXT_ROUND_NUDGE_DELAY_MS = 12 * HOUR_MS;
const NEXT_ROUND_NUDGE_CUTOFF_MS = 7 * 24 * HOUR_MS;

// Date de référence d'un apéro passé : le créneau confirmé, sinon le dernier
// créneau daté (même logique que la purge).
function resolveAperoEndMs(event: AperitifEvent): number {
  if (event.selectedOptionId) {
    const selected = event.options.find((option) => option.id === event.selectedOptionId);
    const selectedMs = selected ? optionStartMs(selected) : Number.NaN;
    if (!Number.isNaN(selectedMs)) {
      return selectedMs;
    }
  }
  const dated = event.options.map(optionStartMs).filter((ms) => !Number.isNaN(ms));
  return dated.length ? Math.max(...dated) : Number.NaN;
}

// Le coup de coude s'adresse à ceux qui ont fait vivre l'apéro : le créateur
// (tournée récurrente à relancer) et les invités qui étaient partants (à eux
// de convoquer la prochaine). Les « peut-être » et « non » sont laissés en paix.
export function computeNextRoundNudge(
  event: AperitifEvent,
  viewer: NotificationViewer,
  previous: AperoSnapshot,
  nowMs: number,
): { drafts: DraftNotification[]; firedNextRoundNudge: boolean } {
  const alreadyFired = Boolean(previous.firedNextRoundNudge);

  if (alreadyFired) {
    return { drafts: [], firedNextRoundNudge: true };
  }

  const eligible = viewer.role === "creator" || viewer.vote === "yes";
  const endMs = resolveAperoEndMs(event);

  if (
    !eligible ||
    Number.isNaN(endMs) ||
    nowMs < endMs + NEXT_ROUND_NUDGE_DELAY_MS ||
    nowMs > endMs + NEXT_ROUND_NUDGE_CUTOFF_MS
  ) {
    // Fenêtre dépassée sans envoi : on grave le drapeau pour ne jamais
    // notifier un apéro préhistorique lors d'une future synchronisation.
    const expired = !Number.isNaN(endMs) && nowMs > endMs + NEXT_ROUND_NUDGE_CUTOFF_MS;
    return { drafts: [], firedNextRoundNudge: expired };
  }

  const draft: DraftNotification = event.recurrence
    ? {
        type: "next-round-nudge",
        title: "La tournée suivante attend",
        body: `« ${event.ceremonialName} » est passé, et cette assemblée se répète. Convoque la prochaine tournée, le zinc garde la cadence.`,
        dedupeKey: `${event.id}:next-round`,
      }
    : {
        type: "next-round-nudge",
        title: "L’assemblée est levée",
        body: `« ${event.ceremonialName} » est derrière nous. À qui le tour de convoquer ? Un lien, deux créneaux, et ça repart.`,
        dedupeKey: `${event.id}:next-round`,
      };

  return { drafts: [draft], firedNextRoundNudge: true };
}

// ---- Entrée principale du moteur --------------------------------------------

export type EngineResult = {
  notifications: AppNotification[];
  snapshot: AperoSnapshot;
};

// Diffe un apéro contre son instantané précédent et rend les notifications à
// créer + l'instantané à persister. `makeId` est injecté (pas de Date.now /
// random ici) pour rester déterministe et testable.
export function diffAperoNotifications(
  event: AperitifEvent,
  previous: AperoSnapshot,
  viewer: NotificationViewer,
  nowMs: number,
  makeId: (dedupeKey: string) => string,
  nowIso: string,
): EngineResult {
  // Premier contact avec cet apéro : on enregistre l'état sans notifier
  // l'historique déjà présent, mais on garde la trace des rappels.
  if (!previous.initialized) {
    return { notifications: [], snapshot: snapshotApero(event) };
  }

  const eventDrafts = buildNotifications(event, previous, viewer);
  const { drafts: reminderDrafts, firedReminders } = computeReminders(
    event,
    viewer,
    previous,
    nowMs,
  );
  const { drafts: nudgeDrafts, firedNextRoundNudge } = computeNextRoundNudge(
    event,
    viewer,
    previous,
    nowMs,
  );

  const nextSnapshot = snapshotApero(event);
  nextSnapshot.firedReminders = firedReminders;
  nextSnapshot.firedNextRoundNudge = firedNextRoundNudge;

  const notifications: AppNotification[] = [...eventDrafts, ...reminderDrafts, ...nudgeDrafts].map((draft) => ({
    id: makeId(draft.dedupeKey),
    aperoId: event.id,
    aperoName: event.ceremonialName,
    type: draft.type,
    title: draft.title,
    body: draft.body,
    createdAt: nowIso,
    read: false,
    dedupeKey: draft.dedupeKey,
  }));

  return { notifications, snapshot: nextSnapshot };
}
