import { useEffect, useRef, useState } from "react";
import { LocationPickerMap } from "./LocationPickerMap";
import type { PlaceSuggestion } from "../utils/photonGeocoding";
import { reverseGeocode, searchPlaces } from "../utils/photonGeocoding";
import type { NearbyPlace } from "../utils/nearbyPlaces";
import { fetchNearbyPlaces, formatDistance } from "../utils/nearbyPlaces";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;
const GEOLOCATION_TIMEOUT_MS = 12_000;

export type LocationValue = {
  location: string;
  locationAddress?: string;
  locationLat?: number;
  locationLng?: number;
  // Référence OSM stable de l'établissement quand le lieu vient d'une liste
  // (« Autour de moi », recherche) — absente pour la saisie libre.
  locationPlaceId?: string;
};

type NearbyState =
  // « priming » : on explique pourquoi/comment AVANT de déclencher la popup de
  // permission du navigateur. Un prompt qui tombe sans contexte se solde
  // souvent par un refus réflexe, difficile à récupérer ensuite (surtout sur
  // mobile) — et le priming réaffirme au passage la promesse « ta position ne
  // part sur aucun serveur ».
  | { status: "idle" }
  | { status: "priming" }
  | { status: "locating" }
  | { status: "searching" }
  | { status: "ready"; places: NearbyPlace[] }
  | { status: "error"; message: string };

type LocationFieldProps = {
  label?: string;
  placeholder?: string;
  value: LocationValue;
  onChange: (value: LocationValue) => void;
};

