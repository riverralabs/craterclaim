import type { PlotRecord } from "@/types";

export function firstLanding(plots: PlotRecord[]) {
  const active = plots.filter((plot) => plot.status === "active");
  if (active.length === 0) return null;
  return [...active].sort((a, b) =>
    (a.claimDate ?? a.createdAt).localeCompare(b.claimDate ?? b.createdAt),
  )[0];
}
