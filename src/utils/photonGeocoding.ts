// Géocodage via l'API publique Photon (komoot), basée sur OpenStreetMap.
// Gratuite, sans clé, compatible CORS — parfaite pour une app sans backend.
const PHOTON_ENDPOINT = "https://photon.komoot.io/api/";

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

export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    q: query,
    lang: "fr",
    limit: "6",
  });

  const response = await fetch(`${PHOTON_ENDPOINT}?${params.toString()}`, { signal });

  if (!response.ok) {
    throw new Error(`Photon a renvoyé ${response.status}.`);
  }

  const payload = (await response.json()) as { features?: PhotonFeature[] };
  const suggestions: PlaceSuggestion[] = [];

  for (const feature of payload.features ?? []) {
    const properties = feature.properties;
    const coordinates = feature.geometry?.coordinates;

    if (!properties?.name || !coordinates) {
      continue;
    }

    const [lng, lat] = coordinates;
    suggestions.push({
      id: `${properties.osm_type ?? "X"}${properties.osm_id ?? suggestions.length}`,
      name: properties.name,
      address: buildAddress(properties),
      lat,
      lng,
    });
  }

  return suggestions;
}
