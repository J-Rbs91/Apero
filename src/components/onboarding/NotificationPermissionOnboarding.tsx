import { WineGlassMark } from "../WineGlassMark";

// Écran d'onboarding : demande l'autorisation d'envoyer des notifications
// système, en expliquant clairement pourquoi (section 6). Refuser n'empêche
// rien : le badge interne rouge reste actif dans tous les cas.

type NotificationPermissionOnboardingProps = {
  onAllow: () => void;
  onSkip: () => void;
  isRequesting?: boolean;
};

const REASONS = [
  "Recevoir les réponses des invités",
  "Être informé des nouvelles propositions",
  "Ne pas oublier de confirmer ta présence",
  "Recevoir les rappels importants avant l'apéro",
];

export function NotificationPermissionOnboarding({
  onAllow,
  onSkip,
  isRequesting = false,
}: NotificationPermissionOnboardingProps) {
  return (
    <main className="onboarding-screen">
      <div className="screen-overlay screen-overlay--scene" aria-hidden />
      <div className="onboarding-screen__inner">
        <div className="brandpill">
          <WineGlassMark size={26} /> La Confrérie
        </div>

        <div className="grow" />

        <section className="sheet" aria-labelledby="notif-onboarding-title">
          <p className="eyebrow">Rester dans la boucle du zinc</p>
          <hr className="accent" />
          <h1 className="h1 h1--sm" id="notif-onboarding-title">
            On te prévient quand ça bouge au comptoir ?
          </h1>
          <p className="lede">
            Autorise les notifications pour ne rien rater de tes apéros, même quand l'app est fermée.
            Tu gardes la main : tu peux refuser, le badge rouge dans l'app fera le guet quand même.
          </p>

          <ul className="notif-reasons">
            {REASONS.map((reason) => (
              <li key={reason} className="notif-reasons__item">
                <span className="notif-reasons__mark" aria-hidden="true" />
                {reason}
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="button button--primary button--block"
            onClick={onAllow}
            disabled={isRequesting}
          >
            {isRequesting ? "On demande au téléphone…" : "Activer les notifications"}
          </button>
          <button
            type="button"
            className="button button--ghost button--block"
            onClick={onSkip}
            disabled={isRequesting}
          >
            Plus tard — garder juste le badge
          </button>
        </section>
      </div>
    </main>
  );
}
