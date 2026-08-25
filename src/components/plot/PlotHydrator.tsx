"use client";

import { useEffect } from "react";
import { useMoonStore } from "@/lib/store/moon-store";
import type { PlotRecord } from "@/types";

export function PlotHydrator({ plots }: { plots: PlotRecord[] }) {
  const hydratePlots = useMoonStore((state) => state.hydratePlots);

  useEffect(() => {
    void useMoonStore.persist.rehydrate();
    hydratePlots(plots);
  }, [hydratePlots, plots]);

  return null;
}
