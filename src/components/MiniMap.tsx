import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { useModalDialog } from "../hooks/useModalDialog";
import {
  loadLeaflet,
  MARKER_STYLE,
  MAX_TILE_ZOOM,
  OSM_TILE_URL,
  TILE_LAYER_OPTIONS,
  watchMapSize,
} from "../utils/leaflet";
import { OpenInMapsButton } from "./OpenInMapsButton";

type MiniMapProps = {
  lat: number;
  lng: number;
  label?: string;
  address?: string;
};

export function MiniMap({ lat, lng, label, address }: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const expandedContainerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const expandedDialogRef = useModalDialog(isExpanded, () => setIsExpanded(false));

  useEffect(() => {
    let isMounted = true;
    let map: import("leaflet").Map | undefined;
    let unwatchSize: (() => void) | undefined;

    async function mountMap() {
      const L = await loadLeaflet();
      const container = containerRef.current;

      if (!isMounted || !container) {
        return;
      }

      map = L.map(container, {
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
      }).setView([lat, lng], 16);

      L.tileLayer(OSM_TILE_URL, TILE_LAYER_OPTIONS).addTo(map);
      L.circleMarker([lat, lng], MARKER_STYLE).addTo(map);
      // La vignette naît dans un panneau qui bouge encore (police, adresse sur
      // deux lignes) : sans recalage, elle garde une bande grise et un repère
      // décalé, et rien ne la redessine puisqu'on ne peut ni la zoomer ni la
      // déplacer.
      unwatchSize = watchMapSize(map, container);
    }

    mountMap();

    return () => {
      isMounted = false;
      unwatchSize?.();
      map?.remove();
    };
  }, [lat, lng]);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    let isMounted = true;
    let map: import("leaflet").Map | undefined;
    let unwatchSize: (() => void) | undefined;

    async function mountExpandedMap() {
      const L = await loadLeaflet();
      const container = expandedContainerRef.current;

      if (!isMounted || !container) {
        return;
      }

      map = L.map(container, { maxZoom: MAX_TILE_ZOOM }).setView([lat, lng], 16);
      L.tileLayer(OSM_TILE_URL, TILE_LAYER_OPTIONS).addTo(map);
      L.circleMarker([lat, lng], MARKER_STYLE).addTo(map);
      // Le conteneur vient d'apparaître dans la modale, qui joue encore son
      // animation d'ouverture : Leaflet a mesuré du vide. On suit sa taille
      // réelle plutôt que de parier sur un délai — sinon la carte reste
      // persuadée d'être plus petite, et chaque zoom part à côté du repère.
      unwatchSize = watchMapSize(map, container);
    }

    mountExpandedMap();

    return () => {
      isMounted = false;
      unwatchSize?.();
      map?.remove();
    };
  }, [isExpanded, lat, lng]);

  return (
    <div className="minimap">
      <div
        ref={containerRef}
        className="minimap__canvas"
        role="img"
        aria-label={label ? `Carte : ${label}` : "Carte du lieu"}
      />
      <div className="minimap__row">
        <OpenInMapsButton
          className="minimap__address"
          label={label ?? "ce troquet"}
          address={address}
          lat={lat}
          lng={lng}
        />
        <button
          type="button"
          className="minimap__expand"
          onClick={() => setIsExpanded(true)}
        >
          Agrandir la carte
        </button>
      </div>

      {isExpanded && (
        <div className="modal-backdrop" role="presentation">
          <section
            ref={expandedDialogRef}
            tabIndex={-1}
            className="sheet modal-sheet modal-sheet--map"
            role="dialog"
            aria-modal="true"
            aria-label={label ? `Carte agrandie : ${label}` : "Carte agrandie"}
          >
            <div className="minimap__expanded-head">
              <p className="eyebrow">{label ?? "Le repère"}</p>
              <button
                type="button"
                className="minimap__close"
                onClick={() => setIsExpanded(false)}
                aria-label="Fermer la carte"
              >
                ✕
              </button>
            </div>
            <div ref={expandedContainerRef} className="minimap__canvas minimap__canvas--expanded" />
            <OpenInMapsButton label={label ?? "ce troquet"} address={address} lat={lat} lng={lng} />
          </section>
        </div>
      )}
    </div>
  );
}
