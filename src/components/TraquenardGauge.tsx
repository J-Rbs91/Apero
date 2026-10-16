import { type CSSProperties } from "react";
import { TRAQUENARD_LEVEL_MAX } from "../utils/calculateResults";
import { describeTraquenardLevel } from "../utils/traquenardScale";

// Dix ampoules, trois zones (froid / tiède / chaud) comme un testeur de force
// de foire (docs/uxer/design-system.md §5). Le niveau est toujours dit en
// toutes lettres : ni la couleur ni le nombre d'ampoules allumées ne portent
// le sens seuls. Les ampoules s'allument en cascade (montée uniquement).
function GaugeBulbs({ lit }: { lit: number }) {
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

// Jauge récapitulative (lecture seule) : synthétise le niveau moyen de
// traquenard autour de l'évènement. Horizontale, en pied de carte.
export function TraquenardGauge({ level, voteCount }: TraquenardGaugeProps) {
  const hasLevel = level != null;
  const lit = hasLevel ? Math.round(level) : 0;

  return (
    <div className="traq traq--summary">
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
        <GaugeBulbs lit={lit} />
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

  return (
    <div className={`traq traq--interactive${value == null ? " traq--untouched" : ""}`}>
      <div className="traq__head">
        <p className="traq__title">Ton pronostic</p>
        <p className={`traq__value${value == null ? " traq__value--empty" : ""}`}>
          {value == null
            ? "Glisse pour te mouiller (optionnel)"
            : `${value}/${TRAQUENARD_LEVEL_MAX} · ${describeTraquenardLevel(value)}`}
        </p>
      </div>
      <div className="traq__gauge">
        <GaugeBulbs lit={displayValue} />
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
