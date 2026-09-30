"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PlotCard } from "@/components/plot/PlotCard";
import { SharePlotButton } from "@/components/plot/SharePlotButton";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { formatUsd } from "@/lib/moon/pricing";
import { useMoonStore } from "@/lib/store/moon-store";
import { plotBody } from "@/lib/worlds";

export function LandingOverlay() {
  const landingPlotId = useMoonStore((state) => state.landingPlotId);
  const landingMode = useMoonStore((state) => state.landingMode);
  const landingCinematic = useMoonStore((state) => state.landingCinematic);
  const landingAsOwner = useMoonStore((state) => state.landingAsOwner);
  const plots = useMoonStore((state) => state.plots);
  const setLandingMode = useMoonStore((state) => state.setLandingMode);
  const skipLanding = useMoonStore((state) => state.skipLanding);
  const clearLanding = useMoonStore((state) => state.clearLanding);
  const reducedMotion = usePrefersReducedMotion();

  const plot = plots.find((item) => item.id === landingPlotId) ?? null;

  useEffect(() => {
    if (!plot || landingMode === "idle") return;
    if (reducedMotion) {
      skipLanding();
    }
  }, [landingMode, plot, reducedMotion, skipLanding]);

  useEffect(() => {
    if (landingMode !== "confirmed") return;
    const id = window.setTimeout(() => setLandingMode("flying"), 900);
    return () => window.clearTimeout(id);
  }, [landingMode, setLandingMode]);

  if (!plot || landingMode === "idle") return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      {landingMode === "confirmed" || landingMode === "flying" ? (
        <div className="absolute inset-x-0 top-24 flex flex-col items-center gap-3 px-4">
          <p className="rounded-full border border-gold/40 bg-charcoal/80 px-4 py-2 text-xs tracking-[0.22em] text-gold uppercase">
            {landingMode === "confirmed"
              ? "Landing confirmed"
              : landingAsOwner
                ? "Approaching your plot"
                : "Approaching landing"}
          </p>
          {landingCinematic && !reducedMotion ? (
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="pointer-events-auto min-h-11 cursor-pointer border-white/15 bg-charcoal/70"
              onClick={skipLanding}
            >
              Skip
            </Button>
          ) : null}
        </div>
      ) : null}

      {landingMode === "arrived" ? (
        <div className="absolute inset-x-3 top-24 z-40 mx-auto max-w-[22.5rem] md:top-24 md:right-4 md:left-auto md:mx-0">
          <div className="pointer-events-auto space-y-3">
            <PlotCard
              plotId={plot.id}
              name={plot.name ?? "Untitled landing"}
              sizeLabel={`${plot.width} × ${plot.height} px`}
              featureName={plot.lunarFeature}
              latitude={plot.centerLatitude}
              longitude={plot.centerLongitude}
              claimDate={plot.claimDate ?? plot.createdAt}
              zone={plot.zone}
              body={plotBody(plot)}
              logoUrl={plot.logoUrl}
              websiteUrl={plot.websiteUrl}
              valueLabel={formatUsd(plot.pricePaid ?? plot.quotedPrice)}
              variant="panel"
              onViewPlot={clearLanding}
            />
            <SharePlotButton
              plotId={plot.id}
              name={plot.name ?? "Untitled landing"}
              className="w-full"
            />
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full cursor-pointer border-white/15 bg-charcoal text-electric-white hover:bg-white/10"
              onClick={clearLanding}
            >
              Keep exploring
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
