import { GRID_REVISION, GRID_REVISION_KEY, migratePlotsToCurrentGrid } from "@/lib/moon/grid";
import type { PlotRecord } from "@/types";

export const PLOTS_STORAGE_KEY = "craterclaim-plots";

export function readLocalPlots(): PlotRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PLOTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PlotRecord[];
    if (!Array.isArray(parsed)) return [];
    const revision = Number(window.localStorage.getItem(GRID_REVISION_KEY) ?? 1);
    const active = parsed.filter((plot) => plot.status === "active");
    const migrated = revision < GRID_REVISION ? migratePlotsToCurrentGrid(active) : active;
    if (revision < GRID_REVISION) {
      window.localStorage.setItem(GRID_REVISION_KEY, String(GRID_REVISION));
      writeLocalPlots(migrated);
    }
    return migrated;
  } catch {
    return [];
  }
}

const OWNED_KEY = "craterclaim-owned";

export function readOwnedIds() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(OWNED_KEY) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && /^CLM-\d{4}$/.test(id));
  } catch {
    return [];
  }
}

export function rememberOwnedId(id: string) {
  if (typeof window === "undefined" || !/^CLM-\d{4}$/.test(id)) return;
  const ids = readOwnedIds().filter((item) => item !== id);
  window.localStorage.setItem(OWNED_KEY, JSON.stringify([id, ...ids].slice(0, 50)));
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
