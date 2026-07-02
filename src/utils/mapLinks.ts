export type MapLinkTarget = {
  label: string;
  address?: string;
  lat?: number;
  lng?: number;
};

export type MapLink = {
  key: string;
  label: string;
  url: string;
};

function destinationQuery(target: MapLinkTarget): string {
  if (target.lat != null && target.lng != null) {
    return `${target.lat},${target.lng}`;
  }
  return target.address || target.label;
}

export function buildMapLinks(target: MapLinkTarget): MapLink[] {
  const hasCoords = target.lat != null && target.lng != null;
  const encodedQuery = encodeURIComponent(destinationQuery(target));

  const links: MapLink[] = [
    {
      key: "google",
      label: "Google Maps",
      url: `https://www.google.com/maps/dir/?api=1&destination=${encodedQuery}`,
    },
    {
      key: "waze",
      label: "Waze",
      url: hasCoords
        ? `https://waze.com/ul?ll=${target.lat},${target.lng}&navigate=yes`
        : `https://waze.com/ul?q=${encodedQuery}&navigate=yes`,
    },
    {
      key: "apple",
      label: "Plans (Apple)",
      url: `https://maps.apple.com/?daddr=${encodedQuery}`,
    },
  ];

  if (hasCoords) {
    links.push({
      key: "osm",
      label: "OpenStreetMap",
      url: `https://www.openstreetmap.org/?mlat=${target.lat}&mlon=${target.lng}#map=17/${target.lat}/${target.lng}`,
    });
  }

  return links;
}

export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
