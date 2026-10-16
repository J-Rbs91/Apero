import { useState } from "react";
import { useAppNavigation } from "../routes/useAppNavigation";
import { getLocalTablees } from "../services/localTableeRegistry";
import { addAperoToTablee } from "../services/tableeRepository";
import type { AperitifEvent } from "../types/apero";
import { hapticError, hapticSuccess } from "../utils/haptics";
import type { InviteKeys } from "../hooks/useAperoInvite";
import { ChoiceGroup, Disclosure } from "./ui";

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
  const { aller } = useAppNavigation();
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
      setFeedback("Apéro ajouté.");
    } catch {
      hapticError();
      setFeedback("Ajout échoué. Réessayer.");
    } finally {
      setIsAttaching(false);
    }
  }

  return (
    <Disclosure
      title="Groupes"
      summary={
        localTablees.length > 0
          ? `${localTablees.length} groupe${localTablees.length > 1 ? "s" : ""}`
          : "Aucun groupe."
      }
    >
      {localTablees.length > 0 ? (
        <>
          <ChoiceGroup
            name="tablee-attach"
            legend="Groupe"
            requirement="required"
            options={localTablees.map((entry) => ({
              value: entry.tableeId,
              label: entry.name ?? entry.tableeId,
            }))}
            value={selectedTableeId}
            onChange={setSelectedTableeId}
          />
          <button
            type="button"
            className="button button--ghost button--block"
            onClick={handleAttach}
            disabled={!selectedTableeId || isAttaching}
          >
            {isAttaching ? "Ajout…" : "Ajouter"}
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            className="button button--ghost button--block"
            onClick={() =>
              aller("/tablees", {
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
            Créer un groupe
          </button>
        </>
      )}
      {feedback && (
        <p className="meta" role="status">
          {feedback}
        </p>
      )}
    </Disclosure>
  );
}
