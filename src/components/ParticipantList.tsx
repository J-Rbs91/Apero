import { useState } from "react";
import type { ParticipantResponse } from "../types/apero";

type PresenceGroup = "coming" | "wavering" | "declined";

function getPresenceGroup(participant: ParticipantResponse): PresenceGroup {
  const votes = Object.values(participant.votes);

  if (votes.some((vote) => vote === "yes")) {
    return "coming";
  }

  if (votes.some((vote) => vote === "maybe")) {
    return "wavering";
  }

  return "declined";
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function describeCompanions(count: number): string {
  return count > 1 ? `+${count} pièces rapportées` : "+1 pièce rapportée";
}

function ParticipantRow({ participant }: { participant: ParticipantResponse }) {
  return (
    <div className="person">
      <i>{getInitials(participant.participantName)}</i>
      <div className="person__body">
        <div className="person__name">
          {participant.participantName}
          {participant.companions != null && participant.companions > 0 && (
            <span className="person__tag">{describeCompanions(participant.companions)}</span>
          )}
        </div>
        {participant.brings && <div className="person__sub">{participant.brings}</div>}
        {participant.comment && (
          <div className="person__sub person__sub--quote">{"« "}{participant.comment}{" »"}</div>
        )}
      </div>
    </div>
  );
}

type ParticipantListProps = {
  participants: ParticipantResponse[];
};

export function ParticipantList({ participants }: ParticipantListProps) {
  const [showOthers, setShowOthers] = useState(false);
  const comingParticipants = participants.filter(
    (participant) => getPresenceGroup(participant) === "coming",
  );
  const waveringParticipants = participants.filter(
    (participant) => getPresenceGroup(participant) === "wavering",
  );
  const decliningParticipants = participants.filter(
    (participant) => getPresenceGroup(participant) === "declined",
  );
  const othersCount = waveringParticipants.length + decliningParticipants.length;

  return (
    <section className="sheet" id="reponses">
      <p className="eyebrow">Qui vient ?</p>
      {participants.length === 0 ? (
        <p className="lede">Personne n’a encore répondu. Sois le premier, ou la première !</p>
      ) : (
        <>
          {comingParticipants.length === 0 ? (
            <p className="lede">Personne n’a encore confirmé sa venue pour l’instant.</p>
          ) : (
            <div className="people">
              {comingParticipants.map((participant) => (
                <ParticipantRow key={participant.id} participant={participant} />
              ))}
            </div>
          )}

          {othersCount > 0 && (
            <>
              <button
                type="button"
                className="ghost-link"
                aria-expanded={showOthers}
                aria-controls="reponses-autres"
                onClick={() => setShowOthers((isShown) => !isShown)}
              >
                {showOthers
                  ? "Masquer les autres réponses"
                  : `Voir qui hésite ou décline (${othersCount})`}
              </button>

              {showOthers && (
                <div id="reponses-autres" className="event-stack">
                  {waveringParticipants.length > 0 && (
                    <>
                      <p className="lbl">Le cul entre deux chaises</p>
                      <div className="people">
                        {waveringParticipants.map((participant) => (
                          <ParticipantRow key={participant.id} participant={participant} />
                        ))}
                      </div>
                    </>
                  )}
                  {decliningParticipants.length > 0 && (
                    <>
                      <p className="lbl">Les déserteurs</p>
                      <div className="people">
                        {decliningParticipants.map((participant) => (
                          <ParticipantRow key={participant.id} participant={participant} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
