import { MobilePage } from "../MobilePage";
import { VERRERIE_ECRANS } from "../field/verrerieEcrans";
import { PointMark } from "../field/PointMark";

// Écran d'onboarding : demande l'autorisation d'envoyer des notifications
// système, en expliquant clairement pourquoi (section 6). Refuser n'empêche
// rien : le badge interne rouge reste actif dans tous les cas.

type NotificationPermissionOnboardingProps = {
  onAllow: () => void;
  onSkip: () => void;
  isRequesting?: boolean;
};

const REASONS = ["Réponses", "Nouveaux créneaux", "Créneau retenu", "Rappels"];

export function NotificationPermissionOnboarding({
  onAllow,
  onSkip,
  isRequesting = false,
}: NotificationPermissionOnboardingProps) {
  return (
    <MobilePage
      className="onboarding-screen"
      verrerie={VERRERIE_ECRANS.notificationsAccueil}
      header={
        <div className="brandpill">
          <PointMark /> La Confrérie
        </div>
      }
      hero={
        <div className="page-hero" role="group" aria-labelledby="notif-onboarding-title">
          <h1 className="h1 h1--sm" id="notif-onboarding-title">
            Notifications
          </h1>
        </div>
      }
    >
      <ul className="notif-reasons">
        {REASONS.map((reason) => (
          <li key={reason} className="notif-reasons__item">
            <span className="notif-reasons__mark" aria-hidden="true" />
            {reason}
          </li>
        ))}
      </ul>

      <div className="vote-form">
        <button
          type="button"
          className="button button--primary button--block"
          onClick={onAllow}
          disabled={isRequesting}
        >
          {isRequesting ? "Activation…" : "Activer"}
        </button>
        <button
          type="button"
          className="button button--ghost button--block"
          onClick={onSkip}
          disabled={isRequesting}
        >
          Plus tard
        </button>
      </div>
    </MobilePage>
  );
}
