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

export function findOverlappingPlot(
  rect: { x: number; y: number; width: number; height: number },
  plots: PlotRecord[],
) {
  return plots.find((plot) => rectsOverlap(rect, plot)) ?? null;
}
