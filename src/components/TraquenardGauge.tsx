import { type CSSProperties } from "react";
import { TRAQUENARD_LEVEL_MAX } from "../utils/calculateResults";
import {
  describeTraquenardLevel,
  traquenardColor,
  traquenardRatioFromLevel,
} from "../utils/traquenardScale";

// Variables CSS pilotant le remplissage et la couleur de la jauge : la même
// valeur donne le même rendu, qu'elle soit récapitulative ou interactive.
function gaugeStyle(ratio: number): CSSProperties {
  return {
    "--traq-ratio": ratio,
    "--traq-color": traquenardColor(ratio),
  } as CSSProperties;
}

type TraquenardGaugeProps = {
  level: number | null;
  voteCount: number;
};

// Jauge récapitulative (lecture seule) : synthétise le niveau moyen de
// traquenard autour de l'évènement. Horizontale, en pied de carte.
export function TraquenardGauge({ level, voteCount }: TraquenardGaugeProps) {
  const hasLevel = level != null;
  const ratio = hasLevel ? traquenardRatioFromLevel(level) : 0;

  return (
    <div className="traq traq--summary" style={gaugeStyle(ratio)}>
      <div className="traq__head">
        {/* « Pronostic de la tablée » : la synthèse se distingue du curseur
            interactif (« Ton pronostic ») d'un coup d'œil. */}
        <p className="traq__title">Pronostic de la tablée</p>
        <p className={`traq__value${hasLevel ? "" : " traq__value--empty"}`}>
          {hasLevel
            ? `${level.toFixed(1)}/${TRAQUENARD_LEVEL_MAX} · ${describeTraquenardLevel(level)}`
            : voteCount === 0
              ? "Aucun pronostic déposé"
              : "En attente de pronostics"}
        </p>
      </div>
      <div
        className="traq__gauge"
        role="img"
        aria-label={
          hasLevel
            ? `Pronostic de la tablée : ${level.toFixed(1)} sur ${TRAQUENARD_LEVEL_MAX}, ${describeTraquenardLevel(level)}`
            : "Pronostic de la tablée : rien de déposé pour l’instant"
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
  /** Null tant que le convive n'a pas touché le curseur : pas de pronostic
   * gravé d'office, la moyenne de la tablée ne compte que les vrais avis. */
  value: number | null;
  onChange: (value: number) => void;
};

// Jauge horizontale interactive : accompagne la réponse de l'utilisateur, qui
// déplace le curseur pour indiquer son pronostic. La couleur suit la valeur.
export function TraquenardSlider({ value, onChange }: TraquenardSliderProps) {
  const displayValue = value ?? 5;
  const ratio = traquenardRatioFromLevel(displayValue);

  return (
    <div
      className={`traq traq--interactive${value == null ? " traq--untouched" : ""}`}
      style={gaugeStyle(ratio)}
    >
      <div className="traq__head">
        <p className="traq__title">Ton pronostic</p>
        <p className={`traq__value${value == null ? " traq__value--empty" : ""}`}>
          {value == null
            ? "Glisse pour te mouiller (optionnel)"
            : `${value}/${TRAQUENARD_LEVEL_MAX} · ${describeTraquenardLevel(value)}`}
        </p>
      </div>
      <div className="traq__gauge">
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
          value={displayValue}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label="Traquenard-O-mètre : ton pronostic"
          aria-valuetext={
            value == null
              ? "aucun pronostic déposé"
              : `${value} sur ${TRAQUENARD_LEVEL_MAX}, ${describeTraquenardLevel(value)}`
          }
        />
      </div>
    </div>
  );
}
