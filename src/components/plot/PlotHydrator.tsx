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
    void useMoonStore.persist.rehydrate();
    hydratePlots(plots);
    if (features) hydrateFeatures(features);
  }, [features, hydrateFeatures, hydratePlots, plots]);

  return null;
}
