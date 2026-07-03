import { useEffect, useState, type CSSProperties } from "react";
import comptoirBackground from "./assets/art/Le-zinc.jpg";
import { ComptoirNameOnboarding } from "./components/onboarding/ComptoirNameOnboarding";
import { NotificationPermissionOnboarding } from "./components/onboarding/NotificationPermissionOnboarding";
import {
  COMPTOIR_NAME_EDIT_EVENT,
  useComptoirName,
} from "./hooks/useComptoirName";
import { useNotificationPermission } from "./hooks/useNotificationPermission";
import { syncAllMyAperos } from "./services/notificationSync";
import { AppRouter } from "./routes/AppRouter";

const appShellStyle = {
  "--app-background-image": "url(" + comptoirBackground + ")",
} as CSSProperties;

export function App() {
  const { comptoirName, setComptoirName } = useComptoirName();
  const [isEditingComptoirName, setIsEditingComptoirName] = useState(false);
  const { isSupported, seenOnboarding, request, dismissOnboarding } = useNotificationPermission();
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  useEffect(() => {
    function handleEditRequest() {
      setIsEditingComptoirName(true);
    }

    window.addEventListener(COMPTOIR_NAME_EDIT_EVENT, handleEditRequest);
    return () => window.removeEventListener(COMPTOIR_NAME_EDIT_EVENT, handleEditRequest);
  }, []);

  const shouldShowNameOnboarding = !comptoirName || isEditingComptoirName;
  // On ne propose l'autorisation système qu'une fois le blaze gravé, et
  // seulement si le navigateur la supporte et qu'on ne l'a pas déjà proposée.
  const shouldShowNotificationOnboarding =
    !shouldShowNameOnboarding && isSupported && !seenOnboarding;

  // Poll naturel au démarrage : dès que l'app est utilisable (blaze en place,
  // onboarding notifications passé), on synchronise les notifications de tous
  // les apéros connus localement.
  useEffect(() => {
    if (shouldShowNameOnboarding || shouldShowNotificationOnboarding) {
      return;
    }

    void syncAllMyAperos();

    // Re-synchronise au retour sur l'app : capte les évolutions distantes et
    // fait mûrir les rappels « peut-être » (48h / 24h / 2h) sans rechargement.
    function handleVisible() {
      if (document.visibilityState === "visible") {
        void syncAllMyAperos();
      }
    }

    window.addEventListener("focus", handleVisible);
    document.addEventListener("visibilitychange", handleVisible);
    return () => {
      window.removeEventListener("focus", handleVisible);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, [shouldShowNameOnboarding, shouldShowNotificationOnboarding]);

  async function handleAllowNotifications() {
    setIsRequestingPermission(true);
    try {
      await request();
    } finally {
      setIsRequestingPermission(false);
      dismissOnboarding();
    }
  }

  return (
    <div className="app-shell" style={appShellStyle}>
      <div className="app-shell__content">
        {shouldShowNameOnboarding ? (
          <ComptoirNameOnboarding
            initialName={comptoirName}
            onConfirm={(name) => {
              setComptoirName(name);
              setIsEditingComptoirName(false);
            }}
          />
        ) : shouldShowNotificationOnboarding ? (
          <NotificationPermissionOnboarding
            isRequesting={isRequestingPermission}
            onAllow={handleAllowNotifications}
            onSkip={dismissOnboarding}
          />
        ) : (
          <AppRouter />
        )}
      </div>
    </div>
  );
}
