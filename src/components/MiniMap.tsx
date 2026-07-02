import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type MiniMapProps = {
  lat: number;
  lng: number;
  label?: string;
};

export function MiniMap({ lat, lng, label }: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    let map: import("leaflet").Map | undefined;

    async function mountMap() {
      const leafletModule = await import("leaflet");
      const L = leafletModule.default ?? leafletModule;

      if (!isMounted || !containerRef.current) {
        return;
      }

      map = L.map(containerRef.current, {
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
      }).setView([lat, lng], 16);

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      L.circleMarker([lat, lng], {
        radius: 9,
        color: "#f4c94c",
        weight: 3,
        fillColor: "#11342a",
        fillOpacity: 1,
      }).addTo(map);
    }

    mountMap();

    return () => {
      isMounted = false;
      map?.remove();
    };
  }, [lat, lng]);

  const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;

  return (
    <div className="minimap">
      <div
        ref={containerRef}
        className="minimap__canvas"
        role="img"
        aria-label={label ? `Carte : ${label}` : "Carte du lieu"}
      />
      <a className="minimap__link" href={osmUrl} target="_blank" rel="noreferrer">
        Voir sur la grande carte
      </a>
    </div>
  );
}
