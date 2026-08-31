"use client";

import { useEffect } from "react";
import { useMoonStore } from "@/lib/store/moon-store";
import type { LunarFeature, PlotRecord } from "@/types";

export function PlotHydrator({
  plots,
  features,
}: {
  plots: PlotRecord[];
  features?: LunarFeature[];
}) {
  const hydratePlots = useMoonStore((state) => state.hydratePlots);
  const hydrateFeatures = useMoonStore((state) => state.hydrateFeatures);

  useEffect(() => {
    hydratePlots(plots);
    if (features) hydrateFeatures(features);
    let cancelled = false;
    void Promise.resolve(useMoonStore.persist.rehydrate()).then(() => {
      if (cancelled) return;
      hydratePlots(plots);
      if (features) hydrateFeatures(features);
    });
    return () => {
      cancelled = true;
    };
  }, [features, hydrateFeatures, hydratePlots, plots]);

  return null;
}
