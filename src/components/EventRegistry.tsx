import type { ParticipantResponse } from "../types/apero";

// Registre du comptoir : présences en tête, hésitations et désertions dans un
// dépliant. Partagé par les pages d'apéro pour un rendu cohérent.

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

function ParticipantRow({ participant }: { participant: ParticipantResponse }) {
  return (
    <div className="person">
      <i>{getInitials(participant.participantName)}</i>
      <div className="person__body">
        <div className="person__name">{participant.participantName}</div>
        {participant.brings && <div className="person__sub">{participant.brings}</div>}
        {participant.comment && (
          <div className="person__sub person__sub--quote">{"« "}{participant.comment}{" »"}</div>
        )}
      </div>
    </div>
  );
}

type EventRegistryProps = {
  participants: ParticipantResponse[];
  showAbsentees: boolean;
  onToggleAbsentees: () => void;
};

export function EventRegistry({
  participants,
  showAbsentees,
  onToggleAbsentees,
}: EventRegistryProps) {
  const coming = participants.filter((participant) => getPresenceGroup(participant) === "coming");
  const wavering = participants.filter((participant) => getPresenceGroup(participant) === "wavering");
  const declining = participants.filter((participant) => getPresenceGroup(participant) === "declined");
  const absenteeCount = wavering.length + declining.length;

  return (
    <section className="sheet" id="registre">
      <p className="eyebrow">Le registre du comptoir</p>
      {participants.length === 0 ? (
        <p className="lede">
          Aucun convive n’a encore signé le registre. L’institution retient son souffle, suspendue à
          la première signature comme à un premier amour.
        </p>
      ) : (
        <>
          {coming.length === 0 ? (
            <p className="lede">
              Personne n’a encore juré présence. Le zinc garde les verres au frais, sans illusion
              excessive, mais avec l’espoir tenace qui caractérise les grandes institutions.
            </p>
          ) : (
            <div className="people">
              {coming.map((participant) => (
                <ParticipantRow key={participant.id} participant={participant} />
              ))}
            </div>
          )}

          {absenteeCount > 0 && (
            <>
              <button
                type="button"
                className="ghost-link"
                aria-expanded={showAbsentees}
                aria-controls="registre-absents"
                onClick={onToggleAbsentees}
              >
                {showAbsentees
                  ? "Replier les dossiers sensibles"
                  : `Qui se défile, qui se tâte (${absenteeCount})`}
              </button>

              {showAbsentees && (
                <div id="registre-absents" className="event-stack">
                  {wavering.length > 0 && (
                    <>
                      <p className="lbl">Le cul entre deux chaises</p>
                      <div className="people">
                        {wavering.map((participant) => (
                          <ParticipantRow key={participant.id} participant={participant} />
                        ))}
                      </div>
                    </>
                  )}
                  {declining.length > 0 && (
                    <>
                      <p className="lbl">Désertions assumées</p>
                      <div className="people">
                        {declining.map((participant) => (
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
