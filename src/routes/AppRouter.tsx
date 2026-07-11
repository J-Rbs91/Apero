import { HashRouter, Route, Routes } from "react-router-dom";
import { AgendaPage } from "../pages/AgendaPage";
import { CoffrePage } from "../pages/CoffrePage";
import { ComptesPage } from "../pages/ComptesPage";
import { CreateEventPage } from "../pages/CreateEventPage";
import { EventPage } from "../pages/EventPage";
import { HomePage } from "../pages/HomePage";
import { InvitePage } from "../pages/InvitePage";
import { NotificationsPage } from "../pages/NotificationsPage";
import { PalmaresPage } from "../pages/PalmaresPage";
import { TableePage } from "../pages/TableePage";
import { TableesPage } from "../pages/TableesPage";

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
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/palmares" element={<PalmaresPage />} />
        <Route path="/comptes" element={<ComptesPage />} />
        <Route path="/coffre" element={<CoffrePage />} />
        {/* Les Tablées : mêmes règles que les invitations, clés dans le
            fragment (#/tablee/:tableeId?k=…&w=…), jamais vers un serveur. */}
        <Route path="/tablees" element={<TableesPage />} />
        <Route path="/tablee/:tableeId" element={<TableePage />} />
      </Routes>
    </HashRouter>
  );
}
