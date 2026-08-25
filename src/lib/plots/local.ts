import type { PlotRecord } from "@/types";

export const PLOTS_STORAGE_KEY = "craterclaim-plots";

export function readLocalPlots(): PlotRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PLOTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PlotRecord[];
    return Array.isArray(parsed) ? parsed.filter((plot) => plot.status === "active") : [];
  } catch {
    return [];
  }
}

export function writeLocalPlots(plots: PlotRecord[]) {
  if (typeof window === "undefined") return;
  const slim = plots.map((plot) =>
    plot.logoUrl?.startsWith("data:")
      ? { ...plot, logoUrl: `/api/plots/${plot.id}/logo` }
      : plot,
  );
  window.localStorage.setItem(PLOTS_STORAGE_KEY, JSON.stringify(slim));
}

export function mergePlots(primary: PlotRecord[], secondary: PlotRecord[]) {
  const byId = new Map<string, PlotRecord>();
  for (const plot of [...secondary, ...primary]) {
    byId.set(plot.id, plot);
  }
  return [...byId.values()].sort((a, b) => {
    const aDate = a.claimDate ?? a.createdAt;
    const bDate = b.claimDate ?? b.createdAt;
    return bDate.localeCompare(aDate);
  });
}
