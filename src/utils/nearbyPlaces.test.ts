import { describe, expect, it } from "vitest";
import { formatDistance, haversineDistanceM, parseNearbyPlaces } from "./nearbyPlaces";

// Position d'origine : le parvis de Notre-Dame, comme tout bon point zéro.
const ORIGIN = { lat: 48.853, lng: 2.3499 };

function overpassNode(overrides: Record<string, unknown> = {}) {
  return {
    type: "node",
    id: 123,
    lat: 48.8535,
    lon: 2.3505,
    tags: { amenity: "bar", name: "Le Zinc Doré", "addr:street": "Rue de la Soif" },
    ...overrides,
  };
}

describe("haversineDistanceM", () => {
  it("donne zéro pour deux points identiques", () => {
    expect(haversineDistanceM(ORIGIN.lat, ORIGIN.lng, ORIGIN.lat, ORIGIN.lng)).toBe(0);
  });

  it("retrouve l'ordre de grandeur Paris-Marseille (~660 km)", () => {
    const distance = haversineDistanceM(48.8566, 2.3522, 43.2965, 5.3698);
    expect(distance).toBeGreaterThan(640_000);
    expect(distance).toBeLessThan(680_000);
  });
});

describe("formatDistance", () => {
  it("arrondit les mètres à la dizaine, plancher à 10 m", () => {
    expect(formatDistance(3)).toBe("10 m");
    expect(formatDistance(87)).toBe("90 m");
    expect(formatDistance(640)).toBe("640 m");
  });

  it("passe en kilomètres avec virgule française au-delà de 1 km", () => {
    expect(formatDistance(1234)).toBe("1,2 km");
  });
});

describe("parseNearbyPlaces", () => {
  it("parse un node complet avec sa référence OSM et son adresse", () => {
    const places = parseNearbyPlaces({ elements: [overpassNode()] }, ORIGIN.lat, ORIGIN.lng);

    expect(places).toHaveLength(1);
    expect(places[0]).toMatchObject({
      placeId: "node/123",
      name: "Le Zinc Doré",
      kind: "Bar",
      address: "Rue de la Soif",
    });
    expect(places[0].distanceM).toBeGreaterThan(0);
    expect(places[0].distanceM).toBeLessThan(200);
  });

  it("lit les coordonnées d'un way sur son centre", () => {
    const way = {
      type: "way",
      id: 456,
      center: { lat: 48.854, lon: 2.351 },
      tags: { amenity: "restaurant", name: "Chez Dédé" },
    };
    const places = parseNearbyPlaces({ elements: [way] }, ORIGIN.lat, ORIGIN.lng);

    expect(places).toHaveLength(1);
    expect(places[0].placeId).toBe("way/456");
    expect(places[0].kind).toBe("Restaurant");
  });

  it("écarte les établissements sans nom, sans coordonnées valides ou d'un type inconnu", () => {
    const elements = [
      overpassNode({ tags: { amenity: "bar" } }), // sans nom
      overpassNode({ id: 2, lat: 999, lon: 2.35 }), // latitude impossible
      overpassNode({ id: 3, lat: undefined, lon: undefined, center: undefined }), // sans coordonnées
      overpassNode({ id: 4, tags: { amenity: "parking", name: "Parking du Marché" } }), // pas un comptoir
      overpassNode({ id: 5, tags: { amenity: "bar", name: "  " } }), // nom vide après trim
    ];
    expect(parseNearbyPlaces({ elements }, ORIGIN.lat, ORIGIN.lng)).toHaveLength(0);
  });

  it("trie par distance croissante et déduplique par référence OSM", () => {
    const elements = [
      overpassNode({ id: 10, lat: 48.859, lon: 2.355, tags: { amenity: "bar", name: "Le Lointain" } }),
      overpassNode({ id: 11, tags: { amenity: "cafe", name: "Le Tout Proche" } }),
      overpassNode({ id: 11, tags: { amenity: "cafe", name: "Le Tout Proche (doublon)" } }),
    ];
    const places = parseNearbyPlaces({ elements }, ORIGIN.lat, ORIGIN.lng);

    expect(places.map((place) => place.name)).toEqual(["Le Tout Proche", "Le Lointain"]);
  });

  it("rend une liste vide sur une réponse malformée", () => {
    expect(parseNearbyPlaces(null, ORIGIN.lat, ORIGIN.lng)).toEqual([]);
    expect(parseNearbyPlaces({}, ORIGIN.lat, ORIGIN.lng)).toEqual([]);
    expect(parseNearbyPlaces({ elements: "pas un tableau" }, ORIGIN.lat, ORIGIN.lng)).toEqual([]);
  });
});
