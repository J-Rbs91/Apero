import { useEffect, useState, type CSSProperties } from "react";
import comptoirBackground from "./assets/art/Le-zinc.jpg";
import { GentlemanNameOnboarding } from "./components/onboarding/GentlemanNameOnboarding";
import {
  GENTLEMAN_NAME_EDIT_EVENT,
  useGentlemanName,
} from "./hooks/useGentlemanName";
import { AppRouter } from "./routes/AppRouter";

const appShellStyle = {
  "--app-background-image": "url(" + comptoirBackground + ")",
} as CSSProperties;

export function App() {
  const { gentlemanName, setGentlemanName } = useGentlemanName();
  const [isEditingGentlemanName, setIsEditingGentlemanName] = useState(false);

  useEffect(() => {
    function handleEditRequest() {
      setIsEditingGentlemanName(true);
    }

    window.addEventListener(GENTLEMAN_NAME_EDIT_EVENT, handleEditRequest);
    return () => window.removeEventListener(GENTLEMAN_NAME_EDIT_EVENT, handleEditRequest);
  }, []);

  const shouldShowOnboarding = !gentlemanName || isEditingGentlemanName;

  return (
    <div className="app-shell" style={appShellStyle}>
      <div className="app-shell__content">
        {shouldShowOnboarding ? (
          <GentlemanNameOnboarding
            initialName={gentlemanName}
            onConfirm={(name) => {
              setGentlemanName(name);
              setIsEditingGentlemanName(false);
            }}
          />
        ) : (
          <AppRouter />
        )}
      </div>
    </div>
  );
}
