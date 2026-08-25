import type { PixelCoord, UV } from "@/types";

/**
 * Equirectangular lunar grid.
 * 2:1 aspect is the natural map projection. 4000 × 1000 = exactly 4,000,000 pixels.
 * Pixels do not represent equal physical area — polar cells cover less ground.
 */
export const GRID_WIDTH = 4000;
export const GRID_HEIGHT = 1000;

const DEG = Math.PI / 180;

export function latLngToUV(lat: number, lng: number): UV {
  const clampedLat = Math.max(-90, Math.min(90, lat));
  const wrappedLng = ((((lng + 180) % 360) + 360) % 360) - 180;
  return {
    u: (wrappedLng + 180) / 360,
    v: (90 - clampedLat) / 180,
  };
}

export function uvToLatLng(u: number, v: number) {
  return {
    lat: 90 - v * 180,
    lng: u * 360 - 180,
  };
}

export function uvToPixel(u: number, v: number): PixelCoord {
  return {
    x: Math.min(GRID_WIDTH - 1, Math.max(0, Math.floor(u * GRID_WIDTH))),
    y: Math.min(GRID_HEIGHT - 1, Math.max(0, Math.floor(v * GRID_HEIGHT))),
  };
}

export function latLngToPixel(lat: number, lng: number): PixelCoord {
  const { u, v } = latLngToUV(lat, lng);
  return uvToPixel(u, v);
}

export function pixelToLatLng(x: number, y: number) {
  return uvToLatLng((x + 0.5) / GRID_WIDTH, (y + 0.5) / GRID_HEIGHT);
}

export function formatLatLng(lat: number, lng: number) {
  const latHemisphere = lat >= 0 ? "N" : "S";
  const lngHemisphere = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(3)}° ${latHemisphere}   ${Math.abs(lng).toFixed(3)}° ${lngHemisphere}`;
}

/** Matches Three.js SphereGeometry vertex layout (Y-up, theta from +X). */
export function latLngToVector3(lat: number, lng: number, radius = 1) {
  const phi = (90 - lat) * DEG;
  const theta = (lng + 180) * DEG;
  const sinPhi = Math.sin(phi);

  return {
    x: -radius * sinPhi * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * sinPhi * Math.sin(theta),
  };
}
