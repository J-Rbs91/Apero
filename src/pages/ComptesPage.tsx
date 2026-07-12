import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
      <MobilePage className="agenda-mobile" overlay="deep">
        <MobileHeader eyebrow="La Rétrospective du Comptoir" />
        <LoadingScreen title="On épluche les registres" subtitle="La Confrérie compte les tournées de l’année…" />
      </MobilePage>
    );
  }

  return (
    <MobilePage className="agenda-mobile" overlay="deep">
      <MobileHeader eyebrow="La Rétrospective du Comptoir" />

      <section className="sheet">
        <h1 className="h1 h1--sm">Ta rétrospective {year}</h1>
        <p className="lede">
          Le bilan comptable de tes activités de comptoir, dressé sur cet appareil et
          nulle part ailleurs. Le registre fait foi, le reste est légende.
        </p>
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
      </section>

      {!comptoirName.trim() ? (
        <section className="sheet">
          <p className="lede">
            Sans blaze, pas de comptes : choisis d’abord ton nom de comptoir depuis le
            menu de la Confrérie.
          </p>
        </section>
      ) : !hasActivity ? (
        <section className="sheet">
          <p className="lede">
            Aucune trace de toi dans les registres de {year} sur cet appareil. Soit une
            année sobre, soit une année ailleurs — dans les deux cas, ça se rattrape.
          </p>
          <Link className="button button--primary button--block" to="/create">
            Lancer l’année {currentYear}
          </Link>
        </section>
      ) : (
        <>
          <section className="sheet">
            <div className="counts">
              <div className="cnt">
                <b>{recap.organizedCount}</b>
                <span>Convoquées</span>
              </div>
              <div className="cnt">
                <b>{recap.participatedCount}</b>
                <span>Émargées</span>
              </div>
              <div className="cnt">
                <b>{recap.fellowCount}</b>
                <span>Blazes croisés</span>
              </div>
            </div>
            <div className="counts">
              <div className="cnt">
                <b>{recap.yesCount}</b>
                <span>Présences</span>
              </div>
              <div className="cnt">
                <b>{recap.maybeCount}</b>
                <span>Hésitations</span>
              </div>
              <div className="cnt">
                <b>{recap.noCount}</b>
                <span>Désertions</span>
              </div>
            </div>
          </section>

          <section className="sheet">
            {recap.favoriteLocation && (
              <>
                <p className="lbl">Quartier général</p>
                <p className="lede">{recap.favoriteLocation}</p>
              </>
            )}
            {recap.biggestTableName && (
              <>
                <p className="lbl">La plus grande tablée</p>
                <p className="lede">
                  {recap.biggestTableName} — {recap.biggestTableSize} convives au registre.
                </p>
              </>
            )}
            <p className="lbl">Traquenard-O-mètre personnel</p>
            <p className="lede">
              {recap.averageTraquenard != null
                ? `${recap.averageTraquenard.toFixed(1)} / 10 de pronostic moyen. On sait à quoi s’en tenir.`
                : "Aucun pronostic déposé cette année. Prudence de sioux, ou négligence coupable."}
            </p>
          </section>

          <section className="sheet">
            <p className="eyebrow">Faire circuler</p>
            <p className="lede">
              La rétrospective se partage en image — les chiffres, ton blaze, rien d’autre.
              Ni lien, ni clé : ta comptabilité reste la tienne.
            </p>
            <button
              type="button"
              className="button button--primary button--block"
              onClick={async () => {
                setShareFeedback("");
                const outcome = await shareOrDownloadRecapImage(
                  { recap, memberName: comptoirName },
                  `retrospective-du-comptoir-${year}.png`,
                );
                setShareFeedback(
                  outcome === "failed"
                    ? "L’image n’a pas voulu sortir du cadre. Réessaie dans un instant."
                    : outcome === "downloaded"
                      ? "Bilan téléchargé : il n’attend plus que la conversation."
                      : "",
                );
              }}
            >
              Partager mes Comptes {year}
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
