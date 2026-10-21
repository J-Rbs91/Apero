import { useEffect, useState } from "react";
import { VERRERIE_ECRANS } from "../field/verrerieEcrans";
import { useModalDialog } from "../../hooks/useModalDialog";
import { MobilePage } from "../MobilePage";
import { PointMark } from "../field/PointMark";
import { Field } from "../ui";
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
  const confirmDialogRef = useModalDialog(Boolean(confirmedName), () => setConfirmedName(""));

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
    <MobilePage
      className="onboarding-screen"
      verrerie={VERRERIE_ECRANS.nom}
      header={
        <div className="brandpill">
          <PointMark /> La Confrérie
        </div>
      }
      hero={
        <div className="page-hero" role="group" aria-labelledby="comptoir-title">
          <h1 className="h1 h1--sm" id="comptoir-title">
            Nom
          </h1>
        </div>
      }
    >
      <form className="vote-form" onSubmit={handleSubmit}>
        <Field
          label="Nom"
          requirement="required"
          error={error || undefined}
        >
          {(control) => (
            <input
              {...control}
              autoFocus
              maxLength={48}
              value={draftName}
              onChange={(eventChange) => setDraftName(eventChange.target.value)}
            />
          )}
        </Field>
        <button className="button button--primary button--block" type="submit">
          Valider
        </button>
      </form>

      {confirmedName && (
        <div className="modal-backdrop" role="presentation">
          <section
            ref={confirmDialogRef}
            tabIndex={-1}
            aria-labelledby="comptoir-confirm-title"
            aria-describedby="comptoir-confirm-name"
            aria-modal="true"
            className="sheet modal-sheet"
            role="dialog"
          >
            <h2 className="h1 h1--sm" id="comptoir-confirm-title">
              Confirmer ?
            </h2>
            <span className="blaze" id="comptoir-confirm-name">
              {confirmedName}
            </span>
            <div className="button-row">
              <button className="button button--primary" type="button" onClick={handleConfirm}>
                Confirmer
              </button>
              <button
                className="button button--ghost"
                type="button"
                onClick={() => setConfirmedName("")}
              >
                Modifier
              </button>
            </div>
          </section>
        </div>
      )}
    </MobilePage>
  );
}
