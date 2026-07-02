import { useEffect, useRef, useState } from "react";
import type { PlaceSuggestion } from "../utils/photonGeocoding";
import { searchPlaces } from "../utils/photonGeocoding";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;

export type LocationValue = {
  location: string;
  locationAddress?: string;
  locationLat?: number;
  locationLng?: number;
};

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
  const containerRef = useRef<HTMLDivElement>(null);
  // Coupe la recherche après un choix dans la liste : le texte change mais
  // ce n'est pas une frappe utilisateur.
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
    });
  }

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
    </div>
  );
}
