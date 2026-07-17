import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLocalTablees } from "../services/localTableeRegistry";
import { addAperoToTablee } from "../services/tableeRepository";
import type { AperitifEvent } from "../types/apero";
import { hapticError, hapticSuccess } from "../utils/haptics";
import type { InviteKeys } from "../hooks/useAperoInvite";

// Rattacher l'apéro aux annales d'une tablée de l'appareil — ou fonder la
// première avec la troupe du registre. Section autonome : son état (choix,
// envoi, feedback) ne regarde pas le reste de la page d'invitation.

type TableeAttachSectionProps = {
  aperoId: string;
  keys: InviteKeys;
  event: AperitifEvent;
  comptoirName: string;
};

export function TableeAttachSection({ aperoId, keys, event, comptoirName }: TableeAttachSectionProps) {
  const navigate = useNavigate();
  // Tablées connues de cet appareil, pour rattacher l'apéro à une bande.
  const [localTablees] = useState(() => getLocalTablees());
  const [selectedTableeId, setSelectedTableeId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isAttaching, setIsAttaching] = useState(false);

  if (!keys.encryptionKey) {
    return null;
  }

  async function handleAttach() {
    if (!keys.encryptionKey || !selectedTableeId) {
      return;
    }
    const tableeEntry = localTablees.find((entry) => entry.tableeId === selectedTableeId);
    if (!tableeEntry) {
      return;
    }

    try {
      setIsAttaching(true);
      setFeedback("");
      await addAperoToTablee(tableeEntry.tableeId, tableeEntry.writeKey, tableeEntry.encryptionKey, {
        aperoId,
        encryptionKey: keys.encryptionKey,
        writeKey: keys.writeKey,
        ceremonialName: event.ceremonialName,
        addedBy: comptoirName.trim() || undefined,
      });
      hapticSuccess();
      setFeedback(
        `C’est gravé : cet apéro rejoint les annales de « ${tableeEntry.name ?? "la tablée"} ».`,
      );
    } catch {
      hapticError();
      setFeedback("Le rattachement a capoté. Réessaie dans un instant.");
    } finally {
      setIsAttaching(false);
    }
  }

  return (
    <section className="sheet">
      <p className="eyebrow">La Tablée</p>
      {localTablees.length > 0 ? (
        <>
          <p className="lede">
            Rattache cet apéro aux annales d’une de tes tablées : la bande le
            retrouvera avec le reste de son histoire.
          </p>
          <label className="field">
            <span>Choisir la tablée</span>
            <select
              value={selectedTableeId}
              onChange={(eventChange) => setSelectedTableeId(eventChange.target.value)}
            >
              <option value="">— Choisir —</option>
              {localTablees.map((entry) => (
                <option value={entry.tableeId} key={entry.tableeId}>
                  {entry.name ?? entry.tableeId}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="button button--ghost button--block"
            onClick={handleAttach}
            disabled={!selectedTableeId || isAttaching}
          >
            {isAttaching ? "On grave aux annales…" : "Rattacher à cette tablée"}
          </button>
        </>
      ) : (
        <>
          <p className="lede">
            Cette bande mérite mieux qu’un apéro sans lendemain : fonde une tablée,
            la troupe du registre sera attablée d’office.
          </p>
          <button
            type="button"
            className="button button--ghost button--block"
            onClick={() =>
              navigate("/tablees", {
                state: {
                  seedFromApero: {
                    aperoId,
                    encryptionKey: keys.encryptionKey,
                    writeKey: keys.writeKey,
                    ceremonialName: event.ceremonialName,
                    memberNames: event.participants.map(
                      (participant) => participant.participantName,
                    ),
                  },
                },
              })
            }
          >
            Fonder une tablée avec cette bande
          </button>
        </>
      )}
      {feedback && (
        <p className="meta" role="status">
          {feedback}
        </p>
      )}
    </section>
  );
}
