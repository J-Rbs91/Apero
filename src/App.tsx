import type { CSSProperties } from "react";
import comptoirBackground from "./assets/art/comptoir-background.jpg";
import { AppRouter } from "./routes/AppRouter";

const appShellStyle = {
  "--app-background-image": `url(${comptoirBackground})`,
} as CSSProperties;

export function App() {
  return (
    <div className="app-shell" style={appShellStyle}>
      <div className="app-shell__content">
        <AppRouter />
      </div>
    </div>
  );
}
