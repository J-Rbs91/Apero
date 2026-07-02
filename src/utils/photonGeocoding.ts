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

  if (!coordinates) {
    return undefined;
  }

  const [lng, lat] = coordinates;
  const address = properties ? buildAddress(properties) : "";
  const name = properties?.name || properties?.street || address || "Position choisie";

  return {
    id: `${properties?.osm_type ?? "X"}${properties?.osm_id ?? fallbackIndex}`,
    name,
    address,
    lat,
    lng,
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
