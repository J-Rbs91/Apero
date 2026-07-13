import { describe, expect, it } from "vitest";
import type { AperitifEvent, AperitifOption, ParticipantResponse } from "../types/apero";
import type { NotificationViewer } from "../types/notifications";
import {
  computeNextRoundNudge,
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

  it("re-prévient lors d'un retour au créneau confirmé précédent (A → B → A)", () => {
    const twoOptions = [option(), option({ id: "option_2" })];
    // Confirmation initiale sur A…
    const confirmedA = snapshotApero(event({ options: twoOptions, selectedOptionId: "option_1" }));
    // …changement vers B…
    const towardsB = event({ options: twoOptions, selectedOptionId: "option_2" });
    const resultB = diffAperoNotifications(towardsB, confirmedA, yesGuest, Date.parse(NOW_ISO), makeId, NOW_ISO);
    expect(resultB.notifications.map((n) => n.type)).toEqual(["important-change"]);
    // …puis retour à A : c'est un changement important à part entière, sa
    // dedupeKey ne doit pas rejouer celle de la confirmation initiale de A.
    const backToA = event({ options: twoOptions, selectedOptionId: "option_1" });
    const resultA = diffAperoNotifications(backToA, resultB.snapshot, yesGuest, Date.parse(NOW_ISO), makeId, NOW_ISO);
    expect(resultA.notifications.map((n) => n.type)).toEqual(["important-change"]);
    expect(resultA.notifications[0].dedupeKey).not.toBe(resultB.notifications[0].dedupeKey);
  });

  it("ne coupe jamais un extrait de mot au milieu d'un emoji (surrogate pair)", () => {
    const body = `${"x".repeat(88)}🍺${"y".repeat(20)}`;
    const before = snapshotApero(event());
    const after = event({
      messages: [{ id: "message_1", authorName: "Jean-Mi", body, createdAt: NOW_ISO }],
    });
    const result = diffAperoNotifications(after, before, yesGuest, Date.parse(NOW_ISO), makeId, NOW_ISO);
    expect(result.notifications.map((n) => n.type)).toEqual(["new-message"]);
    // Aucun demi-surrogate isolé (il s'afficherait « � ») dans le corps.
    expect(result.notifications[0].body).not.toMatch(
      /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/,
    );
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

describe("coup de coude post-apéro", () => {
  const pastOptionStart = "2026-07-10T19:00:00";

  function pastEvent(overrides: Partial<AperitifEvent> = {}) {
    return event({
      options: [option({ date: "2026-07-10", time: "19:00" })],
      ...overrides,
    });
  }

  function msAfterStart(hours: number): number {
    return Date.parse(pastOptionStart) + hours * 60 * 60 * 1000;
  }

  it("souffle « à qui le tour » aux présents une fois l'apéro digéré", () => {
    const target = pastEvent();
    const snap = snapshotApero(target);
    const result = computeNextRoundNudge(target, yesGuest, snap, msAfterStart(13));
    expect(result.drafts).toHaveLength(1);
    expect(result.drafts[0].type).toBe("next-round-nudge");
    expect(result.drafts[0].body).toContain("À qui le tour");
    expect(result.firedNextRoundNudge).toBe(true);
  });

  it("parle de tournée récurrente au créateur quand la cadence est gravée", () => {
    const target = pastEvent({ recurrence: "weekly" });
    const snap = snapshotApero(target);
    const result = computeNextRoundNudge(target, creator, snap, msAfterStart(13));
    expect(result.drafts).toHaveLength(1);
    expect(result.drafts[0].body).toContain("se répète");
  });

  it("attend la fin de l'apéro avant de souffler quoi que ce soit", () => {
    const target = pastEvent();
    const snap = snapshotApero(target);
    const result = computeNextRoundNudge(target, yesGuest, snap, msAfterStart(2));
    expect(result.drafts).toHaveLength(0);
    expect(result.firedNextRoundNudge).toBe(false);
  });

  it("ne déterre pas un apéro vieux de plus de sept jours", () => {
    const target = pastEvent();
    const snap = snapshotApero(target);
    const result = computeNextRoundNudge(target, yesGuest, snap, msAfterStart(8 * 24));
    expect(result.drafts).toHaveLength(0);
    // Fenêtre expirée : gravée dans l'instantané pour ne plus jamais y revenir.
    expect(result.firedNextRoundNudge).toBe(true);
  });

  it("laisse en paix les hésitants et les déserteurs", () => {
    const target = pastEvent();
    const snap = snapshotApero(target);
    expect(computeNextRoundNudge(target, maybeGuest, snap, msAfterStart(13)).drafts).toHaveLength(0);
    expect(computeNextRoundNudge(target, noGuest, snap, msAfterStart(13)).drafts).toHaveLength(0);
  });

  it("ne souffle jamais deux fois", () => {
    const target = pastEvent();
    const snap = { ...snapshotApero(target), firedNextRoundNudge: true };
    const result = computeNextRoundNudge(target, yesGuest, snap, msAfterStart(13));
    expect(result.drafts).toHaveLength(0);
    expect(result.firedNextRoundNudge).toBe(true);
  });

  it("est émis par le moteur complet et persiste le drapeau", () => {
    const target = pastEvent();
    const snap = snapshotApero(target);
    const result = diffAperoNotifications(target, snap, yesGuest, msAfterStart(13), makeId, NOW_ISO);
    expect(result.notifications.map((n) => n.type)).toContain("next-round-nudge");
    expect(result.snapshot.firedNextRoundNudge).toBe(true);
  });
});

describe("mur du comptoir", () => {
  function withMessage(id: string, authorName: string, body = "Qui gère la glace ?") {
    return event({
      messages: [{ id, authorName, body, createdAt: NOW_ISO }],
    });
  }

  it("notifie le créateur et les invités engagés d'un nouveau mot", () => {
    const before = snapshotApero(event());
    const after = withMessage("message_1", "Jean-Mi");

    const forCreator = diffAperoNotifications(after, before, creator, Date.parse(NOW_ISO), makeId, NOW_ISO);
    expect(forCreator.notifications.map((n) => n.type)).toEqual(["new-message"]);
    expect(forCreator.notifications[0].body).toContain("Jean-Mi");

    const forGuest = diffAperoNotifications(after, before, yesGuest, Date.parse(NOW_ISO), makeId, NOW_ISO);
    expect(forGuest.notifications.map((n) => n.type)).toEqual(["new-message"]);
  });

  it("ne notifie jamais l'auteur du mot ni les déserteurs", () => {
    const before = snapshotApero(event());
    const after = withMessage("message_1", "Organisateur");

    const forAuthor = diffAperoNotifications(after, before, creator, Date.parse(NOW_ISO), makeId, NOW_ISO);
    expect(forAuthor.notifications).toHaveLength(0);

    const afterOther = withMessage("message_2", "Jean-Mi");
    const forNoGuest = diffAperoNotifications(afterOther, before, noGuest, Date.parse(NOW_ISO), makeId, NOW_ISO);
    expect(forNoGuest.notifications).toHaveLength(0);
  });

  it("ne renotifie pas un mot déjà vu et tronque les pavés", () => {
    const seen = withMessage("message_1", "Jean-Mi");
    const before = snapshotApero(seen);
    const again = diffAperoNotifications(seen, before, creator, Date.parse(NOW_ISO), makeId, NOW_ISO);
    expect(again.notifications).toHaveLength(0);

    const longBody = "x".repeat(200);
    const after = withMessage("message_2", "Jean-Mi", longBody);
    const result = diffAperoNotifications(after, before, creator, Date.parse(NOW_ISO), makeId, NOW_ISO);
    expect(result.notifications[0].body.length).toBeLessThan(160);
    expect(result.notifications[0].body).toContain("…");
    expect(result.snapshot.messageIds).toContain("message_2");
  });
});
