import type { CSSProperties } from "react";
import { TRAQUENARD_LEVEL_MAX } from "../utils/calculateResults";
import { describeTraquenardLevel } from "../utils/traquenardScale";

// Dix ampoules, trois zones (froid / tiède / chaud) comme un testeur de force de
// foire (design-system §5). Le niveau est toujours dit en toutes lettres : la
// couleur et le nombre d'ampoules allumées ne portent jamais le sens seuls.

function Bulbs10({ lit }: { lit: number }) {
  return (
    <div className="traq__bulbs" aria-hidden="true">
      {Array.from({ length: TRAQUENARD_LEVEL_MAX }, (_, index) => (
        <i
          key={index}
          className={index < lit ? "traq__bulb is-lit" : "traq__bulb"}
          style={{ "--i": index } as CSSProperties}
        />
      ))}
    </div>
  );
}

type TraquenardGaugeProps = {
  level: number | null;
  voteCount: number;
};

// Jauge récapitulative (lecture seule) : niveau moyen de traquenard.
export function TraquenardGauge({ level, voteCount }: TraquenardGaugeProps) {
  const hasLevel = level != null;
  const lit = hasLevel ? Math.round(level) : 0;

  return (
    <div className="traq traq--summary">
      <div className="traq__head">
        <p className="traq__title">Traquenard-O-mètre</p>
        <p className="traq__value">
          {hasLevel
            ? `${level.toFixed(1)}/${TRAQUENARD_LEVEL_MAX} · ${describeTraquenardLevel(level)}`
            : voteCount === 0
              ? "Personne n’a encore répondu"
              : "En attente de réponses"}
        </p>
      </div>
      <div
        className="traq__gauge"
        role="img"
        aria-label={
          hasLevel
            ? `Traquenard-O-mètre : ${level.toFixed(1)} sur ${TRAQUENARD_LEVEL_MAX}, ${describeTraquenardLevel(level)}`
            : "Traquenard-O-mètre : aucune réponse pour l’instant"
        }
      >
        <Bulbs10 lit={lit} />
      </div>
    </div>
  );
}

type TraquenardSliderProps = {
  value: number;
  onChange: (value: number) => void;
};

// Jauge interactive : le curseur natif reste superposé (clavier, tactile,
// lecteurs d'écran) ; les ampoules s'allument jusqu'à la valeur choisie.
export function TraquenardSlider({ value, onChange }: TraquenardSliderProps) {
  return (
    <div className="traq traq--interactive">
      <div className="traq__head">
        <p className="traq__title">Traquenard-O-mètre</p>
        <p className="traq__value">
          {value}/{TRAQUENARD_LEVEL_MAX} · {describeTraquenardLevel(value)}
        </p>
      </div>
      <div className="traq__gauge">
        <Bulbs10 lit={value} />
        <input
          className="traq__input"
          type="range"
          min={0}
          max={TRAQUENARD_LEVEL_MAX}
          step={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label="Traquenard-O-mètre : ton pronostic"
          aria-valuetext={`${value} sur ${TRAQUENARD_LEVEL_MAX}, ${describeTraquenardLevel(value)}`}
        />
      </div>
    </div>
  );
}
