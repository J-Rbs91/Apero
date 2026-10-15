// Géocodage via l'API publique Photon (komoot), basée sur OpenStreetMap.
// Gratuite, sans clé, compatible CORS — parfaite pour une app sans backend.
const PHOTON_SEARCH_ENDPOINT = "https://photon.komoot.io/api/";
const PHOTON_REVERSE_ENDPOINT = "https://photon.komoot.io/reverse";

export type PlaceSuggestion = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  // Référence OSM stable (« node/123 ») quand Photon la fournit : permet de
  // normaliser le lieu choisi, comme les résultats « Autour de moi ».
  placeId?: string;
};

// Photon abrège le type OSM (« N », « W », « R ») : on le déplie vers la
// forme canonique utilisée partout ailleurs (node/way/relation).
const PHOTON_OSM_TYPES: Record<string, string> = {
  N: "node",
  W: "way",
  R: "relation",
};

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    osm_id?: number;
    osm_type?: string;
    name?: string;
    housenumber?: string;
    street?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    country?: string;
  };
};

function buildAddress(properties: NonNullable<PhotonFeature["properties"]>): string {
  const streetLine = [properties.housenumber, properties.street].filter(Boolean).join(" ");
  const cityLine = [properties.postcode, properties.city ?? properties.town ?? properties.village]
    .filter(Boolean)
    .join(" ");

  return [streetLine, cityLine, properties.country === "France" ? undefined : properties.country]
    .filter(Boolean)
    .join(", ");
}

function parseFeature(feature: PhotonFeature, fallbackIndex: number): PlaceSuggestion | undefined {
  const properties = feature.properties;
  const coordinates = feature.geometry?.coordinates;

  // L'API Photon est externe : on ne fait pas confiance à la forme des données.
  // Un couple mal formé (tableau trop court, valeurs non numériques, hors bornes)
  // produirait un marqueur ou un lien cartes cassé — on l'écarte.
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return undefined;
  }

  const [lng, lat] = coordinates;

  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return undefined;
  }
  const address = properties ? buildAddress(properties) : "";
  const name = properties?.name || properties?.street || address || "Position choisie";
  const osmType = properties?.osm_type ? PHOTON_OSM_TYPES[properties.osm_type] : undefined;
  const placeId =
    osmType && typeof properties?.osm_id === "number" && Number.isFinite(properties.osm_id)
      ? `${osmType}/${properties.osm_id}`
      : undefined;

  return {
    id: `${properties?.osm_type ?? "X"}${properties?.osm_id ?? fallbackIndex}`,
    name,
    address,
    lat,
    lng,
    ...(placeId ? { placeId } : {}),
  };
}

export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    lang: "fr",
    limit: "6",
  });

  const response = await fetch(`${PHOTON_SEARCH_ENDPOINT}?${params.toString()}`, { signal });

  if (!response.ok) {
    throw new Error(`Photon a renvoyé ${response.status}.`);
  }

  const payload = (await response.json()) as { features?: PhotonFeature[] };
  const suggestions: PlaceSuggestion[] = [];

  for (const feature of payload.features ?? []) {
    if (!feature.properties?.name) {
      continue;
    }

    const suggestion = parseFeature(feature, suggestions.length);
    if (suggestion) {
      suggestions.push(suggestion);
    }
  }

  return suggestions;
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<PlaceSuggestion | null> {
  const params = new URLSearchParams({
    lon: String(lng),
    lat: String(lat),
    lang: "fr",
  });

  const response = await fetch(`${PHOTON_REVERSE_ENDPOINT}?${params.toString()}`, { signal });

  if (!response.ok) {
    throw new Error(`Photon a renvoyé ${response.status}.`);
  }

  const payload = (await response.json()) as { features?: PhotonFeature[] };
  const feature = payload.features?.[0];

  return feature ? parseFeature(feature, 0) ?? null : null;
}
