import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import {
  loadLeaflet,
  MARKER_STYLE,
  MAX_TILE_ZOOM,
  OSM_TILE_URL,
  TILE_LAYER_OPTIONS,
  watchMapSize,
} from "../utils/leaflet";

// Vue par défaut sur la France quand aucun point n'est encore posé.
const FRANCE_CENTER: [number, number] = [46.6, 2.5];
const FRANCE_ZOOM = 5;
const PICKED_ZOOM = 16;

type LocationPickerMapProps = {
  lat?: number;
  lng?: number;
  onPick: (lat: number, lng: number) => void;
};

export function LocationPickerMap({ lat, lng, onPick }: LocationPickerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").CircleMarker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    let isMounted = true;
    let unwatchSize: (() => void) | undefined;

    async function mountMap() {
      const L = await loadLeaflet();
      const container = containerRef.current;

      if (!isMounted || !container) {
        return;
      }

      const map = L.map(container, { maxZoom: MAX_TILE_ZOOM }).setView(
        lat != null && lng != null ? [lat, lng] : FRANCE_CENTER,
        lat != null && lng != null ? PICKED_ZOOM : FRANCE_ZOOM,
      );

      L.tileLayer(OSM_TILE_URL, TILE_LAYER_OPTIONS).addTo(map);
      map.on("click", (mapEvent) => {
        onPickRef.current(mapEvent.latlng.lat, mapEvent.latlng.lng);
      });

      mapRef.current = map;
      // La carte apparaît au dépliage du bloc « pointe-le toi-même » : sa
      // taille se stabilise après le montage. Tant que Leaflet ne le sait pas,
      // le clic tombe à côté du pixel visé — l'inverse de ce qu'on promet.
      unwatchSize = watchMapSize(map, container);
    }

    mountMap();

    return () => {
      isMounted = false;
      unwatchSize?.();
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Le clic est routé via onPickRef : pas besoin de remonter la carte à chaque frappe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function updateMarker() {
      const map = mapRef.current;

      if (!map) {
        return;
      }

      if (lat == null || lng == null) {
        markerRef.current?.remove();
        markerRef.current = null;
        return;
      }

      const L = await loadLeaflet();

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.circleMarker([lat, lng], MARKER_STYLE).addTo(map);
      }

      map.setView([lat, lng], Math.max(map.getZoom(), 15));
    }

    updateMarker();
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      className="locpicker__canvas"
      role="img"
      aria-label="Carte pour pointer un lieu à la main"
    />
  );
}
