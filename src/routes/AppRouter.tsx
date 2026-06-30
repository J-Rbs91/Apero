import { HashRouter, Route, Routes } from "react-router-dom";
import { CreateEventPage } from "../pages/CreateEventPage";
import { EventPage } from "../pages/EventPage";
import { HomePage } from "../pages/HomePage";

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreateEventPage />} />
        <Route path="/event/:eventId" element={<EventPage />} />
      </Routes>
    </HashRouter>
  );
}
