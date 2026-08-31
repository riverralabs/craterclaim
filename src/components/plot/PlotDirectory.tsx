"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { PlotCard } from "@/components/plot/PlotCard";
import { Button } from "@/components/ui/button";
import { useMoonStore } from "@/lib/store/moon-store";
import type { PlotRecord } from "@/types";

type DirectoryMode = "recent" | "leaderboard";

export function PlotDirectory({
  initialPlots,
  mode,
}: {
  initialPlots: PlotRecord[];
  mode: DirectoryMode;
}) {
  const storePlots = useMoonStore((state) => state.plots);
  const hydratePlots = useMoonStore((state) => state.hydratePlots);
  const plots = storePlots.length > 0 ? storePlots : initialPlots;

  useEffect(() => {
    hydratePlots(initialPlots);
  }, [hydratePlots, initialPlots]);

  const active = useMemo(
    () => plots.filter((plot) => plot.status === "active"),
    [plots],
  );

  const groups = useMemo(() => {
    const recent = [...active].sort((a, b) =>
      (b.claimDate ?? b.createdAt).localeCompare(a.claimDate ?? a.createdAt),
    );
    return {
      recent,
      largest: [...active].sort((a, b) => b.pixelCount - a.pixelCount),
      invested: [...active].sort(
        (a, b) => (b.pricePaid ?? b.quotedPrice) - (a.pricePaid ?? a.quotedPrice),
      ),
      pioneers: [...recent].reverse(),
    };
  }, [active]);

  if (active.length === 0) {
    return (
      <div className="max-w-xl">
        <h1 className="font-heading text-4xl font-bold tracking-tight">
          {mode === "recent" ? "No claims yet." : "Leaderboard is waiting on the first landing."}
        </h1>
        <p className="mt-4 leading-relaxed text-lunar-silver">
          Counts stay at zero until someone claims a digital plot. Nothing is faked.
        </p>
        <Button
          asChild
          size="lg"
          className="mt-8 min-h-11 cursor-pointer bg-electric-white text-space hover:bg-electric-white/90"
        >
          <Link href="/">Explore the Moon</Link>
        </Button>
      </div>
    );
  }

  if (mode === "recent") {
    return (
      <div>
        <h1 className="font-heading text-4xl font-bold tracking-tight">Recent claims</h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {groups.recent.map((plot) => (
            <PlotCard
              key={plot.id}
              plotId={plot.id}
              name={plot.name ?? plot.id}
              sizeLabel={`${plot.width} × ${plot.height} pixels`}
              featureName={plot.lunarFeature}
              latitude={plot.centerLatitude}
              longitude={plot.centerLongitude}
              claimDate={plot.claimDate ?? plot.createdAt}
              zone={plot.zone}
              logoUrl={plot.logoUrl}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <h1 className="font-heading text-4xl font-bold tracking-tight">Leaderboard</h1>
      <Board title="Largest" plots={groups.largest} />
      <Board title="Most invested" plots={groups.invested} />
      <Board title="Recent" plots={groups.recent} />
      <Board title="Pioneers" plots={groups.pioneers} />
    </div>
  );
}

function Board({ title, plots }: { title: string; plots: PlotRecord[] }) {
  return (
    <section>
      <h2 className="font-heading text-xl font-semibold">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {plots.slice(0, 6).map((plot) => (
          <PlotCard
            key={`${title}-${plot.id}`}
            plotId={plot.id}
            name={plot.name ?? plot.id}
            sizeLabel={`${plot.width} × ${plot.height} pixels`}
            featureName={plot.lunarFeature}
            latitude={plot.centerLatitude}
            longitude={plot.centerLongitude}
            claimDate={plot.claimDate ?? plot.createdAt}
            zone={plot.zone}
            logoUrl={plot.logoUrl}
          />
        ))}
      </div>
    </section>
  );
}
