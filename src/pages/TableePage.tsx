import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { LoadingScreen } from "../components/LoadingScreen";
import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";
import { MobileShareBox } from "../components/MobileShareBox";
import { useComptoirName } from "../hooks/useComptoirName";
import { isValidAperoId } from "../services/aperoCryptoKeys";
import { AperoCryptoError } from "../services/aperoEncryption";
import { isEventExpired } from "../services/eventPurge";
import { findLocalTablee } from "../services/localTableeRegistry";
import {
  getTableeById,
  joinTablee,
  loadTableeAperos,
  type TableeAperoItem,
} from "../services/tableeRepository";
import type { Tablee } from "../types/tablee";
import { TableeValidationError } from "../utils/tableeValidation";
import { buildInvitePath, maskInviteUrl, parseInviteKeysFromSearch } from "../utils/inviteLink";
import { normalizeMemberName } from "../utils/memberName";
import { buildTableeShareText, buildTableeUrl } from "../utils/tableeLink";
import { buildTableeMemberStats, buildTableeTitles } from "../utils/tableePalmares";

// Page d'une tablée : la bande, ses apéros, son palmarès maison.
// Route : #/tablee/:tableeId?k=…&w=… — clés dans le fragment, jamais serveur.

type LoadState =
  | { status: "loading" }
  | { status: "invalid-id" }
  | { status: "missing-key" }
  | { status: "not-found" }
  | { status: "bad-key" }
  | { status: "not-a-tablee" }
  | { status: "error" }
  | { status: "ready"; tablee: Tablee };

function formatAperoDate(item: TableeAperoItem): string {
  const event = item.event;
  if (!event) {
    return "";
  }
  const dated = event.options
    .map((option) => (option.date ? `${option.date}T${option.time || "00:00"}:00` : ""))
    .filter(Boolean)
    .sort();
  if (dated.length === 0) {
    return "";
  }
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(dated[dated.length - 1]),
  );
}

