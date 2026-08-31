import { GRID_HEIGHT, GRID_WIDTH, latLngToPixel, pixelToLatLng } from "@/lib/moon/coordinates";
import { MIN_PLOT_SIZE } from "@/lib/moon/pricing";
import type { PlotRecord } from "@/types";

/** Plots authored on the 4000 × 1000 map before the 2M cut. */
export const LEGACY_GRID_WIDTH = 4000;
export const LEGACY_GRID_HEIGHT = 1000;
/** Plots currently stored in Supabase / local cache. */
export const AUTHORED_GRID_WIDTH = 2000;
export const AUTHORED_GRID_HEIGHT = 1000;
export const GRID_REVISION = 5;
export const GRID_REVISION_KEY = "craterclaim-grid-revision";

function snap(value: number) {
  return Math.round(value / MIN_PLOT_SIZE) * MIN_PLOT_SIZE;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function placeOnCurrentGrid(plot: PlotRecord, width: number, height: number): PlotRecord {
  const pixel = latLngToPixel(plot.centerLatitude, plot.centerLongitude);
  let x = clamp(snap(pixel.x - width / 2), 0, GRID_WIDTH - width);
  let y = clamp(snap(pixel.y - height / 2), 0, GRID_HEIGHT - height);

  if (x + width > GRID_WIDTH) {
    width = Math.max(MIN_PLOT_SIZE, snap(GRID_WIDTH - x));
    x = GRID_WIDTH - width;
  }
  if (y + height > GRID_HEIGHT) {
    height = Math.max(MIN_PLOT_SIZE, snap(GRID_HEIGHT - y));
    y = GRID_HEIGHT - height;
  }

  const center = pixelToLatLng(x + width / 2, y + height / 2);
  return {
    ...plot,
    x,
    y,
    width,
    height,
    pixelCount: width * height,
    centerLatitude: center.lat,
    centerLongitude: center.lng,
  };
}

/**
 * Keep the landing on the same mare/crater (lat/lng) and keep its purchased
 * pixel footprint. On a 1M grid that makes Riverra / Demure ~1.4× larger
 * on the idle globe without rewriting the deed.
 */
export function migratePlotToCurrentGrid(plot: PlotRecord): PlotRecord {
  const overflowedAuthored =
    plot.x + plot.width > AUTHORED_GRID_WIDTH || plot.y + plot.height > AUTHORED_GRID_HEIGHT;
  const overflowedCurrent = plot.x + plot.width > GRID_WIDTH || plot.y + plot.height > GRID_HEIGHT;

  let width = plot.width;
  let height = plot.height;

  if (overflowedAuthored) {
    width = (plot.width * AUTHORED_GRID_WIDTH) / LEGACY_GRID_WIDTH;
    height = (plot.height * AUTHORED_GRID_HEIGHT) / LEGACY_GRID_HEIGHT;
  }

  width = Math.max(MIN_PLOT_SIZE, snap(width));
  height = Math.max(MIN_PLOT_SIZE, snap(height));

  const implied = latLngToPixel(plot.centerLatitude, plot.centerLongitude);
  const centerX = plot.x + plot.width / 2;
  const centerY = plot.y + plot.height / 2;
  const onCurrentGrid =
    !overflowedCurrent &&
    Math.abs(implied.x - centerX) <= 2 &&
    Math.abs(implied.y - centerY) <= 2 &&
    plot.pixelCount === plot.width * plot.height &&
    width === plot.width &&
    height === plot.height;

  if (onCurrentGrid) return plot;

  return placeOnCurrentGrid(plot, width, height);
}

export function migratePlotsToCurrentGrid(plots: PlotRecord[]) {
  return plots.map(migratePlotToCurrentGrid);
}
