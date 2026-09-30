import { GRID_HEIGHT, GRID_WIDTH, pixelToLatLng, uvToLatLng } from "@/lib/moon/coordinates";
import type { LunarFeature, Zone } from "@/types";

/**
 * Well-known V1 destinations. Every named site is premium and glows gold.
 * Craters sit inside larger maria, so covering prefers the smallest radius.
 * Coordinates are approximate USGS values.
 */
export const LUNAR_FEATURES: LunarFeature[] = [
  {
    id: "tranquillitatis",
    name: "Mare Tranquillitatis",
    type: "mare",
    centerLat: 8.5,
    centerLng: 31.4,
    radiusDeg: 16,
    isPremium: true,
  },
  {
    id: "imbrium",
    name: "Mare Imbrium",
    type: "mare",
    centerLat: 32.8,
    centerLng: -15.6,
    radiusDeg: 18,
    isPremium: true,
  },
  {
    id: "serenitatis",
    name: "Mare Serenitatis",
    type: "mare",
    centerLat: 28.0,
    centerLng: 17.5,
    radiusDeg: 12,
    isPremium: true,
  },
  {
    id: "procellarum",
    name: "Oceanus Procellarum",
    type: "oceanus",
    centerLat: 18.4,
    centerLng: -57.4,
    radiusDeg: 22,
    isPremium: true,
  },
  {
    id: "tycho",
    name: "Tycho",
    type: "crater",
    centerLat: -43.3,
    centerLng: -11.2,
    radiusDeg: 7,
    isPremium: true,
  },
  {
    id: "copernicus",
    name: "Copernicus",
    type: "crater",
    centerLat: 9.62,
    centerLng: -20.08,
    radiusDeg: 7,
    isPremium: true,
  },
  {
    id: "aristarchus",
    name: "Aristarchus",
    type: "crater",
    centerLat: 23.7,
    centerLng: -47.4,
    radiusDeg: 6,
    isPremium: true,
  },
  {
    id: "south-pole",
    name: "South Pole",
    type: "pole",
    centerLat: -89.5,
    centerLng: 0,
    radiusDeg: 10,
    isPremium: true,
  },
  {
    id: "orientale",
    name: "Mare Orientale",
    type: "mare",
    centerLat: -19.4,
    centerLng: -92.8,
    radiusDeg: 10,
    isPremium: true,
  },
  {
    id: "moscoviense",
    name: "Mare Moscoviense",
    type: "mare",
    centerLat: 27.3,
    centerLng: 147.9,
    radiusDeg: 9,
    isPremium: true,
  },
  {
    id: "tsiolkovskiy",
    name: "Tsiolkovskiy",
    type: "crater",
    centerLat: -20.4,
    centerLng: 129.1,
    radiusDeg: 8,
    isPremium: true,
  },
  {
    id: "hertzsprung",
    name: "Hertzsprung",
    type: "crater",
    centerLat: 1.4,
    centerLng: -128.7,
    radiusDeg: 11,
    isPremium: true,
  },
  {
    id: "ingenii",
    name: "Mare Ingenii",
    type: "mare",
    centerLat: -33.7,
    centerLng: 163.5,
    radiusDeg: 8,
    isPremium: true,
  },
  {
    id: "korolev",
    name: "Korolev",
    type: "crater",
    centerLat: -4.0,
    centerLng: -157.4,
    radiusDeg: 10,
    isPremium: true,
  },
];

export function listDefaultFeatures() {
  return LUNAR_FEATURES;
}

export const PREMIUM_FEATURES = LUNAR_FEATURES.filter((feature) => feature.isPremium);

const DEG = Math.PI / 180;

function angularDistanceDeg(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const dLat = (lat2 - lat1) * DEG;
  const dLng = (lng2 - lng1) * DEG;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG) * Math.cos(lat2 * DEG) * Math.sin(dLng / 2) ** 2;
  return (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) / DEG;
}

