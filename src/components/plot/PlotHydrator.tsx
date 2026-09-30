"use client";

import { useEffect, useLayoutEffect } from "react";
import { useMoonStore } from "@/lib/store/moon-store";
import type { BodyId, LunarFeature, PlotRecord } from "@/types";

export function PlotHydrator({
  plots,
  features,
  body = "moon",
}: {
  plots: PlotRecord[];
  features?: LunarFeature[];
  body?: BodyId;
}) {
  const hydratePlots = useMoonStore((state) => state.hydratePlots);
  const hydrateFeatures = useMoonStore((state) => state.hydrateFeatures);
  const setBody = useMoonStore((state) => state.setBody);

  useLayoutEffect(() => {
    setBody(body);
    hydratePlots(plots, body);
    if (features) hydrateFeatures(features);
  }, [body, features, hydrateFeatures, hydratePlots, plots, setBody]);

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve(useMoonStore.persist.rehydrate()).then(() => {
      if (cancelled) return;
      setBody(body);
      hydratePlots(plots, body);
      if (features) hydrateFeatures(features);
    });
    return () => {
      cancelled = true;
    };
  }, [body, features, hydrateFeatures, hydratePlots, plots, setBody]);

  return null;
}
