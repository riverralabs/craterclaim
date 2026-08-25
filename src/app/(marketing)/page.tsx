import { Suspense } from "react";
import { HomeHud } from "@/components/layout/HomeHud";
import { LandingOverlay } from "@/components/moon/LandingOverlay";
import { LandingQuery } from "@/components/moon/LandingQuery";
import { MoonScene } from "@/components/moon/MoonScene";
import { PlotHydrator } from "@/components/plot/PlotHydrator";
import { SelectionPanel } from "@/components/selection/SelectionPanel";
import { listActivePlots } from "@/lib/plots/inventory";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const plots = await listActivePlots();

  return (
    <main className="relative h-dvh overflow-hidden bg-space">
      <PlotHydrator plots={plots} />
      <MoonScene />
      <HomeHud />
      <SelectionPanel />
      <LandingOverlay />
      <Suspense fallback={null}>
        <LandingQuery />
      </Suspense>
    </main>
  );
}
