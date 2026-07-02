import { useEffect, useState, type CSSProperties } from "react";
import comptoirBackground from "./assets/art/Le-zinc.jpg";
import { ComptoirNameOnboarding } from "./components/onboarding/ComptoirNameOnboarding";
import {
  COMPTOIR_NAME_EDIT_EVENT,
  useComptoirName,
} from "./hooks/useComptoirName";
import { AppRouter } from "./routes/AppRouter";

const appShellStyle = {
  "--app-background-image": "url(" + comptoirBackground + ")",
} as CSSProperties;

export function App() {
  const { comptoirName, setComptoirName } = useComptoirName();
  const [isEditingComptoirName, setIsEditingComptoirName] = useState(false);

  useEffect(() => {
    function handleEditRequest() {
      setIsEditingComptoirName(true);
    }

    window.addEventListener(COMPTOIR_NAME_EDIT_EVENT, handleEditRequest);
    return () => window.removeEventListener(COMPTOIR_NAME_EDIT_EVENT, handleEditRequest);
  }, []);

  const shouldShowOnboarding = !comptoirName || isEditingComptoirName;

  return (
    <div className="app-shell" style={appShellStyle}>
      <div className="app-shell__content">
        {shouldShowOnboarding ? (
          <ComptoirNameOnboarding
            initialName={comptoirName}
            onConfirm={(name) => {
              setComptoirName(name);
              setIsEditingComptoirName(false);
            }}
          />
        ) : (
          <AppRouter />
        )}
      </div>
    </div>
  );
}
