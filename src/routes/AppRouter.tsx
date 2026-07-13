import { lazy, Suspense } from "react";
import { HashRouter, Link, Route, Routes } from "react-router-dom";
import { LoadingScreen } from "../components/LoadingScreen";
import { MobileHeader } from "../components/MobileHeader";
import { MobilePage } from "../components/MobilePage";
import { HomePage } from "../pages/HomePage";
import { InvitePage } from "../pages/InvitePage";

// Code splitting par route : le parcours critique (accueil + invitation, ce
// que voit un primo-invité sur mobile) reste dans le chunk principal ; le
// reste se charge à la demande.
const AgendaPage = lazy(() =>
  import("../pages/AgendaPage").then((module) => ({ default: module.AgendaPage })),
);
const CoffrePage = lazy(() =>
  import("../pages/CoffrePage").then((module) => ({ default: module.CoffrePage })),
);
const ComptesPage = lazy(() =>
  import("../pages/ComptesPage").then((module) => ({ default: module.ComptesPage })),
);
const CreateEventPage = lazy(() =>
  import("../pages/CreateEventPage").then((module) => ({ default: module.CreateEventPage })),
);
const EventPage = lazy(() =>
  import("../pages/EventPage").then((module) => ({ default: module.EventPage })),
);
const NotificationsPage = lazy(() =>
  import("../pages/NotificationsPage").then((module) => ({ default: module.NotificationsPage })),
);
const PalmaresPage = lazy(() =>
  import("../pages/PalmaresPage").then((module) => ({ default: module.PalmaresPage })),
);
const TableePage = lazy(() =>
  import("../pages/TableePage").then((module) => ({ default: module.TableePage })),
);
const TableesPage = lazy(() =>
  import("../pages/TableesPage").then((module) => ({ default: module.TableesPage })),
);

function RouteFallback() {
  return (
    <MobilePage overlay="deep">
      <LoadingScreen title="On pousse la porte" subtitle="Le comptoir arrive…" />
    </MobilePage>
  );
}

// Route de repli : un lien tronqué ou une adresse inconnue ne doit jamais
// laisser un écran blanc — surtout pas pour un lien d'invitation mal collé.
function NotFoundRoute() {
  return (
    <MobilePage overlay="deep">
      <MobileHeader eyebrow="La Confrérie" />
      <section className="sheet">
        <h1 className="h1 h1--sm">Aïe, ce lien coince</h1>
        <p className="lede">
          Cette porte ne mène nulle part : lien tronqué ou adresse inconnue. Si on
          t’a invité·e, demande le lien complet à la personne qui organise.
        </p>
        <Link className="button button--ghost button--block" to="/">
          Retour au comptoir
        </Link>
      </section>
    </MobilePage>
  );
}

export function AppRouter() {
  return (
    <HashRouter>
      <Suspense fallback={<RouteFallback />}>
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
          <Route path="*" element={<NotFoundRoute />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
