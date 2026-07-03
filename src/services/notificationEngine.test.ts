import { describe, expect, it } from "vitest";
import type { AperitifEvent, AperitifOption, ParticipantResponse } from "../types/apero";
import type { NotificationViewer } from "../types/notifications";
import {
  computeReminders,
  createEmptySnapshot,
  deriveVote,
  diffAperoNotifications,
  resolveAperoStartMs,
  snapshotApero,
} from "./notificationEngine";

const NOW_ISO = "2026-07-03T12:00:00.000Z";
const makeId = (dedupeKey: string) => `id:${dedupeKey}`;

function option(overrides: Partial<AperitifOption> = {}): AperitifOption {
  return {
    id: "option_1",
    date: "2026-07-10",
    time: "19:00",
    location: "Chez Dédé",
    createdByRole: "organizer",
    createdByName: "Organisateur",
    ...overrides,
  };
}

function participant(overrides: Partial<ParticipantResponse> = {}): ParticipantResponse {
  return {
    id: "participant_1",
    participantName: "Jean-Mi",
    votes: {},
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
    ...overrides,
  };
}

function event(overrides: Partial<AperitifEvent> = {}): AperitifEvent {
  return {
    id: "apero_test",
    ceremonialName: "Le Concile du Saucisson",
    organizerName: "Organisateur",
    beaufLevel: "medium",
    status: "active",
    options: [option()],
    participants: [],
    createdAt: NOW_ISO,
    updatedAt: NOW_ISO,
    ...overrides,
  };
}

const creator: NotificationViewer = { role: "creator", vote: "none", normalizedName: "organisateur" };
const yesGuest: NotificationViewer = { role: "participant", vote: "yes", normalizedName: "moi" };
const maybeGuest: NotificationViewer = { role: "participant", vote: "maybe", normalizedName: "moi" };
const noGuest: NotificationViewer = { role: "participant", vote: "no", normalizedName: "moi" };

describe("deriveVote", () => {
  it("classe selon la priorité oui > peut-être > non", () => {
    expect(deriveVote(undefined)).toBe("none");
    expect(deriveVote(participant({ votes: {} }))).toBe("none");
    expect(deriveVote(participant({ votes: { a: "no", b: "maybe" } }))).toBe("maybe");
    expect(deriveVote(participant({ votes: { a: "no", b: "yes", c: "maybe" } }))).toBe("yes");
    expect(deriveVote(participant({ votes: { a: "no" } }))).toBe("no");
  });
});

describe("premier contact", () => {
  it("n'émet rien mais enregistre l'instantané", () => {
    const result = diffAperoNotifications(
      event({ participants: [participant({ votes: { option_1: "yes" } })] }),
      createEmptySnapshot(),
      creator,
      Date.parse(NOW_ISO),
      makeId,
      NOW_ISO,
    );
    expect(result.notifications).toHaveLength(0);
    expect(result.snapshot.initialized).toBe(true);
  });
});

describe("notifications créateur", () => {
  it("notifie une nouvelle réponse d'invité", () => {
    const before = snapshotApero(event());
    const after = event({ participants: [participant({ votes: { option_1: "yes" } })] });
    const result = diffAperoNotifications(after, before, creator, Date.parse(NOW_ISO), makeId, NOW_ISO);
    expect(result.notifications.map((n) => n.type)).toEqual(["guest-responded"]);
  });

  it("notifie une modification de réponse", () => {
    const start = event({ participants: [participant({ votes: { option_1: "maybe" } })] });
    const before = snapshotApero(start);
    const after = event({ participants: [participant({ votes: { option_1: "yes" } })] });
    const result = diffAperoNotifications(after, before, creator, Date.parse(NOW_ISO), makeId, NOW_ISO);
    expect(result.notifications.map((n) => n.type)).toEqual(["guest-changed-response"]);
  });

  it("notifie une proposition de créneau par un invité", () => {
    const before = snapshotApero(event());
    const after = event({
      options: [
        option(),
        option({ id: "option_2", createdByRole: "participant", createdByName: "Jean-Mi" }),
      ],
    });
    const result = diffAperoNotifications(after, before, creator, Date.parse(NOW_ISO), makeId, NOW_ISO);
    expect(result.notifications.map((n) => n.type)).toEqual(["guest-proposed-option"]);
  });

  it("ne s'auto-notifie pas de ses propres actions", () => {
    const before = snapshotApero(event());
    const after = event({
      participants: [participant({ participantName: "Organisateur", votes: { option_1: "yes" } })],
      options: [option(), option({ id: "option_2", createdByName: "Organisateur" })],
    });
    const result = diffAperoNotifications(after, before, creator, Date.parse(NOW_ISO), makeId, NOW_ISO);
    expect(result.notifications).toHaveLength(0);
  });
});

