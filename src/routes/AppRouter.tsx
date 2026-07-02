import { HashRouter, Route, Routes } from "react-router-dom";
import { AgendaPage } from "../pages/AgendaPage";
import { CreateEventPage } from "../pages/CreateEventPage";
import { EventPage } from "../pages/EventPage";
import { HomePage } from "../pages/HomePage";
import { InvitePage } from "../pages/InvitePage";
import { PalmaresPage } from "../pages/PalmaresPage";

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateEventPage />} />
        <Route path="/event/:eventId" element={<EventPage />} />
        {/* Nouveau flux chiffré (migration API VPS) : les clés voyagent dans
            le fragment (#/invite/:aperoId?k=…&w=…), jamais vers un serveur. */}
        <Route path="/invite/:aperoId" element={<InvitePage />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/palmares" element={<PalmaresPage />} />
      </Routes>
    </HashRouter>
  );
}
