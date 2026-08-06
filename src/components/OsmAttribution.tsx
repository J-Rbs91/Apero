/**
 * Mention de source pour les données OpenStreetMap affichées **hors carte**.
 *
 * Les fonds de carte portent déjà leur attribution : Leaflet la pose lui-même à
 * partir de `TILE_LAYER_OPTIONS`. Mais les résultats de recherche d'adresse
 * (Photon) et la liste des rades autour de soi (Overpass) sont eux aussi des
 * données OSM, restituées sans carte — et l'ODbL demande de créditer la source
 * partout où la donnée ressort, pas seulement sous les tuiles.
 *
 * D'où ce petit composant, à coller sous chaque liste issue d'OSM.
 */
export function OsmAttribution() {
  return (
    <p className="osm-credit">
      Lieux et adresses ©{" "}
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
      >
        les contributeurs OpenStreetMap
      </a>
    </p>
  );
}
