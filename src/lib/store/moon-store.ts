import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mergePlots, readLocalPlots, writeLocalPlots } from "@/lib/plots/local";
import type { LandingMode, PlotRecord, PlotSelection } from "@/types";

interface MoonState {
  isInteracting: boolean;
  hasUserInteracted: boolean;
  isExploring: boolean;
  selectionMode: boolean;
  selection: PlotSelection | null;
  plots: PlotRecord[];
  landingPlotId: string | null;
  landingMode: LandingMode;
  landingCinematic: boolean;
  setInteracting: (v: boolean) => void;
  markUserInteracted: () => void;
  enterExploreMode: () => void;
  enterSelectMode: () => void;
  exitSelectMode: () => void;
  setSelection: (selection: PlotSelection | null) => void;
  hydratePlots: (plots: PlotRecord[]) => void;
  rememberPlot: (plot: PlotRecord) => void;
  startLanding: (plotId: string, cinematic?: boolean) => void;
  setLandingMode: (mode: LandingMode) => void;
  skipLanding: () => void;
  clearLanding: () => void;
}

export const useMoonStore = create<MoonState>()(
  persist(
    (set, get) => ({
      isInteracting: false,
      hasUserInteracted: false,
      isExploring: false,
      selectionMode: false,
      selection: null,
      plots: [],
      landingPlotId: null,
      landingMode: "idle",
      landingCinematic: false,
      setInteracting: (v) => set({ isInteracting: v }),
      markUserInteracted: () => set({ hasUserInteracted: true }),
      enterExploreMode: () =>
        set({
          isExploring: true,
          hasUserInteracted: true,
          selectionMode: false,
        }),
      enterSelectMode: () =>
        set({
          isExploring: true,
          hasUserInteracted: true,
          selectionMode: true,
          selection: null,
        }),
      exitSelectMode: () => set({ selectionMode: false, selection: null }),
      setSelection: (selection) => set({ selection }),
      hydratePlots: (plots) => {
        const merged = mergePlots(plots, mergePlots(get().plots, readLocalPlots()));
        writeLocalPlots(merged);
        set({ plots: merged });
      },
      rememberPlot: (plot) => {
        const merged = mergePlots([plot], mergePlots(get().plots, readLocalPlots()));
        writeLocalPlots(merged);
        set({ plots: merged, selection: null, selectionMode: false });
      },
      startLanding: (plotId, cinematic = true) =>
        set({
          isExploring: true,
          hasUserInteracted: true,
          selectionMode: false,
          landingPlotId: plotId,
          landingMode: cinematic ? "confirmed" : "flying",
          landingCinematic: cinematic,
        }),
      setLandingMode: (landingMode) => set({ landingMode }),
      skipLanding: () => set({ landingMode: "arrived", landingCinematic: false }),
      clearLanding: () =>
        set({
          landingPlotId: null,
          landingMode: "idle",
          landingCinematic: false,
        }),
    }),
    {
      name: "craterclaim-selection",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ selection: state.selection }),
      skipHydration: true,
    },
  ),
);
