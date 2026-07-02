import { useEffect, useState } from "react";
import { WineGlassMark } from "../WineGlassMark";
import { validateComptoirName } from "../../utils/memberName";

type ComptoirNameOnboardingProps = {
  initialName?: string;
  onConfirm: (name: string) => void;
};

export function ComptoirNameOnboarding({
  initialName = "",
  onConfirm,
}: ComptoirNameOnboardingProps) {
  const [draftName, setDraftName] = useState(initialName);
  const [confirmedName, setConfirmedName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setDraftName(initialName);
  }, [initialName]);

  function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const validation = validateComptoirName(draftName);

    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    setError("");
    setConfirmedName(validation.name);
  }

  function handleConfirm() {
    if (confirmedName) {
      onConfirm(confirmedName);
    }
  }

  return (
    <main className="onboarding-screen">
      <div className="screen-overlay screen-overlay--scene" aria-hidden />
      <div className="onboarding-screen__inner">
        <div className="brandpill">
          <WineGlassMark size={26} /> La Confrérie
        </div>

        <div className="grow" />

        <section className="sheet" aria-labelledby="comptoir-title">
          <p className="eyebrow">{"Entrée dans la Confrérie"}</p>
          <hr className="accent" />
          <h1 className="h1 h1--sm" id="comptoir-title">
            Il te faut un nom de comptoir
          </h1>
          <p className="lede">
            {"C’est sous ce blaze que le zinc se souviendra de toi. La tablée ne juge pas, elle grave les noms."}
          </p>

          <form className="vote-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Nom de comptoir</span>
              <input
                autoFocus
                maxLength={48}
                value={draftName}
                onChange={(eventChange) => setDraftName(eventChange.target.value)}
                placeholder="Jean-Michel Pastaga, Gisèle Perrier…"
              />
            </label>
            <button className="button button--primary button--block" type="submit">
              Graver mon blaze au registre
            </button>
            {error && (
              <p className="feedback" role="alert">
                {error}
              </p>
            )}
          </form>
        </section>
      </div>

      {confirmedName && (
        <div className="modal-backdrop" role="presentation">
          <section
            aria-labelledby="comptoir-confirm-title"
            aria-modal="true"
            className="sheet modal-sheet"
            role="dialog"
          >
            <p className="eyebrow">Validation du registre</p>
            <h2 className="h1 h1--sm" id="comptoir-confirm-title">
              {"Sérieux, c’est ça ton blaze ?"}
            </h2>
            <span className="blaze">
              {"« "}
              {confirmedName}
              {" »"}
            </span>
            <button className="button button--primary button--block" type="button" onClick={handleConfirm}>
              {"Oui, grave ça dans le zinc"}
            </button>
            <button
              className="button button--ghost button--block"
              type="button"
              onClick={() => setConfirmedName("")}
            >
              Non, je change de blaze
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