export function nearestFeature(lat: number, lng: number, features: LunarFeature[] = LUNAR_FEATURES) {
  let closest = features[0] ?? LUNAR_FEATURES[0];
  let best = Number.POSITIVE_INFINITY;

  for (const feature of features) {
    const distance = angularDistanceDeg(lat, lng, feature.centerLat, feature.centerLng);
    if (distance < best) {
      best = distance;
      closest = feature;
    }
  }

  return closest;
}

export function featureCovering(lat: number, lng: number, features: LunarFeature[] = LUNAR_FEATURES) {
  let best: LunarFeature | undefined;
  for (const feature of features) {
    const distance = angularDistanceDeg(lat, lng, feature.centerLat, feature.centerLng);
    if (distance > feature.radiusDeg) continue;
    if (!best || feature.radiusDeg < best.radiusDeg) {
      best = feature;
    }
  }
  return best;
}

export function getFeatureById(id: string) {
  return LUNAR_FEATURES.find((feature) => feature.id === id);
}

/** Shortest signed longitude delta, in degrees, wrapped to (−180, 180]. */
function wrapLng(delta: number) {
  return ((((delta + 180) % 360) + 360) % 360) - 180;
}

/**
 * True when the feature's spherical disk touches the plot's lat/lng rectangle.
 * The rectangle is bounded by meridians and parallels and does not cross the
 * antimeridian; longitude is still compared on a circle so a disk near ±180
 * can meet a plot on the other side of the seam.
 */
function diskHitsRect(
  feature: LunarFeature,
  latMin: number,
  latMax: number,
  lngMin: number,
  lngMax: number,
) {
  const lat = Math.min(latMax, Math.max(latMin, feature.centerLat));
  const mid = (lngMin + lngMax) / 2;
  const lng = Math.min(lngMax, Math.max(lngMin, mid + wrapLng(feature.centerLng - mid)));
  return angularDistanceDeg(feature.centerLat, feature.centerLng, lat, lng) <= feature.radiusDeg;
}

/**
 * One zone for the whole plot. Premium when the center sits in a premium disk
 * or any part of the rectangle overlaps one — a large claim that covers a
 * premium site is premium even if its center is in open ground.
 * The name is the smallest premium disk covering the center, otherwise the
 * overlapping premium closest to the center, otherwise the nearest feature.
 */
export function classifyRect(
  x: number,
  y: number,
  width: number,
  height: number,
  features: LunarFeature[] = LUNAR_FEATURES,
): { feature: LunarFeature; zone: Zone } {
  const center = pixelToLatLng(x + width / 2, y + height / 2);
  const covering = featureCovering(center.lat, center.lng, features);

  const latMax = uvToLatLng(0, y / GRID_HEIGHT).lat;
  const latMin = uvToLatLng(0, (y + height) / GRID_HEIGHT).lat;
  const lngMin = uvToLatLng(x / GRID_WIDTH, 0).lng;
  const lngMax = uvToLatLng((x + width) / GRID_WIDTH, 0).lng;

  let closestPremium: LunarFeature | undefined;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const feature of features) {
    if (!feature.isPremium) continue;
    if (!diskHitsRect(feature, latMin, latMax, lngMin, lngMax)) continue;
    const distance = angularDistanceDeg(center.lat, center.lng, feature.centerLat, feature.centerLng);
    const closer =
      distance < closestDistance ||
      (distance === closestDistance && closestPremium !== undefined && feature.radiusDeg < closestPremium.radiusDeg);
    if (!closestPremium || closer) {
      closestPremium = feature;
      closestDistance = distance;
    }
  }

  if (covering?.isPremium) {
    return { feature: covering, zone: "premium" };
  }
  if (closestPremium) {
    return { feature: closestPremium, zone: "premium" };
  }

  return {
    feature: covering ?? nearestFeature(center.lat, center.lng, features),
    zone: "standard",
  };
}
