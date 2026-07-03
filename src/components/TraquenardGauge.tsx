import { type CSSProperties } from "react";
import { TRAQUENARD_LEVEL_MAX } from "../utils/calculateResults";
import {
  describeTraquenardLevel,
  traquenardColor,
  traquenardRatioFromLevel,
} from "../utils/traquenardScale";

// Variables CSS pilotant le remplissage et la couleur de la jauge : la même
// valeur donne le même rendu, quelle que soit l'orientation.
function gaugeStyle(ratio: number): CSSProperties {
  return {
    "--traq-ratio": ratio,
    "--traq-color": traquenardColor(ratio),
  } as CSSProperties;
}

type TraquenardGaugeProps = {
  level: number | null;
  voteCount: number;
  orientation?: "horizontal" | "vertical";
};

// Jauge récapitulative (lecture seule) : synthétise le niveau moyen de
// traquenard autour de l'évènement. Horizontale dans la carte de synthèse.
export function TraquenardGauge({
  level,
  voteCount,
  orientation = "horizontal",
}: TraquenardGaugeProps) {
  const hasLevel = level != null;
  const ratio = hasLevel ? traquenardRatioFromLevel(level) : 0;

  return (
    <div className={`traq traq--${orientation} traq--summary`} style={gaugeStyle(ratio)}>
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
        <div className="traq__track">
          <div className="traq__fill" />
        </div>
        {hasLevel && <div className="traq__thumb" />}
      </div>
    </div>
  );
}

type TraquenardSliderProps = {
  value: number;
  onChange: (value: number) => void;
};

// Jauge verticale interactive : accompagne la réponse de l'utilisateur, qui
// déplace le curseur pour indiquer son engagement. La couleur suit la valeur.
export function TraquenardSlider({ value, onChange }: TraquenardSliderProps) {
  const ratio = traquenardRatioFromLevel(value);

  return (
    <div className="traq traq--vertical traq--interactive" style={gaugeStyle(ratio)}>
      <div className="traq__scale">
        <div className="traq__track" aria-hidden="true">
          <div className="traq__fill" />
        </div>
        <div className="traq__thumb" aria-hidden="true" />
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
      <div className="traq__head">
        <p className="traq__title">Traquenard-O-mètre</p>
        <p className="traq__value">
          {value}/{TRAQUENARD_LEVEL_MAX} · {describeTraquenardLevel(value)}
        </p>
      </div>
    </div>
  );
}
