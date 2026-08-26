import { GRID_HEIGHT, GRID_WIDTH, pixelToLatLng } from "@/lib/moon/coordinates";
import { calculatePrice, MIN_PLOT_SIZE } from "@/lib/moon/pricing";
import { featureCovering, LUNAR_FEATURES, nearestFeature } from "@/lib/moon/regions";
import type { LunarFeature, PlotSelection, Zone } from "@/types";

export const SNAP = MIN_PLOT_SIZE;

export function snapDown(value: number, size = SNAP) {
  return Math.floor(value / size) * size;
}

export function snapUp(value: number, size = SNAP) {
  return Math.ceil(value / size) * size;
}

export function clampPixel(x: number, y: number) {
  return {
    x: Math.min(GRID_WIDTH - 1, Math.max(0, x)),
    y: Math.min(GRID_HEIGHT - 1, Math.max(0, y)),
  };
}

export function rectFromCorners(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  features: LunarFeature[] = LUNAR_FEATURES,
): PlotSelection {
  const a = clampPixel(startX, startY);
  const b = clampPixel(endX, endY);

  let left = snapDown(Math.min(a.x, b.x));
  let top = snapDown(Math.min(a.y, b.y));
  let right = snapUp(Math.max(a.x, b.x) + 1);
  let bottom = snapUp(Math.max(a.y, b.y) + 1);

  if (right - left < SNAP) right = left + SNAP;
  if (bottom - top < SNAP) bottom = top + SNAP;
  if (right > GRID_WIDTH) {
    left = Math.max(0, GRID_WIDTH - SNAP);
    right = GRID_WIDTH;
  }
  if (bottom > GRID_HEIGHT) {
    top = Math.max(0, GRID_HEIGHT - SNAP);
    bottom = GRID_HEIGHT;
  }

  const width = right - left;
  const height = bottom - top;
  const pixelCount = width * height;
  const center = pixelToLatLng(left + width / 2, top + height / 2);
  const covering = featureCovering(center.lat, center.lng, features);
  const feature = covering ?? nearestFeature(center.lat, center.lng, features);
  const zone: Zone = covering?.isPremium ? "premium" : "standard";

  return {
    x: left,
    y: top,
    width,
    height,
    pixelCount,
    centerLat: center.lat,
    centerLng: center.lng,
    featureName: feature.name,
    zone,
    price: calculatePrice(pixelCount, zone),
  };
}
