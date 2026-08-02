export const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/**
 * Le fond de carte publie ses tuiles jusqu'au zoom 19. Sans le dire, Leaflet
 * s'arrête à 18 (sa valeur par défaut) : on perdait le dernier cran, celui qui
 * montre l'entrée du rade. `maxNativeZoom` borne les tuiles réellement
 * demandées, pour ne jamais réclamer un niveau que le serveur ne sert pas —
 * une tuile absente, c'est un carré gris dans la carte.
 */
export const MAX_TILE_ZOOM = 19;

export const TILE_LAYER_OPTIONS = {
  attribution: OSM_ATTRIBUTION,
  maxZoom: MAX_TILE_ZOOM,
  maxNativeZoom: MAX_TILE_ZOOM,
};

export const MARKER_STYLE = {
  radius: 9,
  color: "#f4c94c",
  weight: 3,
  fillColor: "#11342a",
  fillOpacity: 1,
};

export async function loadLeaflet() {
  const leafletModule = await import("leaflet");
  return leafletModule.default ?? leafletModule;
}

/**
 * Recale la carte sur son conteneur à chaque fois que celui-ci change vraiment
 * de taille.
 *
 * Leaflet mesure son conteneur une seule fois, au montage, et garde cette
 * taille pour toujours. Or nos cartes naissent dans une mise en page qui bouge
 * encore : la modale finit son animation d'ouverture, la ligne d'adresse se
 * replie sur deux lignes, la police arrive. La carte reste alors persuadée
 * d'être plus petite qu'elle ne l'est — d'où la bande grise en bas, et surtout
 * un centre décalé : le repère se retrouve dans le tiers haut, et chaque zoom
 * s'éloigne du point visé au lieu de s'en rapprocher.
 *
 * Un `ResizeObserver` répond à la vraie question (« le conteneur a-t-il
 * changé ? ») au lieu de parier sur un délai. Il se déclenche aussi à la pose,
 * ce qui couvre le cas du montage ; `invalidateSize()` ne fait rien quand la
 * taille est déjà juste.
 *
 * Retourne la fonction d'arrêt à appeler au démontage.
 */
export function watchMapSize(
  map: import("leaflet").Map,
  container: HTMLElement,
): () => void {
  if (typeof ResizeObserver === "undefined") {
    // Environnements sans ResizeObserver : on retombe sur un recalage différé.
    const timer = window.setTimeout(() => map.invalidateSize(), 60);
    return () => window.clearTimeout(timer);
  }

  let frame = 0;
  const observer = new ResizeObserver(() => {
    // Plusieurs notifications peuvent tomber dans la même frame (largeur puis
    // hauteur) : on ne recale qu'une fois, juste avant le prochain rendu.
    window.cancelAnimationFrame(frame);
    frame = window.requestAnimationFrame(() => map.invalidateSize());
  });
  observer.observe(container);

  return () => {
    window.cancelAnimationFrame(frame);
    observer.disconnect();
  };
}