export function LocationField({
  label = "Lieu",
  placeholder = "Bar des Sports",
  value,
  onChange,
}: LocationFieldProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [nearby, setNearby] = useState<NearbyState>({ status: "idle" });
  const containerRef = useRef<HTMLDivElement>(null);
  // Coupe la recherche après un choix dans la liste ou sur la carte : le texte
  // change mais ce n'est pas une frappe utilisateur.
  const skipNextSearchRef = useRef(false);

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    const query = value.location.trim();

    if (query.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const abortController = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const places = await searchPlaces(query, abortController.signal);
        setSuggestions(places);
        setIsOpen(places.length > 0);
      } catch {
        // Photon injoignable : la saisie libre reste souveraine, on se tait.
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      abortController.abort();
      window.clearTimeout(timer);
    };
  }, [value.location]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(pointerEvent: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(pointerEvent.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(keyEvent: KeyboardEvent) {
      if (keyEvent.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleInput(text: string) {
    // Toute frappe manuelle invalide les coordonnées du choix précédent
    // (les clés restent présentes pour écraser l'ancien choix au merge).
    onChange({
      location: text,
      locationAddress: undefined,
      locationLat: undefined,
      locationLng: undefined,
      locationPlaceId: undefined,
    });
  }

  function handleSelect(place: PlaceSuggestion) {
    skipNextSearchRef.current = true;
    setIsOpen(false);
    setSuggestions([]);
    onChange({
      location: place.name,
      locationAddress: place.address || undefined,
      locationLat: place.lat,
      locationLng: place.lng,
      locationPlaceId: place.placeId,
    });
    // Montre immédiatement le point sur la carte : confirmation visuelle du
    // lieu choisi, et possibilité de l'ajuster dans la foulée.
    setIsPickerOpen(true);
  }

  function handleSelectNearby(place: NearbyPlace) {
    skipNextSearchRef.current = true;
    setNearby({ status: "idle" });
    onChange({
      location: place.name,
      locationAddress: place.address || undefined,
      locationLat: place.lat,
      locationLng: place.lng,
      locationPlaceId: place.placeId,
    });
    setIsPickerOpen(true);
  }

  // Premier temps : le clic sur « Les rades autour de moi » n'appelle PAS
  // encore la géoloc — il ouvre l'explication. La permission du navigateur
  // n'est demandée qu'au clic suivant (handleNearbyScan), après contexte.
  function handleNearbyPrime() {
    if (nearby.status === "locating" || nearby.status === "searching") {
      return;
    }
    if (!("geolocation" in navigator)) {
      setNearby({
        status: "error",
        message: "Ce navigateur ne sait pas te situer. La recherche et la carte restent là.",
      });
      return;
    }
    setNearby({ status: "priming" });
  }

  function handleNearbyScan() {
    if (nearby.status === "locating" || nearby.status === "searching") {
      return;
    }
    if (!("geolocation" in navigator)) {
      setNearby({
        status: "error",
        message: "Ce navigateur ne sait pas te situer. La recherche et la carte restent là.",
      });
      return;
    }

    // La position ne quitte jamais le navigateur : elle ne sert qu'à
    // interroger OpenStreetMap, jamais un serveur de la Confrérie.
    setNearby({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setNearby({ status: "searching" });
        try {
          const places = await fetchNearbyPlaces(
            position.coords.latitude,
            position.coords.longitude,
          );
          setNearby({ status: "ready", places });
        } catch {
          setNearby({
            status: "error",
            message: "Le quartier ne répond pas (OpenStreetMap est peut-être en pause). Réessaie dans un instant.",
          });
        }
      },
      (geolocationError) => {
        setNearby({
          status: "error",
          message:
            geolocationError.code === geolocationError.PERMISSION_DENIED
              ? "Position refusée : pas de tournée du quartier sans ton feu vert. La recherche et la carte restent là."
              : "Impossible de te situer pour le moment. Réessaie, ou pointe le rade sur la carte.",
        });
      },
      { enableHighAccuracy: false, timeout: GEOLOCATION_TIMEOUT_MS, maximumAge: 60_000 },
    );
  }

  async function handleMapPick(lat: number, lng: number) {
    const currentName = value.location.trim();
    skipNextSearchRef.current = true;
    onChange({
      location: currentName || "Point posé sur la carte",
      locationAddress: undefined,
      locationLat: lat,
      locationLng: lng,
      locationPlaceId: undefined,
    });

    try {
      const place = await reverseGeocode(lat, lng);
      if (place) {
        skipNextSearchRef.current = true;
        onChange({
          location: currentName || place.name,
          locationAddress: place.address || undefined,
          locationLat: lat,
          locationLng: lng,
          // Un point posé à la main n'est pas forcément l'établissement que
          // Photon croit reconnaître : on ne grave pas sa référence.
          locationPlaceId: undefined,
        });
      }
    } catch {
      // Photon injoignable : le point posé suffit, l'adresse restera muette.
    }
  }

  function handleRemovePin() {
    onChange({
      location: value.location,
      locationAddress: undefined,
      locationLat: undefined,
      locationLng: undefined,
      locationPlaceId: undefined,
    });
  }

  const isScanning = nearby.status === "locating" || nearby.status === "searching";

  return (
    <div className="locfield" ref={containerRef}>
      <label className="field field--wide">
        <span>{label}</span>
        <input
          value={value.location}
          onChange={(eventChange) => handleInput(eventChange.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
        />
      </label>
      {value.locationAddress && (
        <p className="locfield__picked">{value.locationAddress}</p>
      )}
      {isOpen && (
        <ul className="locfield__list" role="listbox">
          {suggestions.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                className="locfield__option"
                role="option"
                aria-selected="false"
                onClick={() => handleSelect(place)}
              >
                <span className="locfield__name">{place.name}</span>
                {place.address && <span className="locfield__addr">{place.address}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {nearby.status === "priming" ? (
        <div className="locfield__nearby-prime">
          <p className="locfield__nearby-prime-text">
            Pour lister les comptoirs autour de toi, la Confrérie a besoin de ta
            position. Elle reste sur ton téléphone : elle sert juste à
            interroger la carte OpenStreetMap, et ne part sur aucun serveur.
          </p>
          <div className="button-row">
            <button
              type="button"
              className="button button--ghost"
              onClick={handleNearbyScan}
            >
              Chercher autour de moi
            </button>
            <button
              type="button"
              className="ghost-link"
              onClick={() => setNearby({ status: "idle" })}
            >
              Laisse tomber
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="ghost-link locfield__nearby-toggle"
          onClick={handleNearbyPrime}
          disabled={isScanning}
        >
          {nearby.status === "locating"
            ? "On te situe…"
            : nearby.status === "searching"
              ? "On scanne le quartier…"
              : "Les rades autour de moi"}
        </button>
      )}

      {nearby.status === "error" && (
        <p className="locfield__nearby-note" role="alert">
          {nearby.message}
        </p>
      )}

      {nearby.status === "ready" &&
        (nearby.places.length === 0 ? (
          <p className="locfield__nearby-note" role="status">
            Aucun comptoir recensé à moins de 800 m. Soit le désert, soit une
            carte OpenStreetMap à compléter — la recherche reste là.
          </p>
        ) : (
          <ul className="locfield__nearby-list">
            {nearby.places.map((place) => (
              <li key={place.placeId}>
                <button
                  type="button"
                  className="locfield__option"
                  onClick={() => handleSelectNearby(place)}
                >
                  <span className="locfield__name">{place.name}</span>
                  <span className="locfield__addr">
                    {place.kind} · {formatDistance(place.distanceM)}
                    {place.address ? ` · ${place.address}` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ))}

      <button
        type="button"
        className="ghost-link locfield__pin-toggle"
        onClick={() => setIsPickerOpen((isShown) => !isShown)}
      >
        {isPickerOpen
          ? "Cacher la carte"
          : value.locationLat != null
            ? "Corriger le point sur la carte"
            : "Introuvable ? Pointe-le toi-même sur la carte"}
      </button>

      {isPickerOpen && (
        <div className="locpicker">
          <p className="hint">
            Clique sur la carte à l’endroit exact du rade, au pixel près si possible.
          </p>
          <LocationPickerMap
            lat={value.locationLat}
            lng={value.locationLng}
            onPick={handleMapPick}
          />
          {value.locationLat != null && (
            <button type="button" className="ghost-link" onClick={handleRemovePin}>
              Retirer le point
            </button>
          )}
        </div>
      )}
    </div>
  );
}
