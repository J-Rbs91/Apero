// « Autour de moi » : bars, cafés et restaurants proches d'une position, via
// l'API publique Overpass (OpenStreetMap). Gratuite, sans clé, compatible
// CORS — même philosophie que Photon : la géolocalisation reste dans le
// navigateur, aucun serveur de la Confrérie ne voit où se trouve le convive.
const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";

// Rayon de comptoir : au-delà de 800 m, ce n'est plus « autour de moi »,
// c'est une expédition.
export const NEARBY_RADIUS_M = 800;
const MAX_RESULTS = 25;

// Les amenities OSM qui savent servir un apéro.
const AMENITY_LABELS: Record<string, string> = {
  bar: "Bar",
  pub: "Pub",
  cafe: "Café",
  restaurant: "Restaurant",
  biergarten: "Biergarten",
};

export type NearbyPlace = {
  // Référence OSM stable (« node/123 ») : la clé de normalisation des lieux.
  placeId: string;
  name: string;
  // Libellé humain du type d'établissement (Bar, Restaurant…).
  kind: string;
  address: string;
  lat: number;
  lng: number;
  distanceM: number;
};

type OverpassElement = {
  type?: string;
  id?: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

const EARTH_RADIUS_M = 6_371_000;

export function haversineDistanceM(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

export function formatDistance(distanceM: number): string {
  if (distanceM < 1000) {
    // Arrondi à 10 m : la précision au mètre près est un mensonge de GPS.
    return `${Math.max(10, Math.round(distanceM / 10) * 10)} m`;
  }
  return `${(distanceM / 1000).toFixed(1).replace(".", ",")} km`;
}

function buildAddress(tags: Record<string, string>): string {
  const streetLine = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  const cityLine = [tags["addr:postcode"], tags["addr:city"]].filter(Boolean).join(" ");
  return [streetLine, cityLine].filter(Boolean).join(", ");
}

function parseCoordinates(lat: unknown, lng: unknown): { lat: number; lng: number } | null {
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
    return null;
  }
  return { lat, lng };
}

// L'API Overpass est externe : on ne fait pas confiance à la forme des
// données. Sans nom, sans coordonnées valides ou sans type reconnu, un
// élément est écarté plutôt que de produire une carte ou un lien cassé.
export function parseNearbyPlaces(
  payload: unknown,
  originLat: number,
  originLng: number,
): NearbyPlace[] {
  const elements = (payload as { elements?: OverpassElement[] } | null)?.elements;
  if (!Array.isArray(elements)) {
    return [];
  }

  const places: NearbyPlace[] = [];
  const seenIds = new Set<string>();

  for (const element of elements) {
    const tags = element.tags;
    const name = tags?.name?.trim();
    const kind = tags?.amenity ? AMENITY_LABELS[tags.amenity] : undefined;
    if (!tags || !name || !kind || typeof element.id !== "number" || !element.type) {
      continue;
    }

    // Un node porte ses coordonnées ; un way/relation expose son centre.
    const coordinates = parseCoordinates(
      element.lat ?? element.center?.lat,
      element.lon ?? element.center?.lon,
    );
    if (!coordinates) {
      continue;
    }

    const placeId = `${element.type}/${element.id}`;
    if (seenIds.has(placeId)) {
      continue;
    }
    seenIds.add(placeId);

    places.push({
      placeId,
      name,
      kind,
      address: buildAddress(tags),
      lat: coordinates.lat,
      lng: coordinates.lng,
      distanceM: haversineDistanceM(originLat, originLng, coordinates.lat, coordinates.lng),
    });
  }

  return places.sort((a, b) => a.distanceM - b.distanceM).slice(0, MAX_RESULTS);
}

export async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<NearbyPlace[]> {
  const amenities = Object.keys(AMENITY_LABELS).join("|");
  const query = `[out:json][timeout:10];nwr(around:${NEARBY_RADIUS_M},${lat},${lng})["amenity"~"^(${amenities})$"]["name"];out center tags 60;`;

  const response = await fetch(OVERPASS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
    signal,
  });

  if (!response.ok) {
    throw new Error(`Overpass a renvoyé ${response.status}.`);
  }

  return parseNearbyPlaces(await response.json(), lat, lng);
}
