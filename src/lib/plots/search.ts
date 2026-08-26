import type { LunarFeature, PlotRecord } from "@/types";

export function normalizeQuery(query: string) {
  return query.trim().toLowerCase();
}

export function searchPlots(plots: PlotRecord[], query: string) {
  const q = normalizeQuery(query);
  if (!q) return plots;
  return plots.filter((plot) => {
    const hay = [plot.id, plot.name, plot.lunarFeature, plot.socialHandle, plot.websiteUrl]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function searchFeatures(features: LunarFeature[], query: string) {
  const q = normalizeQuery(query);
  if (!q) return features;
  return features.filter((feature) =>
    `${feature.name} ${feature.id} ${feature.type}`.toLowerCase().includes(q),
  );
}
