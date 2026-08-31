"use client";

import { useEffect, useState } from "react";
import { PlotHydrator } from "@/components/plot/PlotHydrator";
import { LUNAR_FEATURES } from "@/lib/moon/regions";
import type { PlotRecord } from "@/types";

export function HomePlotLoader() {
  const [plots, setPlots] = useState<PlotRecord[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/plots")
      .then((res) => (res.ok ? res.json() : { plots: [] }))
      .then((data: { plots?: PlotRecord[] }) => {
        if (!cancelled) setPlots(data.plots ?? []);
      })
      .catch(() => {
        if (!cancelled) setPlots([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!plots) return null;
  return <PlotHydrator plots={plots} features={LUNAR_FEATURES} />;
}
