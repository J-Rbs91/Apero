export const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

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
