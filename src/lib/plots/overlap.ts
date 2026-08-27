import type { PlotRecord } from "@/types";

export function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function sameGeometry(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

export function findOverlappingPlot(
  rect: { x: number; y: number; width: number; height: number },
  plots: PlotRecord[],
) {
  return plots.find((plot) => rectsOverlap(rect, plot)) ?? null;
}

export function findPlotAtPixel(x: number, y: number, plots: PlotRecord[]) {
  return (
    plots.find(
      (plot) =>
        plot.status === "active" &&
        x >= plot.x &&
        x < plot.x + plot.width &&
        y >= plot.y &&
        y < plot.y + plot.height,
    ) ?? null
  );
}

/** Distance from a pixel to a plot rectangle. 0 if inside. */
function distanceToPlot(x: number, y: number, plot: PlotRecord) {
  const dx = x < plot.x ? plot.x - x : x >= plot.x + plot.width ? x - (plot.x + plot.width - 1) : 0;
  const dy = y < plot.y ? plot.y - y : y >= plot.y + plot.height ? y - (plot.y + plot.height - 1) : 0;
  return Math.hypot(dx, dy);
}

/** Prefer the exact cell, then the nearest active plot within `radius` grid pixels. */
export function findPlotNearPixel(x: number, y: number, plots: PlotRecord[], radius: number) {
  const exact = findPlotAtPixel(x, y, plots);
  if (exact) return exact;
  let best: PlotRecord | null = null;
  let bestDist = radius;
  for (const plot of plots) {
    if (plot.status !== "active") continue;
    const dist = distanceToPlot(x, y, plot);
    if (dist < bestDist) {
      bestDist = dist;
      best = plot;
    }
  }
  return best;
}
