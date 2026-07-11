import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LoadingScreen } from "../components/LoadingScreen";
import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";
import { useComptoirName } from "../hooks/useComptoirName";
import { AperoApiError } from "../services/aperoApiClient";
import { createTablee, getMyTablees, type MyTableeItem } from "../services/tableeRepository";
import { buildTableePath } from "../utils/tableeLink";

// Les Tablées : la liste des bandes de cet appareil, et la fondation d'une
// nouvelle. Une tablée peut naître de rien, ou d'un apéro dont on veut garder
// la troupe (state seedFromApero passé par la page d'invitation).

export type SeedFromApero = {
  aperoId: string;
  encryptionKey: string;
  writeKey?: string;
  ceremonialName: string;
  memberNames: string[];
};

// « La Tablée de Le Concile » écorche l'oreille : on contracte l'article du
// nom cérémoniel (du / de la / des / de l'), comme au comptoir.
function suggestTableeName(ceremonialName: string): string {
  const name = ceremonialName.trim();
  const contracted = /^le\s+/i.test(name)
    ? `du ${name.replace(/^le\s+/i, "")}`
    : /^la\s+/i.test(name)
      ? `de la ${name.replace(/^la\s+/i, "")}`
      : /^les\s+/i.test(name)
        ? `des ${name.replace(/^les\s+/i, "")}`
        : /^l[’']\s*/i.test(name)
          ? `de l’${name.replace(/^l[’']\s*/i, "")}`
          : `de ${name}`;

  // Le nom d'une tablée est plafonné à 80 caractères (sanitizeTablee).
  return `La Tablée ${contracted}`.slice(0, 80);
}

export function TableesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { comptoirName } = useComptoirName();

  const seed = (location.state as { seedFromApero?: SeedFromApero } | null)?.seedFromApero;

  const [items, setItems] = useState<MyTableeItem[] | null>(null);
  const [name, setName] = useState(seed ? suggestTableeName(seed.ceremonialName) : "");
  const [motto, setMotto] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showForm, setShowForm] = useState(Boolean(seed));

  useEffect(() => {
    let isMounted = true;

    getMyTablees()
      .then((loaded) => {
        if (isMounted) {
          setItems(loaded);
        }
      })
      .catch(() => {
        if (isMounted) {
          setItems([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleCreate(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setFeedback("");

    const trimmedName = name.trim();
    const founderName = comptoirName.trim();

    if (!trimmedName) {
      setFeedback("Une tablée sans nom, c’est juste des gens debout. Trouve-lui un blaze.");
      return;
    }
    if (trimmedName.length > 80) {
      setFeedback("Ce nom déborde de la table (80 caractères maximum). Fais plus court, ça claque mieux.");
      return;
    }
    if (!founderName) {
      setFeedback("Choisis d’abord ton blaze (menu de la Confrérie) : une tablée a besoin d’un fondateur.");
      return;
    }

    try {
      setIsCreating(true);
      const created = await createTablee({
        name: trimmedName,
        motto: motto.trim() || undefined,
        founderName,
        memberNames: seed?.memberNames,
        seedAperoRef: seed
          ? {
              aperoId: seed.aperoId,
              encryptionKey: seed.encryptionKey,
              writeKey: seed.writeKey,
              ceremonialName: seed.ceremonialName,
              addedBy: founderName,
            }
          : undefined,
      });

      navigate(
        buildTableePath(created.tableeId, {
          encryptionKey: created.encryptionKey,
          writeKey: created.writeKey,
        }),
        { replace: true },
      );
    } catch (createError) {
      setFeedback(
        createError instanceof AperoApiError && createError.code === "NETWORK_ERROR"
          ? "Impossible de joindre le comptoir numérique. Vérifie la connexion et réessaie."
          : "La fondation a capoté, on ne sait pas trop pourquoi. Réessaie dans un instant.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  if (items === null) {
    return (
      <MobilePage className="agenda-mobile" overlay="deep">
        <MobileHeader eyebrow="Les Tablées" />
        <LoadingScreen title="On pousse les tables" subtitle="La Confrérie recense tes tablées…" />
      </MobilePage>
    );
  }

  const knownTablees = items.filter((item) => item.tablee);

  return (
    <MobilePage className="agenda-mobile" overlay="deep">
      <MobileHeader eyebrow="Les Tablées" />

      <section className="sheet">
        <h1 className="h1 h1--sm">Tes tablées</h1>
        <p className="lede">
          Un apéro est un événement ; une tablée est la bande qui recommence. Membres,
          apéros passés et à venir, palmarès maison : tout au même endroit, chiffré comme
          le reste.
        </p>
      </section>

      {knownTablees.length === 0 ? (
        <section className="sheet">
          <p className="lede">
            Aucune tablée sur cet appareil pour l’instant. Fonde la première : il suffit
            d’un nom, le reste suivra à la prochaine tournée.
          </p>
        </section>
      ) : (
        <div className="event-stack">
          {knownTablees.map(({ entry, tablee }) => (
            <section className="sheet" key={entry.tableeId}>
              <p className="eyebrow">
                {tablee!.members.length} attablé{tablee!.members.length > 1 ? "s" : ""} ·{" "}
                {tablee!.aperoRefs.length} apéro{tablee!.aperoRefs.length > 1 ? "s" : ""}
              </p>
              <h2 className="h2">{tablee!.name}</h2>
              {tablee!.motto && <p className="lede">{"« "}{tablee!.motto}{" »"}</p>}
              <p className="meta">fondée par {tablee!.founderName}</p>
              <Link
                className="button button--ghost button--block"
                to={buildTableePath(entry.tableeId, {
                  encryptionKey: entry.encryptionKey,
                  writeKey: entry.writeKey,
                })}
              >
                Voir la tablée
              </Link>
            </section>
          ))}
        </div>
      )}

      {!showForm ? (
        <section className="sheet">
          <button
            type="button"
            className="button button--primary button--block"
            onClick={() => setShowForm(true)}
          >
            Fonder une tablée
          </button>
        </section>
      ) : (
        <form className="sheet" onSubmit={handleCreate}>
          <p className="eyebrow">Acte de fondation</p>
          {seed && (
            <p className="hint">
              La troupe de « {seed.ceremonialName} » ({seed.memberNames.length} blaze
              {seed.memberNames.length > 1 ? "s" : ""}) sera attablée d’office, et l’apéro
              rejoindra les annales de la tablée.
            </p>
          )}
          <label className="field">
            <span>Nom de la tablée</span>
            <input
              value={name}
              onChange={(eventChange) => setName(eventChange.target.value)}
              placeholder="Les Piliers du Jeudi"
            />
          </label>
          <label className="field">
            <span>Devise (optionnelle)</span>
            <input
              value={motto}
              onChange={(eventChange) => setMotto(eventChange.target.value)}
              placeholder="On ne présume rien, on trinque."
            />
          </label>
          <button className="button button--primary button--block" disabled={isCreating}>
            {isCreating ? "Fondation en cours…" : "Fonder la tablée"}
          </button>
          {feedback && (
            <p className="feedback" role="alert">
              {feedback}
            </p>
          )}
        </form>
      )}
    </MobilePage>
  );
}
