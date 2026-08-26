import { GRID_HEIGHT, GRID_WIDTH, pixelToLatLng } from "@/lib/moon/coordinates";
import { MIN_PLOT_SIZE } from "@/lib/moon/pricing";
import type { PlotRecord } from "@/types";

export const LEGACY_GRID_WIDTH = 4000;
export const LEGACY_GRID_HEIGHT = 1000;
export const GRID_REVISION = 4;
export const GRID_REVISION_KEY = "craterclaim-grid-revision";

function snap(value: number) {
  return Math.round(value / MIN_PLOT_SIZE) * MIN_PLOT_SIZE;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function migratePlotToCurrentGrid(plot: PlotRecord): PlotRecord {
  const legacy = plot.x + plot.width > GRID_WIDTH || plot.y + plot.height > GRID_HEIGHT;
  let x = plot.x;
  let y = plot.y;
  let width = plot.width;
  let height = plot.height;

  if (legacy) {
    x = (plot.x * GRID_WIDTH) / LEGACY_GRID_WIDTH;
    y = (plot.y * GRID_HEIGHT) / LEGACY_GRID_HEIGHT;
    width = (plot.width * GRID_WIDTH) / LEGACY_GRID_WIDTH;
    height = (plot.height * GRID_HEIGHT) / LEGACY_GRID_HEIGHT;
  }

  x = clamp(snap(x), 0, GRID_WIDTH - MIN_PLOT_SIZE);
  y = clamp(snap(y), 0, GRID_HEIGHT - MIN_PLOT_SIZE);
  width = Math.max(MIN_PLOT_SIZE, snap(width));
  height = Math.max(MIN_PLOT_SIZE, snap(height));

  if (x + width > GRID_WIDTH) {
    width = Math.max(MIN_PLOT_SIZE, snap(GRID_WIDTH - x));
    x = GRID_WIDTH - width;
  }
  if (y + height > GRID_HEIGHT) {
    height = Math.max(MIN_PLOT_SIZE, snap(GRID_HEIGHT - y));
    y = GRID_HEIGHT - height;
  }

  if (
    x === plot.x &&
    y === plot.y &&
    width === plot.width &&
    height === plot.height &&
    plot.pixelCount === width * height
  ) {
    return plot;
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

export function migratePlotsToCurrentGrid(plots: PlotRecord[]) {
  return plots.map(migratePlotToCurrentGrid);
}
