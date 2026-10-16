import { useEffect, useMemo, useState } from "react";
import { BadgeMedal } from "../components/BadgeMedal";
import { LoadingScreen } from "../components/LoadingScreen";
import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";
import { useComptoirName } from "../hooks/useComptoirName";
import { getAperoStorageMode } from "../config/aperoApiConfig";
import { eventStorage } from "../services";
import { getMyAperos } from "../services/encryptedAperoRepository";
import type { AperitifEvent } from "../types/apero";
import type { BadgeDefinition } from "../types/badges";
import { BADGE_DEFINITIONS } from "../types/badges";
import type { RewardsLedger } from "../types/rewards";
import { getMemberBadgeIds } from "../utils/badgeRules";
import { normalizeDisplayName, normalizeMemberName } from "../utils/memberName";

const BADGE_BY_ID = new Map<string, BadgeDefinition>(
  BADGE_DEFINITIONS.map((badge) => [badge.id, badge]),
);

type MemberPalmares = {
  key: string;
  displayName: string;
  badges: BadgeDefinition[];
};

function collectMemberNames(
  ledger: RewardsLedger,
  activeEvents: AperitifEvent[],
): Map<string, string> {
  const names = new Map<string, string>();

  function register(raw?: string) {
    if (!raw) {
      return;
    }
    const key = normalizeMemberName(raw);
    if (!key || names.has(key)) {
      return;
    }
    names.set(key, normalizeDisplayName(raw));
  }

  Object.values(ledger.members).forEach((stats) => register(stats.displayName));
  activeEvents.forEach((event) => {
    register(event.organizerName);
    event.participants.forEach((participant) => register(participant.participantName));
    event.options.forEach((option) => register(option.createdByName));
  });

  return names;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function PalmaresPage() {
  const { comptoirName } = useComptoirName();
  const [ledger, setLedger] = useState<RewardsLedger | null>(null);
  const [activeEvents, setActiveEvents] = useState<AperitifEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        setIsLoading(true);
        setError("");
        const loadedLedger = await eventStorage.readRewardsLedger();
        let loadedEvents: AperitifEvent[] = [];
        try {
          if (getAperoStorageMode() === "api-vps") {
            // Flux chiffré : le palmarès se juge sur les apéros connus de cet
            // appareil (créés ou rejoints), passés compris — c'est la seule
            // source de vérité déchiffrable ici.
            const mine = await getMyAperos();
            loadedEvents = mine
              .map((item) => item.event)
              .filter((event): event is AperitifEvent => Boolean(event));
          } else {
            loadedEvents = await eventStorage.listActiveEvents();
          }
        } catch {
          // Les apéros en cours sont un bonus : le palmarès tient déjà
          // debout avec le seul grand livre des récompenses.
        }

        if (isMounted) {
          setLedger(loadedLedger);
          setActiveEvents(loadedEvents);
        }
      } catch {
        if (isMounted) {
          setError("Chargement impossible. Réessayer.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const myKey = normalizeMemberName(comptoirName);

  const members = useMemo<MemberPalmares[]>(() => {
    if (!ledger) {
      return [];
    }

    const names = collectMemberNames(ledger, activeEvents);
    if (myKey && !names.has(myKey)) {
      names.set(myKey, normalizeDisplayName(comptoirName));
    }

    const list: MemberPalmares[] = [];
    names.forEach((displayName, key) => {
      const badgeIds = getMemberBadgeIds({ activeEvents, ledger, memberName: displayName });
      const badges = badgeIds
        .map((id) => BADGE_BY_ID.get(id))
        .filter((badge): badge is BadgeDefinition => Boolean(badge));
      list.push({ key, displayName, badges });
    });

    list.sort((a, b) => {
      if (a.key === myKey) {
        return -1;
      }
      if (b.key === myKey) {
        return 1;
      }
      if (b.badges.length !== a.badges.length) {
        return b.badges.length - a.badges.length;
      }
      return a.displayName.localeCompare(b.displayName, "fr");
    });

    return list;
  }, [ledger, activeEvents, myKey, comptoirName]);

  const shownMembers = members.filter(
    (member) => member.key === myKey || member.badges.length > 0,
  );
  const emptyOthers = members.filter(
    (member) => member.key !== myKey && member.badges.length === 0,
  ).length;

  const hero = (
    <div className="page-hero">
      <h1 className="h1 h1--sm">Palmarès</h1>
    </div>
  );

  if (isLoading) {
    return (
      <MobilePage
        className="palmares-mobile"
        header={<MobileHeader eyebrow="La Confrérie" />}
        hero={hero}
      >
        <LoadingScreen />
      </MobilePage>
    );
  }

  return (
    <MobilePage
      className="palmares-mobile"
      header={<MobileHeader eyebrow="La Confrérie" />}
      hero={hero}
    >
      {error ? (
        <section className="sheet">
          <p className="feedback">{error}</p>
        </section>
      ) : shownMembers.length === 0 ? (
        <section className="sheet">
          <p className="lede">Aucun badge.</p>
        </section>
      ) : (
        <div className="event-stack event-stack--grid">
          {shownMembers.map((member) => (
            <section className="sheet" key={member.key}>
              <div className="palmares-head">
                <i className="palmares-avatar">{getInitials(member.displayName)}</i>
                <div className="palmares-head__body">
                  <div className="person__name">
                    {member.displayName}
                    {member.key === myKey && <span className="palmares-tag">Moi</span>}
                  </div>
                  <div className="person__sub">
                    {member.badges.length === 0
                      ? "Aucun badge"
                      : `${member.badges.length} badge${member.badges.length > 1 ? "s" : ""}`}
                  </div>
                </div>
              </div>

              {member.badges.length > 0 && (
                <div className="badge-list">
                  {member.badges.map((badge) => (
                    <BadgeMedal badge={badge} key={badge.id} />
                  ))}
                </div>
              )}
            </section>
          ))}

          {emptyOthers > 0 && (
            <p className="meta meta--center">
              {emptyOthers} autre{emptyOthers > 1 ? "s" : ""} convive
              {emptyOthers > 1 ? "s" : ""} sans badge.
            </p>
          )}
        </div>
      )}
    </MobilePage>
  );
}
