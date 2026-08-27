import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mergePlots, readLocalPlots, writeLocalPlots } from "@/lib/plots/local";
import { migratePlotsToCurrentGrid } from "@/lib/moon/grid";
import { LUNAR_FEATURES } from "@/lib/moon/regions";
import type { LandingMode, LunarFeature, PlotRecord, PlotSelection } from "@/types";

interface MoonState {
  isInteracting: boolean;
  hasUserInteracted: boolean;
  isExploring: boolean;
  selectionMode: boolean;
  selection: PlotSelection | null;
  plots: PlotRecord[];
  features: LunarFeature[];
  landingPlotId: string | null;
  hoverPlotId: string | null;
  landingMode: LandingMode;
  landingCinematic: boolean;
  landingAsOwner: boolean;
  viewResetAt: number;
  setInteracting: (v: boolean) => void;
  setHoverPlot: (plotId: string | null) => void;
  markUserInteracted: () => void;
  enterExploreMode: () => void;
  enterSelectMode: () => void;
  exitSelectMode: () => void;
  setSelection: (selection: PlotSelection | null) => void;
  hydratePlots: (plots: PlotRecord[]) => void;
  hydrateFeatures: (features: LunarFeature[]) => void;
  rememberPlot: (plot: PlotRecord) => void;
  startLanding: (plotId: string, cinematic?: boolean) => void;
  setLandingMode: (mode: LandingMode) => void;
  skipLanding: () => void;
  clearLanding: () => void;
  resetView: () => void;
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
      features: LUNAR_FEATURES,
      landingPlotId: null,
      hoverPlotId: null,
      landingMode: "idle",
      landingCinematic: false,
      landingAsOwner: false,
      viewResetAt: 0,
      setInteracting: (v) => set({ isInteracting: v }),
      setHoverPlot: (plotId) => {
        if (get().hoverPlotId === plotId) return;
        set({ hoverPlotId: plotId });
      },
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
          hoverPlotId: null,
        }),
      exitSelectMode: () => set({ selectionMode: false, selection: null }),
      setSelection: (selection) => set({ selection }),
      hydratePlots: (plots) => {
        const merged = mergePlots(
          migratePlotsToCurrentGrid(plots),
          mergePlots(get().plots, readLocalPlots()),
        );
        writeLocalPlots(merged);
        set({ plots: merged });
      },
      hydrateFeatures: (features) => set({ features }),
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
          hoverPlotId: null,
          landingPlotId: plotId,
          landingMode: cinematic ? "confirmed" : "flying",
          landingCinematic: cinematic,
          landingAsOwner: cinematic,
        }),
      setLandingMode: (landingMode) => set({ landingMode }),
      skipLanding: () => set({ landingMode: "arrived", landingCinematic: false }),
      clearLanding: () =>
        set({
          landingPlotId: null,
          landingMode: "idle",
          landingCinematic: false,
          landingAsOwner: false,
        }),
      resetView: () =>
        set((state) => ({
          viewResetAt: state.viewResetAt + 1,
          selectionMode: false,
          selection: null,
          hoverPlotId: null,
        })),
    }),
    {
      name: "craterclaim-selection",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ selection: state.selection }),
      skipHydration: true,
    },
  ),
);