describe("notifications invités", () => {
  it("prévient un invité « oui » d'un nouveau créneau", () => {
    const before = snapshotApero(event());
    const after = event({ options: [option(), option({ id: "option_2" })] });
    const result = diffAperoNotifications(after, before, yesGuest, Date.parse(NOW_ISO), makeId, NOW_ISO);
    expect(result.notifications.map((n) => n.type)).toEqual(["new-option"]);
  });

  it("prévient un invité « oui » d'une confirmation finale", () => {
    const before = snapshotApero(event());
    const after = event({ selectedOptionId: "option_1" });
    const result = diffAperoNotifications(after, before, yesGuest, Date.parse(NOW_ISO), makeId, NOW_ISO);
    expect(result.notifications.map((n) => n.type)).toEqual(["final-confirmation"]);
  });

  it("prévient d'un changement important quand le créneau retenu change", () => {
    const start = event({ selectedOptionId: "option_1" });
    const before = snapshotApero(start);
    const after = event({
      options: [option(), option({ id: "option_2" })],
      selectedOptionId: "option_2",
    });
    const result = diffAperoNotifications(after, before, yesGuest, Date.parse(NOW_ISO), makeId, NOW_ISO);
    expect(result.notifications.some((n) => n.type === "important-change")).toBe(true);
  });

  it("n'envoie AUCUNE notification à un invité « non »", () => {
    const before = snapshotApero(event());
    const after = event({
      options: [option(), option({ id: "option_2" })],
      selectedOptionId: "option_1",
    });
    const result = diffAperoNotifications(after, before, noGuest, Date.parse(NOW_ISO), makeId, NOW_ISO);
    expect(result.notifications).toHaveLength(0);
  });

  it("n'envoie pas de notification d'évolution à un « peut-être » (rappels uniquement)", () => {
    const before = snapshotApero(event());
    const after = event({ options: [option(), option({ id: "option_2" })] });
    const result = diffAperoNotifications(after, before, maybeGuest, Date.parse(NOW_ISO), makeId, NOW_ISO);
    expect(result.notifications).toHaveLength(0);
  });
});

describe("rappels peut-être", () => {
  const startMs = new Date("2026-07-10T19:00:00").getTime();
  const target = event({
    options: [option({ date: "2026-07-10", time: "19:00" })],
  });

  it("ne concerne que les « peut-être »", () => {
    const nowMs = startMs - 3 * 60 * 60 * 1000; // 3h avant
    expect(computeReminders(target, yesGuest, snapshotApero(target), nowMs).drafts).toHaveLength(0);
    expect(computeReminders(target, noGuest, snapshotApero(target), nowMs).drafts).toHaveLength(0);
  });

  it("déclenche le rappel 24h", () => {
    const nowMs = startMs - 23 * 60 * 60 * 1000; // entre 24h et 2h
    const snap = snapshotApero(target);
    const result = computeReminders(target, maybeGuest, snap, nowMs);
    expect(result.drafts).toHaveLength(1);
    expect(result.drafts[0].type).toBe("reminder-24h");
    expect(result.firedReminders).toEqual(expect.arrayContaining(["48h", "24h"]));
  });

  it("ne rejoue pas un rappel déjà déclenché", () => {
    const nowMs = startMs - 23 * 60 * 60 * 1000;
    const snap = { ...snapshotApero(target), firedReminders: ["48h", "24h"] };
    expect(computeReminders(target, maybeGuest, snap, nowMs).drafts).toHaveLength(0);
  });

  it("n'émet que le palier le plus urgent si plusieurs sont franchis d'un coup", () => {
    const nowMs = startMs - 1 * 60 * 60 * 1000; // 1h avant : 48h, 24h et 2h franchis
    const snap = snapshotApero(target);
    const result = computeReminders(target, maybeGuest, snap, nowMs);
    expect(result.drafts).toHaveLength(1);
    expect(result.drafts[0].type).toBe("reminder-2h");
    expect(result.firedReminders).toEqual(expect.arrayContaining(["48h", "24h", "2h"]));
  });
});

describe("resolveAperoStartMs", () => {
  it("privilégie le créneau confirmé", () => {
    const evt = event({
      options: [
        option({ id: "option_1", date: "2026-07-20", time: "20:00" }),
        option({ id: "option_2", date: "2026-07-10", time: "19:00" }),
      ],
      selectedOptionId: "option_1",
    });
    expect(resolveAperoStartMs(evt, Date.parse(NOW_ISO))).toBe(Date.parse("2026-07-20T20:00:00"));
  });

  it("sinon prend le prochain créneau à venir", () => {
    const evt = event({
      options: [
        option({ id: "option_1", date: "2020-01-01", time: "19:00" }),
        option({ id: "option_2", date: "2026-07-10", time: "19:00" }),
      ],
    });
    expect(resolveAperoStartMs(evt, Date.parse(NOW_ISO))).toBe(Date.parse("2026-07-10T19:00:00"));
  });
});
