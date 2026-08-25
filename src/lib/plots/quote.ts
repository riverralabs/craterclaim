import { GRID_HEIGHT, GRID_WIDTH, pixelToLatLng } from "@/lib/moon/coordinates";
import { calculatePrice, MIN_PLOT_SIZE } from "@/lib/moon/pricing";
import { featureCovering, nearestFeature } from "@/lib/moon/regions";
import { SNAP } from "@/lib/moon/selection";
import type { PlotSelection } from "@/types";

export class QuoteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuoteError";
  }
}

export function quoteGeometry(input: {
  x: number;
  y: number;
  width: number;
  height: number;
}): PlotSelection {
  const { x, y, width, height } = input;

  if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(width) || !Number.isInteger(height)) {
    throw new QuoteError("Plot coordinates must be integers.");
  }
  if (x < 0 || y < 0 || x + width > GRID_WIDTH || y + height > GRID_HEIGHT) {
    throw new QuoteError("Plot is outside the lunar grid.");
  }
  if (width < MIN_PLOT_SIZE || height < MIN_PLOT_SIZE) {
    throw new QuoteError("Minimum plot size is 10 × 10.");
  }
  if (width % SNAP !== 0 || height % SNAP !== 0 || x % SNAP !== 0 || y % SNAP !== 0) {
    throw new QuoteError("Plots must snap to 10 × 10 blocks.");
  }

  const pixelCount = width * height;
  const center = pixelToLatLng(x + width / 2, y + height / 2);
  const covering = featureCovering(center.lat, center.lng);
  const feature = covering ?? nearestFeature(center.lat, center.lng);
  const zone = covering?.isPremium ? "premium" : "standard";

  return {
    x,
    y,
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
