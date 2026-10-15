import { useState } from "react";
import type { AperitifEvent, AperitifOption, ResultState } from "../types/apero";
import { calculateAverageTraquenardLevel } from "../utils/calculateResults";
import { downloadAperoIcs } from "../utils/calendarExport";
import { shareOrDownloadVerdictImage } from "../utils/verdictImage";

// « Graver au registre » : export calendrier (.ics) et partage du tableau de
// chasse une fois le verdict tombé. Section autonome extraite d'InvitePage.

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
      <p className="eyebrow">Graver au registre</p>
      <p className="lede">
        Le verdict est tombé : grave-le avant qu’il ne s’évapore entre deux tournées.
      </p>
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
        Graver dans mon calendrier
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
            "tableau-de-chasse.png",
          );
          setShareFeedback(
            outcome === "failed"
              ? "L’image n’a pas voulu sortir du cadre. Réessaie dans un instant."
              : outcome === "downloaded"
                ? "Tableau de chasse téléchargé : il n’attend plus que la conversation."
                : "",
          );
        }}
      >
        Partager le tableau de chasse
      </button>
      {shareFeedback && (
        <p className="meta" role="status">
          {shareFeedback}
        </p>
      )}
    </section>
  );
}
