import { useEffect, useMemo, useState } from "react";
import { AppLink } from "../components/AppLink";
import { LoadingScreen } from "../components/LoadingScreen";
import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";
import { useComptoirName } from "../hooks/useComptoirName";
import { eventStorage } from "../services";
import { getMyAperos } from "../services/encryptedAperoRepository";
import type { AperitifEvent } from "../types/apero";
import type { PurgedEventRecord } from "../types/rewards";
import { shareOrDownloadRecapImage } from "../utils/recapImage";
import { buildYearRecap } from "../utils/yearRecap";

// La Rétrospective du Comptoir : le bilan annuel du membre, calculé sur l'appareil
// depuis les apéros connus localement. Rien ne quitte le navigateur, sauf
// l'image que le membre choisit lui-même de partager.

export function ComptesPage() {
  const { comptoirName } = useComptoirName();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [events, setEvents] = useState<AperitifEvent[]>([]);
  const [purgedEvents, setPurgedEvents] = useState<PurgedEventRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [shareFeedback, setShareFeedback] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      // Les apéros connus de cet appareil (créés ou rejoints), passés compris.
      let loadedEvents: AperitifEvent[] = [];
      try {
        const mine = await getMyAperos();
        loadedEvents = mine
          .map((item) => item.event)
          .filter((event): event is AperitifEvent => Boolean(event));
      } catch {
        // Sans lecture publique, le bilan se fera sur ce que l'appareil sait.
      }

      // Le grand livre des purges est un bonus quand il est disponible.
      let loadedPurged: PurgedEventRecord[] = [];
      try {
        const ledger = await eventStorage.readRewardsLedger();
        loadedPurged = ledger.purgedEvents;
      } catch {
        // Tant pis pour les archives, le bilan tient déjà debout.
      }

      if (isMounted) {
        setEvents(loadedEvents);
        setPurgedEvents(loadedPurged);
        setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const recap = useMemo(
    () => buildYearRecap({ events, purgedEvents, memberName: comptoirName, year }),
    [events, purgedEvents, comptoirName, year],
  );

  const hasActivity = recap.organizedCount > 0 || recap.participatedCount > 0;

  if (isLoading) {
    return (
      <MobilePage
        className="agenda-mobile"
        header={<MobileHeader eyebrow="La Confrérie" />}
        hero={<h1 className="h1 h1--sm">Bilan {year}</h1>}
      >
        <LoadingScreen />
      </MobilePage>
    );
  }

  return (
    <MobilePage
      className="agenda-mobile comptes-page"
      header={<MobileHeader eyebrow="La Confrérie" />}
      hero={
        <div className="page-hero">
          <h1 className="h1 h1--sm">Bilan {year}</h1>
          <div className="button-row">
            <button
              type="button"
              className={`button ${year === currentYear - 1 ? "button--primary" : "button--ghost"}`}
              onClick={() => setYear(currentYear - 1)}
            >
              {currentYear - 1}
            </button>
            <button
              type="button"
              className={`button ${year === currentYear ? "button--primary" : "button--ghost"}`}
              onClick={() => setYear(currentYear)}
            >
              {currentYear}
            </button>
          </div>
        </div>
      }
    >
      {!comptoirName.trim() ? (
        <section className="sheet">
          <p className="lede">Nom requis, depuis le menu.</p>
        </section>
      ) : !hasActivity ? (
        <section className="sheet">
          <p className="lede">Aucun apéro en {year}.</p>
          <AppLink className="button button--primary button--block" to="/create">
            Nouvel apéro
          </AppLink>
        </section>
      ) : (
        <>
          <section className="sheet">
            <div className="counts">
              <div className="cnt">
                <b>{recap.organizedCount}</b>
                <span>Créés</span>
              </div>
              <div className="cnt">
                <b>{recap.participatedCount}</b>
                <span>Rejoints</span>
              </div>
              <div className="cnt">
                <b>{recap.fellowCount}</b>
                <span>Convives</span>
              </div>
            </div>
            <div className="counts">
              <div className="cnt">
                <b>{recap.yesCount}</b>
                <span>Oui</span>
              </div>
              <div className="cnt">
                <b>{recap.maybeCount}</b>
                <span>Peut-être</span>
              </div>
              <div className="cnt">
                <b>{recap.noCount}</b>
                <span>Non</span>
              </div>
            </div>
          </section>

          <section className="sheet">
            {recap.favoriteLocation && (
              <>
                <p className="lbl">Lieu</p>
                <p className="lede">{recap.favoriteLocation}</p>
              </>
            )}
            {recap.biggestTableName && (
              <>
                <p className="lbl">Plus grand apéro</p>
                <p className="lede">
                  {recap.biggestTableName}, {recap.biggestTableSize} convive
                  {recap.biggestTableSize > 1 ? "s" : ""}
                </p>
              </>
            )}
            <p className="lbl">Intensité moyenne</p>
            <p className="lede">
              {recap.averageTraquenard != null
                ? `${recap.averageTraquenard.toFixed(1)} / 10`
                : "Aucune"}
            </p>
          </section>

          <section className="sheet">
            <p className="hint">Image : chiffres et nom, sans lien.</p>
            <button
              type="button"
              className="button button--primary button--block"
              onClick={async () => {
                setShareFeedback("");
                const outcome = await shareOrDownloadRecapImage(
                  { recap, memberName: comptoirName },
                  `bilan-${year}.png`,
                );
                setShareFeedback(
                  outcome === "failed"
                    ? "Image indisponible. Réessayer."
                    : outcome === "downloaded"
                      ? "Image téléchargée."
                      : "",
                );
              }}
            >
              Partager
            </button>
            {shareFeedback && (
              <p className="meta" role="status">
                {shareFeedback}
              </p>
            )}
          </section>
        </>
      )}
    </MobilePage>
  );
}
