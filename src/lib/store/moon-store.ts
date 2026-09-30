import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { trackEvent } from "@/lib/analytics";
import { mergePlots, readLocalPlots, writeLocalPlots } from "@/lib/plots/local";
import { migratePlotsToCurrentGrid } from "@/lib/moon/grid";
import { getWorld, plotBody, withBody, type BodyId } from "@/lib/worlds";
import type { LandingMode, LunarFeature, PlotRecord, PlotSelection } from "@/types";

interface MoonState {
  body: BodyId;
  isInteracting: boolean;
  hasUserInteracted: boolean;
  isExploring: boolean;
  selectionMode: boolean;
  selection: PlotSelection | null;
  /** Plots on the active globe. */
  plots: PlotRecord[];
  /** Moon and Mars plots together, including ones not on the active globe. */
  archive: PlotRecord[];
  features: LunarFeature[];
  landingPlotId: string | null;
  hoverPlotId: string | null;
  landingMode: LandingMode;
  landingCinematic: boolean;
  landingAsOwner: boolean;
  viewResetAt: number;
  setBody: (body: BodyId) => void;
  setInteracting: (v: boolean) => void;
  setHoverPlot: (plotId: string | null) => void;
  markUserInteracted: () => void;
  enterExploreMode: () => void;
  enterSelectMode: () => void;
  exitSelectMode: () => void;
  setSelection: (selection: PlotSelection | null) => void;
  hydratePlots: (plots: PlotRecord[], fallbackBody?: BodyId) => void;
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
      body: "moon",
      isInteracting: false,
      hasUserInteracted: false,
      isExploring: true,
      selectionMode: false,
      selection: null,
      plots: [],
      archive: [],
      features: getWorld("moon").features,
      landingPlotId: null,
      hoverPlotId: null,
      landingMode: "idle",
      landingCinematic: false,
      landingAsOwner: false,
      viewResetAt: 0,
      setBody: (body) => {
        if (get().body === body) return;
        const archive = get().archive.length ? get().archive : readLocalPlots().map((plot) => withBody(plot));
        set({
          body,
          features: getWorld(body).features,
          archive,
          plots: archive.filter((plot) => plotBody(plot) === body),
          selection: null,
          selectionMode: false,
          landingPlotId: null,
          landingMode: "idle",
          landingCinematic: false,
          landingAsOwner: false,
          hoverPlotId: null,
          viewResetAt: get().viewResetAt + 1,
        });
      },
      setInteracting: (v) => set({ isInteracting: v }),
      setHoverPlot: (plotId) => {
        if (get().hoverPlotId === plotId) return;
        set({ hoverPlotId: plotId });
      },
      markUserInteracted: () => set({ hasUserInteracted: true }),
      enterExploreMode: () => {
        const alreadyExploring = get().isExploring && !get().selectionMode;
        set({
          isExploring: true,
          hasUserInteracted: true,
          selectionMode: false,
        });
        if (!alreadyExploring) trackEvent("explore");
      },
      enterSelectMode: () => {
        const alreadySelecting = get().selectionMode;
        set({
          isExploring: true,
          hasUserInteracted: true,
          selectionMode: true,
          selection: null,
          hoverPlotId: null,
        });
        if (!alreadySelecting) trackEvent("select");
      },
      exitSelectMode: () => set({ selectionMode: false, selection: null }),
      setSelection: (selection) => set({ selection }),
      hydratePlots: (plots, fallbackBody) => {
        const body = get().body;
        const incoming = migratePlotsToCurrentGrid(plots).map((plot) => withBody(plot, fallbackBody ?? "moon"));
        const merged = mergePlots(incoming, mergePlots(get().archive, readLocalPlots().map((plot) => withBody(plot))));
        writeLocalPlots(merged);
        set({
          archive: merged,
          plots: merged.filter((plot) => plotBody(plot) === body),
        });
      },
      hydrateFeatures: (features) => set({ features }),
      rememberPlot: (plot) => {
        const tagged = withBody(migratePlotsToCurrentGrid([plot])[0], plot.body ?? get().body);
        const merged = mergePlots([tagged], mergePlots(get().archive, readLocalPlots().map((item) => withBody(item))));
        writeLocalPlots(merged);
        set({
          archive: merged,
          plots: merged.filter((item) => plotBody(item) === get().body),
          selection: null,
          selectionMode: false,
        });
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
      partialize: (state) => ({ selection: state.selection, body: state.body }),
      skipHydration: true,
    },
  ),
);