export function TableePage() {
  const { tableeId } = useParams<{ tableeId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { comptoirName } = useComptoirName();

  const keys = useMemo(() => {
    const fromLink = parseInviteKeysFromSearch(location.search);
    const localEntry = tableeId ? findLocalTablee(tableeId) : null;

    return {
      encryptionKey: fromLink.encryptionKey ?? localEntry?.encryptionKey,
      writeKey: fromLink.writeKey ?? localEntry?.writeKey,
    };
  }, [tableeId, location.search]);

  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [aperoItems, setAperoItems] = useState<TableeAperoItem[] | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      if (!tableeId || !isValidAperoId(tableeId)) {
        setState({ status: "invalid-id" });
        return;
      }
      if (!keys.encryptionKey) {
        setState({ status: "missing-key" });
        return;
      }

      try {
        setState({ status: "loading" });
        const loaded = await getTableeById(tableeId, keys.encryptionKey);

        if (!isMounted) {
          return;
        }
        if (!loaded) {
          setState({ status: "not-found" });
          return;
        }

        setState({ status: "ready", tablee: loaded.tablee });

        const items = await loadTableeAperos(loaded.tablee);
        if (isMounted) {
          setAperoItems(items);
        }
      } catch (loadError) {
        if (!isMounted) {
          return;
        }
        if (loadError instanceof AperoCryptoError) {
          setState({ status: "bad-key" });
        } else if (loadError instanceof TableeValidationError) {
          setState({ status: "not-a-tablee" });
        } else {
          setState({ status: "error" });
        }
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [tableeId, keys.encryptionKey]);

  async function handleJoin() {
    const memberName = comptoirName.trim();
    if (state.status !== "ready" || !tableeId || !keys.writeKey || !keys.encryptionKey || !memberName) {
      return;
    }

    try {
      setIsJoining(true);
      setError("");
      const updated = await joinTablee(tableeId, keys.writeKey, keys.encryptionKey, memberName);
      setState({ status: "ready", tablee: updated });
    } catch {
      setError("Impossible de t’attabler pour le moment. Réessaie dans un instant.");
    } finally {
      setIsJoining(false);
    }
  }

  if (state.status === "loading") {
    return (
      <MobilePage className="agenda-mobile" overlay="deep">
        <MobileHeader eyebrow="La Tablée" />
        <LoadingScreen title="On pousse les tables" subtitle="On déchiffre le registre de la tablée…" />
      </MobilePage>
    );
  }

  if (state.status !== "ready") {
    const message =
      state.status === "invalid-id"
        ? "Ce lien de tablée est mal formé : on ne reconnaît pas cet identifiant."
        : state.status === "missing-key"
          ? "Ce lien de tablée est incomplet : il lui manque sa clé de lecture. Demande le lien complet à la bande."
          : state.status === "not-found"
            ? "Cette tablée reste introuvable : soit le lien ne mène nulle part, soit la tablée a été dissoute."
            : state.status === "bad-key"
              ? "Cette clé n’ouvre pas cette tablée : lien tronqué ou périmé."
              : state.status === "not-a-tablee"
                ? "Ce lien mène à autre chose qu’une tablée. Vérifie qu’il ne s’agit pas d’un lien d’apéro."
                : "Impossible de récupérer cette tablée pour le moment. Réessaie dans un instant.";

    return (
      <MobilePage className="agenda-mobile" overlay="deep">
        <MobileHeader eyebrow="La Tablée" />
        <section className="sheet">
          <h1 className="h1 h1--sm">Aïe, ce lien coince</h1>
          <p className="lede">{message}</p>
          <Link className="button button--ghost button--block" to="/tablees">
            Voir mes tablées
          </Link>
        </section>
      </MobilePage>
    );
  }

  const { tablee } = state;
  const myKey = normalizeMemberName(comptoirName);
  const isMember = Boolean(
    myKey && tablee.members.some((member) => normalizeMemberName(member.name) === myKey),
  );

  const readableEvents = (aperoItems ?? [])
    .map((item) => item.event)
    .filter((event): event is NonNullable<typeof event> => Boolean(event));
  const now = new Date();
  const upcoming = (aperoItems ?? []).filter((item) => item.event && !isEventExpired(item.event, now));
  const past = (aperoItems ?? []).filter((item) => !item.event || isEventExpired(item.event, now));

  const memberStats = buildTableeMemberStats(readableEvents);
  const titles = buildTableeTitles(memberStats);

  const shareUrl = keys.encryptionKey
    ? buildTableeUrl({
        tableeId: tablee.id,
        encryptionKey: keys.encryptionKey,
        writeKey: keys.writeKey,
      })
    : "";

  return (
    <MobilePage className="agenda-mobile" overlay="deep">
      <MobileHeader eyebrow="La Tablée" />

      <section className="sheet">
        <p className="eyebrow">
          {tablee.members.length} attablé{tablee.members.length > 1 ? "s" : ""} — fondée par{" "}
          {tablee.founderName}
        </p>
        <h1 className="h1 h1--sm">{tablee.name}</h1>
        {tablee.motto && <p className="lede">{"« "}{tablee.motto}{" »"}</p>}
        <p className="meta">
          Attablés : {tablee.members.map((member) => member.name).join(", ")}
        </p>
        {!isMember && keys.writeKey && (
          <button
            type="button"
            className="button button--primary button--block"
            onClick={handleJoin}
            disabled={isJoining || !comptoirName.trim()}
          >
            {isJoining ? "On te fait une place…" : "M’attabler"}
          </button>
        )}
        {!isMember && keys.writeKey && !comptoirName.trim() && (
          <p className="hint">Choisis d’abord ton blaze (menu de la Confrérie) pour t’attabler.</p>
        )}
      </section>

      {error && (
        <p className="page-message page-message--error" role="alert">
          {error}
        </p>
      )}

      <section className="sheet">
        <p className="eyebrow">La prochaine tournée</p>
        <p className="lede">
          {upcoming.length > 0
            ? "Une assemblée est déjà en route — mais rien n’interdit d’en convoquer une autre."
            : "Rien d’attablé à l’horizon. La tablée n’attend qu’une convocation."}
        </p>
        <button
          type="button"
          className="button button--primary button--block"
          onClick={() =>
            navigate("/create", {
              state: {
                linkToTablee: keys.writeKey
                  ? {
                      tableeId: tablee.id,
                      encryptionKey: keys.encryptionKey,
                      writeKey: keys.writeKey,
                    }
                  : undefined,
              },
            })
          }
        >
          Convoquer la tablée
        </button>
      </section>

      {(upcoming.length > 0 || past.length > 0) && (
        <section className="sheet">
          <p className="eyebrow">Les annales de la tablée</p>
          <div className="slot-stack">
            {[...upcoming, ...past].map((item) => (
              <div className="slot" key={item.ref.aperoId}>
                <div className="slot__top">
                  <div>
                    <div className="slot__d">{item.event?.ceremonialName ?? item.ref.ceremonialName}</div>
                    <div className="slot__p">
                      {item.event
                        ? `${formatAperoDate(item)} · ${item.event.participants.length} réponses`
                        : "Disparu du registre (annulé ou purgé)"}
                    </div>
                  </div>
                  {item.event && !isEventExpired(item.event, now) && (
                    <span className="agenda-lead">À venir</span>
                  )}
                </div>
                {item.event && (
                  <Link
                    className="ghost-link"
                    to={buildInvitePath(item.ref.aperoId, {
                      encryptionKey: item.ref.encryptionKey,
                      writeKey: item.ref.writeKey,
                    })}
                  >
                    Ouvrir l’apéro
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {titles.length > 0 && (
        <section className="sheet">
          <p className="eyebrow">Le palmarès de la tablée</p>
          <div className="wall-list">
            {titles.map((title) => (
              <div className="wall-item" key={title.id}>
                <div className="wall-item__head">
                  <span className="wall-item__author">{title.title}</span>
                  <span className="wall-item__when">{title.memberName}</span>
                </div>
                <p className="wall-item__body">{title.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {shareUrl && (
        <MobileShareBox
          url={shareUrl}
          displayUrl={maskInviteUrl(shareUrl)}
          title={`La Confrérie du Petit Jaune — ${tablee.name}`}
          text={buildTableeShareText(tablee.name, tablee.founderName)}
        />
      )}
    </MobilePage>
  );
}
