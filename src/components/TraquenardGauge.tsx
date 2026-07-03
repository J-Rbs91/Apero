import { TRAQUENARD_LEVEL_MAX } from "../utils/calculateResults";

type TraquenardGaugeProps = {
  level: number | null;
  voteCount: number;
};

function describeLevel(level: number): string {
  if (level >= 8) {
    return "Traquenard total";
  }

  if (level >= 5) {
    return "Ça sent le traquenard";
  }

  if (level >= 2) {
    return "Ambiance correcte";
  }

  return "Petite soirée sage";
}

export function TraquenardGauge({ level, voteCount }: TraquenardGaugeProps) {
  const ratio = level == null ? 0 : Math.min(1, Math.max(0, level / TRAQUENARD_LEVEL_MAX));

  return (
    <div className="traquenard-gauge">
      <div
        className="traquenard-gauge__track"
        role="img"
        aria-label={
          level == null
            ? "Traquenard-O-mètre : aucune réponse pour l’instant"
            : `Traquenard-O-mètre : ${level.toFixed(1)} sur ${TRAQUENARD_LEVEL_MAX}, ${describeLevel(level)}`
        }
      >
        {level != null && (
          <div className="traquenard-gauge__marker" style={{ bottom: `${ratio * 100}%` }} />
        )}
      </div>
      <div className="traquenard-gauge__legend">
        <p className="traquenard-gauge__title">Traquenard-O-mètre</p>
        <p className="traquenard-gauge__value">
          {level == null
            ? voteCount === 0
              ? "Personne n’a encore répondu"
              : "En attente de réponses"
            : `${level.toFixed(1)}/${TRAQUENARD_LEVEL_MAX} · ${describeLevel(level)}`}
        </p>
      </div>
    </div>
  );
}
