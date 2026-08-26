import type { LunarFeature } from "@/types";

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
