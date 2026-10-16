import { useState } from "react";
import type { AperitifEvent, AperitifOption, ResultState } from "../types/apero";
import { calculateAverageTraquenardLevel } from "../utils/calculateResults";
import { downloadAperoIcs } from "../utils/calendarExport";
import { shareOrDownloadVerdictImage } from "../utils/verdictImage";

// « Exporter » : export calendrier (.ics) et partage de l'image du résultat
// une fois le créneau retenu. Section autonome extraite d'InvitePage.

type VerdictExportSectionProps = {
  event: AperitifEvent;
  winnerOption: AperitifOption;
  result: ResultState;
  /** Lien d'invitation complet, glissé dans l'événement calendrier. */
  inviteUrl?: string;
};

export function VerdictExportSection({
  event,
  winnerOption,
  result,
  inviteUrl,
}: VerdictExportSectionProps) {
  const [shareFeedback, setShareFeedback] = useState("");

  return (
    <section className="sheet">
      <p className="eyebrow">Exporter</p>
      <button
        type="button"
        className="button button--ghost button--block"
        onClick={() =>
          downloadAperoIcs({
            event,
            option: winnerOption,
            inviteUrl,
          })
        }
      >
        Calendrier
      </button>
      <button
        type="button"
        className="button button--ghost button--block"
        onClick={async () => {
          setShareFeedback("");
          const winnerCounts = result.results.find(
            (item) => item.optionId === winnerOption.id,
          );
          const outcome = await shareOrDownloadVerdictImage(
            {
              event,
              option: winnerOption,
              counts: {
                yes: winnerCounts?.yesCount ?? 0,
                maybe: winnerCounts?.maybeCount ?? 0,
                no: winnerCounts?.noCount ?? 0,
              },
              traquenardAverage: calculateAverageTraquenardLevel(event),
            },
            "apero.png",
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
        Image
      </button>
      {shareFeedback && (
        <p className="meta" role="status">
          {shareFeedback}
        </p>
      )}
    </section>
  );
}
