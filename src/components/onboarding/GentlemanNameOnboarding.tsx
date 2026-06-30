import { useEffect, useState } from "react";
import { validateGentlemanName } from "../../utils/memberName";

type GentlemanNameOnboardingProps = {
  initialName?: string;
  onConfirm: (name: string) => void;
};

export function GentlemanNameOnboarding({
  initialName = "",
  onConfirm,
}: GentlemanNameOnboardingProps) {
  const [draftName, setDraftName] = useState(initialName);
  const [confirmedName, setConfirmedName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setDraftName(initialName);
  }, [initialName]);

  function handleSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const validation = validateGentlemanName(draftName);

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
      <section className="onboarding-card" aria-labelledby="gentleman-title">
        <p className="eyebrow">{"Entr\u00e9e dans la Confr\u00e9rie"}</p>
        <h1 id="gentleman-title">
          {"Avant d\u2019entrer dans la Confr\u00e9rie, il te faut un nom de gentleman."}
        </h1>
        <p>
          {"C\u2019est sous ce blaze que le zinc se souviendra de tes votes, de tes convocations et de tes prises de position autour du paquet de chips."}
        </p>

        <form className="onboarding-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Nom de gentleman</span>
            <input
              autoFocus
              maxLength={48}
              value={draftName}
              onChange={(eventChange) => setDraftName(eventChange.target.value)}
              placeholder="Exemple : Jean-Michel Pastaga"
            />
          </label>
          <button className="button button--primary button--large button--block" type="submit">
            Faire graver mon blaze au registre
          </button>
          {error && (
            <p className="feedback" role="alert">
              {error}
            </p>
          )}
        </form>
      </section>

      {confirmedName && (
        <div className="onboarding-modal-backdrop" role="presentation">
          <section
            aria-labelledby="gentleman-confirm-title"
            aria-modal="true"
            className="onboarding-modal"
            role="dialog"
          >
            <p className="eyebrow">Validation du registre</p>
            <h2 id="gentleman-confirm-title">{"S\u00e9rieux, c\u2019est \u00e7a ton blaze ?"}</h2>
            <p>
              {"Le registre de la Confr\u00e9rie s\u2019appr\u00eate \u00e0 retenir ce nom. Apr\u00e8s \u00e7a, le comptoir ne pourra plus faire semblant de ne pas te conna\u00eetre."}
            </p>
            <strong className="onboarding-modal__name">
              {"\u201c"}
              {confirmedName}
              {"\u201d"}
            </strong>
            <div className="onboarding-modal__actions">
              <button className="button button--primary button--block" type="button" onClick={handleConfirm}>
                {"Oui, grave \u00e7a dans le zinc"}
              </button>
              <button
                className="button button--secondary button--block"
                type="button"
                onClick={() => setConfirmedName("")}
              >
                Non, je change de blaze
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
