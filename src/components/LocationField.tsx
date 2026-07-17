import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  // Overlay de recherche : le champ remonte en haut de l'écran, au-dessus du
  // clavier, pour que le menu déroulant (et son squelette) reste visible — sinon
  // les suggestions ancrées sous le champ tombent derrière le clavier mobile.
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Requête Photon en vol : pilote le squelette du menu déroulant, qui rend la
  // complétion auto lisible dès la première frappe (avant même les résultats).
  const [isSearching, setIsSearching] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [nearby, setNearby] = useState<NearbyState>({ status: "idle" });
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayInputRef = useRef<HTMLInputElement>(null);
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
      setIsSearching(false);
      return;
    }

    // On allume le squelette dès la frappe (avant le debounce) : la sensation de
    // complétion auto est immédiate, pas suspendue au délai réseau.
    setIsSearching(true);
    const abortController = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const places = await searchPlaces(query, abortController.signal);
        setSuggestions(places);
      } catch {
        // Photon injoignable : la saisie libre reste souveraine, on se tait.
      } finally {
        // La requête annulée (frappe suivante) ne doit pas éteindre le squelette
        // de la requête en cours — sinon clignotement.
        if (!abortController.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      abortController.abort();
      window.clearTimeout(timer);
    };
  }, [value.location]);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    function handleKeyDown(keyEvent: KeyboardEvent) {
      if (keyEvent.key === "Escape") {
        setIsSearchOpen(false);
      }
    }

    // On fige le défilement du fond pendant que l'overlay occupe l'écran.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchOpen]);

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
    setIsSearchOpen(false);
    setIsSearching(false);
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
          onFocus={() => setIsSearchOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={isSearchOpen}
          aria-autocomplete="list"
        />
      </label>
      {value.locationAddress && (
        <p className="locfield__picked">{value.locationAddress}</p>
      )}

      {isSearchOpen &&
        createPortal(
          <div
            className="locsearch"
            role="dialog"
            aria-modal="true"
            aria-label="Recherche du lieu"
          >
            <button
              type="button"
              className="locsearch__scrim"
              aria-label="Fermer la recherche"
              onClick={() => setIsSearchOpen(false)}
            />
            <div className="locsearch__panel">
              <div className="locsearch__bar">
                <button
                  type="button"
                  className="locsearch__back"
                  aria-label="Retour"
                  onClick={() => setIsSearchOpen(false)}
                >
                  ←
                </button>
                <input
                  ref={overlayInputRef}
                  className="locsearch__input"
                  value={value.location}
                  onChange={(eventChange) => handleInput(eventChange.target.value)}
                  placeholder={placeholder}
                  autoComplete="off"
                  autoFocus
                  role="combobox"
                  aria-expanded={suggestions.length > 0}
                  aria-autocomplete="list"
                />
                {value.location.length > 0 && (
                  <button
                    type="button"
                    className="locsearch__clear"
                    aria-label="Effacer"
                    onClick={() => {
                      handleInput("");
                      overlayInputRef.current?.focus();
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="locsearch__results">
                {value.location.trim().length < MIN_QUERY_LENGTH ? (
                  <p className="locsearch__hint">
                    Tape le nom du rade (au moins {MIN_QUERY_LENGTH} lettres) — les
                    suggestions s’affichent ici au fil de ta saisie.
                  </p>
                ) : isSearching ? (
                  <ul className="locsearch__list locsearch__list--skeleton" aria-hidden="true">
                    {[0, 1, 2, 3].map((row) => (
                      <li key={row} className="locsearch__skel">
                        <span className="locsearch__skel-line locsearch__skel-line--name" />
                        <span className="locsearch__skel-line locsearch__skel-line--addr" />
                      </li>
                    ))}
                  </ul>
                ) : suggestions.length > 0 ? (
                  <ul className="locsearch__list" role="listbox">
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
                          {place.address && (
                            <span className="locfield__addr">{place.address}</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="locsearch__hint">
                    Aucun lieu trouvé. Ferme la recherche pour le pointer toi-même
                    sur la carte.
                  </p>
                )}
              </div>
            </div>
          </div>,
          document.body,
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
